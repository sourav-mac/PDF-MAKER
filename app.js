/**
 * PDF Master Studio - Ultra Clean & Minimal PDF Editor
 * Direct Form + Live Inline 2-Way Sync + Advanced Tools:
 * - Real Document Color Auto-Detection & Color Picker
 * - Add New Text (Draggable & Editable)
 * - Delete Text (Whiteout & Erase Masking)
 * - Add Images (Draggable, Resizable & Exportable)
 * - Reorder Pages (Visual Thumbnails & Order Manager)
 * - Font Size Controls (Per-field scaling)
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
  const pdfCustomElementsLayer = document.getElementById('pdf-custom-elements-layer');
  const viewportDropHint = document.getElementById('viewport-drop-hint');
  const pageNumInput = document.getElementById('page-num-input');
  const pageCountTotal = document.getElementById('page-count-total');
  const btnPrevPage = document.getElementById('btn-prev-page');
  const btnNextPage = document.getElementById('btn-next-page');

  // Quick Tools Elements
  const editorQuickTools = document.getElementById('editor-quick-tools');
  const sidebarQuickTools = document.getElementById('sidebar-quick-tools');
  const toolAddText = document.getElementById('tool-add-text');
  const toolAddImage = document.getElementById('tool-add-image');
  const toolReorderPages = document.getElementById('tool-reorder-pages');
  const sidebarBtnAddText = document.getElementById('sidebar-btn-add-text');
  const sidebarBtnAddImage = document.getElementById('sidebar-btn-add-image');
  const imageFileInput = document.getElementById('image-file-input');

  // Reorder Modal Elements
  const reorderModal = document.getElementById('reorder-modal');
  const reorderPagesGrid = document.getElementById('reorder-pages-grid');
  const btnCloseReorderModal = document.getElementById('btn-close-reorder-modal');
  const btnCancelReorder = document.getElementById('btn-cancel-reorder');
  const btnApplyReorder = document.getElementById('btn-apply-reorder');

  const previewWelcomeSheet = document.getElementById('preview-welcome-sheet');
  const btnWelcomeUpload = document.getElementById('btn-welcome-upload');
  if (btnWelcomeUpload) {
    btnWelcomeUpload.addEventListener('click', () => pdfFileInput.click());
  }

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
    pagesData: {},
    pageOrder: []
  };

  /* Helper Color Utilities */
  function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
      const hex = Math.max(0, Math.min(255, Math.round(x))).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  }

  function parseColorToRgb(colorStr) {
    if (!colorStr) return { r: 0, g: 0, b: 0 };
    if (colorStr.startsWith('#')) {
      let hex = colorStr.replace('#', '');
      if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
      const num = parseInt(hex, 16);
      return {
        r: ((num >> 16) & 255) / 255,
        g: ((num >> 8) & 255) / 255,
        b: (num & 255) / 255
      };
    }
    const rgbMatch = colorStr.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (rgbMatch) {
      return {
        r: parseInt(rgbMatch[1], 10) / 255,
        g: parseInt(rgbMatch[2], 10) / 255,
        b: parseInt(rgbMatch[3], 10) / 255
      };
    }
    return { r: 0, g: 0, b: 0 };
  }

  function parseColorToPdfLibRgb(colorStr, pdfLibRgb) {
    const c = parseColorToRgb(colorStr);
    return pdfLibRgb(c.r, c.g, c.b);
  }

  /* Auto-detect Text Color from Rendered Canvas */
  function detectTextColorFromCanvas(ctx, left, top, width, height, canvasWidth, canvasHeight) {
    try {
      const scale = 2.0;
      const sx = Math.max(0, Math.min(canvasWidth - 1, Math.round(left * scale)));
      const sy = Math.max(0, Math.min(canvasHeight - 1, Math.round(top * scale)));
      const sw = Math.max(1, Math.min(canvasWidth - sx, Math.round(width * scale)));
      const sh = Math.max(1, Math.min(canvasHeight - sy, Math.round(height * scale)));

      if (sw <= 0 || sh <= 0) return { hex: '#000000', rgb: { r: 0, g: 0, b: 0 } };

      const imgData = ctx.getImageData(sx, sy, Math.min(sw, 400), Math.min(sh, 120));
      const data = imgData.data;

      let totalR = 0, totalG = 0, totalB = 0, totalCount = 0;
      let coloredR = 0, coloredG = 0, coloredB = 0, coloredCount = 0;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        if (a < 100) continue;

        // Skip white/near-white page background
        if (r > 225 && g > 225 && b > 225) continue;

        totalR += r;
        totalG += g;
        totalB += b;
        totalCount++;

        // Detect chromatic colored text pixels (e.g. blue, navy, red)
        const maxDiff = Math.max(Math.abs(r - g), Math.abs(r - b), Math.abs(g - b));
        if (maxDiff > 16) {
          coloredR += r;
          coloredG += g;
          coloredB += b;
          coloredCount++;
        }
      }

      // If chromatic pixels (like blue text) exist, prioritize that exact color
      if (coloredCount > 4) {
        const avgR = Math.round(coloredR / coloredCount);
        const avgG = Math.round(coloredG / coloredCount);
        const avgB = Math.round(coloredB / coloredCount);
        return {
          hex: rgbToHex(avgR, avgG, avgB),
          rgb: { r: avgR / 255, g: avgG / 255, b: avgB / 255 }
        };
      } else if (totalCount > 4) {
        const avgR = Math.round(totalR / totalCount);
        const avgG = Math.round(totalG / totalCount);
        const avgB = Math.round(totalB / totalCount);
        return {
          hex: rgbToHex(avgR, avgG, avgB),
          rgb: { r: avgR / 255, g: avgG / 255, b: avgB / 255 }
        };
      }
    } catch (e) {
      console.warn('Canvas color detection skipped:', e);
    }

    return { hex: '#000000', rgb: { r: 0, g: 0, b: 0 } };
  }

  /* Zoom Controller */
  function applyZoom(zoom) {
    if (!pdfState.loadedPdfDoc) {
      if (paperWrapper) {
        paperWrapper.style.width = '100%';
        paperWrapper.style.height = 'auto';
        paperWrapper.style.display = 'flex';
        paperWrapper.style.alignItems = 'center';
        paperWrapper.style.justifyContent = 'center';
      }
      return;
    }

    currentZoom = Math.min(Math.max(zoom, 0.2), 2.0);
    if (customPdfStage) {
      customPdfStage.style.transform = `scale(${currentZoom})`;
      customPdfStage.style.transformOrigin = 'top center';
    }
    if (paperWrapper && pdfState.pageWidth && pdfState.pageHeight) {
      paperWrapper.style.display = 'block';
      paperWrapper.style.width = `${Math.round(pdfState.pageWidth * currentZoom)}px`;
      paperWrapper.style.height = `${Math.round(pdfState.pageHeight * currentZoom)}px`;
    }
    zoomLevelDisplay.innerText = `${Math.round(currentZoom * 100)}%`;
  }

  zoomInBtn.addEventListener('click', () => applyZoom(currentZoom + 0.1));
  zoomOutBtn.addEventListener('click', () => applyZoom(currentZoom - 0.1));
  zoomResetBtn.addEventListener('click', () => autoFit());

  function autoFit() {
    if (!pdfState.loadedPdfDoc) {
      applyZoom(1);
      return;
    }

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
      pdfState.pageOrder = Array.from({ length: pdfDoc.numPages }, (_, i) => i + 1);

      docFileName.innerText = filename;
      document.body.classList.add('pdf-loaded');
      docInfoBar.style.display = 'flex';
      sidebarQuickTools.style.display = 'flex';
      editorQuickTools.style.display = 'flex';
      pdfDropzone.style.display = 'none';
      if (previewWelcomeSheet) previewWelcomeSheet.style.display = 'none';
      if (customPdfStage) customPdfStage.style.display = 'block';
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
  async function renderPdfPage(logicalPageNum) {
    if (!pdfState.loadedPdfDoc) return;
    
    // Determine actual source page index based on pageOrder
    const actualSourcePage = pdfState.pageOrder[logicalPageNum - 1] || logicalPageNum;
    pdfState.currentPageNum = logicalPageNum;
    pageNumInput.value = logicalPageNum;
    btnPrevPage.disabled = logicalPageNum <= 1;
    btnNextPage.disabled = logicalPageNum >= pdfState.totalPages;

    const page = await pdfState.loadedPdfDoc.getPage(actualSourcePage);
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

    const ctx = pdfRenderCanvas.getContext('2d', { willReadFrequently: true });
    await page.render({ canvasContext: ctx, viewport: viewport }).promise;

    // Extract text on first load of this source page
    if (!pdfState.pagesData[actualSourcePage]) {
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
        const top = targetHeight - ty - (fontHeight * 0.82);
        const width = item.width || Math.max(textStr.length * fontHeight * 0.55, 20);
        const height = fontHeight;

        // Auto-detect real text color from the underlying rendered canvas
        const detectedColor = detectTextColorFromCanvas(ctx, left, top, width, height, viewport.width, viewport.height);
        const fontName = (item.fontName || '').toLowerCase();
        const isBoldDetected = /bold|black|heavy|w7|w8|w9|700|800/i.test(fontName) || true;

        items.push({
          id: `p${actualSourcePage}_item_${idx}`,
          page: actualSourcePage,
          text: textStr,
          originalText: textStr,
          origX: tx,
          origY: ty,
          isEdited: false,
          isDeleted: false,
          isBold: isBoldDetected,
          left: Math.round(left * 10) / 10,
          top: Math.round(top * 10) / 10,
          width: Math.round(width * 10) / 10,
          height: Math.round(height * 10) / 10,
          fontSize: Math.round(fontHeight),
          angle: angle,
          color: detectedColor.hex,
          colorRgb: detectedColor.rgb
        });
      });

      pdfState.pagesData[actualSourcePage] = {
        items: items,
        originalItems: JSON.parse(JSON.stringify(items)),
        customTexts: [],
        customImages: []
      };
    }

    const currentPageData = pdfState.pagesData[actualSourcePage];
    const totalFields = currentPageData.items.length + (currentPageData.customTexts || []).length;
    docMetaSub.innerText = `Page ${logicalPageNum} of ${pdfState.totalPages} • ${totalFields} items`;

    renderTextOverlayLayer(currentPageData.items);
    renderCustomElementsLayer(actualSourcePage);
    buildFormFieldsList(currentPageData.items, currentPageData.customTexts, currentPageData.customImages);
    autoFit();
  }

  /* Inline Text Layer for Extracted Items */
  function renderTextOverlayLayer(items) {
    pdfTextLayer.innerHTML = '';

    items.forEach(item => {
      const el = document.createElement('div');
      el.className = `pdf-text-item ${item.isEdited ? 'is-edited' : ''} ${item.isDeleted ? 'is-deleted' : ''} ${item.isBold !== false ? 'is-bold' : 'is-normal'}`;
      el.id = `inline_${item.id}`;
      el.setAttribute('contenteditable', item.isDeleted ? 'false' : 'true');
      el.setAttribute('spellcheck', 'false');
      
      el.innerText = item.isDeleted ? '' : item.text;
      el.style.left = `${item.left}px`;
      el.style.top = `${item.top}px`;
      el.style.minWidth = `${item.width}px`;
      el.style.fontSize = `${item.fontSize}px`;
      el.style.fontWeight = item.isBold !== false ? '700' : '400';

      if (item.isEdited) {
        el.style.color = item.color || '#000000';
      }

      if (item.angle && Math.abs(item.angle) > 0.01) {
        el.style.transform = `rotate(${-item.angle}rad)`;
      }

      // Inline -> Form Sync
      el.addEventListener('input', () => {
        item.text = el.innerText;
        item.isEdited = true;
        el.classList.add('is-edited');
        el.style.color = item.color || '#000000';

        const formInput = document.getElementById(`form_input_${item.id}`);
        if (formInput && formInput.value !== el.innerText) {
          formInput.value = el.innerText;
        }
      });

      // Highlight matching field and apply color on focus
      el.addEventListener('focus', () => {
        el.style.color = item.color || '#000000';
        document.querySelectorAll('.field-item').forEach(card => card.classList.remove('focused'));
        const formCard = document.getElementById(`card_${item.id}`);
        if (formCard) {
          formCard.classList.add('focused');
          formCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      });

      el.addEventListener('blur', () => {
        if (!item.isEdited) {
          el.style.color = 'transparent';
        }
      });

      pdfTextLayer.appendChild(el);
    });
  }

  /* Custom Elements Layer (Added Texts & Images) */
  function renderCustomElementsLayer(sourcePageNum) {
    if (!pdfCustomElementsLayer) return;
    pdfCustomElementsLayer.innerHTML = '';

    const pageData = pdfState.pagesData[sourcePageNum];
    if (!pageData) return;

    // Render Added Texts
    (pageData.customTexts || []).forEach(item => {
      if (item.isDeleted) return;

      const el = document.createElement('div');
      el.className = 'pdf-custom-text-item';
      el.id = `custom_text_el_${item.id}`;
      el.style.left = `${item.left}px`;
      el.style.top = `${item.top}px`;
      el.style.fontSize = `${item.fontSize}px`;
      el.style.color = item.color || '#000000';

      el.innerHTML = `
        <span class="custom-text-content" contenteditable="true" spellcheck="false">${escapeHtml(item.text)}</span>
        <button type="button" class="custom-text-del-btn" title="Delete Text"><i class="fa-solid fa-xmark"></i></button>
      `;

      const content = el.querySelector('.custom-text-content');
      content.addEventListener('input', () => {
        item.text = content.innerText;
        const formInput = document.getElementById(`form_input_${item.id}`);
        if (formInput && formInput.value !== content.innerText) {
          formInput.value = content.innerText;
        }
      });

      // Delete custom text
      el.querySelector('.custom-text-del-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        item.isDeleted = true;
        renderCustomElementsLayer(sourcePageNum);
        buildFormFieldsList(pageData.items, pageData.customTexts, pageData.customImages);
      });

      // Make draggable
      makeDraggable(el, item);

      pdfCustomElementsLayer.appendChild(el);
    });

    // Render Added Images
    (pageData.customImages || []).forEach(imgItem => {
      if (imgItem.isDeleted) return;

      const el = document.createElement('div');
      el.className = 'pdf-custom-image-item';
      el.id = `custom_img_el_${imgItem.id}`;
      el.style.left = `${imgItem.left}px`;
      el.style.top = `${imgItem.top}px`;
      el.style.width = `${imgItem.width}px`;
      el.style.height = `${imgItem.height}px`;

      el.innerHTML = `
        <img src="${imgItem.dataUrl}" class="custom-img-el" alt="Inserted image" />
        <div class="img-resize-handle" title="Drag to resize"></div>
        <button type="button" class="img-delete-btn" title="Delete Image"><i class="fa-solid fa-xmark"></i></button>
      `;

      // Delete image
      el.querySelector('.img-delete-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        imgItem.isDeleted = true;
        renderCustomElementsLayer(sourcePageNum);
        buildFormFieldsList(pageData.items, pageData.customTexts, pageData.customImages);
      });

      // Resize handle
      const resizeHandle = el.querySelector('.img-resize-handle');
      resizeHandle.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        e.preventDefault();

        const startX = e.clientX;
        const initWidth = imgItem.width;

        function onResizeMove(moveEvent) {
          const dx = (moveEvent.clientX - startX) / currentZoom;
          const newWidth = Math.max(30, Math.round(initWidth + dx));
          const newHeight = Math.round(newWidth * imgItem.aspectRatio);
          
          imgItem.width = newWidth;
          imgItem.height = newHeight;
          el.style.width = `${newWidth}px`;
          el.style.height = `${newHeight}px`;
        }

        function onResizeUp() {
          document.removeEventListener('mousemove', onResizeMove);
          document.removeEventListener('mouseup', onResizeUp);
        }

        document.addEventListener('mousemove', onResizeMove);
        document.addEventListener('mouseup', onResizeUp);
      });

      // Make draggable
      makeDraggable(el, imgItem);

      pdfCustomElementsLayer.appendChild(el);
    });
  }

  /* Utility: Dragging Support with Zoom factor */
  function makeDraggable(el, dataItem) {
    el.addEventListener('mousedown', (e) => {
      if (e.target.closest('.custom-text-del-btn') || e.target.closest('.img-delete-btn') || e.target.closest('.img-resize-handle')) {
        return;
      }
      if (e.target.classList.contains('custom-text-content') && document.activeElement === e.target) {
        return;
      }

      const startX = e.clientX;
      const startY = e.clientY;
      const initLeft = dataItem.left;
      const initTop = dataItem.top;

      function onMouseMove(moveEvent) {
        const dx = (moveEvent.clientX - startX) / currentZoom;
        const dy = (moveEvent.clientY - startY) / currentZoom;
        dataItem.left = Math.max(0, Math.round(initLeft + dx));
        dataItem.top = Math.max(0, Math.round(initTop + dy));
        el.style.left = `${dataItem.left}px`;
        el.style.top = `${dataItem.top}px`;
      }

      function onMouseUp() {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      }

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });
  }

  /* Sidebar Form Fields List */
  function buildFormFieldsList(items, customTexts = [], customImages = []) {
    pdfFieldsList.innerHTML = '';
    const actualSourcePage = pdfState.pageOrder[pdfState.currentPageNum - 1] || pdfState.currentPageNum;

    // 1. Extracted Text Fields
    items.forEach((item, index) => {
      const card = document.createElement('div');
      card.className = `field-item ${item.isDeleted ? 'is-deleted' : ''}`;
      card.id = `card_${item.id}`;

      card.innerHTML = `
        <div class="field-item-header">
          <span class="field-item-label">${item.isDeleted ? '<i class="fa-solid fa-trash text-danger"></i> (Deleted)' : `Field #${index + 1}`}</span>
          <div class="field-header-actions">
            <!-- Text Color Picker -->
            <input type="color" class="field-color-picker" id="color_${item.id}" value="${item.color || '#000000'}" title="Text Color" />
            <!-- Bold Toggle Button -->
            <button type="button" class="btn-bold-toggle ${item.isBold !== false ? 'active' : ''}" id="bold_${item.id}" title="Toggle Bold">B</button>
            <!-- Font Size Stepper -->
            <div class="field-font-size-ctrl" title="Adjust Font Size">
              <button type="button" class="fs-btn fs-dec" title="Decrease font size"><i class="fa-solid fa-minus"></i></button>
              <span class="fs-val">${item.fontSize}px</span>
              <button type="button" class="fs-btn fs-inc" title="Increase font size"><i class="fa-solid fa-plus"></i></button>
            </div>
            <!-- Delete / Undo Button -->
            <button type="button" class="field-act-btn delete-btn" id="btn_del_${item.id}" title="${item.isDeleted ? 'Restore Text' : 'Delete / Erase Text'}">
              <i class="fa-solid ${item.isDeleted ? 'fa-rotate-left' : 'fa-trash-can'}"></i>
            </button>
            <!-- Focus Button -->
            <button type="button" class="field-act-btn" id="btn_focus_${item.id}" title="Focus on sheet">
              <i class="fa-solid fa-crosshairs"></i>
            </button>
          </div>
        </div>
        <div class="field-input-wrap">
          <input type="text" id="form_input_${item.id}" value="${escapeHtml(item.text)}" autocomplete="off" ${item.isDeleted ? 'disabled' : ''} style="color: ${item.color || '#cbd5e1'}; font-weight: ${item.isBold !== false ? '700' : '400'};" />
        </div>
      `;

      // Bold button sync
      const boldBtn = card.querySelector(`#bold_${item.id}`);
      if (boldBtn) {
        boldBtn.addEventListener('click', () => {
          item.isBold = !(item.isBold !== false);
          item.isEdited = true;
          boldBtn.classList.toggle('active', item.isBold);
          const inputEl = card.querySelector(`#form_input_${item.id}`);
          if (inputEl) inputEl.style.fontWeight = item.isBold ? '700' : '400';
          const inlineEl = document.getElementById(`inline_${item.id}`);
          if (inlineEl) {
            inlineEl.style.fontWeight = item.isBold ? '700' : '400';
            inlineEl.classList.toggle('is-bold', item.isBold);
            inlineEl.classList.toggle('is-normal', !item.isBold);
            inlineEl.classList.add('is-edited');
          }
        });
      }

      // Color picker sync
      const colorPicker = card.querySelector(`#color_${item.id}`);
      if (colorPicker) {
        colorPicker.addEventListener('input', (e) => {
          item.color = e.target.value;
          item.colorRgb = parseColorToRgb(e.target.value);
          item.isEdited = true;
          
          const inputEl = card.querySelector(`#form_input_${item.id}`);
          if (inputEl) inputEl.style.color = item.color;

          const inlineEl = document.getElementById(`inline_${item.id}`);
          if (inlineEl) {
            inlineEl.style.color = item.color;
            inlineEl.classList.add('is-edited');
          }
        });
      }

      // Form -> Inline Sync
      const input = card.querySelector(`#form_input_${item.id}`);
      input.addEventListener('input', () => {
        item.text = input.value;
        item.isEdited = true;

        const inlineEl = document.getElementById(`inline_${item.id}`);
        if (inlineEl) {
          inlineEl.innerText = input.value;
          inlineEl.style.color = item.color || '#000000';
          inlineEl.classList.add('is-edited');
        }
      });

      // Font size steppers
      card.querySelector('.fs-dec').addEventListener('click', () => {
        item.fontSize = Math.max(6, item.fontSize - 1);
        item.isEdited = true;
        card.querySelector('.fs-val').innerText = `${item.fontSize}px`;
        const inlineEl = document.getElementById(`inline_${item.id}`);
        if (inlineEl) {
          inlineEl.style.fontSize = `${item.fontSize}px`;
          inlineEl.style.color = item.color || '#000000';
          inlineEl.classList.add('is-edited');
        }
      });

      card.querySelector('.fs-inc').addEventListener('click', () => {
        item.fontSize = Math.min(72, item.fontSize + 1);
        item.isEdited = true;
        card.querySelector('.fs-val').innerText = `${item.fontSize}px`;
        const inlineEl = document.getElementById(`inline_${item.id}`);
        if (inlineEl) {
          inlineEl.style.fontSize = `${item.fontSize}px`;
          inlineEl.style.color = item.color || '#000000';
          inlineEl.classList.add('is-edited');
        }
      });

      // Delete Toggle
      card.querySelector(`#btn_del_${item.id}`).addEventListener('click', () => {
        item.isDeleted = !item.isDeleted;
        item.isEdited = true;
        renderTextOverlayLayer(items);
        buildFormFieldsList(items, customTexts, customImages);
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

    // 2. Added Custom Text Items
    customTexts.forEach((item, index) => {
      if (item.isDeleted) return;

      const card = document.createElement('div');
      card.className = 'field-item';
      card.id = `card_${item.id}`;

      card.innerHTML = `
        <div class="field-item-header">
          <span class="field-item-label text-primary"><i class="fa-solid fa-font"></i> New Text #${index + 1}</span>
          <div class="field-header-actions">
            <!-- Text Color Picker -->
            <input type="color" class="field-color-picker" id="color_${item.id}" value="${item.color || '#000000'}" title="Text Color" />
            <!-- Bold Toggle Button -->
            <button type="button" class="btn-bold-toggle ${item.isBold !== false ? 'active' : ''}" id="bold_${item.id}" title="Toggle Bold">B</button>
            <div class="field-font-size-ctrl" title="Adjust Font Size">
              <button type="button" class="fs-btn fs-dec" title="Decrease"><i class="fa-solid fa-minus"></i></button>
              <span class="fs-val">${item.fontSize}px</span>
              <button type="button" class="fs-btn fs-inc" title="Increase"><i class="fa-solid fa-plus"></i></button>
            </div>
            <button type="button" class="field-act-btn delete-btn" id="btn_del_${item.id}" title="Delete Custom Text">
              <i class="fa-solid fa-trash-can"></i>
            </button>
            <button type="button" class="field-act-btn" id="btn_focus_${item.id}" title="Focus on sheet">
              <i class="fa-solid fa-crosshairs"></i>
            </button>
          </div>
        </div>
        <div class="field-input-wrap">
          <input type="text" id="form_input_${item.id}" value="${escapeHtml(item.text)}" autocomplete="off" style="color: ${item.color || '#cbd5e1'}; font-weight: ${item.isBold !== false ? '700' : '400'};" />
        </div>
      `;

      // Bold button sync
      const boldBtn = card.querySelector(`#bold_${item.id}`);
      if (boldBtn) {
        boldBtn.addEventListener('click', () => {
          item.isBold = !(item.isBold !== false);
          boldBtn.classList.toggle('active', item.isBold);
          const inputEl = card.querySelector(`#form_input_${item.id}`);
          if (inputEl) inputEl.style.fontWeight = item.isBold ? '700' : '400';
          const customEl = document.getElementById(`custom_text_el_${item.id}`);
          if (customEl) customEl.style.fontWeight = item.isBold ? '700' : '400';
        });
      }

      // Color picker sync
      const colorPicker = card.querySelector(`#color_${item.id}`);
      if (colorPicker) {
        colorPicker.addEventListener('input', (e) => {
          item.color = e.target.value;
          item.colorRgb = parseColorToRgb(e.target.value);
          const inputEl = card.querySelector(`#form_input_${item.id}`);
          if (inputEl) inputEl.style.color = item.color;
          const customEl = document.getElementById(`custom_text_el_${item.id}`);
          if (customEl) customEl.style.color = item.color;
        });
      }

      const input = card.querySelector(`#form_input_${item.id}`);
      input.addEventListener('input', () => {
        item.text = input.value;
        const customEl = document.getElementById(`custom_text_el_${item.id}`);
        if (customEl) {
          const content = customEl.querySelector('.custom-text-content');
          if (content) content.innerText = input.value;
        }
      });

      card.querySelector('.fs-dec').addEventListener('click', () => {
        item.fontSize = Math.max(6, item.fontSize - 1);
        card.querySelector('.fs-val').innerText = `${item.fontSize}px`;
        const customEl = document.getElementById(`custom_text_el_${item.id}`);
        if (customEl) customEl.style.fontSize = `${item.fontSize}px`;
      });

      card.querySelector('.fs-inc').addEventListener('click', () => {
        item.fontSize = Math.min(72, item.fontSize + 1);
        card.querySelector('.fs-val').innerText = `${item.fontSize}px`;
        const customEl = document.getElementById(`custom_text_el_${item.id}`);
        if (customEl) customEl.style.fontSize = `${item.fontSize}px`;
      });

      card.querySelector(`#btn_del_${item.id}`).addEventListener('click', () => {
        item.isDeleted = true;
        renderCustomElementsLayer(actualSourcePage);
        buildFormFieldsList(items, customTexts, customImages);
      });

      card.querySelector(`#btn_focus_${item.id}`).addEventListener('click', () => {
        const customEl = document.getElementById(`custom_text_el_${item.id}`);
        if (customEl) {
          const content = customEl.querySelector('.custom-text-content');
          if (content) content.focus();
          customEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });

      pdfFieldsList.appendChild(card);
    });

    // 3. Added Images
    customImages.forEach((item, index) => {
      if (item.isDeleted) return;

      const card = document.createElement('div');
      card.className = 'field-item';
      card.id = `card_${item.id}`;

      card.innerHTML = `
        <div class="field-item-header">
          <span class="field-item-label text-primary"><i class="fa-solid fa-image"></i> Image #${index + 1}</span>
          <div class="field-header-actions">
            <button type="button" class="field-act-btn delete-btn" id="btn_del_${item.id}" title="Delete Image">
              <i class="fa-solid fa-trash-can"></i>
            </button>
            <button type="button" class="field-act-btn" id="btn_focus_${item.id}" title="Focus on sheet">
              <i class="fa-solid fa-crosshairs"></i>
            </button>
          </div>
        </div>
        <div class="field-input-wrap">
          <input type="text" value="${escapeHtml(item.fileName || 'Inserted Image')}" disabled />
        </div>
      `;

      card.querySelector(`#btn_del_${item.id}`).addEventListener('click', () => {
        item.isDeleted = true;
        renderCustomElementsLayer(actualSourcePage);
        buildFormFieldsList(items, customTexts, customImages);
      });

      card.querySelector(`#btn_focus_${item.id}`).addEventListener('click', () => {
        const imgEl = document.getElementById(`custom_img_el_${item.id}`);
        if (imgEl) {
          imgEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });

      pdfFieldsList.appendChild(card);
    });
  }

  function escapeHtml(str) {
    return (str || '').replace(/"/g, '&quot;');
  }

  /* Add New Text Tool */
  function handleAddText() {
    if (!pdfState.loadedPdfDoc) return;
    const actualSourcePage = pdfState.pageOrder[pdfState.currentPageNum - 1] || pdfState.currentPageNum;
    const pageData = pdfState.pagesData[actualSourcePage];
    if (!pageData) return;

    if (!pageData.customTexts) pageData.customTexts = [];

    const newItem = {
      id: `ct_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      page: actualSourcePage,
      isCustom: true,
      text: 'Sample Text',
      left: Math.max(30, Math.round((pdfState.pageWidth - 140) / 2)),
      top: Math.max(30, Math.round((pdfState.pageHeight - 40) / 3)),
      fontSize: 16,
      color: '#000000',
      colorRgb: { r: 0, g: 0, b: 0 },
      isDeleted: false
    };

    pageData.customTexts.push(newItem);
    renderCustomElementsLayer(actualSourcePage);
    buildFormFieldsList(pageData.items, pageData.customTexts, pageData.customImages);

    setTimeout(() => {
      const el = document.getElementById(`custom_text_el_${newItem.id}`);
      if (el) {
        const content = el.querySelector('.custom-text-content');
        if (content) {
          content.focus();
          document.execCommand('selectAll', false, null);
        }
      }
    }, 40);
  }

  toolAddText.addEventListener('click', handleAddText);
  sidebarBtnAddText.addEventListener('click', handleAddText);

  /* Add Image Tool */
  toolAddImage.addEventListener('click', () => imageFileInput.click());
  sidebarBtnAddImage.addEventListener('click', () => imageFileInput.click());

  imageFileInput.addEventListener('change', async (e) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    await handleImageInsert(file);
    imageFileInput.value = '';
  });

  async function handleImageInsert(file) {
    if (!pdfState.loadedPdfDoc) return;
    const actualSourcePage = pdfState.pageOrder[pdfState.currentPageNum - 1] || pdfState.currentPageNum;
    const pageData = pdfState.pagesData[actualSourcePage];
    if (!pageData) return;

    if (!pageData.customImages) pageData.customImages = [];

    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = ev => resolve(ev.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const arrayBuffer = await file.arrayBuffer();
    const uint8Bytes = new Uint8Array(arrayBuffer);

    const img = new Image();
    img.src = dataUrl;
    await new Promise(res => { img.onload = res; });

    let initWidth = Math.min(200, img.naturalWidth || 180);
    let ratio = (img.naturalHeight || 1) / (img.naturalWidth || 1);
    let initHeight = Math.round(initWidth * ratio);

    const newImg = {
      id: `ci_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      page: actualSourcePage,
      isImage: true,
      fileName: file.name,
      dataUrl: dataUrl,
      rawBytes: uint8Bytes,
      isPng: file.type.includes('png'),
      left: Math.max(30, Math.round((pdfState.pageWidth - initWidth) / 2)),
      top: Math.max(30, Math.round((pdfState.pageHeight - initHeight) / 3)),
      width: initWidth,
      height: initHeight,
      aspectRatio: ratio,
      isDeleted: false
    };

    pageData.customImages.push(newImg);
    renderCustomElementsLayer(actualSourcePage);
    buildFormFieldsList(pageData.items, pageData.customTexts, pageData.customImages);
  }

  /* Page Reordering Modal */
  let tempPageOrder = [];

  toolReorderPages.addEventListener('click', async () => {
    if (!pdfState.loadedPdfDoc) return;
    tempPageOrder = [...pdfState.pageOrder];
    await renderReorderModalGrid();
    reorderModal.style.display = 'flex';
  });

  btnCloseReorderModal.addEventListener('click', () => {
    reorderModal.style.display = 'none';
  });

  btnCancelReorder.addEventListener('click', () => {
    reorderModal.style.display = 'none';
  });

  btnApplyReorder.addEventListener('click', async () => {
    pdfState.pageOrder = [...tempPageOrder];
    reorderModal.style.display = 'none';
    await renderPdfPage(pdfState.currentPageNum);
  });

  async function renderReorderModalGrid() {
    reorderPagesGrid.innerHTML = '';

    for (let index = 0; index < tempPageOrder.length; index++) {
      const sourcePageNum = tempPageOrder[index];
      const card = document.createElement('div');
      card.className = 'page-order-card';
      card.draggable = true;
      card.dataset.index = index;

      card.innerHTML = `
        <div class="page-order-thumb-wrap">
          <canvas class="page-order-thumb-canvas" id="thumb_canvas_${index}"></canvas>
        </div>
        <span class="page-order-badge">Page ${index + 1} (Orig: ${sourcePageNum})</span>
        <div class="page-order-actions">
          <button type="button" class="btn-move-page" ${index === 0 ? 'disabled' : ''} data-action="left" title="Move Left / Up">
            <i class="fa-solid fa-arrow-left"></i>
          </button>
          <button type="button" class="btn-move-page" ${index === tempPageOrder.length - 1 ? 'disabled' : ''} data-action="right" title="Move Right / Down">
            <i class="fa-solid fa-arrow-right"></i>
          </button>
        </div>
      `;

      // Move Left/Right
      card.querySelector('[data-action="left"]')?.addEventListener('click', () => {
        if (index > 0) {
          const temp = tempPageOrder[index - 1];
          tempPageOrder[index - 1] = tempPageOrder[index];
          tempPageOrder[index] = temp;
          renderReorderModalGrid();
        }
      });

      card.querySelector('[data-action="right"]')?.addEventListener('click', () => {
        if (index < tempPageOrder.length - 1) {
          const temp = tempPageOrder[index + 1];
          tempPageOrder[index + 1] = tempPageOrder[index];
          tempPageOrder[index] = temp;
          renderReorderModalGrid();
        }
      });

      // Drag and drop reordering
      card.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', index.toString());
        card.classList.add('dragging');
      });

      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
      });

      card.addEventListener('dragover', (e) => {
        e.preventDefault();
      });

      card.addEventListener('drop', (e) => {
        e.preventDefault();
        const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
        const toIndex = index;
        if (!isNaN(fromIndex) && fromIndex !== toIndex) {
          const moved = tempPageOrder.splice(fromIndex, 1)[0];
          tempPageOrder.splice(toIndex, 0, moved);
          renderReorderModalGrid();
        }
      });

      reorderPagesGrid.appendChild(card);

      // Render thumbnail asynchronously
      renderThumbnail(sourcePageNum, `thumb_canvas_${index}`);
    }
  }

  async function renderThumbnail(sourcePageNum, canvasId) {
    try {
      const page = await pdfState.loadedPdfDoc.getPage(sourcePageNum);
      const canvas = document.getElementById(canvasId);
      if (!canvas) return;

      const viewport = page.getViewport({ scale: 0.3 });
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');
      await page.render({ canvasContext: ctx, viewport: viewport }).promise;
    } catch (err) {
      console.error('Thumbnail render error:', err);
    }
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
    const actualSourcePage = pdfState.pageOrder[pdfState.currentPageNum - 1] || pdfState.currentPageNum;
    if (pdfState.pagesData[actualSourcePage]) {
      const original = pdfState.pagesData[actualSourcePage].originalItems;
      pdfState.pagesData[actualSourcePage].items = JSON.parse(JSON.stringify(original));
      pdfState.pagesData[actualSourcePage].customTexts = [];
      pdfState.pagesData[actualSourcePage].customImages = [];
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
      const sourceDoc = await PDFDocument.load(pdfState.rawBytes.slice(0), { ignoreEncryption: true });
      const finalDoc = await PDFDocument.create();
      const fontHelveticaBold = await finalDoc.embedFont(StandardFonts.HelveticaBold);
      const fontHelvetica = await finalDoc.embedFont(StandardFonts.Helvetica);

      // Copy and populate pages in customized pageOrder sequence
      for (let orderIdx = 0; orderIdx < pdfState.pageOrder.length; orderIdx++) {
        const sourcePageNum = pdfState.pageOrder[orderIdx];
        const [copiedPage] = await finalDoc.copyPages(sourceDoc, [sourcePageNum - 1]);
        finalDoc.addPage(copiedPage);

        const pageData = pdfState.pagesData[sourcePageNum];
        if (!pageData) continue;

        const { width: pWidth, height: pHeight } = copiedPage.getSize();
        const stageWidth = pdfState.pageWidth || pWidth;
        const stageHeight = pdfState.pageHeight || pHeight;
        
        const scaleX = pWidth / stageWidth;
        const scaleY = pHeight / stageHeight;

        // 1. Process Extracted Text Items (Mask & Redraw or Mask Deleted)
        (pageData.items || []).forEach(item => {
          if (item.isDeleted || item.isEdited) {
            const pdfX = (item.origX !== undefined ? item.origX : item.left) * scaleX;
            const pdfY = (item.origY !== undefined ? item.origY : (stageHeight - item.top - item.fontSize * 0.82)) * scaleY;
            const pdfW = Math.max(item.width * scaleX, ((item.text || item.originalText).length * item.fontSize * 0.6) * scaleX);
            const pdfH = item.fontSize * 1.15 * scaleY;

            // Whiteout solid mask over original text with tight clean padding
            copiedPage.drawRectangle({
              x: pdfX - 1,
              y: pdfY - (item.fontSize * 0.22 * scaleY),
              width: pdfW + 2,
              height: pdfH,
              color: rgb(1, 1, 1),
              borderColor: rgb(1, 1, 1),
              borderWidth: 0
            });

            // Draw new text with exact baseline alignment and matched/picked color & bold font
            if (!item.isDeleted && item.text && item.text.trim() !== '') {
              const drawColor = item.colorRgb ? rgb(item.colorRgb.r, item.colorRgb.g, item.colorRgb.b) : parseColorToPdfLibRgb(item.color, rgb);
              const selectedFont = (item.isBold !== false) ? fontHelveticaBold : fontHelvetica;

              copiedPage.drawText(item.text, {
                x: pdfX,
                y: pdfY,
                size: Math.max(item.fontSize * scaleY, 6),
                font: selectedFont,
                color: drawColor
              });
            }
          }
        });

        // 2. Process Custom Added Text Items
        (pageData.customTexts || []).forEach(customItem => {
          if (customItem.isDeleted || !customItem.text || customItem.text.trim() === '') return;

          const pdfX = customItem.left * scaleX;
          const pdfY = (stageHeight - (customItem.top + (customItem.fontSize * 1.25))) * scaleY;
          const drawColor = customItem.colorRgb ? rgb(customItem.colorRgb.r, customItem.colorRgb.g, customItem.colorRgb.b) : parseColorToPdfLibRgb(customItem.color, rgb);
          const selectedCustomFont = (customItem.isBold !== false) ? fontHelveticaBold : fontHelvetica;

          copiedPage.drawText(customItem.text, {
            x: pdfX,
            y: pdfY,
            size: Math.max(customItem.fontSize * scaleY, 6),
            font: selectedCustomFont,
            color: drawColor
          });
        });

        // 3. Process Custom Added Images
        for (const imgItem of (pageData.customImages || [])) {
          if (imgItem.isDeleted || !imgItem.rawBytes) continue;

          try {
            let embeddedImg;
            if (imgItem.isPng) {
              embeddedImg = await finalDoc.embedPng(imgItem.rawBytes);
            } else {
              embeddedImg = await finalDoc.embedJpg(imgItem.rawBytes);
            }

            const pdfX = imgItem.left * scaleX;
            const pdfY = (stageHeight - (imgItem.top + imgItem.height)) * scaleY;
            const pdfW = imgItem.width * scaleX;
            const pdfH = imgItem.height * scaleY;

            copiedPage.drawImage(embeddedImg, {
              x: pdfX,
              y: pdfY,
              width: pdfW,
              height: pdfH
            });
          } catch (imgErr) {
            console.error('Failed to embed image in PDF:', imgErr);
          }
        }
      }

      const updatedPdfBytes = await finalDoc.save();
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
