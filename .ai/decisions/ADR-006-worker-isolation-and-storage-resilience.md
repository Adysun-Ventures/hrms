# Engineering Decision Record: Worker Isolation & Storage Quota Resilience

## Metadata
- **ID**: ADR-006
- **Date**: 2026-11-16
- **Status**: ACCEPTED
- **Feature**: Background PDF Threading & Client-Side Storage Stability
- **Author**: Antigravity & Viraj Kadam
- **Supersedes**: Extends ADR-002

---

## Problem / Context
1. **Firefox Worker Failure and Silent Main-Thread Fallback (Category 1)**:
   - In Firefox, `new Worker(new URL('./pdf.worker.jsx', import.meta.url), { type: 'module' })` had potential module resolution quirks in local development with Vite.
   - If the Web Worker failed, crashed, or ran out of memory, `generate.jsx` caught `worker.onerror` and **silently transferred the entire workload to `mainThread.jsx`**.
   - Running `@react-pdf/renderer` layout compilation on the main UI thread blocked Firefox's event loop for 45+ seconds on large statements, triggering Firefox's slow-script watchdog:
     *"This page is slowing down Firefox. To speed up your browser, stop this page."*
2. **Synchronous `localStorage` Quota & Main-Thread Blocking (Category 3)**:
   - Large statements (thousands of transactions) produce multi-megabyte JSON payloads.
   - Synchronous `localStorage.setItem()` calls on every state update caused main-thread stutter and could trigger fatal `QuotaExceededError` crashes once storage reached browser 5 MB limits.

---

## Proposed Approach / Decision

### 1. Vite Native `?worker` Pipeline & Strict Thread Isolation (Category 1)
- **Vite `?worker` Constructor**:
  - Replace `new URL(..., import.meta.url)` with Vite's official pre-bundled worker import:
    `import PdfWorker from './pdf.worker.jsx?worker'`
  - Vite automatically bundles and resolves worker dependencies across Chrome, Firefox, and Safari in both development and production.
- **Strict Thread Isolation (Zero Main-Thread Freezes)**:
  - If a worker job crashes or runs out of memory, **never fall back to blocking the main thread**.
  - Reject the in-flight promise with a clear, graceful error message (`PDF compilation failed in background worker`).
  - Terminate the crashed worker and automatically reinitialize a fresh worker instance for subsequent jobs, keeping the main thread responsive at 60 FPS.

### 2. Non-Blocking Storage & Quota-Exceeded Safeguards (Category 3)
- **Idle Callback Scheduling**:
  - Schedule state persistence in `App.jsx` during browser idle cycles using `requestIdleCallback` (with a debounced 600ms fallback), avoiding contention with UI typing and rendering.
- **Quota Exceeded Recovery**:
  - In `app/lib/storage.js`, intercept `QuotaExceededError`. If total storage approaches or exceeds 5 MB, automatically prune older saved drafts to safeguard the active statement.

---

## Consequences & Trade-offs
- **Positive**:
  - Eliminates main-thread lockups and prevents Firefox's *"page slowing down"* warning.
  - Ensures 100% reliable worker loading across Firefox and Chromium.
  - Protects against storage quota exceptions when managing large statements.
- **Negative / Risks**:
  - If a statement is truly beyond the device's memory limits, the worker fails with an error message rather than attempting a desperate (and tab-freezing) main-thread compile.

---

## Verification & Tests
- `npm test`: Verify that all 23 unit tests pass.
- `npm run build`: Verify that Vite bundles the worker cleanly as a separate chunk.
