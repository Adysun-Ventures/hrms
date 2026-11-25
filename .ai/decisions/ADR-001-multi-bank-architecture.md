# ADR-001: Multi-Bank Statement Architecture

## Metadata
- **ID**: ADR-001
- **Date**: 2026-11-13
- **Status**: ACCEPTED
- **Feature**: Multi-Bank Support
- **Author**: Antigravity & Viraj Kadam
- **Supersedes**: ADR-000 (Kotak-only hardcoded document)

---

## Context
Initially, the Statement Builder only generated statements for Kotak Mahindra Bank. When the user requested support for HDFC Bank (which uses a completely different aspect ratio, custom cyan alternating table styling, separate customer info boxes, and distinct bank disclaimers), the system needed a scalable way to switch templates cleanly without code duplication.

---

## Decision
1. **Model Normalization**:
   - Add `bank` property to `account` model in `app/lib/model.js` with `BANK_OPTIONS = ['Kotak Mahindra Bank', 'HDFC Bank']`.
   - Default to `'Kotak Mahindra Bank'` for backward compatibility with older statements.
2. **Top-Level Router Component**:
   - In `app/pdf/StatementDocument.jsx`, inspect `statement.account.bank`.
   - If `bank === 'HDFC Bank'`, delegate rendering to `<HdfcStatementDocument {...props} />`.
   - Otherwise, render Kotak Mahindra Bank layout.
3. **UI Integration**:
   - Add Bank Name dropdown in `AccountForm.jsx`.
   - Display bank badge in `Dashboard.jsx`.

---

## Consequences
- **Positive**: Adding new banks (e.g. ICICI, SBI) requires only creating `app/pdf/<Bank>StatementDocument.jsx` and adding an entry in `BANK_OPTIONS`.
- **Positive**: Existing Kotak statements load seamlessly without migration failures.
- **Negative**: Each bank requires dedicated layout styling due to differing physical layouts.
