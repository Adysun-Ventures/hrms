# Project Context: Statement Builder

## 1. Vision & Purpose
Statement Builder is a specialized frontend web application and PDF generation engine that creates authentic, pixel-accurate Indian bank account statements. It serves financial software testing, accounting workflow demonstrations, UI mocking, and banking software compliance audits.

## 2. Core Capabilities
- **Multi-Bank Statement Generation**: Supports Kotak Mahindra Bank and HDFC Bank, with an extensible architecture to add ICICI, SBI, and Axis Bank.
- **Client-Side Live Preview & Export**: Powered by `@react-pdf/renderer` in the browser with full page navigation, zoom, and live interactive updates as values change.
- **Standalone CLI Rendering**: Command-line rendering engine using Node.js and `@react-pdf/renderer` to generate production PDFs without a browser.
- **JSON Import / Export**: Statements are stored, shared, and versioned as clean JSON documents with complete mathematical validation.
- **CSV Data Ingestion**: Supports flexible CSV imports (Amount + Type or Debit/Credit column formats) with formula injection protection.
- **Dynamic Transaction Seeder**: Generates realistic Indian daily spending across authentic merchant categories (tapri, chai, supermarket, food delivery, utilities, ATM withdrawals) with monthly recurring salary/credit deposits.

## 3. Supported Bank Statement Templates

### Kotak Mahindra Bank
- **Page Geometry**: Standard A4 (`595.28 × 841.89 pt`).
- **Design Elements**: Top red brand banner (`kotak-header-banner.png`), red header band for Savings Account Transactions (`#ed1c24`), clean modern sans-serif typography (`Noto Sans`), unmasked account number, 2-page+ continuation header.

### HDFC Bank
- **Page Geometry**: Wide custom layout (`638.00 × 842.00 pt`).
- **Design Elements**: Official HDFC Bank blue/red logo with tagline "We understand your world", customer details box with solid borders, right-aligned bank branch metadata block, 7-column transaction table with repeating header, cyan alternating rows (`#EBF5FB`), statement summary table, and royal blue disclaimer footer (`#0000FF`).

## 4. Key Repository Locations
- `app/components/`: React UI components (Editor, Dashboard, AccountForm, TransactionList, PdfPreview).
- `app/lib/`: Core computational logic (integer paise calculation `calc.js`, formatters `format.js`, data model `model.js`, validation `validate.js`).
- `app/pdf/`: React-PDF document templates (`StatementDocument.jsx`, `HdfcStatementDocument.jsx`, fonts, logos).
- `scripts/`: CLI rendering and diff tools (`render_cli.jsx`, `render_cli.mjs`, `visual_diff_marker.py`).
- `docs/`: Product and technical specifications (`TRANSACTION_SEEDER_SPEC.md`).
- `tests/`: Native Node.js test suite (`node --test tests/*.test.js`).
