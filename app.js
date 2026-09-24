/**
 * PDF Master Studio - Ultra Clean & Minimal PDF Editor
 * Direct Form + Live Inline 2-Way Sync
 */

document.addEventListener('DOMContentLoaded', () => {
  if (window.pdfjsLib) {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }

  // Core DOM Elements
  const customPdfStage = document.getElementById('custom-pdf-stage');
  const paperWrapper = document.getElementById('paper-wrapper');
  const pageNavControls = document.getElementById('page-nav-controls');
  const pdfDropzone = document.getElementById('pdf-dropzone');
  const pdfFileInput = document.getElementById('pdf-file-input');
  const docInfoBar = document.getElementById('doc-info-bar');
  const docFileName = document.getElementById('doc-file-name');
  const docMetaSub = document.getElementById('doc-meta-sub');
  const btnChangePdf = document.getElementById('btn-change-pdf');
  const pdfFieldsList = document.getElementById('pdf-fields-list');
  const pdfActionButtons = document.getElementById('pdf-action-buttons');
  const btnDownloadCustomPdf = document.getElementById('btn-download-custom-pdf');
  const mBtnDownload = document.getElementById('m-btn-download');
  const btnResetPdfEdits = document.getElementById('btn-reset-pdf-edits');

  // Preview elements
  const pdfRenderCanvas = document.getElementById('pdf-render-canvas');
  const pdfTextLayer = document.getElementById('pdf-text-layer');
  const viewportDropHint = document.getElementById('viewport-drop-hint');
  const pageNumInput = document.getElementById('page-num-input');
  const pageCountTotal = document.getElementById('page-count-total');
  const btnPrevPage = document.getElementById('btn-prev-page');
  const btnNextPage = document.getElementById('btn-next-page');

  // Zoom Controls
  const zoomInBtn = document.getElementById('zoom-in');
  const zoomOutBtn = document.getElementById('zoom-out');
  const zoomResetBtn = document.getElementById('zoom-reset');
  const zoomLevelDisplay = document.getElementById('zoom-level');
  let currentZoom = 1;

  // PDF State
  const pdfState = {
    fileName: '',
    rawBytes: null,
    loadedPdfDoc: null,
    currentPageNum: 1,
    totalPages: 1,
    pageWidth: 794,
    pageHeight: 1123,
    pagesData: {}
  };

  /* Zoom Controller */
  function applyZoom(zoom) {
    currentZoom = Math.min(Math.max(zoom, 0.2), 2.0);
    customPdfStage.style.transform = `scale(${currentZoom})`;
    customPdfStage.style.transformOrigin = 'top center';
    if (paperWrapper && pdfState.pageWidth && pdfState.pageHeight) {
      paperWrapper.style.width = `${Math.round(pdfState.pageWidth * currentZoom)}px`;
      paperWrapper.style.height = `${Math.round(pdfState.pageHeight * currentZoom)}px`;
    }
    zoomLevelDisplay.innerText = `${Math.round(currentZoom * 100)}%`;
  }

  zoomInBtn.addEventListener('click', () => applyZoom(currentZoom + 0.1));
  zoomOutBtn.addEventListener('click', () => applyZoom(currentZoom - 0.1));
  zoomResetBtn.addEventListener('click', () => autoFit());

  function autoFit() {
    const viewportWidth = window.innerWidth;
    const isMobile = viewportWidth <= 850;
    let baseWidth = pdfState.pageWidth || 794;

    if (isMobile) {
      const availableWidth = viewportWidth - 28;
      applyZoom(Math.min(Math.max(availableWidth / baseWidth, 0.25), 0.95));
    } else if (viewportWidth < 1250) {
      const availableWidth = Math.min(viewportWidth - 440, 800);
      applyZoom(Math.min(Math.max(availableWidth / baseWidth, 0.4), 0.85));
    } else {
      applyZoom(1);
    }
  }

  window.addEventListener('resize', autoFit);

  /* File Upload & Dropzone */
  pdfDropzone.addEventListener('click', () => pdfFileInput.click());
  pdfFileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  });

  ['dragenter', 'dragover'].forEach(eventName => {
    pdfDropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      pdfDropzone.classList.add('dragover');
    });
    document.body.addEventListener(eventName, (e) => {
      e.preventDefault();
      viewportDropHint.classList.add('active');
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    pdfDropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      pdfDropzone.classList.remove('dragover');
    });
    document.body.addEventListener(eventName, (e) => {
      e.preventDefault();
      viewportDropHint.classList.remove('active');
    });
  });

  document.body.addEventListener('drop', (e) => {
    e.preventDefault();
    viewportDropHint.classList.remove('active');
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        handleFileSelected(file);
      }
    }
  });

  btnChangePdf.addEventListener('click', () => pdfFileInput.click());

  async function handleFileSelected(file) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      pdfState.fileName = file.name;
      pdfState.rawBytes = new Uint8Array(arrayBuffer);
      await loadPdfFromBytes(pdfState.rawBytes, file.name);
    } catch (err) {
      console.error('Failed to load PDF file:', err);
    }
  }

  async function loadPdfFromBytes(bytes, filename = 'document.pdf') {
    if (!window.pdfjsLib) return;

    try {
      const loadingTask = window.pdfjsLib.getDocument({ data: bytes.slice(0) });
      const pdfDoc = await loadingTask.promise;

      pdfState.loadedPdfDoc = pdfDoc;
      pdfState.totalPages = pdfDoc.numPages;
      pdfState.currentPageNum = 1;
      pdfState.fileName = filename;
      pdfState.pagesData = {};

      docFileName.innerText = filename;
      docInfoBar.style.display = 'flex';
      pdfDropzone.style.display = 'none';
      pdfFieldsList.style.display = 'flex';
      pdfActionButtons.style.display = 'flex';

      pageCountTotal.innerText = pdfState.totalPages;
      pageNumInput.max = pdfState.totalPages;
      pageNumInput.value = 1;
      pageNavControls.style.display = pdfState.totalPages > 1 ? 'flex' : 'none';

      await renderPdfPage(1);
    } catch (err) {
      console.error('Error loading PDF document:', err);
    }
  }

  /* Render Page Canvas & Extract Form Fields */
  async function renderPdfPage(pageNum) {
    if (!pdfState.loadedPdfDoc) return;
    pdfState.currentPageNum = pageNum;
    pageNumInput.value = pageNum;
    btnPrevPage.disabled = pageNum <= 1;
    btnNextPage.disabled = pageNum >= pdfState.totalPages;

    const page = await pdfState.loadedPdfDoc.getPage(pageNum);
    const unscaledViewport = page.getViewport({ scale: 1.0 });
    const targetWidth = unscaledViewport.width;
    const targetHeight = unscaledViewport.height;
    
    pdfState.pageWidth = targetWidth;
    pdfState.pageHeight = targetHeight;

    customPdfStage.style.width = `${targetWidth}px`;
    customPdfStage.style.height = `${targetHeight}px`;

    // Render Canvas at 2x scale
    const viewport = page.getViewport({ scale: 2.0 });
    pdfRenderCanvas.width = viewport.width;
    pdfRenderCanvas.height = viewport.height;
    pdfRenderCanvas.style.width = `${targetWidth}px`;
    pdfRenderCanvas.style.height = `${targetHeight}px`;

    const ctx = pdfRenderCanvas.getContext('2d');
    await page.render({ canvasContext: ctx, viewport: viewport }).promise;

    // Extract text on first load of page
    if (!pdfState.pagesData[pageNum]) {
      const textContent = await page.getTextContent({ includeMarkedContent: true });
      const items = [];

      textContent.items.forEach((item, idx) => {
        const textStr = item.str;
        if (!textStr || textStr.trim() === '') return;

        const t0 = item.transform[0];
        const t1 = item.transform[1];
        const t2 = item.transform[2];
        const t3 = item.transform[3];
        const tx = item.transform[4];
        const ty = item.transform[5];
        const fontHeight = Math.sqrt(t2 * t2 + t3 * t3) || 12;
        const angle = Math.atan2(t1, t0);
        
        const left = tx;
        const top = targetHeight - ty - fontHeight * 0.9;
        const width = item.width || Math.max(textStr.length * fontHeight * 0.55, 20);
        const height = fontHeight * 1.25;

        items.push({
          id: `p${pageNum}_item_${idx}`,
          page: pageNum,
          text: textStr,
          originalText: textStr,
          isEdited: false,
          left: Math.round(left),
          top: Math.round(top),
          width: Math.round(width),
          height: Math.round(height),
          fontSize: Math.round(fontHeight),
          angle: angle
        });
      });

      pdfState.pagesData[pageNum] = {
        items: items,
        originalItems: JSON.parse(JSON.stringify(items))
      };
    }

    const currentPageData = pdfState.pagesData[pageNum];
    docMetaSub.innerText = `Page ${pageNum} of ${pdfState.totalPages} • ${currentPageData.items.length} fields`;

    renderTextOverlayLayer(currentPageData.items);
    buildFormFieldsList(currentPageData.items);
    autoFit();
  }

  /* Inline Text Layer */
  function renderTextOverlayLayer(items) {
    pdfTextLayer.innerHTML = '';

    items.forEach(item => {
      const el = document.createElement('div');
      el.className = `pdf-text-item ${item.isEdited ? 'is-edited' : ''}`;
      el.id = `inline_${item.id}`;
      el.setAttribute('contenteditable', 'true');
      el.setAttribute('spellcheck', 'false');
      
      el.innerText = item.text;
      el.style.left = `${item.left}px`;
      el.style.top = `${item.top}px`;
      el.style.minWidth = `${item.width}px`;
      el.style.fontSize = `${item.fontSize}px`;
      if (item.angle && Math.abs(item.angle) > 0.01) {
        el.style.transform = `rotate(${-item.angle}rad)`;
      }

      // Inline -> Form Sync
      el.addEventListener('input', () => {
        item.text = el.innerText;
        item.isEdited = true;
        el.classList.add('is-edited');

        const formInput = document.getElementById(`form_input_${item.id}`);
        if (formInput && formInput.value !== el.innerText) {
          formInput.value = el.innerText;
        }
      });

      // Highlight matching field
      el.addEventListener('focus', () => {
        document.querySelectorAll('.field-item').forEach(card => card.classList.remove('focused'));
        const formCard = document.getElementById(`card_${item.id}`);
        if (formCard) {
          formCard.classList.add('focused');
          formCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      });

      pdfTextLayer.appendChild(el);
    });
  }

  /* Sidebar Form Fields List */
  function buildFormFieldsList(items) {
    pdfFieldsList.innerHTML = '';

    items.forEach((item, index) => {
      const card = document.createElement('div');
      card.className = 'field-item';
      card.id = `card_${item.id}`;

      card.innerHTML = `
        <div class="field-item-header">
          <span class="field-item-label">Field #${index + 1}</span>
          <button type="button" class="field-act-btn" id="btn_focus_${item.id}" title="Focus on sheet">
            <i class="fa-solid fa-crosshairs"></i>
          </button>
        </div>
        <div class="field-input-wrap">
          <input type="text" id="form_input_${item.id}" value="${escapeHtml(item.text)}" autocomplete="off" />
        </div>
      `;

      // Form -> Inline Sync
      const input = card.querySelector(`#form_input_${item.id}`);
      input.addEventListener('input', () => {
        item.text = input.value;
        item.isEdited = true;

        const inlineEl = document.getElementById(`inline_${item.id}`);
        if (inlineEl) {
          inlineEl.innerText = input.value;
          inlineEl.classList.add('is-edited');
        }
      });

      // Focus on PDF
      card.querySelector(`#btn_focus_${item.id}`).addEventListener('click', () => {
        const inlineEl = document.getElementById(`inline_${item.id}`);
        if (inlineEl) {
          inlineEl.focus();
          inlineEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });

      pdfFieldsList.appendChild(card);
    });
  }

  function escapeHtml(str) {
    return (str || '').replace(/"/g, '&quot;');
  }

  /* Page Controls */
  btnPrevPage.addEventListener('click', () => {
    if (pdfState.currentPageNum > 1) {
      renderPdfPage(pdfState.currentPageNum - 1);
    }
  });

  btnNextPage.addEventListener('click', () => {
    if (pdfState.currentPageNum < pdfState.totalPages) {
      renderPdfPage(pdfState.currentPageNum + 1);
    }
  });

  pageNumInput.addEventListener('change', () => {
    let val = parseInt(pageNumInput.value, 10);
    if (isNaN(val) || val < 1) val = 1;
    if (val > pdfState.totalPages) val = pdfState.totalPages;
    renderPdfPage(val);
  });

  // Revert / Reset edits
  btnResetPdfEdits.addEventListener('click', () => {
    if (pdfState.pagesData[pdfState.currentPageNum]) {
      const original = pdfState.pagesData[pdfState.currentPageNum].originalItems;
      pdfState.pagesData[pdfState.currentPageNum].items = JSON.parse(JSON.stringify(original));
      renderPdfPage(pdfState.currentPageNum);
    }
  });

  /* Export & Download Updated PDF */
  btnDownloadCustomPdf.addEventListener('click', async () => {
    if (!pdfState.loadedPdfDoc) return;

    const originalText = btnDownloadCustomPdf.innerHTML;
    btnDownloadCustomPdf.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Exporting...';
    btnDownloadCustomPdf.disabled = true;

    try {
      const { PDFDocument, rgb, StandardFonts } = window.PDFLib;
      let pdfDoc = pdfState.rawBytes ? await PDFDocument.load(pdfState.rawBytes.slice(0), { ignoreEncryption: true }) : await PDFDocument.create();
      const fontHelveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const numPages = pdfDoc.getPageCount();

      for (let pIndex = 0; pIndex < numPages; pIndex++) {
        const pageNum = pIndex + 1;
        const pageData = pdfState.pagesData[pageNum];
        if (!pageData || !pageData.items) continue;

        const page = pdfDoc.getPage(pIndex);
        const { width: pWidth, height: pHeight } = page.getSize();
        const stageWidth = pdfState.pageWidth || pWidth;
        const stageHeight = pdfState.pageHeight || pHeight;
        
        const scaleX = pWidth / stageWidth;
        const scaleY = pHeight / stageHeight;

        pageData.items.forEach(item => {
          if (item.isEdited) {
            const pdfX = item.left * scaleX;
            const pdfY = (stageHeight - (item.top + item.height)) * scaleY;
            const pdfW = Math.max(item.width * scaleX, (item.text.length * item.fontSize * 0.6) * scaleX);
            const pdfH = item.height * scaleY;

            // White mask over original text
            page.drawRectangle({
              x: pdfX - 2,
              y: pdfY - 2,
              width: pdfW + 4,
              height: pdfH + 4,
              color: rgb(1, 1, 1),
              borderColor: rgb(1, 1, 1),
              borderWidth: 0
            });

            // Draw new text
            if (item.text && item.text.trim() !== '') {
              page.drawText(item.text, {
                x: pdfX,
                y: pdfY + 2,
                size: Math.max(item.fontSize * scaleY, 8),
                font: fontHelveticaBold,
                color: rgb(0, 0, 0)
              });
            }
          }
        });
      }

      const updatedPdfBytes = await pdfDoc.save();
      const blob = new Blob([updatedPdfBytes], { type: 'application/pdf' });
      const downloadUrl = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = pdfState.fileName ? pdfState.fileName.replace('.pdf', '') + '_Updated.pdf' : 'Updated_Document.pdf';
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(downloadUrl);
      a.remove();

      btnDownloadCustomPdf.innerHTML = originalText;
      btnDownloadCustomPdf.disabled = false;
    } catch (err) {
      console.error('PDF Export Error:', err);
      btnDownloadCustomPdf.innerHTML = originalText;
      btnDownloadCustomPdf.disabled = false;
    }
  });

  // Mobile Tabs
  const appContainer = document.querySelector('.app-container');
  document.querySelectorAll('.mobile-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.mobile-tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (btn.getAttribute('data-tab') === 'preview') {
        appContainer.classList.add('show-preview');
        setTimeout(() => autoFit(), 60);
      } else {
        appContainer.classList.remove('show-preview');
      }
    });
  });

  if (mBtnDownload) {
    mBtnDownload.addEventListener('click', () => btnDownloadCustomPdf.click());
  }

  autoFit();
});
