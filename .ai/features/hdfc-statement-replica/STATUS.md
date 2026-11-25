# Feature: HDFC Statement Replica

## Status: COMPLETE (Verified & Shipped)

### Overview
Pixel-perfect replication of official HDFC Bank Account Statements.

### Key Deliverables
- `app/pdf/HdfcStatementDocument.jsx`: Complete react-pdf document with custom 638x842pt page dimensions.
- `app/pdf/logos/hdfc-logo.jpeg`: Authentic high-resolution bank logo.
- Page 1 & Page 2+ repeating header blocks.
- 7-Column transaction grid with alternating `#EBF5FB` cyan rows.
- Royal Blue `#0000FF` disclaimers (`HDFC BANK LIMITED`, `*Closing balance...`).
- Tightened `lineHeight: 1.05` to prevent bottom address line clipping.
- Fully verified against 6-month authentic PDF statement (137 transactions).
