# REJECTED: html2canvas & Headless Puppeteer for PDF Generation

## Metadata
- **ID**: REJ-001
- **Date**: 2026-11-12
- **Status**: REJECTED
- **Feature**: PDF Generation Engine
- **Alternative to**: ADR-002 (React-PDF)

---

## Proposed Approach
Render the statement as standard HTML/CSS DOM in the browser and use `html2canvas` + `jspdf` or a headless Chrome / Puppeteer instance to take screenshots and compile them into a PDF document.

---

## Reason for Rejection
1. **Font & Vector Degradation**: `html2canvas` rasterizes text into bitmap pixels, resulting in blurry text when zoomed and rendering PDF text unselectable. Real bank statements require crisp, selectable vector text with embedded standard fonts.
2. **Page Break Nightmares**: Browser DOM rendering cannot deterministically split multi-page transaction tables across arbitrary page boundaries without awkward sliced rows or overflowing headers.
3. **Heavy Dependency Footprint**: Puppeteer requires a 300MB headless Chromium download, making lightweight client-side offline execution impossible.

---

## What Went Wrong / Evidence
Prototype tests generated multi-megabyte image-based PDFs where text could not be searched or copied, and page breaks cut table rows in half.

---

## Reconsideration Conditions
Do not reconsider unless the application shifts to server-only pre-rendered reporting where exact DOM print stylesheets are mandated by corporate policy.
