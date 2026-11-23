# 📄 MarkPDF Studio

> A fast, elegant, privacy-first web application that converts Markdown into beautiful, publication-quality vector PDFs.

---

## ✨ Features

- **Split-Screen Studio**: Live Markdown editor alongside an exact page-sheet preview.
- **4 Publication-Quality Themes**:
  - 🚀 **Modern Tech**: Inter & JetBrains Mono, vibrant code highlighting, sleek borders.
  - 💼 **Executive Proposal**: High-contrast header bars, Source Serif typography, formal tables.
  - 🎓 **Academic Journal**: Merriweather serif, research styling, justified body text.
  - 🌿 **Minimalist Clean**: Distraction-free, high whitespace, understated styling.
- **Vector PDF Output**:
  - Uses native browser `@media print` with CSS Paged Media.
  - Razor-sharp vector typography (infinitely scalable, selectable text).
  - Clickable hyperlinks and small PDF file sizes.
- **Smart Page Break Rules**:
  - `break-inside: avoid` on tables, code blocks, blockquotes, and callouts to prevent awkward cuts.
  - Insert intentional page breaks with `<!-- pagebreak -->` or the toolbar button.
- **Rich Markdown Enhancements**:
  - GitHub-style Callouts: `[!NOTE]`, `[!TIP]`, `[!WARNING]`, `[!CAUTION]`.
  - Math & LaTeX equations via KaTeX (`$E = mc^2$`).
  - Code syntax highlighting for 50+ languages via Highlight.js.
  - Task lists and formatted data tables.
- **Document & Print Controls**:
  - Page formats: **A4** (210 × 297mm) and **US Letter** (8.5 × 11").
  - Margins: Standard (20mm), Compact (12mm), Spacious (28mm).
  - Built-in templates: *Technical Specification*, *Executive Proposal*, *Modern Resume*, and *Meeting Minutes*.
- **100% Private & Client-Side**:
  - Everything runs inside your browser. No server uploads. Your data stays on your machine.
  - Local auto-save preserves your work across refreshes.

---

## 🚀 How to Run

### Method 1: Instant Browser Open (Zero install)
Simply double-click or open [index.html](file:///c:/Users/skamalud/OneDrive - Capgemini/Documents/markPdfGenerator/index.html) in any modern web browser (Google Chrome, Microsoft Edge, Brave, Firefox, Safari).

### Method 2: Local HTTP Server (Recommended)
You can start a lightweight local server with Node.js or Python:

```bash
# Using Python:
python -m http.server 3000

# Using Node / npx:
npx serve .
```

Then visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🖨️ How to Export to PDF

1. Click the **Export PDF** button in the top right (or press `Ctrl + P`).
2. In the browser print dialog:
   - **Destination**: Choose *"Save as PDF"*.
   - **Paper size**: Select *A4* or *Letter* (matching your choice in the app).
   - **Margins**: Set to **"None"** or **"Default"** (the app provides its own exact page margins).
   - **Options**: Ensure **"Background graphics"** is **checked** (so colors, table highlights, and code backgrounds print faithfully).
3. Click **Save**!
