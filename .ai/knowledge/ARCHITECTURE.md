# System Architecture & Technical Design

## 1. Technology Stack
- **Framework**: React 19 (`react`, `react-dom`).
- **Build Tool**: Vite 7 (`@vitejs/plugin-react`).
- **PDF Engine**: `@react-pdf/renderer` v4.9.0 (declarative PDF primitives: Document, Page, View, Text, Image, Font, StyleSheet).
- **PDF Viewing**: `pdfjs-dist` (client-side canvas rendering of generated PDF blobs for high-fidelity interactive preview).
- **Test Runner**: Node.js Native Test Runner (`node --test tests/*.test.js`).
- **CLI Bundler**: `esbuild` for bundling React-PDF JSX into standalone Node.js ES modules.

---

## 2. Data Flow Architecture

```
                 ┌────────────────────────────────┐
                 │       JSON / CSV Input         │
                 └──────────────┬─────────────────┘
                                │
                                ▼
                 ┌────────────────────────────────┐
                 │    normalizeStatement()        │  (app/lib/model.js)
                 └──────────────┬─────────────────┘
                                │
                                ▼
                 ┌────────────────────────────────┐
                 │         compute()              │  (app/lib/calc.js)
                 │  - Integer paise math          │
                 │  - Running balances            │
                 │  - Totals: Cr, Dr, Net, Close  │
                 └──────────────┬─────────────────┘
                                │
                                ▼
               ┌──────────────────────────────────┐
               │    StatementDocument Router      │  (app/pdf/StatementDocument.jsx)
               │      Checks `account.bank`       │
               └────────┬─────────────────┬───────┘
                        │                 │
            Kotak Bank  ▼                 ▼  HDFC Bank
      ┌────────────────────┐       ┌────────────────────┐
      │  Kotak Layout      │       │  HdfcStatementDoc  │
      │  - Standard A4     │       │  - 638x842 custom  │
      │  - Noto Sans       │       │  - Times Roman     │
      │  - Red Banner      │       │  - Cyan Grid Table │
      └─────────┬──────────┘       └─────────┬──────────┘
                │                            │
                └──────────────┬─────────────┘
                               │
                               ▼
                 ┌────────────────────────────────┐
                 │   @react-pdf/renderer Engine   │
                 └──────────────┬─────────────────┘
                                │
                ┌───────────────┴───────────────┐
                ▼                               ▼
       Browser Blob URL                  Node.js CLI File
       (pdfjs-dist viewer)               (/tmp/statement.pdf)
```

---

## 3. Mathematical Integrity & Balance Calculation
All balance arithmetic resides exclusively in `app/lib/calc.js`:
1. Every input string amount is parsed to integer paise:
   ```javascript
   export function parsePaise(str) {
     const clean = String(str).replace(/[^\d.-]/g, '');
     const [whole, frac = ''] = clean.split('.');
     return Math.round(Number(whole) * 100 + Number((frac + '00').slice(0, 2)));
   }
   ```
2. Transactions are sorted strictly by `date` (then `id`).
3. Running balance increments: `balance[i] = balance[i-1] + credits[i] - debits[i]`.
4. Final invariant: `closingPaise === openingPaise + totalCreditsPaise - totalDebitsPaise`.

---

## 4. Dual Rendering: Browser vs Standalone CLI
- **Browser**: React renders `Editor.jsx` with `<PdfPreview />`. Whenever state changes, `@react-pdf/renderer` generates a PDF blob, which `pdfjs-dist` renders onto HTML5 `<canvas>` elements.
- **Node.js CLI**: `scripts/render_cli.jsx` shims the `fetch` API for `file://` URLs so Node can read local font files, imports `StatementDocument.jsx`, and calls `ReactPDF.renderToFile()`. This is bundled with `esbuild` using `--packages=external` to allow headless verification.
