# Technical Debt Ledger

1. **Kotak Continuation Header Vertical Offset**:
   - *Current*: Continuation header is cleanly positioned at `y = 11.78 to 48.60 pt`.
   - *Debt*: Kotak transaction table top margin on page 2+ should be systematically measured against the original bank statement if 1:1 page breaks are requested.

2. **Bank Font Inlining**:
   - *Current*: `Noto Sans` is used for Kotak; `Times-Roman` (standard PDF font) is used for HDFC.
   - *Improvement*: When expanding to more banks, register custom bank typography fonts in `app/pdf/fonts/`.

3. **Dynamic Table Page Break Tuning**:
   - *Current*: React-PDF automatically wraps rows across pages when content exceeds page height.
   - *Improvement*: Allow optional manual row heights or target page counts to replicate multi-page bank statements 1:1.
