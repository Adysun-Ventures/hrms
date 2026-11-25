# ADR-002: Dual-Runtime React-PDF Rendering Architecture

## Metadata
- **ID**: ADR-002
- **Date**: 2026-11-12
- **Status**: ACCEPTED
- **Feature**: PDF Generation Engine
- **Author**: Antigravity

---

## Context
We need to generate pixel-perfect bank statement PDFs both inside a modern browser (interactive preview and download) and from the command line in headless Node.js environments (automated testing, pixel comparison, backend rendering).

---

## Decision
Use `@react-pdf/renderer` as the sole declarative document definition engine for all statements, and support two runtime targets:
1. **Browser Runtime**:
   - Compiles JSX documents using Vite.
   - Generates binary PDF blobs via `ReactPDF.pdf(<StatementDocument />).toBlob()`.
   - Renders preview using `pdfjs-dist` to HTML5 canvas.
2. **Headless Node.js Runtime**:
   - Execute standalone render via `scripts/render_cli.jsx`.
   - Bundle with `esbuild --bundle --format=esm --packages=external` to allow Node to resolve `@react-pdf/renderer` and standard fonts directly from disk.
   - Polyfill `globalThis.fetch` to read local `file://` font URLs.

---

## Consequences
- Single source of truth for PDF templates across browser and CLI.
- Pixel-perfect visual comparison can be automated headlessly.
