# Implementation Plan: Dynamic Transaction Seeder & Large-Scale Preview

## Phase 1: Dependency & Merchant Dataset (Completed)
- [x] Install `@faker-js/faker` via npm.
- [x] Create `app/lib/indianMerchants.js` with structured merchant categories, realistic price bounds, and UPI/NEFT narration generators.

## Phase 2: Core Seeder Engine (Completed)
- [x] Create `app/lib/seeder.js`:
  - [x] Date iteration across `periodStart` to `periodEnd`.
  - [x] Monthly credit injection (Pointer 2).
  - [x] Daily randomized debit generation (Pointer 1).
  - [x] Balance pacing & negative prevention.

## Phase 3: Initial UI Integration (Completed)
- [x] Add Seeder controls to `app/components/TransactionSeeder.jsx`.
- [x] Month-by-month amount customization table.

## Phase 4: Initial Testing & Verification (Completed)
- [x] Unit tests in `tests/seeder.test.js`.
- [x] Production build verification (`npm run build`).

## Phase 5: Client Change Request — 1-Click UI & Crash Fix (Completed)
- [x] **Large-Scale Preview Virtualization (`PdfPreview.jsx`)**:
  - [x] Implement `PdfPageSlot` with `IntersectionObserver` (600px rootMargin buffer).
  - [x] Dynamic load: render `<canvas>` and `textLayer` only when page enters viewport.
  - [x] Dynamic unload & GPU reclamation: zero canvas buffer (`width = 0; height = 0`) and unmount off-screen pages.
  - [x] Maintain constant placeholder height so scrollbar dynamics and scroll position never shift.
  - [x] Verified with `npm test` and `npm run build`.
- [x] **UI Simplification (`TransactionSeeder.jsx` / `Editor.jsx`)**:
  - [x] Strip out parameter inputs, frequency controls, and override tables.
  - [x] Replace with a single primary button: `[ Generate Random Data ]`.
  - [x] Automatically wire active `account.periodStart` and `account.periodEnd` with smart default configurations (5-10 daily debits with category bounds, 1 monthly salary credit).
