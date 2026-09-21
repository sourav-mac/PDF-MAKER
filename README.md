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
- **Direct High-Fidelity PDF Export**: 1-click ultra-crisp vector A4 PDF direct download powered by headless Puppeteer/Chromium.
- **Creator Social Link**: Integrated profile connection with [@sourav__6459](https://www.instagram.com/sourav__6459?stkn=cnd5cHB0dGpwazRv).

## 🛠️ Built With

- **HTML5**: Semantic structure & A4 page simulation.
- **CSS3 (Vanilla)**: Responsive studio layout, print stylesheets (`@media print`), and custom box styles.
- **JavaScript (ES6+)**: Real-time two-way data binding, dynamic slip cloning, and export controllers.
- **Node.js & Express**: Lightweight backend serving the app and handling PDF generation.
- **Puppeteer & Headless Chromium**: High-fidelity native A4 PDF rendering with embedded typography.
- **FontAwesome 6** (Modern iconography)
- **Google Fonts** (Montserrat)

## 💻 How to Run Locally

1. Clone this repository:
   ```bash
   git clone https://github.com/sourav-mac/PDF-MAKER.git
   ```
2. Navigate to the project directory:
   ```bash
   cd PDF-MAKER
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the application:
   ```bash
   npm start
   ```
   Then navigate to `http://localhost:3000`.

## 📄 License

Open-source under the MIT License.
