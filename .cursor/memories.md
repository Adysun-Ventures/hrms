# Memory Management Rules

## Purpose:
This @memories.md file is specifically for Cursor IDE to improve code writing and should always be referenced for better development assistance. The purpose of this @memories.md is to follow consistency without completely saying through prompt - even if user said same UI change, we should behind the hood follow the consistency and established UI, LOGICAL etc methods!!!

## Rules for Managing Memories:
1. **Always Read First**: Always read existing @memories.md before adding new memories
2. **No Self-Contradiction**: If new memories seem to contradict existing ones, keep both old and new memories
3. **Contradiction Marking**: Add ⚠️ danger emoji to highlight contradictory memories
4. **Memory Preservation**: Never delete existing memories, only add new ones
5. **Clear Separation**: Use horizontal rules (`---`) to separate different memories
6. **Consistency Check**: Always review for contradictions when adding new memories
7. **Header Management**: At the start/header of @memories.md, add the rules for memories. If memories contradict, keep both old and new entries and highlight contradictions with a danger emoji (⚠️)
8. **Session Inclusion**: Always remember to add the @memories.md to each chat and agent session of cursor IDE!
9. **Cursor IDE Reference**: The @memories.md is for Cursor IDE better code writing helpful file and cursor should always refer this!
10. **Behind-the-Scenes Consistency**: Follow established UI patterns, logical methods, and consistency rules automatically without needing to repeat in every prompt
11. **Pattern Reference & User Approval**: Always refer to established code patterns, best practices, suggestions to ask user does he accepts and grant or not - on that decider will choose the path!

## Resolution Rules:
- **Same Memory Exists**: If exact same memory already exists, skip adding duplicate
- **Similar Memory**: If similar intended memory exists but with different wording, keep both and mark with 🔄
- **Contradictory Memory**: If new memory contradicts existing one, keep both and mark with ⚠️
- **Enhanced Memory**: If new memory provides more detail to existing one, replace old with new and mark with ✨

---

The user prefers that joining dates across the entire project always be formatted as 'DD MMM YYYY' (e.g., 20 Jun 2025) using a reusable parsing method.

---

When providing rules changes, the assistant should first ask the user for their current rules, then add the new rule, and provide the complete updated rules.

---

The user prefers that the assistant create a /docs/rule.md file containing recent Firestore rules and always refer to it before providing any new rules.

---

The user prefers concise output, providing only the necessary parts of code rather than full verbose code dumps.

---

The user prefers a consistent UI pattern: display the value above its label, using established font size, card styles, and colors.

---

The user prefers always using formatDateToDayMonYear from @documentUtils.ts for date formatting, and parsing time into 12-hour format with Indian timezone handling.

---

The user prefers joining dates across the entire project formatted as 'DD MMM YYYY' (e.g., 20 Jun 2025) using a reusable parsing method, always using formatDateToDayMonYear from @documentUtils.ts and parsing time into 12-hour format with Indian timezone handling.

---

The user wants the assistant to always include the @memories.md file in every chat and agent session of the Cursor IDE.

---

The user prefers that tooltips should match the accent color of the button they are attached to - using the lighter accent color (like button background) rather than the darker base color (like button icon), following the pattern where button background is accent color and button icon is base color.

---

The user prefers the TableHeader component pattern with consistent three-column layout: Left (back button), Center (title), Right (action buttons), with stats section below showing Total/Active/Inactive counts, and optional filter dropdown with All/Active/Inactive options positioned between refresh button and search bar.

---

The user prefers a consistent 4-column grid layout (grid-cols-1 md:grid-cols-4 gap-4) for all form sections in create/view/edit screens across the project. Each section should be organized in groups of 4 fields, with longer fields like addresses or descriptions optionally spanning multiple columns using col-span classes. This applies to all form sections including personal details, contact information, documents, and educational details.

---

The user prefers the TableHeader component pattern for add/edit screens with consistent structure: title, back button (left), action button (right), no stats/search/filter, headerClassName="px-6 py-6", and form buttons layout with Cancel (left) and Add/Save button (right) using justify-between layout with px-6 py-3 padding.

---

The user requires that when implementing Tanstack Query, always use globally declared configuration from @lib/queryClient.ts and never declare individual staleTime, gcTime, or retry values in custom hooks. All query configurations should inherit from the global QueryClient defaultOptions to maintain consistency across the application.

---

The user requires that only big/large API responses should be cached (like employee lists, employment lists, dashboard stats) while small/quick operations should not be cached. Mutations should only be triggered when there are actual changes in the main API data, not for every UI interaction. This ensures efficient caching strategy where only heavy data operations benefit from cache while keeping the system responsive for quick operations.

---

The user prefers that when navigating from Employee Details page to Add Employment page, the employee ID should be passed as a query parameter (?employeeId=id) and the employment add page should pre-select the employee and completely hide the employee selection section. The employee selection should only be shown when no employee is pre-selected from the URL parameter. After successfully adding employment, navigation should go back to the Employee Details page when employee was pre-selected, otherwise to the employments list.

---

The user requires that back buttons in TableHeader should always be present with the default "Back" label, not custom labels. The back button should always be shown in the left position of the three-column layout (Left: back button, Center: title, Right: action buttons).

---

The user requires that action buttons in TableHeader should always use simple, consistent labels like "Create" instead of custom text. Action buttons should not use dynamic text like "Add Salary for [employeeName]" or context-specific labels.

---


In the UI design, the TableHeader component should always include a back button and should not use hardcoded text like 'Back to Employees', ensuring consistent back navigation across views.

---

The user requires that all save buttons should use green color with success class for consistent styling across the application.

---

The user prefers using terminal commands for faster file and folder creation to improve development speed. The preferred method is: 1) Ask user what type of file they need (create, edit, list, details/view), 2) Create directories with `mkdir -p path/to/folders`, 3) Copy existing similar files with `cp source/file.tsx destination/file.tsx` based on the file type pattern, 4) Then refactor the copied files for specific context. This approach ensures consistent folder structure, follows established patterns for each file type (create forms, edit forms, list pages, detail pages), and reduces manual file creation time while maintaining established UI patterns and logical methods. This method guarantees UI and minimal/common consistency across the entire project by reusing proven patterns and established components.

---

The user requires that breadcrumbs should be implemented using the established pattern: pass `breadcrumbItems` prop to layout components (DashboardLayout/EmployeeLayout) with an array of objects containing `label`, `href` (optional), and `isCurrent` (boolean). The layout components automatically render SimpleBreadcrumb with proper styling and navigation. Breadcrumb items should follow the navigation hierarchy: Dashboard → Section → Current Page, with the current page marked with `isCurrent: true`.

---

The user requires that all password fields should include eye icons for toggling password visibility. This includes: 1) Import FiEye and FiEyeOff icons from react-icons/fi, 2) Add state variables showPassword and showConfirmPassword (boolean), 3) Wrap password inputs in relative div containers, 4) Add type={showPassword ? 'text' : 'password'} to inputs, 5) Add pr-10 padding to input className for icon space, 6) Add button with absolute positioning for eye icon toggle, 7) Update form types to include confirmPassword field for validation. This applies to login pages, add employee forms, and edit employee forms to provide consistent password visibility toggling across the application.

---

The user requires that all form fields and information displays should follow the consistent pattern: **value above, label below**. This applies to: 1) Employee information cards, 2) Profile displays, 3) Form field layouts, 4) Dashboard information sections. Example structure: `<div><p className="font-medium text-gray-900">{value}</p><p className="text-sm text-gray-600">{label}</p></div>`. This ensures consistent visual hierarchy where the actual data (value) is more prominent and the descriptive text (label) is secondary, improving readability and user experience across all information displays in the application.

---

The user requires that TableHeader components should conditionally show header elements based on data state: 1) Hide stats, search, filter, and refresh when no records exist (`filteredData.length === 0`), 2) Only show header controls when data exists (`filteredData.length > 0`), 3) Always maintain action buttons (Create, Edit, Delete) regardless of data state, 4) Use consistent margin pattern `px-6 pt-6 pb-6` for all TableHeader components to maintain uniform spacing across the application. This ensures cleaner empty states and better user experience by reducing visual clutter when no data is available.

---

The user prefers that employee names should be displayed in breadcrumb navigation rather than in page headers. When navigating to add/edit pages for specific employees, the breadcrumb should show the employee name as a clickable link, while the header title should remain generic (e.g., "Add New Employment" instead of "Add Employment for John Doe"). This provides better navigation context while keeping headers focused on the current action.

---

The user requires that the default password pattern for employees should be: "last 5 digits of employee mobile number + @#$$". This pattern should be used in: 1) Add employee form (when password field is empty - password field is optional), 2) Admin utils password migration function, 3) All placeholder texts and instructions. Example: If employee mobile is 8308377308, default password should be "37308@#$$". This provides a more secure and memorable default password pattern compared to the previous "1234" pattern. Password fields should be marked as optional with "(Optional)" in labels. Only one password field is needed - no confirm password field required.

---