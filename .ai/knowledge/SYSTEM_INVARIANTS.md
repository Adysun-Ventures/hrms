# System Invariants & Non-Negotiable Rules

These rules represent fundamental truths and constraints of this repository. They must never be violated by any code change, feature addition, or refactoring.

---

## 1. Zero Floating-Point Arithmetic for Money
- **Rule**: Never compute running balances, totals, debits, or credits using JavaScript `Number` floats directly (e.g. `0.1 + 0.2 === 0.30000000000000004`).
- **Enforcement**: All calculations in `app/lib/calc.js` must convert amounts to integer paise (`Math.round(amount * 100)`), perform arithmetic with integers, and format to string decimals only at the presentation boundary.
- **Verification**: `tests/calc.test.js` enforces exact integer paise arithmetic.

---

## 2. Mathematical Consistency Invariant
- **Rule**: Every statement must satisfy:
  $$\text{Closing Balance} = \text{Opening Balance} + \sum \text{Credits} - \sum \text{Debits}$$
- **Enforcement**: Even if a user enters a custom closing balance or transactions fail to balance, `compute()` reports discrepancies and calculates the true running balance from the opening balance.

---

## 3. Strict ISO Date Format in State
- **Rule**: All transaction dates (`date`, `valueDate`) and statement boundaries (`periodStart`, `periodEnd`) in memory and JSON MUST be standard ISO strings: `YYYY-MM-DD`.
- **Reason**: Date validation (`isISODate`) rejects non-ISO formats (e.g. raw DD/MM/YY), which will silently cause transactions to be dropped by `compute()`.
- **Formatting for Display**: Formatting into `DD-MMM-YYYY` (Kotak) or `DD/MM/YY` (HDFC) must only occur inside formatting helper functions (`format.js`), never stored in state.

---

## 4. No Sample Ribbons or Fictional Watermarks
- **Rule**: Generated statements must never include intrusive sample watermarks, "SAMPLE - NOT VALID" diagonal ribbons, or disclaimers claiming the document is fake, unless explicitly requested by the user.
- **Enforcement**: All unmasked account numbers and authentic bank layouts must remain authentic replicas.

---

## 5. React-PDF Page Boundary & Height Overflow Constraints
- **Rule**: Fixed headers and footers on react-pdf `<Page>` elements must never exceed the physical page dimensions (`595.28 × 841.89` for A4 Kotak, `638.00 × 842.00` for HDFC).
- **Enforcement**:
  - Footers must specify tight line-heights (`lineHeight: 1.05` to `1.15`) so that multiline disclaimers do not stack past `y = 840 pt`.
  - When positioning elements absolutely, ensure coordinates account for page padding.
  - Never specify rigid fixed `height` on containers with text children that exceed that height; react-pdf's layout engine will drop all overflowing text children.

---

## 6. Standalone CLI & Browser Dual-Compatibility
- **Rule**: React-PDF templates must work both inside Vite's browser runtime and inside headless Node.js via `scripts/render_cli.jsx`.
- **Enforcement**: Any asset URL or font registration must be compatible with both Node's filesystem and Vite's bundle asset graph.

---

## 7. Submodule CSS Scoping & Tailwind Specificity Isolation
- **Rule**: CSS imported by submodules (such as `src/statements/styles.css`) must never pollute the global SPA document scope or override Tailwind utility classes.
- **Enforcement**:
  1. Every selector must be nested inside a root container (e.g., `.statement-root`).
  2. Never write compound tag resets inside a container class (e.g. `.statement-root button { color: inherit; }`), because compound specificity `(0, 1, 1)` overrides Tailwind utilities (`text-white`, `text-red-600` at `0, 1, 0`). Rely on Tailwind's base preflight reset (`(0, 0, 1)`).
  3. Never define class names that collide with Tailwind utilities (`.grid`, `.flex`, `.hidden`). Use domain-prefixed classes (e.g., `.st-form-grid`).
  4. Header layouts must use symmetrical tracks `lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]` with centered titles and `justify-end` actions. Primary buttons must always display white text (`text-white`) on emerald green backgrounds.
