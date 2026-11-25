# Feature Specification: Dynamic Transaction Seeder & Large-Scale Preview

## Metadata
- **Status**: CHANGE REQUEST RECEIVED (Voice Note 2026-11-16)
- **Primary Spec**: Link to [docs/TRANSACTION_SEEDER_SPEC.md](file:///home/sugat/Documents/vk/viraj%20kadam/BankStatement/docs/TRANSACTION_SEEDER_SPEC.md)
- **Related ADR**: [ADR-005: PDF Preview Virtualization & Seeder Simplification](file:///home/sugat/Documents/vk/viraj%20kadam/BankStatement/.ai/decisions/ADR-005-pdf-preview-virtualization-and-seeder-simplification.md)

---

## 1. Core Generator Requirements (Retained & Enforced)
1. **Dynamic Daily Debits**:
   - 5 to 10 randomized transactions per day across statement period (`periodStart` to `periodEnd`).
   - Realistic Indian merchant categories with exact price bounds (Tapri: ₹10–60, Fast food: ₹50–350, Dining: ₹150–1,800, Groceries: ₹150–3,500, Fuel: ₹150–2,500, Utilities: ₹299–2,499, ATM: ₹500/1,000/2,000 multiples).
   - Bank-accurate UPI narration formatting for Kotak and HDFC.
2. **Own Monthly Credit (Salary / Self-Deposit)**:
   - Exactly 1 credit entry per calendar month between `periodStart` and `periodEnd`.
   - Realistic credit amount (e.g., ₹55,000–₹75,000) deposited around the 5th of each month via NEFT salary format.
3. **Data Integrity & Balance Preservation**:
   - Integer paise calculations across all transactions.
   - Paced daily debit amounts to ensure running balance never dips below minimum reserve threshold.

---

## 2. Client Change Request (Voice Note: 2026-11-16)

### A. Remove Complex Seeder UI Controls
- **Voice Note Instruction**: *"शेजारी सीडर चा ऑप्शन दिला आहे किंवा त्याच्यात मला सीडर च्या काही गोष्टी वगैरे घालायचे ऑप्शन्स दिले आहेत, काही नको, ते सगळं काढून टाक. मला ऑप्शन्स नकोय, ते सगळं ऑटोमॅटिक जनरेट केलं पाहिजे."*
- **Action**: Remove manual frequency inputs, mode selectors, recurring day inputs, sender randomizer inputs, and custom month-by-month override table from `TransactionSeeder.jsx` / `Editor.jsx`.

### B. Single 1-Click Action Button
- **Voice Note Instruction**: *"सीडर चा ऑप्शन देऊ नको, मला फक्त एक बटन दे 'जनरेट रँडम डेटा'. क्लिक केलं की सगळं ऑटोमॅटिक जनरेट करू दे, फ्रॉम डेट आणि टू डेट पर्यंत."*
- **Action**: Replace the entire configuration drawer with a single prominent button: **"Generate Random Data"** (or **"Generate Random Transactions"**).
- **Behavior**: Reads the active account's `periodStart` and `periodEnd`, executes `generateSeededTransactions()`, and loads all entries into state instantly.

### C. Large-Scale Statement Crash Resolution
- **Client Issue**: Generating multi-month or annual data freezes the browser or crashes the tab.
- **Root Cause**: `PdfPreview.jsx` renders all 100+ pages onto high-DPI HTML5 canvases, exceeding GPU canvas memory budgets (>1 GB).
- **Action**: Virtualize/cap canvas rendering in `PdfPreview.jsx` to the first 3–5 pages with a notice that the full statement is included in the downloaded PDF.

---

## 3. Client Change Request 2: Smart Random Filler Mode (2026-11-17)

### A. Problem
- When users import custom or OCR-extracted salary schedules (e.g. `salary_credits.json` containing 1 monthly salary transaction per month over multi-year ranges), clicking **"Generate Random Data"** used to overwrite the imported salary with random fake salaries and prompted to replace all data.
- The user workflow requires keeping the imported monthly salary credits intact while generating random daily filler data (UPI retail debits) for the empty gap days.

### B. Solution
- Make `TransactionSeeder.jsx` context-aware:
  - If existing transactions are detected (e.g., imported salary credits), dynamically change the action to **"Generate Random Filler Data"**.
  - Call `fillTransactionGaps(account, transactions)` to generate realistic daily Indian UPI debits for empty days while strictly preserving all existing transactions.
  - Pace daily debits against incoming monthly salary credits to maintain a strictly positive running balance.
  - Suppress the destructive "Replace all transactions?" confirmation dialog when operating in filler mode.

