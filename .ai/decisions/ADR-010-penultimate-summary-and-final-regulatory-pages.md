# Engineering Decision Record: Authentic Kotak Summary & Regulatory Appendix Pages (CR-004)

## Metadata
- **ID**: ADR-010
- **Date**: 2026-11-18
- **Status**: ACCEPTED
- **Feature**: Authentic Kotak Statement Appendix & Closing Layout (CR-004)
- **Author**: Antigravity & Viraj Kadam
- **Supersedes**: Extends ADR-001, ADR-002, and ADR-008

---

## Problem / Context (Change Request)
Visual and structural inspection of the authentic Kotak Mahindra Bank reference statement (`AccountStatement_01-Nov-2024_01-Nov-2025.pdf`) revealed two architectural discrepancies:
1. **Transactions Table End**:
   - In our previous implementation, the transactions table ended with an in-table `Closing Balance` row (`s.rowTotal`).
   - In authentic bank statements, the transactions table concludes immediately after the last transaction row without any in-table summary row.
2. **Missing Closing Summary and Regulatory Notice Pages**:
   - Authentic Kotak statements always conclude with two dedicated full pages:
     - **Page N-1 (Account Summary & Customer Assistance)**: Customer mini-header, "Account Summary" table with Opening and Closing balances, "End of Statement" centered disclaimers, promotional campaign banner, 3-column contact details card with icons, "Remember!" security alert card with safe banking QR code, and corporate registered office details.
     - **Page N (Important Information & Narrations)**: Customer mini-header, "Important Information" rounded container with 13 official RBI and Kotak regulatory disclosures, and "Commonly Used Narrations" 2-column grid covering 26 standard banking abbreviations.

---

## Technical Solution & Implementation

### 1. In-Table Closing Balance Row Removal
Removed the `<View style={[s.tr, s.rowTotal]}>` element from the transactions table inside [app/pdf/StatementDocument.jsx](file:///home/sugat/Documents/vk/viraj%20kadam/BankStatement/app/pdf/StatementDocument.jsx). The table now ends directly on the final transaction row, leaving subsequent vertical space clear as on the authentic document.

### 2. High-Resolution Asset Extraction & Alpha Compositing
Extracted vector/raster image streams directly from the authentic PDF with `smask` transparency composited on white backgrounds:
- `app/pdf/logos/kotak-promo-banner.jpeg` (Campaign banner: "Hausla hai toh ho jayega")
- `app/pdf/logos/kotak-icon-phone.png` (Contact Us & Branch Phone icon)
- `app/pdf/logos/kotak-icon-branch.png` (Branch Address icon)
- `app/pdf/logos/kotak-qr-security.jpeg` (Safe banking QR code)

### 3. Multi-Page Architecture in React-PDF
Implemented two dedicated `<Page>` components following the transactions page:
- **Page N-1 (`s.page`)**:
  - `contHeader` (fixed): Customer Name, Account No., Statement Period.
  - Red band & grey table header for `Account Summary` (`Particulars`, `Opening Balance`, `Closing Balance`).
  - Data row dynamically bound to `m(computed.opening)` and `m(computed.closing)`.
  - Centered "End of Statement" and statutory non-signature disclaimers.
  - Campaign banner image (`width: 523pt, height: 86.3pt`).
  - 3-column contact card: Toll-free Contact Us (`1800 4100`), dynamic Branch Address, and Branch Phone Number (`9168614476`).
  - Light-grey rounded security card (`#eaebec`) with red "Remember!" title, fraud prevention text, and QR code.
  - CIN & Registered Office legal footer.
  - Running page footer (`fixed` with `pageNumber` and `totalPages`).
- **Page N (`s.page`)**:
  - `contHeader` (fixed): Customer mini-header.
  - Red band for `Important Information` and rounded rectangle border (`#9fa1a4`, `borderRadius: 6`).
  - 13 official verbatim regulatory bullet points (Positive Pay, cheque clearing, debit card insurance, TDS thresholds, Form 121, RBI current account circular, DICGC ₹5,00,000 cover, etc.).
  - Red band for `Commonly Used Narrations` and 2-column table grid with 13 rows mapping 26 standard transaction codes.
  - Running page footer (`fixed`).

### 4. React-PDF Dynamic TotalPages Bug Prevention
In `@react-pdf/renderer`, elements using dynamic render props (`render={({ pageNumber, totalPages }) => ...}`) must be marked with `fixed`. Without `fixed`, React-PDF attempts standard flow layout adjustments on the dynamic text, creating an infinite two-pass re-pagination loop. Both footers were assigned `fixed` to ensure instantaneous 1-second compilation.

---

## Verification & Testing
1. **Unit Tests (`npm test`)**: All 25 unit tests pass without regression.
2. **Production Bundle (`npm run build`)**: Vite production bundle compiled cleanly in 9.73s.
3. **PyMuPDF Image Inspection**: Rendered PNG bitmaps of Page 1, Page 2, and Page 3 and compared against the original PDF (`real_statement_page77.png` and `real_statement_page78.png`), confirming identical typography, column widths, and component alignment.

---

## Consequences
- Authentic statements now match official Kotak Mahindra Bank statement exports 1:1.
- In-table closing balance removed in favor of the formal closing summary page.
