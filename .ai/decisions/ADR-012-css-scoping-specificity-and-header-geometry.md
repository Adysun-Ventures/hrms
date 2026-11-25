# Engineering Decision Record: CSS Scoping, Specificity Isolation & CardHeader Geometry

## Metadata
- **ID**: ADR-012
- **Date**: 2026-11-20
- **Status**: ACCEPTED
- **Feature**: Statement UI/UX Integration into Slot Profile
- **Author**: Antigravity & Viraj Kadam
- **Applies to**: `src/statements/styles.css`, `src/ui.jsx`, `src/statements/components/`

---

## Context & Problem Statement
When integrating the standalone Bank Statement module into the unified `slot-profile` dashboard, client-side SPA navigation revealed severe visual degradation:
1. **Global Class Collision (`.grid`)**:
   `src/statements/styles.css` declared `.grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px 10px; }`.
   Because Vite SPA keeps dynamically injected stylesheets in `<head>`, visiting Statements and then returning to Resumes corrupted `CardHeader`'s 3-column layout into 2 equal 50% columns, shifting the title off-center to 75% width and dropping action buttons to a new row.
2. **Global Input/Select Override**:
   Unscoped rules `input:not([type='radio']):not([type='file']), select, textarea { width: 100%; min-height: 34px; padding: 6px 8px; border-radius: 6px; }` had compound specificity `(0, 2, 1)`. This overpowered Tailwind classes (`(0, 1, 0)`) on `<FilterSelect>` and `<SearchInput>` across Resume Builder and Candidate List, forcing all controls to stretch to 100% width and lose their rounded pill shapes.
3. **Compound Tag Specificity Override on Button Text**:
   `button, input, select, textarea { font: inherit; color: inherit; }` nested inside `.statement-root` produced `.statement-root button { color: inherit; }` with specificity `(0, 1, 1)`. This overpowered Tailwind's utility class `.text-white` `(0, 1, 0)` on primary buttons (`BUTTON.primary`), causing emerald green buttons (`+ New statement`, `Open`) to display dark gray/black text instead of white.
4. **Header Asymmetry**:
   When action buttons had varying widths, a naive `1fr auto 1fr` grid allowed track 3 to expand past its fractional budget due to default `minmax(auto, 1fr)` track sizing, pushing the centered title away from the true horizontal center of the card.

---

## Architectural Decisions & Standards

### 1. Mandatory Root Container Scoping
Every stylesheet imported by a submodule (e.g. `src/statements/styles.css`) must have all its rules and CSS variables strictly nested inside its designated root selector (e.g. `.statement-root`). No global tag, class, or attribute selectors are permitted outside the root scope (except top-level `@keyframes`).

### 2. Elimination of High-Specificity Tag Resets
Never declare tag selectors like `button, input, select, textarea { color: inherit; }` inside a parent class selector.
- **Rule**: Rely exclusively on Tailwind's base preflight reset (`(0, 0, 1)` specificity) for font and color inheritance.
- **Reason**: Any tag selector nested inside a class selector achieves specificity `(0, 1, 1)`, which permanently breaks Tailwind utility classes (`text-white`, `text-red-600`, `w-32`) that have specificity `(0, 1, 0)`.

### 3. Namespace Collision Prevention (`.st-form-grid`)
Never define classes that match Tailwind utility names (e.g., `.grid`, `.flex`, `.hidden`).
- Custom form grids in the Statement module are renamed to `.st-form-grid`.
- Media queries target `.st-form-grid` instead of `.grid`.

### 4. Symmetrical 3-Column CardHeader Geometry
All card header layouts in `src/ui.jsx` must enforce mathematical symmetry:
```jsx
<div className="grid grid-cols-[auto_1fr] items-center gap-2 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
  <div><CircleButton icon={ICONS.back} label={backLabel} onClick={onBack} /></div>
  <div className="flex items-center justify-center gap-2 text-center">
    <h1 className="text-center text-base font-bold text-brand-600">{title}</h1>
    {extra}
  </div>
  <div className="col-span-2 flex flex-wrap items-center justify-end gap-2 lg:col-span-1">{actions}</div>
</div>
```
- **Track 1 & Track 3**: Sized as `minmax(0, 1fr)` to guarantee that left and right columns are identical in width regardless of button count.
- **Track 2**: Sized as `auto`, mathematically locking the header title in the dead center of the card.
- **Actions Alignment**: Action button wrappers must include `justify-end` to ensure buttons remain pinned to the right margin.

### 5. Primary Button Design System Compliance
Primary buttons throughout the dashboard must render emerald green with bold white text:
- Class: `bg-emerald-500 text-white enabled:hover:bg-emerald-600 rounded-full font-bold shadow-sm`.
- Text color must remain `#FFFFFF` under all circumstances.

---

## Verification & Impact
- **Unit Tests**: 60/60 tests passing (`npm test`).
- **Build**: Vite production bundling succeeds with 0 errors.
- **Linter**: `oxlint` reports 0 errors.
- **Visuals**:
  - Resumes tab retains pill-shaped filters and correct toolbar width after visiting Statements.
  - Statement Builder header title is centered with all action buttons right-aligned.
  - Emerald buttons render crisp white text.
