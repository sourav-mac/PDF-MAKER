// Standalone A4 Print Stylesheet directly embedded for zero disk dependency on Vercel
const A4_PRINT_CSS = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  @page {
    size: A4 portrait;
    margin: 0;
  }

  html, body {
    width: 794px;
    height: 1123px;
    margin: 0 !important;
    padding: 0 !important;
    background: #ffffff !important;
    background-color: #ffffff !important;
    color: #000000 !important;
    overflow: hidden !important;
    font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .a4-page {
    font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
    width: 794px !important;
    height: 1123px !important;
    max-height: 1123px !important;
    background: #ffffff !important;
    background-color: #ffffff !important;
    color: #000000 !important;
    padding: 60px 68px !important;
    box-shadow: none !important;
    border: none !important;
    border-radius: 0 !important;
    transform: none !important;
    margin: 0 !important;
    position: relative !important;
    box-sizing: border-box !important;
    overflow: hidden !important;
    display: flex !important;
    flex-direction: column !important;
  }

  .slips-container {
    display: flex !important;
    flex-direction: column !important;
    width: 100% !important;
    height: 100% !important;
    box-sizing: border-box !important;
  }

  .exam-slip {
    width: 100% !important;
    display: flex !important;
    flex-direction: column !important;
    position: relative !important;
    page-break-inside: avoid !important;
  }

  /* Cut Line with Scissors */
  .cut-line {
    display: flex !important;
    align-items: center !important;
    margin: 0 !important;
    color: #444444 !important;
    font-size: 11px !important;
    font-weight: 500 !important;
    user-select: none !important;
    flex-shrink: 0 !important;
    width: 100% !important;
  }

  .cut-line .cut-scissors {
    padding-right: 8px !important;
    font-size: 14px !important;
    color: #444444 !important;
  }

  .cut-line .cut-dashed {
    flex: 1 !important;
    border-bottom: 1.5px dashed #666666 !important;
  }

  .cut-line .cut-text {
    padding: 0 8px !important;
    text-transform: uppercase !important;
    letter-spacing: 0.8px !important;
    font-size: 9px !important;
    color: #444444 !important;
  }

  .slips-container.hide-cut-lines .cut-line {
    display: none !important;
  }

  /* 1 Slip: Top-aligned matching original exam sheet */
  .slips-container.repeat-1 {
    justify-content: flex-start !important;
  }
  .slips-container.repeat-1 .exam-slip {
    flex: none !important;
  }

  /* 2 Slips: Equally divided into 2 equal 50% halves */
  .slips-container.repeat-2 {
    justify-content: space-between !important;
  }
  .slips-container.repeat-2 .exam-slip {
    flex: 1 !important;
    display: flex !important;
    flex-direction: column !important;
    justify-content: center !important;
  }

  /* 3 Slips: Equally divided into 3 equal 33.3% sections */
  .slips-container.repeat-3 {
    justify-content: space-between !important;
  }
  .slips-container.repeat-3 .exam-slip {
    flex: 1 !important;
    display: flex !important;
    flex-direction: column !important;
    justify-content: center !important;
  }

  /* 4 Slips: Equally divided into 4 equal 25% sections */
  .slips-container.repeat-4 {
    justify-content: space-between !important;
  }
  .slips-container.repeat-4 .exam-slip {
    flex: 1 !important;
    display: flex !important;
    flex-direction: column !important;
    justify-content: center !important;
  }
  .slips-container.repeat-4 .exam-header-box {
    min-height: 125px !important;
    padding: 10px 16px 12px 16px !important;
  }
  .slips-container.repeat-4 .exam-title-text {
    font-size: 16px !important;
  }
  .slips-container.repeat-4 .subject-text {
    font-size: 14.5px !important;
    margin-bottom: 8px !important;
  }
  .slips-container.repeat-4 .student-info-section {
    margin-top: 8px !important;
    gap: 8px !important;
  }
  .slips-container.repeat-4 .info-row {
    font-size: 12.5px !important;
  }

  /* Original Exam Header Box */
  .exam-header-box {
    border: 1.8px solid #000000 !important;
    width: 100% !important;
    min-height: 160px;
    padding: 16px 20px 20px 20px !important;
    box-sizing: border-box !important;
    display: flex !important;
    flex-direction: column !important;
    position: relative !important;
    background-color: #ffffff !important;
    background: #ffffff !important;
  }

  .institution-line {
    text-align: center !important;
    font-size: 15px !important;
    font-weight: 700 !important;
    text-transform: uppercase !important;
    margin-bottom: 6px !important;
    letter-spacing: 0.3px !important;
    color: #000000 !important;
  }

  .exam-title-text {
    text-align: center !important;
    font-size: 18.5px !important;
    font-weight: 800 !important;
    color: #000000 !important;
    letter-spacing: 0.5px !important;
    text-transform: uppercase !important;
    line-height: 1.35 !important;
    margin-bottom: 6px !important;
  }

  .subject-text {
    text-align: center !important;
    font-size: 16.5px !important;
    font-weight: 700 !important;
    color: #000000 !important;
    letter-spacing: 0.35px !important;
    text-transform: uppercase !important;
    line-height: 1.35 !important;
    margin-bottom: 14px !important;
  }

  .extra-meta-row {
    display: flex !important;
    justify-content: space-between !important;
    font-size: 12px !important;
    font-weight: 600 !important;
    padding-bottom: 8px !important;
    border-bottom: 1px dashed #bbb !important;
    margin-bottom: 14px !important;
    color: #000000 !important;
  }

  .student-info-section {
    margin-top: 14px !important;
    display: flex !important;
    flex-direction: column !important;
    gap: 14px !important;
    border: none !important;
    outline: none !important;
  }

  .info-row {
    display: flex !important;
    align-items: baseline !important;
    gap: 8px !important;
    font-size: 13.5px !important;
    border: none !important;
    outline: none !important;
  }

  .info-label {
    font-weight: 700 !important;
    color: #000000 !important;
    white-space: nowrap !important;
    letter-spacing: 0.2px !important;
    border: none !important;
    outline: none !important;
  }

  .info-value {
    font-weight: 700 !important;
    color: #000000 !important;
    min-width: 140px !important;
    display: inline-block !important;
    border: none !important;
    border-bottom: none !important;
    text-decoration: none !important;
    outline: none !important;
  }

  .info-value:empty:before,
  .exam-body-content:empty:before {
    display: none !important;
  }

  [contenteditable] {
    outline: none !important;
    border: none !important;
    background-color: transparent !important;
  }
`;

// Helper to launch browser across Vercel Serverless, Docker, and Local environments
async function launchBrowser() {
  const isVercel = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_VERSION || process.env.AWS_REGION);

  if (isVercel) {
    const chromiumModule = await import('@sparticuz/chromium');
    const chromium = chromiumModule.default || chromiumModule;
    const puppeteerCoreModule = await import('puppeteer-core');
    const puppeteer = puppeteerCoreModule.default || puppeteerCoreModule;

    const executablePath = await chromium.executablePath();

    return await puppeteer.launch({
      args: [
        ...chromium.args,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--single-process',
        '--no-zygote'
      ],
      defaultViewport: { width: 794, height: 1123, deviceScaleFactor: 2 },
      executablePath: executablePath,
      headless: chromium.headless !== undefined ? chromium.headless : true,
      ignoreHTTPSErrors: true
    });
  } else {
    // Local / standard server environment
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
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        '/usr/bin/google-chrome',
        '/usr/bin/chromium',
        '/usr/bin/chromium-browser'
      ];
      const foundPath = possiblePaths.find(p => fs.existsSync(p));
      if (foundPath) {
        return await puppeteerCore.launch({
          executablePath: foundPath,
          headless: 'new',
          args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
        });
      }
      throw err;
    }
  }
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

  // Parse body safely
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
        ${A4_PRINT_CSS}
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
      waitUntil: 'load',
      timeout: 15000
    });

    try {
      await page.evaluateHandle('document.fonts.ready');
    } catch (fontErr) {
      console.warn('Fonts ready check bypassed:', fontErr.message);
    }

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
    console.error('PDF Generation Error:', err);
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
