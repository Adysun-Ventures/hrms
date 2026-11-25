# Security Rules & Data Safety

## 1. CSV Formula Injection Defense
- When exporting statements to CSV in `app/lib/csv.js`, any cell value beginning with `=`, `+`, `-`, or `@` must be safely escaped (e.g. prefixed with `'`) to prevent spreadsheet formula injection attacks when opened in Excel or Google Sheets.

## 2. Client-Side Sandboxing
- All statement data processing occurs strictly in memory on the client side. No transaction data or customer PII should be transmitted to third-party tracking services or external APIs.

## 3. Secret Management
- Never commit private keys, credentials, or API tokens to the git repository.
