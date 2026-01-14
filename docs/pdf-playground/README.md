# PDF Playground Workflow - README

## Problem Statement

When editing PDF documents in the codebase (specifically `src/app/doc_pages/pages/v2/OfferLetter.jsx`), developers face a significant workflow bottleneck:

- **Current Pain Point**: Every time you make a small change to PDF styling, layout, or content, you must:

  1. Save the code
  2. Run the application
  3. Navigate to the PDF generation page
  4. Fill out the form
  5. Generate the PDF
  6. Download the PDF
  7. Open it to see the changes
  8. Repeat for every iteration

This process is **time-consuming and frustrating**, especially when making multiple small adjustments to:

- Text alignment and spacing
- Table layouts
- Font sizes and styles
- Page breaks
- Dynamic data formatting

## Solution: React-PDF Playground

The [React-PDF Playground](https://react-pdf.org/repl) provides a **real-time preview** of PDF changes without requiring downloads or application restarts.

### Benefits

- ✅ **Instant Preview**: See changes in real-time as you type
- ✅ **No Downloads**: Preview directly in the browser
- ✅ **Fast Iteration**: Make multiple changes quickly
- ✅ **No Setup Required**: Works directly in the browser

## File Structure

- **Main Implementation**: `src/app/doc_pages/pages/v2/OfferLetter.jsx`
- **Playground Version**: `docs/pdf-playground/offer_letter.txt`
- **Styles Reference**: `src/components/pdf/PDFStyles.tsx`

## Workflow

### For Developers

1. **Open Playground File**

   - Navigate to `docs/pdf-playground/offer_letter.txt`
   - Copy the entire contents

2. **Paste into React-PDF Playground**

   - Go to https://react-pdf.org/repl
   - Replace the default code with your copied code
   - The PDF will render automatically on the right side

3. **Make Your Edits**

   - Edit styles, layout, or content in the left panel
   - See changes instantly in the right panel preview
   - Iterate quickly without downloads

4. **Sync Changes Back**

   - Copy the updated code from the playground
   - Update `docs/pdf-playground/offer_letter.txt` with your changes
   - Apply the same changes to `src/app/doc_pages/pages/v2/OfferLetter.jsx`
   - Note: You'll need to:
     - Add back import statements
     - Replace `styles` with `offerLetterStyles` (from PDFStyles.tsx)
     - Replace hardcoded data with `formData` props
     - Add back the `export default` statement

### For AI Agents

When asked to edit PDF documents, follow this workflow:

1. **Identify the Document Type**

   - Check which PDF document needs editing (e.g., OfferLetter, AppointmentLetter, etc.)
   - Locate the corresponding playground file in `docs/pdf-playground/`

2. **Read the Playground File**

   - Read `docs/pdf-playground/offer_letter.txt` (or relevant file)
   - Understand the current structure

3. **Make Changes in Playground Format**

   - Edit the playground file directly
   - Ensure code follows playground rules:
     - ❌ No `import` statements
     - ❌ No `export` statements
     - ✅ Use `const ComponentName = () => (...)` pattern
     - ✅ Define styles with `StyleSheet.create()`
     - ✅ End with `ReactPDF.render(<ComponentName />)`

4. **Sync to Main Codebase**

   - Read the main implementation file (e.g., `src/app/doc_pages/pages/v2/OfferLetter.jsx`)
   - Apply the same changes, but:
     - Add back imports: `import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';`
     - Use `offerLetterStyles` instead of `styles` (import from `@/components/pdf/PDFStyles`)
     - Replace hardcoded `HARDCODED_DATA` with `formData` props
     - Add `export default OfferLetterPDF;`

5. **Verify Changes**

   - Check that both files are updated consistently
   - Ensure the main file maintains proper imports and exports

## Playground Code Rules

The React-PDF playground has specific requirements:

### ✅ DO:

- Define components as arrow functions: `const ComponentName = () => (...)`
- Use `StyleSheet.create()` for styles
- End with `ReactPDF.render(<ComponentName />)`
- Use hardcoded data for testing
- Reference styles before they're defined (playground handles this)

### ❌ DON'T:

- Include `import` statements
- Include `export` statements
- Use named exports
- Import external modules

## Example: Making a Style Change

**Scenario**: Change the company name font size from 18 to 20

1. **In Playground** (`docs/pdf-playground/offer_letter.txt`):
   ```javascript
   companyName: {
     fontSize: 20,  // Changed from 18
     // ... rest of styles
   }
   ```

2. **In Main Code** (`src/app/doc_pages/pages/v2/OfferLetter.jsx`):

   - The styles are in `src/components/pdf/PDFStyles.tsx`
   - Update `offerLetterStyles.companyName.fontSize` to 20

3. **Or** if styles are inline, update the same way in the main file

## Troubleshooting

### Playground Shows Errors

- **"CompileError: Transforming import"**: Remove all `import` statements
- **"styles is not defined"**: Ensure styles are defined (playground should handle this, but if not, move styles before component)
- **Component not rendering**: Check that `ReactPDF.render(<ComponentName />)` is at the end

### Changes Not Syncing

- Verify you updated both the playground file AND the main implementation
- Check that imports/exports are correct in the main file
- Ensure style references match (e.g., `styles.page` vs `offerLetterStyles.page`)

## Related Files

- Main PDF Component: `src/app/doc_pages/pages/v2/OfferLetter.jsx`
- PDF Styles: `src/components/pdf/PDFStyles.tsx`
- Playground File: `docs/pdf-playground/offer_letter.txt`

## Quick Reference

| Task | Playground File | Main File |
|------|----------------|-----------|
| Edit styles | ✅ Direct edit | ✅ Update PDFStyles.tsx or inline |
| Test layout | ✅ Real-time preview | ❌ Requires download |
| Iterate quickly | ✅ Instant feedback | ❌ Slow workflow |
| Final implementation | ⚠️ Sync required | ✅ Production code |

---

**Remember**: The playground is for **rapid iteration and testing**. Always sync your final changes back to the main codebase for production use.

