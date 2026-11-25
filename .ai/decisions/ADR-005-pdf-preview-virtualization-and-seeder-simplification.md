# Engineering Decision Record: PDF Preview Virtualization & Seeder UI Simplification

## Metadata
- **ID**: ADR-005
- **Date**: 2026-11-16
- **Status**: ACCEPTED
- **Feature**: Dynamic Transaction Seeder & Large-Scale PDF Preview
- **Author**: Antigravity & Viraj Kadam
- **Supersedes**: N/A (Extends ADR-002)

---

## Problem / Context
1. **Client Browser Freeze / Out-Of-Memory Crash**:
   When generating statements over large date ranges (e.g. 6 to 12 months, yielding 1,200 to 2,500 transactions and 80 to 180+ PDF pages), client browsers freeze, display "Page Unresponsive", or crash with an Out-Of-Memory error (`Aw, Snap!`, error code 5).
   - In `app/components/PdfPreview.jsx`, a loop renders **every single page** into an HTML5 `<canvas>` with `devicePixelRatio = 2`.
   - 100 pages × ~8.4 MB bitmap per high-DPI canvas = >840 MB to 1.5 GB allocated simultaneously in DOM/GPU memory, which exceeds browser tab canvas limits (typically 256–512 MB).
2. **Client Feedback on Seeder Usability**:
   In client voice note (`/home/sugat/Downloads/WhatsApp Ptt 2026-11-16 at 5.39.06 PM.ogg`), the client explicitly rejected complex configuration options (daily frequency sliders, mode selectors, recurring day inputs, month-by-month override tables).
   - The client requested removing all configuration forms and replacing them with a single, frictionless button: **"Generate Random Data"** (or **"जनरेट रँडम डेटा"**).
   - The button must automatically read the statement's `periodStart` and `periodEnd` and generate realistic transactions with zero user configuration.

---

## Proposed Approach / Decision

### 1. Dynamic Virtual Scroll with Load & Unload in `PdfPreview.jsx` (Solution 1)
- **DOM Virtualization (Windowing)**:
  - When the PDF is compiled, calculate standard page dimensions (`pageWidth`, `pageHeight`) from Page 1.
  - Mount `numPages` lightweight placeholder wrappers in the `.pdf-pages` container. Each wrapper has fixed CSS dimensions matching the page, ensuring the scrollbar height, scroll thumb, and scroll position are 100% stable and natural.
  - Attach an `IntersectionObserver` to each page slot with `rootMargin: '600px 0px 600px 0px'` (approximately 1 page buffer above and below viewport).
- **Dynamic Load**:
  - When a page enters the viewport/buffer (`isIntersecting === true`), PDF.js renders the `<canvas>` and selectable `textLayer` into that wrapper.
- **Dynamic Unload & Memory Reclamation**:
  - When a page scrolls out of the buffer (`isIntersecting === false`), any active render task is immediately cancelled (`renderTask.cancel()`), the canvas buffer is explicitly zeroed (`canvas.width = 0; canvas.height = 0`), and child nodes are unmounted.
  - A lightweight placeholder (`Page X`) is shown in the slot while off-screen.
- **Result**:
  - Only **2 to 4 active `<canvas>` elements exist in memory simultaneously** (~25–35 MB total memory), regardless of whether the statement is 5 pages or 200 pages.
  - The user can smoothly scroll through all 100+ pages from top to bottom.
  - Zero browser tab freezes, zero OOM crashes.

### 2. Streamlining Seeder UI to 1-Click Action
- In `app/components/TransactionSeeder.jsx` (and its placement in `Editor.jsx`):
  - Remove all input controls: min/max frequency, mode selectors, sender names, salary day, and custom monthly table overrides.
  - Expose a single primary action button: `[ Generate Random Data ]`.
  - Automatically seeds realistic daily debits and 1 monthly credit based on `account.periodStart` and `account.periodEnd`.

---

## Alternatives Considered

- **Alternative 1: Hard Cap to First 5 Pages with Download Banner**:
  - *Description*: Only render the first 5 pages and stop rendering subsequent pages.
  - *Reason Rejected*: Users cannot preview later pages or verify transactions on later months without downloading the PDF. Virtual scroll allows viewing all pages with identical memory safety.
- **Alternative 2: Paginated Document Toolbar (Next/Prev Buttons)**:
  - *Description*: Acrobat-style toolbar showing 1 page at a time with Prev/Next buttons.
  - *Reason Rejected*: User prefers continuous scrolling over button clicks for a smoother document inspection experience.

---

## Consequences & Trade-offs
- **Positive**:
  - Eliminates 100% of browser tab crashes and memory leaks on large multi-month statements.
  - Preserves full continuous scrolling for the entire statement (all pages accessible).
  - Keeps active canvas memory strictly bounded at ~25–35 MB.
  - Full downloaded PDF remains complete with all pages and exact formatting.
- **Negative / Risks**:
  - Rapid scrolling may briefly show page placeholder boxes for ~50ms while PDF.js renders the newly visible page.
- **Mitigations**:
  - 600px prefetch root margin ensures pages render before they scroll into the visible viewport during normal scrolling.

---

## Verification & Tests
- **Canvas Memory Verification**: Generate 1-year statement (1,500+ txs, ~100 pages). Verify tab memory stays under 50 MB and all pages render on scroll.
- **Seeder Tests**: Existing unit tests in `tests/seeder.test.js` continue to pass.
- **Build Verification**: `npm run build` succeeds cleanly.
