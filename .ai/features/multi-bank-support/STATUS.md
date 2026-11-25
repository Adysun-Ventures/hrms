# Feature: Multi-Bank Statement Support

## Status: COMPLETE

### Overview
Allows users to toggle statement branding, styling, and data formats between Kotak Mahindra Bank and HDFC Bank.

### Affected Modules
- `app/lib/model.js`: `BANK_OPTIONS = ['Kotak Mahindra Bank', 'HDFC Bank']`, `blankAccount()`, `normalizeStatement()`.
- `app/components/AccountForm.jsx`: Dynamic "Bank & Account" selector dropdown.
- `app/components/Dashboard.jsx`: Displays bank name badges on saved statements.
- `app/pdf/StatementDocument.jsx`: Top-level router delegating to bank-specific templates.
