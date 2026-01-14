<!-- 7551f4ae-eca6-4300-baca-aa89659305bb 4a247925-1c30-4e3c-a0ae-37aa6d8eeabb -->
# Align Offer Letter Styling with Visual Template

## Analysis from Images

Based on the 5-page template images, here are the key styling observations:

### Page 1 (Header & Opening)

- **Company Name**: Large, bold, **RED** text (currently orange-red #FF4500)
- **Logo**: Top-right positioned, circular with @ symbol
- **Spacing**: Proper margins between sections
- **"LETTER OF APPOINTMENT"**: Centered, bold, underlined, uppercase

### Pages 2-5 (Content Sections)

- **Section Headings**: Bold, underlined, 14px font size
- **Body Text**: 11px font size, proper line spacing
- **Bullet Points**: Indented with consistent left margin
- **Line Spacing**: Appears tight but readable

### Page 4 (Table)

- **Table Cells**: 5px padding (currently 4px)
- **Borders**: All cells have borders
- **Alignment**: Text aligned properly in columns

## Changes Required

### 1. Color Corrections

- Change company name color from `tw.textOrange` (#FF4500) to `tw.textRed600` (#DC2626) - pure red as shown in image

### 2. Table Padding

- Add `p5px: { padding: 5 }` utility for table cells
- Replace `tw.p1` (4px) with `tw.p5px` (5px) in all table cells

### 3. Verify & Adjust Spacing

- Review line spacing for readability (currently using `tw.leadingNone` which is 1.0 - might be too tight)
- Ensure consistent spacing between sections
- Verify bullet point indentation matches visual (currently `tw.ml36`)

### 4. Font Size Verification

- Company name: Currently `tw.text2xl` (20px) - verify if this matches the large size in image
- Section headings: Currently `tw.text14` (14px) - correct
- Body text: Currently `tw.text11` (11px) - correct

## Implementation Steps

1. **Add missing utility**: `p5px: { padding: 5 }` to tw object
2. **Update company name color**: Change `tw.textOrange` to `tw.textRed600` on line 630
3. **Update table cell padding**: Replace all `tw.p1` with `tw.p5px` in table cells (lines 782-945)
4. **Review and adjust line spacing**: Consider changing `tw.leadingNone` (1.0) to `tw.leadingTight` (1.25) for better readability in body text sections
5. **Verify all spacing matches visual**: Check margins, padding, and gaps between elements

## Files to Modify

- `docs/pdf-playground/offer_letter_option2.txt` - Update styling throughout the component

### To-dos

- [ ] Add p5px utility (padding: 5) to tw object for table cells
- [ ] Change company name color from tw.textOrange to tw.textRed600 on line 630
- [ ] Replace tw.p1 with tw.p5px in all table cells (approximately 15+ instances)
- [ ] Review line spacing - consider changing tw.leadingNone to tw.leadingTight for body text sections
- [ ] Verify all margins, padding, and spacing match the visual template
- [ ] Add p5px utility (padding: 5) to tw object for table cells
- [ ] Change company name color from tw.textOrange to tw.textRed600 on line 630
- [ ] Replace tw.p1 with tw.p5px in all table cells (approximately 15+ instances)
- [ ] Review line spacing - consider changing tw.leadingNone to tw.leadingTight for body text sections
- [ ] Verify all margins, padding, and spacing match the visual template