# PDF-MAKER

An interactive, modern web application designed to generate, customize, and print editable examination papers, student slips, and admit card headers with live A4 PDF export.

## 🚀 Features

- **Live Form & Document Synchronization**: Fill in Exam Title, Subject, Registration Number, and Roll Number with real-time updates.
- **Two-Way Inline Editing**: Click directly onto any text on the A4 page preview to edit on the fly.
- **Multi-Slip Repetition (Same Page Copies)**:
  - 1 Slip (Original single header sheet)
  - 2 Slips (Top & Bottom halves on 1 page)
  - 3 Slips (3 full-size repeated slips)
  - 4 Slips (4 repeated slips on 1 page)
  - **No Shrinking**: All repeated boxes retain 100% original full size, padding, and bold typography.
  - Optional cutting guide lines (`✂`) for physical slicing after printing.
- **Strict Single A4 Page Guarantee**: Pre-calculated dimensions ensuring zero page overflow or extra blank pages.
- **Direct PDF Export & Native Print**: 1-click high-resolution PDF download using `html2pdf.js` plus clean vector `@media print` layout (`Ctrl + P`).
- **Creator Social Link**: Integrated profile connection with [@sourav__6459](https://www.instagram.com/sourav__6459?stkn=cnd5cHB0dGpwazRv).

## 🛠️ Built With

- **HTML5**: Semantic structure & A4 page simulation.
- **CSS3 (Vanilla)**: Responsive studio layout, print stylesheets (`@media print`), and custom box styles.
- **JavaScript (ES6+)**: Real-time two-way data binding, dynamic slip cloning, and export controllers.
- **Libraries**:
  - `html2pdf.js` (Vector-quality client-side PDF generation)
  - `FontAwesome 6` (Modern iconography)
  - `Google Fonts` (Montserrat)

## 💻 How to Run Locally

1. Clone this repository:
   ```bash
   git clone https://github.com/sourav-mac/PDF-MAKER.git
   ```
2. Navigate to the project directory:
   ```bash
   cd PDF-MAKER
   ```
3. Open `index.html` in your favorite browser:
   - Double click `index.html`, or
   - Run a lightweight server:
     ```bash
     python -m http.server 3000
     ```
     Then navigate to `http://localhost:3000`.

## 📄 License

Open-source under the MIT License.
