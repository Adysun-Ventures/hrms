# REJECTED: Native Floating-Point Math for Bank Balances

## Metadata
- **ID**: REJ-002
- **Date**: 2026-11-12
- **Status**: REJECTED
- **Feature**: Financial Calculation
- **Alternative to**: ADR-003 (Integer Paise Math)

---

## Proposed Approach
Use native JavaScript floating-point numbers (`parseFloat(str)`) directly for running totals and balance checks, relying on `toFixed(2)` at the end to clean up decimals.

---

## Reason for Rejection
1. **Accumulated Drift**: Accumulating 100+ transactions with floating point operations produces errors like `5713.62 + 40000.00 = 45713.620000000005`.
2. **Discrepancy Invariant Failure**: Over multiple additions and subtractions, rounding errors compound, causing the computed closing balance to diverge from `opening + credits - debits` by ₹0.01 or ₹0.02.
3. **Flaky Unit Tests**: Tests comparing currency strings fail intermittently due to epsilon differences.

---

## Reconsideration Conditions
Never reconsider. Financial software must always use integer or BigInt cents/paise arithmetic.
