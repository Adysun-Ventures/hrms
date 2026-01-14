# Component Memory & User Preference Rules

## User Interaction Memory

### Server Management
- **Server Restart**: Always ask user before automatically restarting server
- **Build Processes**: Notify user of build status and completion
- **Deployment**: Confirm deployment actions before execution

### Navigation Preferences
- **Back Button**: Always include consistent back navigation
- **Breadcrumb State**: Maintain breadcrumb context across navigation
- **Form State**: Preserve form data when navigating away and back

### UI State Persistence
- **Filter Preferences**: Remember user's filter selections
- **Sort Preferences**: Maintain sort order across sessions
- **View Preferences**: Remember user's preferred view modes

## Component Behavior Memory

### TableHeader Component
- **Back Button**: Always present with consistent navigation
- **Action Buttons**: Show relevant actions based on data state
- **Search State**: Maintain search value across component updates
- **Filter State**: Remember active filters and selections

### Form Components
- **Validation State**: Remember validation errors until resolved
- **Input Focus**: Maintain focus state where appropriate
- **Auto-save**: Implement auto-save for long forms
- **Draft Recovery**: Allow recovery of unsaved changes

### Data Display Components
- **Pagination State**: Remember current page across navigation
- **Expanded Rows**: Maintain expanded state for collapsible content
- **Selected Items**: Remember selections for bulk operations
- **Sort Order**: Maintain sort preferences

## Error Handling Memory

### User-Friendly Errors
- **Error Context**: Provide context for what went wrong
- **Recovery Options**: Offer clear next steps
- **Error Logging**: Log errors for debugging while showing user-friendly messages

### Retry Logic
- **Automatic Retry**: Implement smart retry for transient failures
- **Manual Retry**: Provide clear retry buttons
- **Fallback Options**: Offer alternative actions when primary action fails

## Performance Memory

### Loading States
- **Skeleton Loading**: Show appropriate loading placeholders
- **Progressive Loading**: Load critical content first
- **Caching Strategy**: Implement proper data caching

### User Experience
- **Responsive Design**: Ensure good UX across all devices
- **Accessibility**: Maintain accessibility standards
- **Smooth Interactions**: Optimize for fluid user interactions

## Data Relationship Memory

### Employee-Employment Logic
- **Employment Status**: Remember employment state for conditional UI
- **Navigation Context**: Maintain context when navigating between related data
- **Data Integrity**: Ensure proper relationships between entities

### Form Pre-population
- **Query Parameters**: Use URL parameters for pre-selecting data
- **Default Values**: Provide sensible defaults based on context
- **User Preferences**: Remember user's common selections

## Component Communication

### Parent-Child Communication
- **Event Handling**: Consistent event handling patterns
- **State Lifting**: Proper state management between components
- **Callback Patterns**: Use consistent callback signatures

### Cross-Component State
- **Global State**: Use appropriate state management for shared data
- **Local State**: Keep component-specific state local
- **State Synchronization**: Ensure state consistency across components

## User Preference Patterns

### Interface Customization
- **Theme Preferences**: Remember user's theme choice
- **Layout Preferences**: Maintain user's layout preferences
- **Feature Toggles**: Remember user's feature preferences

### Workflow Preferences
- **Common Actions**: Remember frequently used actions
- **Navigation Patterns**: Learn from user's navigation habits
- **Data Display**: Remember preferred data presentation formats

## Accessibility Memory

### User Assistance
- **Screen Reader**: Maintain proper ARIA labels and descriptions
- **Keyboard Navigation**: Ensure consistent keyboard navigation
- **Focus Management**: Proper focus handling across components

### Inclusive Design
- **Color Preferences**: Respect user's color scheme preferences
- **Font Size**: Remember user's font size preferences
- **Motion Preferences**: Respect user's motion preferences 