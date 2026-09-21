const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname)));

// Cache CSS for fast inline injection
let cachedCSS = '';
function getCSS() {
  try {
    cachedCSS = fs.readFileSync(path.join(__dirname, 'style.css'), 'utf8');
  } catch (err) {
    console.error('Error reading style.css:', err);
  }
  return cachedCSS;
}
getCSS();

// Managed Puppeteer Browser instance
let browserInstance = null;
let browserLaunching = null;

async function getBrowser() {
  if (browserInstance && browserInstance.connected) {
    return browserInstance;
  }
  if (browserLaunching) {
    return browserLaunching;
  }

  browserLaunching = (async () => {
    try {
      const browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--font-render-hinting=none'
        ]
      });

      browser.on('disconnected', () => {
        console.log('Puppeteer browser disconnected. Will recreate on next request.');
        browserInstance = null;
      });

      browserInstance = browser;
      return browser;
    } finally {
      browserLaunching = null;
    }
  })();

  return browserLaunching;
}

// Pre-warm browser in the background on server boot
getBrowser().catch(err => console.warn('Browser pre-warm warning:', err.message));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    puppeteer: browserInstance && browserInstance.connected ? 'connected' : 'ready_to_launch'
  });
});

// PDF Generation Endpoint
app.post('/api/generate-pdf', async (req, res) => {
  const { html, filename } = req.body;

  if (!html) {
    return res.status(400).json({ error: 'Missing HTML content to render.' });
  }

  const css = getCSS();
  const pdfFilename = filename || 'Exam_Sheet.pdf';

  // Build the complete standalone A4 document
  const fullHtmlDocument = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Printable Exam Sheet</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,600;1,700&display=swap" rel="stylesheet">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
      <style>
        ${css}

        @page {
          size: A4 portrait;
          margin: 0;
        }

        html, body {
          width: 794px;
          height: 1123px;
          margin: 0;
          padding: 0;
          background: #ffffff !important;
          overflow: hidden !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        .a4-page {
          width: 794px !important;
          height: 1123px !important;
          max-height: 1123px !important;
          box-shadow: none !important;
          border: none !important;
          border-radius: 0 !important;
          transform: none !important;
          margin: 0 !important;
          overflow: hidden !important;
          page-break-inside: avoid !important;
          page-break-after: avoid !important;
        }

        .a4-page [contenteditable] {
          outline: none !important;
          border: none !important;
        }
      </style>
    </head>
    <body>
      ${html}
    </body>
    </html>
  `;

  let page = null;
  try {
    const browser = await getBrowser();
    page = await browser.newPage();

    // Configure exact A4 pixel viewport with 2x scale for ultra-crisp vector rasterization
    await page.setViewport({
      width: 794,
      height: 1123,
      deviceScaleFactor: 2
    });

    await page.setContent(fullHtmlDocument, {
      waitUntil: ['load', 'networkidle0'],
      timeout: 15000
    });

    // Ensure all custom fonts (Montserrat and FontAwesome icons) are fully loaded
    await page.evaluateHandle('document.fonts.ready');

    // Generate PDF strictly formatted to A4 single page
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
      preferCSSPageSize: true
    });

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(pdfFilename)}"`,
      'Content-Length': pdfBuffer.length
    });

    return res.send(pdfBuffer);
  } catch (err) {
    console.error('PDF Generation Error:', err);
    return res.status(500).json({
      error: 'Failed to generate PDF via Chromium engine',
      details: err.message
    });
  } finally {
    if (page) {
      try {
        await page.close();
      } catch (closeErr) {
        console.warn('Error closing page:', closeErr.message);
      }
    }
  }
});

// Start Server
const server = app.listen(PORT, () => {
  console.log(`Exam PDF Studio server running on http://localhost:${PORT}`);
});

// Graceful cleanup
async function cleanup() {
  console.log('Shutting down server...');
  if (browserInstance) {
    try {
      await browserInstance.close();
    } catch (e) {}
  }
  server.close(() => {
    process.exit(0);
  });
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
