<!-- 774c6633-4858-45bc-a85f-b3f78cb54e51 d1b481c3-434f-43d0-8b59-838f6e5a43b8 -->
# Rename Payslip to Salary Slip - Implementation Plan

## Overview

This plan systematically changes all "payslip" references to "salary slip" across the codebase, prioritizing critical user-facing changes first.

## Priority Categories

### Phase 1: Critical User-Facing Changes (Highest Priority)

These changes directly impact what users see and interact with.

1. **Page Titles & Descriptions**

- `src/app/dashboard/documents/page.tsx`: "Payslip Generator" → "Salary Slip Generator"
- `src/app/dashboard/documents/v2/page.tsx`: "Payslip Generator (v2)" → "Salary Slip Generator (v2)"
- `src/app/dashboard/documents/payslip/page.tsx`: Update title and description
- `src/app/dashboard/documents/v2/payslip/page.tsx`: Update title and description
- `src/app/doc_pages/pages/Home.jsx`: "Payslip" → "Salary Slip"

2. **Button Text & UI Labels**

- `src/app/doc_pages/pages/v2/PaySlipGenerator.jsx`: "Generate Payslip" → "Generate Salary Slip"
- `src/app/doc_pages/pages/companyDetails.jsx`: "Enter Payslip Detail" → "Enter Salary Slip Detail"
- `src/app/doc_pages/pages/v2/PaySlipGenerator.jsx`: "PAY SLIP FOR THE MONTH OF" → "SALARY SLIP FOR THE MONTH OF"
- `src/app/employee/documents/salary-slips/page.tsx`: Update toast messages and download filenames

3. **Component Names (User-facing)**

- `src/app/dashboard/documents/payslip/page.tsx`: `PayslipPage` → `SalarySlipPage`
- `src/app/dashboard/documents/v2/payslip/page.tsx`: `PayslipV2Page` → `SalarySlipV2Page`

### Phase 2: Route & Type Definitions (High Priority)

These affect routing and type safety.

4. **Document Type in TypeScript**

- `src/types/index.ts`: Change `'payslip'` to `'salary-slip'` in documentType union

5. **Route Paths & Document Types**

- `src/app/document-generator/[type]/page.tsx`: Update case statements for `'payslip'` → `'salary-slip'`
- `src/app/document-generator/[type]/staticParams.ts`: Update static params
- `src/components/documents/DocumentGeneratorFrame.tsx`: Update documentType cases
- Update all `documentType="payslip"` → `documentType="salary-slip"`
- Update all `documentType="v2/payslip"` → `documentType="v2/salary-slip"`

6. **File/Directory Paths** (If user chooses option a)

- Rename `src/app/dashboard/documents/payslip/` → `src/app/dashboard/documents/salary-slip/`
- Rename `src/app/dashboard/documents/v2/payslip/` → `src/app/dashboard/documents/v2/salary-slip/`
- Update all import paths and route references

### Phase 3: Code-Level Changes (Medium Priority)

Internal code references that don't directly affect users.

7. **Function & Variable Names**

- `src/app/doc_pages/pages/v2/PaySlipGenerator.jsx`: 
- `handleGeneratePayslip` → `handleGenerateSalarySlip`
- `getPayslipMonth` → `getSalarySlipMonth`
- `payslipStyles` → `salarySlipStyles`
- `src/utils/documentFunctions.ts`: `calculatePayslipComponents` → `calculateSalarySlipComponents`

8. **CSS Classes & Styles**

- `src/components/components/PaySlip.css`: `.payslip-page` → `.salary-slip-page`, `.payslip-container` → `.salary-slip-container`, `.payslip-title` → `.salary-slip-title`
- `src/components/components/PaySlip.js`: Update class references
- `src/components/pdf/PDFStyles.tsx`: `payslipStyles` → `salarySlipStyles`

9. **Component File Names** (Optional - if renaming files)

- `PaySlipGenerator.jsx` → `SalarySlipGenerator.jsx`
- `PaySlip.js` → `SalarySlip.js`
- `PaySlip.css` → `SalarySlip.css`
- Update all imports

### Phase 4: Comments & Documentation (Low Priority)

Internal documentation and comments.

10. **Code Comments**

- Update all comments mentioning "payslip" to "salary slip"
- `src/app/doc_pages/pages/v2/PaySlipGenerator.jsx`: "This is a computer generated payslip" → "This is a computer generated salary slip"

11. **Documentation Files**

- `docs/firebase-database-structure.md`: Update `payslipUrl` references
- `docs/firebase_firestore_database_structure.md`: Update documentation
- `src/components/docs/pdf_generation.md`: Update references

12. **Console Logs & Messages**

- `src/app/employee/documents/salary-slips/page.tsx`: Update console logs
- Any other console messages

### Phase 5: Database Fields (If user chooses option a)

13. **Database Schema Updates**

- `docs/firebase-database-structure.md`: `payslipUrl` → `salarySlipUrl`
- Update any TypeScript interfaces that reference `payslipUrl`
- Note: Actual database migration would need to be handled separately

## Execution Strategy

1. Start with Phase 1 (user-facing) to immediately improve UX
2. Proceed through phases sequentially
3. Test after each phase to ensure no breaking changes
4. Use find-and-replace carefully to avoid unintended changes
5. Update imports and exports as files are renamed

## Notes

- Directory renaming confirmed: Will rename `/payslip/` directories to `/salary-slip/`
- Database field renaming confirmed: Will update `payslipUrl` → `salarySlipUrl` in code and documentation
- Backward compatibility confirmed: Will add redirects for old routes
- Maintain consistency: use "salary-slip" (kebab-case) for routes/types, "Salary Slip" (Title Case) for UI text
- Component file names can be renamed since we're doing full migration
- Database migration script will need to be created separately to update existing Firestore documents

### To-dos

- [ ] Update all page titles and descriptions from 'Payslip' to 'Salary Slip' in dashboard documents pages
- [ ] Update button text and UI labels (Generate Payslip → Generate Salary Slip, etc.)
- [ ] Rename component names (PayslipPage → SalarySlipPage, PayslipV2Page → SalarySlipV2Page)
- [ ] Update TypeScript documentType from 'payslip' to 'salary-slip' in types/index.ts
- [ ] Update route paths and documentType cases in routing files (payslip → salary-slip)
- [ ] Rename directory paths from /payslip/ to /salary-slip/ (if user chooses option a)
- [ ] Rename function and variable names (handleGeneratePayslip → handleGenerateSalarySlip, etc.)
- [ ] Update CSS class names and style references (.payslip-* → .salary-slip-*)
- [ ] Update code comments and documentation references
- [ ] Update database field documentation (payslipUrl → salarySlipUrl, if user chooses option a)