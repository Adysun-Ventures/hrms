# Bugs, Root Causes & Post-Mortems

This document chronicles real bugs encountered in this codebase, their underlying root causes, and how they were permanently fixed.

---

### Bug 1: Invisible Bank Metadata Block on Page 1 & 2
- **Symptoms**: Customer address on the left rendered correctly, but the entire right-side block (`Account Branch`, `Address`, `MICR`, `IFSC`) was completely invisible (`Blocks: []` in PyMuPDF).
- **Root Cause**: The container row had a rigid fixed height: `height: 8.70, alignItems: 'center'`. Because `@react-pdf/renderer` measures font line height as font size * line-height, it concluded the text exceeded 8.70 pt and dropped all child text nodes rather than overflowing.
- **Fix**: Removed fixed `height` and let natural flex line height size the container: `lineHeight: 1.1, marginBottom: 0.5`.

---

### Bug 2: Header Y-Offset Translation (`+228.88 pt`)
- **Symptoms**: Page 1 logo and customer details were translated down the page by ~228 pt and shifted right by 28 pt, overlapping the table.
- **Root Cause**: The `<Page>` had `paddingTop: 228.88`. The header `<View fixed>` had no explicit position styling, causing react-pdf to place child `position: 'absolute'` elements relative to the content padding box rather than the page origin.
- **Fix**: Styled the header container with `position: 'absolute', top: 0, left: 0, width: 638, height: 228.88`.

---

### Bug 3: Registered Office Address Truncation / Clipping at Bottom Page Edge
- **Symptoms**: In HDFC statements, the 7th footer line (`Registered Office Address...`) had its lower half cut off.
- **Root Cause**: Footer container was placed at `top: 782.5` with `lineHeight: 1.35`. With 7 stacked lines, each line consumed ~9.45 pt, pushing line 7 to `y = 839.13 pt – 848.47 pt`, which exceeded the `842.0 pt` page boundary.
- **Fix**: Tightened `lineHeight: 1.05` on footer text, matching the original PDF's 7.3 pt line pitch, bringing line 7 to `y = 829.03 pt – 838.37 pt` with full clearance.

---

### Bug 4: Browser Crash & Tab Freeze on Large Scale Statement Generation (Canvas GPU OOM)
- **Symptoms**: When seeding statements over multi-month or annual date ranges (e.g. 6 to 12 months, ~1,200 to 2,500 transactions, generating 80 to 180+ PDF pages), the browser freezes, stops responding, or crashes with Chrome error code 5 / `Aw, Snap!`.
- **Root Cause**: In `app/components/PdfPreview.jsx`, a `for (let i = 1; i <= doc.numPages; i++)` loop rendered every single page into an HTML5 `<canvas>` at `devicePixelRatio = 2`. Each canvas allocated ~8.4 MB of RGBA bitmap memory. Rendering 100 pages allocated >840 MB to 1.5 GB simultaneously, blowing past Chromium's per-tab GPU canvas memory budget and starving the JS event loop.
- **Fix**: Virtualize / cap the canvas preview in `PdfPreview.jsx` to render the first 3 to 5 pages with a notice that the full statement is included in the downloaded PDF. Capping preview to 5 pages keeps canvas memory strictly under ~35 MB regardless of statement size.

---

### Bug 5: Web Worker Fast Refresh ReferenceError (`window is not defined`) in Vite Dev Server
- **Symptoms**: PDF preview fails with `"Could not render the preview: PDF compilation failed or ran out of memory in background worker."`.
- **Root Cause**: In Vite development mode (`npm run dev`), the `@vitejs/plugin-react` plugin injects React Fast Refresh / HMR (`/@react-refresh`) into every JSX file. When `pdf.worker.jsx` and imported documents were processed, `@react-refresh` accessed `window.__registerBeforePerformReactRefresh`. In Web Worker execution contexts, `window` does not exist, throwing `ReferenceError: window is not defined` immediately on worker startup and terminating the worker. Additionally, un-guarded `a.address.split('\n')` crashed worker rendering when address was null or undefined.
- **Fix**:
  1. Configured `@vitejs/plugin-react` in `vite.config.js` with `exclude: [/\/pdf\//, /\/node_modules\//]`, preventing HMR injection into worker bundles while preserving JSX compilation via esbuild.
  2. Converted `pdf.worker.jsx` to `pdf.worker.js` and added `if (typeof window === 'undefined') self.window = self;` polyfill.
  3. Added `(a.address || '').split('\n')` defensive null-checks in `HdfcStatementDocument.jsx` and `StatementDocument.jsx`.

---

### Bug 6: Global UI Deformation Across SPA Navigation due to Unscoped `.grid` & Tag Selectors
- **Symptoms**: After visiting the Statements screen, clicking back to Resumes caused the Resume filter controls ("All resumes", "All Phases", "Name or phone...") to stretch 100% width across the card, becoming rectangular boxes with 6px border-radius instead of pill shapes. Additionally, the "Resume Builder" header title was knocked off-center towards 75% width.
- **Root Cause**: `src/statements/styles.css` was injected into `<head>` upon navigating to `#statements`. The stylesheet had global rules `.grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }` and `input:not(...), select, textarea { width: 100%; min-height: 34px; border-radius: 6px; }`. Because of CSS specificity `(0, 2, 1)`, these rules clobbered Tailwind's `.grid` and `.w-full / md:w-36` utilities across the SPA.
- **Fix**:
  1. Scoped all selectors in `styles.css` inside `.statement-root`.
  2. Renamed `.grid` in form markup and CSS to `.st-form-grid`.
  3. Upgraded `CardHeader` in `src/ui.jsx` to `lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]`.

---

### Bug 7: Dark Gray/Black Text on Emerald Primary Buttons (`.statement-root button` Specificity Overwrite)
- **Symptoms**: In the Statement dashboard, the primary "+ New statement" button and table "Open" buttons rendered with emerald green backgrounds, but with dark gray/black text instead of crisp white.
- **Root Cause**: `styles.css` contained a reset rule `button, input, select, textarea { font: inherit; color: inherit; }`. When nested inside `.statement-root`, it compiled to `.statement-root button { color: inherit; }`. Its specificity `(0, 1, 1)` was higher than Tailwind's `.text-white` `(0, 1, 0)`. The button text inherited the dark body text (`--text: #1f2933`).
- **Fix**: Removed the redundant `button, input, select, textarea { color: inherit; }` reset. Tailwind's base preflight handles font and color inheritance at base specificity `(0, 0, 1)`, allowing `.text-white` to take precedence.

---

### Bug 8: PDF Preview Toolbar Overlap & Control Misalignment (Transparent Sticky Header Bleed)
- **Symptoms**: As the user scrolled the PDF preview, PDF page text ("01 Jan 2021 - 31 Oct 2024", "Mahadev", CRN) scrolled directly behind the toolbar, bleeding into the "34 pages · A4", "Protect with password", password input, and "Download Protected PDF" button. The toolbar had raw emojis, mismatched heights (32px input vs 28px button vs 26px checkbox), and cut off the top Kotak/HDFC header banner.
- **Root Cause**: The preview bar had `position: sticky; top: 0; background: transparent;` inside the same container as the scrollable canvas list. Without a dedicated non-scrolling header with a solid background and border, the canvas rendered directly under the controls.
- **Fix**:
  1. Restructured `PdfPreview.jsx` with a non-scrolling, solid white top toolbar (`bg-white border-b border-gray-200 px-3.5 py-2.5`).
  2. Confined the PDF pages to a dedicated scrollable viewport (`max-h-[calc(100vh-8.5rem)] overflow-y-auto p-4`), completely separating page scrolling from the toolbar.
  3. Standardized all toolbar controls to `h-8` (32px), using SVG `Icon` components instead of emojis, and styled the password input and page count badge using Tailwind design tokens.



