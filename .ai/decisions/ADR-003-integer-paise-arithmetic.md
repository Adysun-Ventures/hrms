# ADR-003: Integer Paise Balance Calculation

## Metadata
- **ID**: ADR-003
- **Date**: 2026-11-12
- **Status**: ACCEPTED
- **Feature**: Financial Calculation Engine
- **Author**: Antigravity

---

## Context
Financial software cannot tolerate IEEE-754 floating-point inaccuracies (e.g. `10000.10 + 20000.20 === 30000.300000000003`). In bank statements with 100+ transactions, floating point drift causes running balances and closing totals to differ from actual transaction sums by 1 or 2 paise, invalidating the statement.

---

## Decision
All financial quantities in `app/lib/calc.js` must be parsed into integer paise (1 INR = 100 paise) upon ingestion:
```javascript
export function parsePaise(str) {
  const clean = String(str).replace(/[^\d.-]/g, '');
  const [whole, frac = ''] = clean.split('.');
  return Math.round(Number(whole) * 100 + Number((frac + '00').slice(0, 2)));
}
```
All running totals, debits, credits, and closing balances are accumulated exclusively using standard integer addition and subtraction. Values are only formatted back to currency strings for PDF and UI presentation.

---

## Consequences
- Guaranteed zero rounding drift across arbitrarily long transaction histories.
- Exact unit test coverage in `tests/calc.test.js`.
