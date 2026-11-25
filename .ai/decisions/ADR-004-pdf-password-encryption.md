# ADR-004: Client-Side PDF Password Encryption

## Metadata
- **ID**: ADR-004
- **Date**: 2026-11-14
- **Status**: ACCEPTED
- **Feature**: PDF Password Protection
- **Author**: Antigravity & Viraj Kadam

---

## Context
Official Indian bank statements (HDFC, Kotak, SBI, ICICI, etc.) are frequently issued as password-protected PDF files to protect customer financial privacy. The user requested an option to download password-protected statements using an explicit password input, while also allowing normal unencrypted downloads when password protection is disabled.

---

## Decision
1. **Library Selection**:
   - Use `@cantoo/pdf-lib` (a maintained fork of `pdf-lib` supporting native ISO 32000-2 revision 6 AES-256 PDF encryption).
   - Works purely client-side in the browser and in headless Node.js without requiring backend server crypto calls.
2. **Encapsulation**:
   - Encapsulate encryption logic inside `app/lib/encrypt.js` (`encryptPdfBlob(blob, password)`).
   - If `password` is empty or undefined, the original blob is returned untouched (zero overhead for unencrypted statements).
3. **Model & State**:
   - Add `encryptPdf` (boolean) and `pdfPassword` (string) to `account` in `app/lib/model.js`.
   - Persist settings across sessions and exported JSON statements.
4. **UI Integration**:
   - Provide inline toggle (`Protect with password`) and password input right beside the "Download PDF" button in the preview pane.
   - Also expose the setting under "PDF Security & Password Protection" in `AccountForm.jsx`.
   - Require password entry if protection is enabled before initiating download.

---

## Consequences
- **Positive**: Generated bank statements can now faithfully mimic real password-protected bank statement files.
- **Positive**: Zero backend requirement; 100% offline and client-side safe.
- **Negative**: Adds `@cantoo/pdf-lib` dependency to client bundle (~450KB uncompressed, code-split dynamically).
