# UI Logic & Rules Documentation

## TableHeader Component Rules

### Core Requirements
- **Back Button**: Always include a back button with consistent navigation
- **No Hardcoded Text**: Avoid hardcoded text like 'Back to Employees'
- **Consistent Margins**: Use `px-6 pt-6 pb-6` className for uniform spacing
- **Conditional Actions**: Show relevant buttons based on data state

### Employment Logic
- **No Employments**: Display "Create Employment" button → `/employments/add?employeeId=${employeeId}`
- **Has Employments**: Display "View Employment" and "View Salary" buttons
- **Always Show**: "Edit" and "Delete" buttons regardless of employment status

### Button Patterns
- **Variants**: 'primary', 'secondary', 'success', 'warning', 'danger'
- **Icons**: Use react-icons/fi library consistently
- **Navigation**: Use query parameters for pre-selecting data in forms

### Conditional Header Elements
- **No Records**: Hide stats, search, filter, and refresh when no data exists
- **Show Elements**: Only display header controls when `filteredData.length > 0`
- **Maintain Actions**: Always show action buttons (Create, Edit, Delete) regardless of data state
- **Consistent Margins**: Use `px-6 pt-6 pb-6` className for uniform spacing across all TableHeader components

## Layout Consistency Rules

### Spacing Standards
- **Content Containers**: Use `px-6 pb-6` for consistent horizontal padding and bottom margin
- **TableHeader**: Followed by content with proper spacing using established patterns
- **Grid Layouts**: Use responsive grid patterns with proper gap spacing

### Component Hierarchy
- **DashboardLayout**: Main wrapper with sidebar and breadcrumb
- **TableHeader**: Consistent header with actions and navigation
- **Content Sections**: Properly spaced content areas with consistent styling

## Navigation Patterns

### URL Structure
- **Employee Details**: `/employees/[id]`
- **Employment Creation**: `/employments/add?employeeId=${id}`
- **Employment Details**: `/employments/[id]`
- **Salary Management**: `/salaries?employeeId=${id}`

### Query Parameters
- **Pre-selection**: Use `?employeeId=${id}` for form pre-population
- **Filtering**: Use query params for list filtering and sorting
- **State Management**: Maintain URL state for navigation consistency

## Form & Data Patterns

### Data Fetching
- **Tanstack Query**: Use for all data fetching and mutations
- **Loading States**: Implement proper skeleton loading
- **Error Handling**: Consistent error messages and retry mechanisms

### Form Validation
- **React Hook Form**: Use for form management
- **Validation Rules**: Consistent validation patterns across forms
- **Error Display**: Standardized error message styling

## Component Memory Rules

### User Preferences
- **Server Restart**: Ask user before automatically restarting server
- **Navigation**: Maintain consistent back navigation patterns
- **State Persistence**: Remember user preferences where appropriate

### UI State Management
- **Loading States**: Show appropriate loading indicators
- **Success/Error**: Use toast notifications consistently
- **Confirmation**: Implement confirmation dialogs for destructive actions

## Code Quality Standards

### TypeScript Patterns
- **Interface Definitions**: Consistent prop interfaces
- **Type Safety**: Proper typing for all components
- **Default Values**: Provide sensible defaults for optional props

### Component Structure
- **Single Responsibility**: Each component has a clear purpose
- **Reusability**: Design components for reuse across the application
- **Consistency**: Follow established patterns for similar functionality

## Implementation Guidelines

### Employee Management
1. **View Employee**: Check employment status
2. **Conditional Actions**: Show relevant buttons based on data
3. **Navigation**: Provide clear paths to related functionality
4. **Data Integrity**: Ensure proper data relationships

### Employment Workflow
1. **Creation**: Pre-select employee when creating employment
2. **Viewing**: Show employment details with proper navigation
3. **Editing**: Maintain data consistency during updates
4. **Deletion**: Implement proper confirmation and cleanup

### Salary Management
1. **Linking**: Connect salaries to employees and employments
2. **Navigation**: Provide clear paths between related data
3. **Data Display**: Show relevant salary information in context

## Error Handling Patterns

### User Experience
- **Graceful Degradation**: Handle errors without breaking the UI
- **Clear Messages**: Provide helpful error messages
- **Recovery Options**: Offer retry or alternative actions

### Technical Implementation
- **Error Boundaries**: Implement proper error boundaries
- **Logging**: Log errors for debugging
- **Fallbacks**: Provide fallback UI for failed components

## Performance Considerations

### Loading Optimization
- **Skeleton Loading**: Show loading placeholders
- **Progressive Loading**: Load critical content first
- **Caching**: Implement proper data caching strategies

### User Interaction
- **Responsive Design**: Ensure good UX across devices
- **Accessibility**: Follow accessibility best practices
- **Performance**: Optimize for smooth interactions 