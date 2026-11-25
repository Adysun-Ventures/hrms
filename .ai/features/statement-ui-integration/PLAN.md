# Implementation Plan: Bank Statement UI/UX Integration into Slot Profile

This document details the issues identified and the step-by-step plan to align the Statement Builder UI with the existing Slot Profile design patterns.

---

## 1. Identified Issues

### Issue 1: Back Button Placement & Breadcrumbs
* **Problem**: 
  * Statements screens currently lack the standard breadcrumbs (`Home > Statements` / `Home > Statements > [Title]`).
  * In the editor, navigation is an unstyled raw text link (`← All statements`) instead of the standard Slot Profile circular back button (`CircleButton` with left arrow icon) inside a `CardHeader`.
* **Fix**:
  * Wrap the Statement views in `<Page crumbs={crumbs}>` from `src/ui.jsx`.
  * Use `<CardHeader>` from `src/ui.jsx` with `onBack={() => go(null)}` or `history.back()`, placing the circular back button on the left, centered title, and actions on the right.

---

### Issue 2: Full-Width Screen Expansion (Left & Right)
* **Problem**:
  * Statement dashboard (`Dashboard.jsx`) was constrained by `.dash { max-width: 1180px; margin: 0 auto; }`, causing boxed, narrow gutters on wide screens while Candidates and Resumes span full-width.
  * Statement editor had an artificial fixed column layout with inconsistent horizontal padding.
* **Fix**:
  * Remove `max-width: 1180px` constraint from `.dash` and embed both the dashboard and editor inside standard Slot Profile `<Card>` containers with responsive padding (`px-4 sm:px-6`).
  * Ensure tables and editor panels expand to 100% of the container width matching `ResumeList` and `ResumeEditor`.

---

### Issue 3: Edit Statement Page Bottom Unwanted Space & Trapped Sidebars
* **Problem**:
  * The `.app` grid used a rigid `height: calc(100vh - 56px)` with internal `overflow: auto` on `.editor`, while outer `.statement-root` had `min-height: calc(100vh - 56px)`.
  * This created nested double scrollbars (the window scrollbar + the editor internal scrollbar), causing the top Slot Profile header to scroll out of view and leaving a massive dead white gap (>50% of the screen) at the bottom.
* **Fix**:
  * Replace the rigid height `.app` container with a clean responsive grid matching `ResumeEditor`:
    `<div className="grid items-start gap-5 lg:grid-cols-[minmax(380px,460px)_1fr] xl:grid-cols-[minmax(420px,500px)_1fr]">`
  * Remove nested scrollbars: let the page scroll naturally or keep the PDF preview container sticky (`sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto`).
  * Eliminate bottom dead space and ensure the layout seamlessly fits the viewport without unwanted margins.

---

## 2. Step-by-Step Execution Plan

- [ ] **Step 1: Fix Breadcrumbs and Back Button (Issue 1)**
  - Update `src/statements/App.jsx` to wrap Dashboard in `<Page crumbs={[['Statements']]}>` and Editor in `<Page crumbs={[['Statements', '#/statements'], [statementTitle(statement) || 'Statement']]}>`.
  - Replace raw header in `Dashboard.jsx` with `CardHeader` (circle back button, title, action buttons).
  - Replace raw header in `Editor.jsx` with `CardHeader` (circle back button, title, download/save actions).

- [ ] **Step 2: Full-Width Expansion for List & Dashboard (Issue 2)**
  - In `styles.css` and `Dashboard.jsx`, wrap the content in `<Card>` and remove `.dash { max-width: 1180px; }`.
  - Style the dashboard table to span full width with standard Slot Profile borders and hover states.

- [ ] **Step 3: Fix Editor Layout, Eliminate Bottom Space & Trapped Sidebars (Issue 3)**
  - Refactor `Editor.jsx` layout: use `<Card>` container with two-column responsive grid.
  - Remove `.app` rigid `height: calc(100vh - 56px)` and nested `overflow: auto` on `.editor`.
  - Make `PdfPreview` sticky on the right (`sticky top-4 overflow-y-auto`) so it scrolls smoothly alongside the left form without creating double scrollbars or bottom dead space.

- [ ] **Step 4: Verification & Tests**
  - Run `npm test` to ensure all 60 tests continue to pass.
  - Run `npm run build` to verify production Vite compilation.
  - Run `npm run lint` (`oxlint`).
