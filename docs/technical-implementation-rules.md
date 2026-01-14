# Technical Implementation Rules

## Code Architecture Patterns

### Component Structure
- **Single Responsibility**: Each component has one clear purpose
- **Composition Over Inheritance**: Use composition for component reuse
- **Props Interface**: Define clear TypeScript interfaces for all props
- **Default Values**: Provide sensible defaults for optional props

### File Organization
- **Feature-Based**: Organize by feature rather than type
- **Consistent Naming**: Use consistent naming conventions
- **Import Order**: Maintain consistent import order
- **Export Patterns**: Use named exports for components

## Data Management Patterns

### Tanstack Query Usage
- **Query Keys**: Use consistent query key patterns
- **Mutation Handling**: Implement proper error handling for mutations
- **Cache Management**: Implement appropriate cache invalidation
- **Loading States**: Show proper loading indicators

### State Management
- **Local State**: Use useState for component-specific state
- **Global State**: Use appropriate global state management
- **Form State**: Use React Hook Form for form management
- **URL State**: Use URL parameters for shareable state

## TypeScript Patterns

### Interface Definitions
```typescript
interface ComponentProps {
  // Required props
  requiredProp: string;
  
  // Optional props with defaults
  optionalProp?: string;
  
  // Event handlers
  onAction?: (data: ActionData) => void;
  
  // Children
  children?: React.ReactNode;
}
```

### Type Safety
- **Strict Typing**: Use strict TypeScript configuration
- **Generic Types**: Use generics for reusable components
- **Union Types**: Use union types for variant props
- **Type Guards**: Implement proper type guards where needed

## Error Handling Patterns

### Component Error Boundaries
```typescript
class ErrorBoundary extends React.Component {
  // Implement error boundary logic
  // Log errors for debugging
  // Show fallback UI
}
```

### API Error Handling
- **Network Errors**: Handle network failures gracefully
- **Validation Errors**: Display validation errors clearly
- **Server Errors**: Show appropriate error messages
- **Retry Logic**: Implement smart retry mechanisms

## Performance Optimization

### React Optimization
- **Memoization**: Use React.memo for expensive components
- **Callback Optimization**: Use useCallback for event handlers
- **Dependency Arrays**: Proper dependency arrays in hooks
- **Lazy Loading**: Implement code splitting where appropriate

### Data Optimization
- **Pagination**: Implement proper pagination for large datasets
- **Virtualization**: Use virtualization for long lists
- **Debouncing**: Implement debouncing for search inputs
- **Caching**: Use appropriate caching strategies

## Testing Patterns

### Component Testing
- **Unit Tests**: Test individual component functionality
- **Integration Tests**: Test component interactions
- **Snapshot Tests**: Use snapshot testing for UI consistency
- **Accessibility Tests**: Test accessibility compliance

### Data Testing
- **API Mocking**: Mock API calls in tests
- **Error Scenarios**: Test error handling paths
- **Loading States**: Test loading state behavior
- **Form Validation**: Test form validation logic

## Security Patterns

### Input Validation
- **Client-Side**: Implement client-side validation
- **Server-Side**: Always validate on server
- **Sanitization**: Sanitize user inputs
- **XSS Prevention**: Prevent XSS attacks

### Authentication
- **Token Management**: Proper token storage and refresh
- **Route Protection**: Protect sensitive routes
- **Permission Checks**: Implement proper permission checks
- **Session Management**: Handle session timeouts

## Build & Deployment

### Build Configuration
- **Environment Variables**: Use proper environment configuration
- **Bundle Optimization**: Optimize bundle size
- **Code Splitting**: Implement proper code splitting
- **Asset Optimization**: Optimize images and assets

### Deployment Patterns
- **Environment-Specific**: Use environment-specific configurations
- **Health Checks**: Implement proper health checks
- **Rollback Strategy**: Have rollback procedures
- **Monitoring**: Implement proper monitoring

## Code Quality Standards

### Linting & Formatting
- **ESLint**: Use ESLint for code quality
- **Prettier**: Use Prettier for code formatting
- **TypeScript**: Use strict TypeScript configuration
- **Import Sorting**: Maintain consistent import order

### Documentation
- **JSDoc**: Document complex functions
- **README**: Maintain up-to-date README
- **API Documentation**: Document API endpoints
- **Component Documentation**: Document component usage

## Database Patterns

### Firestore Usage
- **Collection Structure**: Use consistent collection naming
- **Document Structure**: Maintain consistent document structure
- **Indexing**: Create proper indexes for queries
- **Security Rules**: Implement proper security rules

### Data Relationships
- **Foreign Keys**: Use proper foreign key relationships
- **Denormalization**: Denormalize for performance where needed
- **Data Consistency**: Maintain data consistency
- **Backup Strategy**: Implement proper backup procedures

## API Design Patterns

### RESTful APIs
- **Resource Naming**: Use consistent resource naming
- **HTTP Methods**: Use appropriate HTTP methods
- **Status Codes**: Use proper HTTP status codes
- **Error Responses**: Provide consistent error responses

### GraphQL Patterns
- **Schema Design**: Design clear and consistent schemas
- **Resolvers**: Implement efficient resolvers
- **Caching**: Implement proper GraphQL caching
- **Error Handling**: Handle GraphQL errors properly 