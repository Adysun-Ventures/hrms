# Coding Standards

## 1. JavaScript & React
- **Standard**: Modern ES2023+ JavaScript. Standard functional React with hooks (`useState`, `useMemo`, `useCallback`, `useRef`).
- **No Class Components**: Use pure functional components only.
- **Component File Structure**:
  1. Imports (standard libraries, third-party packages, internal modules).
  2. Constants and helper formatting functions.
  3. Stylesheet definitions (`StyleSheet.create` for react-pdf).
  4. Component definition and export.
- **Pure Helpers**: Calculation and formatting logic belongs in `app/lib/`, completely decoupled from React components.

## 2. React-PDF Conventions
- **Standard Styling**: Always use `StyleSheet.create({...})` for react-pdf elements.
- **Measurement Units**: All coordinates, widths, paddings, and font sizes in react-pdf are in Points (`pt`), where `72 pt = 1 inch`.
- **Text Wrapping**: Always use `<Text wrap={false}>` on table headers, fixed lines, and bank names to prevent unintended layout wrapping.
- **Fixed Elements**: Use `<View fixed>` or `<Text fixed>` for headers and footers that repeat across every page.

## 3. Formatting
- Use 2-space indentation.
- Single quotes for strings; backticks for templates.
- Explicit semicolons.
