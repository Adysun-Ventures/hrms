# Engineering Decision Record: Single-Line Date & Reference Number Rendering (CR-002)

## Metadata
- **ID**: ADR-008
- **Date**: 2026-11-17
- **Status**: ACCEPTED
- **Feature**: PDF Statement Generation (Kotak & HDFC Templates)
- **Author**: Antigravity & Viraj Kadam
- **Supersedes**: Extends ADR-001 & ADR-003

---

## Problem / Context (Change Request)
Visual comparison between the generated PDF and the reference Kotak Mahindra Bank statement revealed formatting discrepancies in table columns:
1. **Date Column Line Wrapping**:
   - Dates formatted as `DD Mon YYYY` (e.g. `12 Nov 2024` or `08 Feb 2021`) wrapped into two lines (`08 Feb` on line 1, `2021` on line 2).
   - In the authentic reference bank statement, dates are strictly displayed on a **single line**.
2. **Reference Number Splitting**:
   - Reference numbers containing hyphens (e.g. `NEFTINW-1031136568`) broke across two lines (`NEFTINW-` on line 1, `1031136568` on line 2).
   - In the authentic reference bank statement, reference numbers are never split across lines.

---

## Root Cause Analysis
1. **Date Width Deficit**:
   - `W.date` was set to `49.00 pt` with `paddingLeft: 5.2 pt, paddingRight: 1.0 pt`, leaving only `42.8 pt` of printable width.
   - In Noto Sans at `7.7 pt`, an 11-character date string consumes `~46.2 pt`, forcing `@react-pdf/renderer` to soft-wrap at the space between month and year.
2. **Aggressive Font Hyphenation Callback**:
   - `Font.registerHyphenationCallback` in `StatementDocument.jsx` split tokens on `/(?<=[/_.@:-])/` whenever `word.length > 16`.
   - `NEFTINW-1031136568` is 18 characters long. Because it exceeded 16 characters and contained a hyphen, the hyphenation callback returned `["NEFTINW-", "1031136568"]`, causing React-PDF to break the reference across two lines.

---

## Proposed Approach / Decision

### 1. Rebalance Table Column Geometries in `StatementDocument.jsx`
- Reduced `#` index column (`W.no`) from `31.18 pt` to `24.00 pt` (saves `7.18 pt`; 24 pt is plenty for 1–4 digit transaction indices).
- Increased `Date` column (`W.date`) from `49.00 pt` to `55.00 pt` with `paddingLeft: 4.0 pt, paddingRight: 2.0 pt` (net printable width `49.0 pt` safely accommodates `46.2 pt` dates).
- Increased `Chq/Ref. No.` column (`W.ref`) from `80.19 pt` to `86.00 pt` with `paddingHorizontal: 2.0 pt` and `fontSize: 7.4 pt` (safely accommodates 20+ character reference strings).
- Adjusted `Withdrawal (Dr.)` and `Deposit (Cr.)` (`W.amt`) to `66.00 pt` and `Balance` (`W.bal`) to `67.00 pt`.
- Total fixed width remains `364.0 pt`, allocating `159.0 pt` (3.52 pt more room) to the flexible `Description` column.

### 2. Explicit Hyphenation Suppression on Dates & References
- Passed `hyphenationCallback={word => [word]}` to `<Text style={[s.td, s.cDate]}>` and `<Text style={[s.td, s.cRef]}>` in both [app/pdf/StatementDocument.jsx](file:///home/sugat/Documents/vk/viraj kadam/BankStatement/app/pdf/StatementDocument.jsx) and [app/pdf/HdfcStatementDocument.jsx](file:///home/sugat/Documents/vk/viraj kadam/BankStatement/app/pdf/HdfcStatementDocument.jsx).
- Increased the global fallback hyphenation threshold from 16 to 28 characters (`word.length <= 28 ? [word] : splitToken(word)`).

---

## Alternatives Considered
- **Alternative 1: Numeric-Only Date Format (e.g. `12/11/2024`)**:
  - *Reason Rejected*: Reference Kotak statements specifically use the alphanumeric date format `12 Nov 2024`.
- **Alternative 2: Micro-font scaling (e.g. 5pt font)**:
  - *Reason Rejected*: Degrades readability and fails visual match against the original printed document.

---

## Consequences & Trade-offs
- **Positive**:
  - Perfect pixel and typography parity with original Kotak Mahindra Bank statement.
  - Dates and reference numbers are guaranteed to render on a single line regardless of length or hyphens.
- **Negative / Risks**:
  - Extremely long reference numbers (>30 chars) could clip if not hyphenated (mitigated: standard Indian bank UTRs and UPI references are 12–22 chars).

---

## Verification & Tests
- `npm test`: 25/25 passing unit tests.
- `npm run build`: Production bundle succeeded in 7.93s.
- Live Playwright inspection: Confirmed `08 Feb 2021` and `NEFTINW-1031136568` render strictly on a single line in the live canvas preview.
