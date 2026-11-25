# Engineering Decision Record: Smart Random Filler Data & Gap Seeding (CR-001)

## Metadata
- **ID**: ADR-007
- **Date**: 2026-11-17
- **Status**: ACCEPTED
- **Feature**: Dynamic Transaction Seeder & Transaction Manager
- **Author**: Antigravity & Viraj Kadam
- **Supersedes**: Extends ADR-005

---

## Problem / Context (Change Request)
1. **User Workflow Evolution**:
   Users frequently import custom or OCR-extracted salary schedules (such as `salary_credits.json` containing 1 monthly salary payment per month over multi-year ranges, e.g. Feb 2021 – Oct 2024).
2. **The Seeder Overwrite Limitation**:
   Previously, clicking **"Generate Random Data"** in `TransactionSeeder.jsx` assumed the user always wanted a fully synthetic statement from scratch. It generated random corporate salary credits (between ₹55k and ₹75k) and daily debits, prompting to completely replace all existing transactions. If accepted, it destroyed the user's authentic imported salary schedule.
3. **Empty Date Gaps**:
   Importing 1 salary credit per month left empty gaps on the remaining ~29 days of every month. Users needed the seeder to act as a **smart random filler**: preserve all imported salary credits and populate realistic daily retail debits on the gap days between salary payments without plunging the balance into debt.

---

## Proposed Approach / Decision

### 1. Context-Aware Dual Mode in `TransactionSeeder.jsx`
- `TransactionSeeder` now accepts `transactions = []` from `statement.transactions`.
- **Mode A: Full Synthesis Mode (`transactions.length === 0`)**:
  - Operates as before: generates both salary credits and daily debits across `[periodStart, periodEnd]`.
  - Button reads: `Generate Random Data`.
- **Mode B: Smart Filler Mode (`transactions.length > 0`)**:
  - Detects existing transactions (e.g. 45 imported monthly salary credits).
  - Button dynamically updates to: `Generate Random Filler Data`.
  - Hint text displays: *"Statement has X existing transactions (Y salary credits). Generates realistic daily filler debits (Tapri, Groceries, Dining, Fuel, ATM) for the gap days while preserving your salary."*
  - Calls `fillTransactionGaps(account, transactions)` to generate debits strictly on empty days.
  - Passes `{ isFiller: true }` to `onSeed`, suppressing the `window.confirm("Replace all existing transactions?")` prompt.

### 2. Financial Math & Solvency Invariant in `fillTransactionGaps`
- **Chronological Balance Simulation**: Tracks cleared running balance day-by-day starting from `openingBalance`.
- **Solvency Gate**: On each gap day, new debits are only generated if `runningBalPaise - minReservePaise > 0` (keeping at least ₹1,000 cleared buffer).
- **Proportional Monthly Spending**: When monthly salary credits exist, monthly debits are bounded to ~65%–80% of incoming salary.
- **Result**: Zero negative balances (`negativeCount === 0`) throughout the entire statement period, accumulating natural savings.

---

## Alternatives Considered
- **Alternative 1: Separate "Fill Gaps" button only in Transaction Manager**:
  - *Reason Rejected*: Users naturally look at the prominent **Random Data Generator** card at the top of the editor. Splitting the behavior creates UI confusion. Making `TransactionSeeder` context-aware provides an intuitive 1-click experience.
- **Alternative 2: Unconstrained Daily Debits (5–10 debits/day regardless of salary)**:
  - *Reason Rejected*: Over 45 months, 5–10 debits/day yields >10,000 transactions and ₹94 Lakhs in debits against ₹10.4 Lakhs in salary, plunging the balance into massive debt (-₹66.9 Lakhs) and freezing the browser.

---

## Consequences & Trade-offs
- **Positive**:
  - Seamless 1-click workflow: Import salary JSON -> Click `Generate Random Filler Data` -> Complete, authentic bank statement ready in seconds.
  - Zero loss of custom salary credits.
  - 100% positive running balance across multi-year statements.
- **Negative / Risks**:
  - If a statement has 0 credits and ₹0 opening balance, filler debits cannot be generated (mitigated: seeder informs user to set opening balance or import credits).

---

## Verification & Tests
- **Automated Tests**:
  - `tests/seeder.test.js`: Verified `fillTransactionGaps` preserves all 45 salary credits from `salary_credits.json` and ensures `computed.negativeCount === 0` and `computed.closing > 0`.
  - Full suite: 25/25 passing unit tests.
- **Live Playwright E2E**:
  - Imported `salary_credits.json` (45 credits, ₹10,45,180.13).
  - Clicked `Generate Random Filler Data`: populated 878 debits (`₹7,27,073.75`), positive closing balance `₹3,18,106.38`, and compiled PDF cleanly in background worker.
