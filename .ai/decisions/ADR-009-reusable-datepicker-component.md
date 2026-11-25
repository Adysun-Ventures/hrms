# Engineering Decision Record: Accessible Reusable DatePicker Component (CR-003)

## Metadata
- **ID**: ADR-009
- **Date**: 2026-11-17
- **Status**: ACCEPTED
- **Feature**: Statement Period & Transaction Date Entry (CR-003)
- **Author**: Antigravity & Viraj Kadam
- **Supersedes**: Replaces native `<input type="date">` and raw text inputs for dates

---

## Problem / Context (Change Request)
Previously, date entry across the application suffered from inconsistent user experience and lack of a unified calendar picker:
1. **`AccountForm.jsx`**:
   - `periodStart` and `periodEnd` rendered as plain `<input type="text">` in order to support `dd-mmm-yyyy` formatting (`fmtDashDate` / `parseFlexibleDate`).
   - Users were forced to type dates manually without an interactive calendar popup.
2. **`TransactionManager.jsx`**:
   - `date` and `valueDate` rendered using native `<input type="date">`.
   - Native browser date pickers have several drawbacks:
     - They do not support displaying the project's canonical `01-Feb-2021` (`dd-mmm-yyyy`) format.
     - Navigating backwards 3–5 years (e.g. 2021 to 2024 for historic statements) requires tedious month-by-month clicking in many browser implementations.
     - Styling is uncustomizable and inconsistent across operating systems and browsers.

The user requested a proper, unified calendar picker UI implemented via a reusable component across all places where date inputs are needed.

---

## Technical Solution & Architecture

### 1. Reusable DatePicker Component (`app/components/DatePicker.jsx`)
Implemented a dependency-free, accessible, and responsive DatePicker component:
- **Dual Interaction Modes**:
  1. **Typing**: Users can directly type dates in any format (e.g., `01-Feb-2021`, `2021-02-01`, `5/11/2026`). On blur, the input parses the string using `parseFlexibleDate` and formats it as `dd-mmm-yyyy`.
  2. **Interactive Calendar Dropdown**: Clicking the calendar icon opens a 42-cell calendar grid. Selecting a day updates the canonical ISO date string (`YYYY-MM-DD`) and formats the input display.
- **Fast Multi-Year & Multi-Month Navigation**:
  - Contains dedicated `<select>` dropdowns for both Month and Year (ranging from `currentYear - 15` to `currentYear + 5`), allowing 1-click jumps between years (e.g. instantly switching from 2026 to 2021).
  - Contains `‹` and `›` arrow buttons for step-by-step month browsing.
- **Quick Actions & Dismissal**:
  - "Today" button sets the value to current date.
  - "Clear" button (available when field is optional) clears the date.
  - Dismissible via `Escape` key, click outside, or the "Close" button.
- **Accessibility & Validation**:
  - Full ARIA compliance (`role="dialog"`, `aria-label`, `aria-invalid`, `aria-describedby`).

### 2. Integration Across the Codebase
- **`AccountForm.jsx`**:
  - All date fields (`f.date = true`, including `periodStart` and `periodEnd`) now render `<DatePicker>`.
  - Cleaned up manual format bindings from the generic form helper.
- **`TransactionManager.jsx`**:
  - Replaced `<input type="date">` for `draft.date` and `draft.valueDate` with `<DatePicker>`.

### 3. Styling (`app/styles.css`)
- Styled `.datepicker-wrapper`, `.datepicker-input-group`, `.datepicker-popup`, `.datepicker-grid`, `.datepicker-day`, and nav controls to match the project design system.
- Popups use `position: absolute; z-index: 1000` with subtle elevation shadows (`box-shadow: 0 10px 25px -5px rgba(0,0,0,0.15)`).

---

## Verification & Testing
1. **Unit Testing (`npm test`)**:
   - All 25 test suites pass without regression.
2. **Build Verification (`npm run build`)**:
   - Vite client and worker production bundles compiled cleanly in 9.62s.
3. **Live Browser Verification (Playwright MCP)**:
   - Verified opening the calendar picker from `Start date`, selecting a day, and observing automatic ISO state propagation and `dd-mmm-yyyy` formatting.
   - Verified fast year-select navigation.
   - Verified manual typing and blur synchronization.

---

## Consequences & Trade-offs
- **Positive**:
  - Unified, consistent date picker experience across all forms.
  - Zero external npm dependencies added (keeps bundle lean and avoids bundle bloat).
  - Effortless multi-year navigation for historical statement generation.
- **Maintained**:
  - Integer paise calculations and statement invariants remain unaffected.
