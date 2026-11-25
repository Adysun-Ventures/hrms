# Testing Rules & Protocols

## 1. Test Framework
- We use Node.js's native test runner (`node --test tests/*.test.js`).
- Fast, zero external test framework dependencies (no Jest, Mocha, or Vitest needed for unit tests).

## 2. Mandatory Test Coverage
Any modification to the following modules requires running and maintaining unit tests:
- `app/lib/calc.js`: Balance arithmetic, running balance tracking, paise parsing.
- `app/lib/validate.js`: Account validation, transaction validation, ISO date checks.
- `app/lib/format.js`: Currency formatting (Indian grouping for INR, Western otherwise), date formatting.
- `app/lib/model.js`: Normalization, migration of legacy statements, customer ID masking.

## 3. Verification Protocol
Before finishing any turn involving functional code:
```bash
npm test
npm run build
```
Both commands must pass with code 0.
