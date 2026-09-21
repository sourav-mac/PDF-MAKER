const path = require('path');
const fs = require('fs');

// Helper to launch browser across Vercel Serverless and Local environments
async function launchBrowser() {
  const isVercel = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_VERSION);

  if (isVercel) {
    const chromium = require('@sparticuz/chromium');
    const puppeteer = require('puppeteer-core');

    const executablePath = await chromium.executablePath();

    return await puppeteer.launch({
      args: [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      defaultViewport: { width: 794, height: 1123, deviceScaleFactor: 2 },
      executablePath: executablePath,
      headless: chromium.headless,
    });
  } else {
    // Local environment
    try {
      const puppeteer = require('puppeteer');
      return await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--font-render-hinting=none'
        ]
      });
    } catch (err) {
      const puppeteerCore = require('puppeteer-core');
      const possiblePaths = [
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
      ];
      const foundPath = possiblePaths.find(p => fs.existsSync(p));
      if (foundPath) {
        return await puppeteerCore.launch({
          executablePath: foundPath,
          headless: 'new',
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
      }
      throw err;
    }
  }
}

// Read style.css safely
function getStyles() {
  try {
    const cssPath = path.join(process.cwd(), 'style.css');
    if (fs.existsSync(cssPath)) {
      return fs.readFileSync(cssPath, 'utf8');
    }
  } catch (e) {
    console.warn('Could not read local style.css:', e.message);
  }
  return '';
}

module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  // Parse body if not already parsed (Vercel parses JSON bodies automatically)
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid JSON payload' });
    }
  }

  const { html, filename } = body || {};

  if (!html) {
    return res.status(400).json({ error: 'Missing HTML content to render.' });
  }

  const css = getStyles();
  const pdfFilename = filename || 'Exam_Sheet.pdf';

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

  let browser = null;
  let page = null;
  try {
    browser = await launchBrowser();
    page = await browser.newPage();

    await page.setViewport({
      width: 794,
      height: 1123,
      deviceScaleFactor: 2
    });

    await page.setContent(fullHtmlDocument, {
      waitUntil: ['load', 'networkidle0'],
      timeout: 20000
    });

    // Await font loading for crisp typography
    try {
      await page.evaluateHandle('document.fonts.ready');
    } catch (e) {}

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
      preferCSSPageSize: true
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(pdfFilename)}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    return res.status(200).send(pdfBuffer);
  } catch (err) {
    console.error('Vercel PDF Generation Error:', err);
    return res.status(500).json({
      error: 'Failed to generate PDF via Chromium engine',
      details: err.message
    });
  } finally {
    if (page) {
      try { await page.close(); } catch (e) {}
    }
    if (browser) {
      try { await browser.close(); } catch (e) {}
    }
  }
};
