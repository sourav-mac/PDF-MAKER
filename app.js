/**
 * Exam PDF Studio - Interactive Controller
 * Real-time two-way synchronization between form, multi-slip repetition, and printable A4 page
 */

document.addEventListener('DOMContentLoaded', () => {
  // Elements - Form Inputs
  const inputExamTitle = document.getElementById('exam-title');
  const inputSubjectName = document.getElementById('subject-name');
  const inputRegNo = document.getElementById('reg-no');
  const inputRollNo = document.getElementById('roll-no');
  const inputInstitution = document.getElementById('institution-name');
  const inputExamDate = document.getElementById('exam-date');
  const inputExamTime = document.getElementById('exam-time');
  const boxHeightSlider = document.getElementById('box-height');
  const boxHeightVal = document.getElementById('box-height-val');

  // Slips Container & Printable Sheet
  const slipsContainer = document.getElementById('slips-container');
  const printableDoc = document.getElementById('printable-document');
  const paperWrapper = document.getElementById('paper-wrapper');
  const BASE_A4_WIDTH = 794;
  const BASE_A4_HEIGHT = 1123;

  // Repetition Controls
  const repeatSelector = document.getElementById('repeat-selector');
  const repeatBadge = document.getElementById('repeat-badge');
  const repeatOptions = document.getElementById('repeat-options');
  const showCutLinesCheckbox = document.getElementById('show-cut-lines');
  let currentRepeatCount = 1;

  // Buttons & Extras
  const btnDownload = document.getElementById('btn-download');
  const btnPrint = document.getElementById('btn-print');
  const mBtnDownload = document.getElementById('m-btn-download');
  const mBtnPrint = document.getElementById('m-btn-print');
  const btnSampleData = document.getElementById('btn-sample-data');
  const btnReset = document.getElementById('btn-reset');
  const toggleExtraFields = document.getElementById('toggle-extra-fields');
  const extraFieldsContent = document.getElementById('extra-fields-content');

  // Zoom Controls
  const zoomInBtn = document.getElementById('zoom-in');
  const zoomOutBtn = document.getElementById('zoom-out');
  const zoomResetBtn = document.getElementById('zoom-reset');
  const zoomLevelDisplay = document.getElementById('zoom-level');
  let currentZoom = 1;

  // Function to generate a single slip HTML template (Full Size Always)
  function generateSlipHTML(index) {
    const isInstitutionVisible = inputInstitution.value.trim() !== '';
    const isMetaVisible = (inputExamDate.value.trim() !== '' || inputExamTime.value.trim() !== '');

    return `
      <div class="exam-slip" data-slip-index="${index}">
        <div class="exam-header-box" style="min-height: ${boxHeightSlider.value}px;">
          <!-- Institution -->
          <div 
            class="institution-line preview-institution" 
            contenteditable="true" 
            spellcheck="false" 
            style="display: ${isInstitutionVisible ? 'block' : 'none'};"
          >${inputInstitution.value.trim()}</div>

          <!-- Exam Heading -->
          <div 
            class="exam-title-text preview-exam-title" 
            contenteditable="true" 
            spellcheck="false"
          >${inputExamTitle.value.trim() || 'B.SC NURSING 6TH SEMESTER EXAMINATION, 2026'}</div>

          <!-- Subject / Paper -->
          <div 
            class="subject-text preview-subject" 
            contenteditable="true" 
            spellcheck="false"
          >${inputSubjectName.value.trim() || 'MENTAL HEALTH NURSING (I & II)'}</div>

          <!-- Meta Row -->
          <div class="extra-meta-row preview-meta-row" style="display: ${isMetaVisible ? 'flex' : 'none'};">
            <span class="preview-exam-date">${inputExamDate.value.trim() ? 'Date: ' + inputExamDate.value.trim() : ''}</span>
            <span class="preview-exam-time">${inputExamTime.value.trim() ? 'Time/Marks: ' + inputExamTime.value.trim() : ''}</span>
          </div>

          <!-- Student Info: Reg No & Roll No -->
          <div class="student-info-section">
            <div class="info-row">
              <span class="info-label">REG NO. –</span>
              <span 
                class="info-value preview-reg-no" 
                contenteditable="true" 
                spellcheck="false"
                data-placeholder="[Enter Reg No]"
              >${inputRegNo.value}</span>
            </div>
            <div class="info-row">
              <span class="info-label">ROLL NO. –</span>
              <span 
                class="info-value preview-roll-no" 
                contenteditable="true" 
                spellcheck="false"
                data-placeholder="[Enter Roll No]"
              >${inputRollNo.value}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function getCutLineHTML() {
    return `
      <div class="cut-line">
        <span class="cut-scissors"><i class="fa-solid fa-scissors"></i></span>
        <span class="cut-dashed"></span>
        <span class="cut-text">Cut along the dashed line</span>
        <span class="cut-dashed"></span>
      </div>
    `;
  }

  // Render Slips based on current repeat count
  function renderSlips(count) {
    currentRepeatCount = count;
    slipsContainer.className = `slips-container repeat-${count}`;
    if (!showCutLinesCheckbox.checked) {
      slipsContainer.classList.add('hide-cut-lines');
    }

    let html = '';
    for (let i = 1; i <= count; i++) {
      if (i > 1) {
        html += getCutLineHTML();
      }
      html += generateSlipHTML(i);
    }

    slipsContainer.innerHTML = html;
    bindInlineEditingEvents();
  }

  // Synchronize Form -> All Preview Slips
  function updateAllSlips() {
    const examTitleVal = inputExamTitle.value.trim() || 'B.SC NURSING 6TH SEMESTER EXAMINATION, 2026';
    const subjectVal = inputSubjectName.value.trim() || 'MENTAL HEALTH NURSING (I & II)';
    const regVal = inputRegNo.value;
    const rollVal = inputRollNo.value;
    const instVal = inputInstitution.value.trim();
    const dateVal = inputExamDate.value.trim();
    const timeVal = inputExamTime.value.trim();
    const minH = boxHeightSlider.value + 'px';

    document.querySelectorAll('.preview-exam-title').forEach(el => el.innerText = examTitleVal);
    document.querySelectorAll('.preview-subject').forEach(el => el.innerText = subjectVal);
    document.querySelectorAll('.preview-reg-no').forEach(el => el.innerText = regVal);
    document.querySelectorAll('.preview-roll-no').forEach(el => el.innerText = rollVal);

    document.querySelectorAll('.preview-institution').forEach(el => {
      if (instVal) {
        el.innerText = instVal;
        el.style.display = 'block';
      } else {
        el.innerText = '';
        el.style.display = 'none';
      }
    });

    document.querySelectorAll('.preview-meta-row').forEach(row => {
      if (dateVal || timeVal) {
        row.style.display = 'flex';
        const dEl = row.querySelector('.preview-exam-date');
        const tEl = row.querySelector('.preview-exam-time');
        if (dEl) dEl.innerText = dateVal ? `Date: ${dateVal}` : '';
        if (tEl) tEl.innerText = timeVal ? `Time/Marks: ${timeVal}` : '';
      } else {
        row.style.display = 'none';
      }
    });

    document.querySelectorAll('.exam-header-box').forEach(box => box.style.minHeight = minH);
  }

  // Bind input listeners to form
  inputExamTitle.addEventListener('input', updateAllSlips);
  inputSubjectName.addEventListener('input', updateAllSlips);
  inputRegNo.addEventListener('input', updateAllSlips);
  inputRollNo.addEventListener('input', updateAllSlips);
  inputInstitution.addEventListener('input', updateAllSlips);
  inputExamDate.addEventListener('input', updateAllSlips);
  inputExamTime.addEventListener('input', updateAllSlips);

  boxHeightSlider.addEventListener('input', (e) => {
    boxHeightVal.innerText = e.target.value + 'px';
    document.querySelectorAll('.exam-header-box').forEach(box => {
      box.style.minHeight = e.target.value + 'px';
    });
  });

  // Bind 2-Way Inline Editing: When user types in ANY slip, sync back to form and all other slips
  function bindInlineEditingEvents() {
    document.querySelectorAll('.preview-exam-title').forEach(el => {
      el.addEventListener('input', () => {
        inputExamTitle.value = el.innerText;
        document.querySelectorAll('.preview-exam-title').forEach(other => {
          if (other !== el) other.innerText = el.innerText;
        });
      });
    });

    document.querySelectorAll('.preview-subject').forEach(el => {
      el.addEventListener('input', () => {
        inputSubjectName.value = el.innerText;
        document.querySelectorAll('.preview-subject').forEach(other => {
          if (other !== el) other.innerText = el.innerText;
        });
      });
    });

    document.querySelectorAll('.preview-reg-no').forEach(el => {
      el.addEventListener('input', () => {
        inputRegNo.value = el.innerText;
        document.querySelectorAll('.preview-reg-no').forEach(other => {
          if (other !== el) other.innerText = el.innerText;
        });
      });
    });

    document.querySelectorAll('.preview-roll-no').forEach(el => {
      el.addEventListener('input', () => {
        inputRollNo.value = el.innerText;
        document.querySelectorAll('.preview-roll-no').forEach(other => {
          if (other !== el) other.innerText = el.innerText;
        });
      });
    });

    document.querySelectorAll('.preview-institution').forEach(el => {
      el.addEventListener('input', () => {
        inputInstitution.value = el.innerText;
        document.querySelectorAll('.preview-institution').forEach(other => {
          if (other !== el) other.innerText = el.innerText;
        });
      });
    });
  }

  // Handle Repeat Selector Button Clicks
  const repeatLabels = {
    1: '1 Slip (Original)',
    2: '2 Slips (Repeated)',
    3: '3 Slips (Repeated)',
    4: '4 Slips (Repeated)'
  };

  repeatSelector.querySelectorAll('.btn-repeat').forEach(btn => {
    btn.addEventListener('click', () => {
      repeatSelector.querySelectorAll('.btn-repeat').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const count = parseInt(btn.getAttribute('data-count'), 10);
      repeatBadge.innerText = repeatLabels[count];
      repeatOptions.style.display = count > 1 ? 'block' : 'none';

      renderSlips(count);
      showToast(`Page layout updated to ${count} full-size slips!`);
    });
  });

  // Handle Cut Lines Toggle
  showCutLinesCheckbox.addEventListener('change', () => {
    if (showCutLinesCheckbox.checked) {
      slipsContainer.classList.remove('hide-cut-lines');
    } else {
      slipsContainer.classList.add('hide-cut-lines');
    }
  });

  // Accordion Toggle
  toggleExtraFields.addEventListener('click', () => {
    toggleExtraFields.classList.toggle('active');
    extraFieldsContent.classList.toggle('open');
  });

  // Sample Data Filler
  btnSampleData.addEventListener('click', () => {
    inputExamTitle.value = "B.SC NURSING 6TH SEMESTER EXAMINATION, 2026";
    inputSubjectName.value = "MENTAL HEALTH NURSING (I & II)";
    inputRegNo.value = "2023010489";
    inputRollNo.value = "1048";

    updateAllSlips();
    showToast("Demo registration and roll number filled!");
  });

  // Reset Form
  btnReset.addEventListener('click', () => {
    if (confirm("Are you sure you want to reset all fields?")) {
      inputExamTitle.value = "B.SC NURSING 6TH SEMESTER EXAMINATION, 2026";
      inputSubjectName.value = "MENTAL HEALTH NURSING (I & II)";
      inputRegNo.value = "";
      inputRollNo.value = "";
      inputInstitution.value = "";
      inputExamDate.value = "";
      inputExamTime.value = "";

      updateAllSlips();
      showToast("Form reset to default!");
    }
  });

  // Dedicated Native Browser Printing
  function triggerBrowserPrint() {
    window.print();
  }

  if (btnPrint) {
    btnPrint.addEventListener('click', triggerBrowserPrint);
  }

  // Direct PDF Download using Puppeteer/Chromium Backend Engine
  let isGenerating = false;
  btnDownload.addEventListener('click', async () => {
    if (isGenerating) return;
    isGenerating = true;

    // Visual button loading state
    const originalBtnHTML = btnDownload.innerHTML;
    btnDownload.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generating...';
    btnDownload.disabled = true;
    if (mBtnDownload) {
      mBtnDownload.disabled = true;
      mBtnDownload.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generating...';
    }

    showToast("Generating crisp vector PDF via Chromium...");

    const rollNoText = inputRollNo.value.trim();
    const regNoText = inputRegNo.value.trim();
    let filename = 'Exam_Sheet.pdf';
    if (rollNoText) {
      filename = `Exam_Paper_${currentRepeatCount}x_Roll_${rollNoText}.pdf`;
    } else if (regNoText) {
      filename = `Exam_Paper_${currentRepeatCount}x_Reg_${regNoText}.pdf`;
    }

    // Create an isolated clone of printableDoc for pristine vector export
    const clone = printableDoc.cloneNode(true);
    clone.classList.add('export-pdf-mode');
    clone.style.position = 'relative';
    clone.style.top = '0';
    clone.style.left = '0';
    clone.style.transform = 'none';
    clone.style.transition = 'none';
    clone.style.boxShadow = 'none';
    clone.style.border = 'none';
    clone.style.margin = '0';

    // Strip contenteditable and remove borders on fields in the export clone
    clone.querySelectorAll('[contenteditable]').forEach(el => {
      el.removeAttribute('contenteditable');
      el.style.border = 'none';
      el.style.borderBottom = 'none';
      el.style.outline = 'none';
      el.style.textDecoration = 'none';
    });
    clone.querySelectorAll('.info-value, .info-label, .info-row, .student-info-section').forEach(el => {
      el.style.border = 'none';
      el.style.borderBottom = 'none';
      el.style.outline = 'none';
      el.style.textDecoration = 'none';
    });

    function resetButton() {
      btnDownload.innerHTML = originalBtnHTML;
      btnDownload.disabled = false;
      if (mBtnDownload) {
        mBtnDownload.disabled = false;
        mBtnDownload.innerHTML = '<i class="fa-solid fa-file-arrow-down"></i> Download PDF';
      }
      isGenerating = false;
    }

    try {
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          html: clone.outerHTML,
          filename: filename
        })
      });

      if (!response.ok) {
        let errMessage = 'PDF generation failed';
        try {
          const errData = await response.json();
          if (errData && errData.error) errMessage = errData.error;
        } catch (_) {}
        throw new Error(errMessage);
      }

      const blob = await response.blob();
      console.log('Blob received successfully, size:', blob.size);
      window.lastDownloadedBlob = blob;
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      a.remove();

      resetButton();
      showToast("Crisp vector PDF downloaded successfully!");
    } catch (err) {
      console.error("Puppeteer PDF generation error:", err);
      resetButton();
      showToast("Server PDF generator offline, opening browser print instead...");
      window.print();
    }
  });

  // Zoom Controls
  function applyZoom(zoom) {
    currentZoom = Math.min(Math.max(zoom, 0.25), 1.8);
    printableDoc.style.transform = `scale(${currentZoom})`;
    if (paperWrapper) {
      paperWrapper.style.width = `${Math.round(BASE_A4_WIDTH * currentZoom)}px`;
      paperWrapper.style.height = `${Math.round(BASE_A4_HEIGHT * currentZoom)}px`;
    }
    zoomLevelDisplay.innerText = `${Math.round(currentZoom * 100)}%`;
  }

  zoomInBtn.addEventListener('click', () => applyZoom(currentZoom + 0.1));
  zoomOutBtn.addEventListener('click', () => applyZoom(currentZoom - 0.1));
  zoomResetBtn.addEventListener('click', () => autoFit());

  function autoFit() {
    const viewportWidth = window.innerWidth;
    if (viewportWidth <= 850) {
      // Mobile screen: scale 794px A4 width to fit available width perfectly with 24px margins
      const availableWidth = viewportWidth - 24;
      const targetScale = Math.min(Math.max(availableWidth / BASE_A4_WIDTH, 0.28), 0.95);
      applyZoom(targetScale);
    } else if (viewportWidth < 1200) {
      applyZoom(0.8);
    } else {
      applyZoom(1);
    }
  }
  autoFit();
  window.addEventListener('resize', autoFit);

  // Mobile Top Navigation Tabs
  const appContainer = document.querySelector('.app-container');
  const mobileTabBtns = document.querySelectorAll('.mobile-tab-btn');
  mobileTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      mobileTabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const targetTab = btn.getAttribute('data-tab');
      if (targetTab === 'preview') {
        appContainer.classList.add('show-preview');
        setTimeout(() => autoFit(), 60);
      } else {
        appContainer.classList.remove('show-preview');
      }
    });
  });

  // Mobile Sticky Bottom Action Buttons
  if (mBtnDownload) {
    mBtnDownload.addEventListener('click', () => btnDownload.click());
  }
  if (mBtnPrint) {
    mBtnPrint.addEventListener('click', triggerBrowserPrint);
  }

  // Toast Helper
  function showToast(message) {
    let existingToast = document.querySelector('.toast');
    if (existingToast) existingToast.remove();

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<i class="fa-solid fa-circle-check"></i> <span>${message}</span>`;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 50);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 400);
    }, 3200);
  }

  // Initial binding
  bindInlineEditingEvents();
});
