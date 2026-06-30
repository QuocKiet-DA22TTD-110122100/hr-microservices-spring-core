# Frontend Testing Guide

## Tổng quan

Frontend sử dụng **Vitest** và **React Testing Library** để test components và integration.

## Test Structure

```
frontend/
├── src/
│   ├── test/
│   │   ├── setup.ts           # Test setup và mocks
│   │   ├── utils.tsx           # Test utilities
│   │   └── README.md           # Documentation này
│   ├── components/
│   │   └── UI/
│   │       ├── Table.tsx
│   │       ├── Table.test.tsx
│   │       ├── Modal.tsx
│   │       └── Modal.test.tsx
│   └── pages/
│       ├── UserManagementPage.tsx
│       └── UserManagementPage.test.tsx
└── vitest.config.ts
```

## Running Tests

### Chạy tất cả tests

```bash
npm test
```

### Chạy tests ở watch mode

```bash
npm run test:watch
```

### Chạy tests với coverage

```bash
npm run test:coverage
```

### Chạy specific test file

```bash
npm test Table.test.tsx
```

### Chạy tests matching pattern

```bash
npm test -- --grep "User table"
```

## Test Utilities

### renderWithRouter

Render component với React Router context.

```tsx
import { renderWithRouter } from '@/test/utils';

it('should render', () => {
  renderWithRouter(<MyComponent />);
  expect(screen.getByText('Hello')).toBeInTheDocument();
});
```

### Mock Data

```tsx
import { mockUser, mockAdminUser } from '@/test/utils';

// Regular user with limited permissions
const user = mockUser;

// Admin user with all permissions
const admin = mockAdminUser;
```

### Mock Stores

```tsx
import { createMockAuthStore, createMockUIStore } from '@/test/utils';

const mockAuthStore = createMockAuthStore(mockUser);
const mockUIStore = createMockUIStore();
```

### Mock API Responses

```tsx
import { createMockResponse, createMockError } from '@/test/utils';

// Success response
vi.mocked(api.getUsers).mockResolvedValue(
  createMockResponse(mockUsers)
);

// Error response
vi.mocked(api.getUsers).mockRejectedValue(
  createMockError('Failed to load', 500)
);
```

## Writing Tests

### Component Test Template

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  describe('Rendering', () => {
    it('should render component', () => {
      render(<MyComponent />);
      expect(screen.getByText('Title')).toBeInTheDocument();
    });
  });

  describe('User Interaction', () => {
    it('should handle click', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      
      render(<MyComponent onClick={handleClick} />);
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<MyComponent />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAccessibleName();
    });
  });
});
```

### Testing User Interactions

```tsx
import userEvent from '@testing-library/user-event';

it('should handle form submission', async () => {
  const user = userEvent.setup();
  const handleSubmit = vi.fn();
  
  render(<Form onSubmit={handleSubmit} />);
  
  // Type in input
  await user.type(screen.getByLabelText('Username'), 'testuser');
  
  // Click button
  await user.click(screen.getByRole('button', { name: 'Submit' }));
  
  expect(handleSubmit).toHaveBeenCalledWith(
    expect.objectContaining({ username: 'testuser' })
  );
});
```

### Testing Async Operations

```tsx
it('should load data on mount', async () => {
  vi.mocked(api.getUsers).mockResolvedValue({ data: mockUsers });
  
  render(<UserList />);
  
  // Wait for data to appear
  expect(await screen.findByText('John Doe')).toBeInTheDocument();
  
  // API should be called
  expect(api.getUsers).toHaveBeenCalledTimes(1);
});
```

### Testing Error States

```tsx
it('should show error message on API failure', async () => {
  const errorMessage = 'Failed to load users';
  vi.mocked(api.getUsers).mockRejectedValue(
    new Error(errorMessage)
  );
  
  render(<UserList />);
  
  expect(await screen.findByText(errorMessage)).toBeInTheDocument();
});
```

### Testing Modals

```tsx
it('should open and close modal', async () => {
  const user = userEvent.setup();
  render(<ModalExample />);
  
  // Open modal
  await user.click(screen.getByRole('button', { name: 'Open' }));
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  
  // Close modal
  await user.click(screen.getByRole('button', { name: 'Close' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
```

### Testing Forms with Validation

```tsx
it('should show validation errors', async () => {
  const user = userEvent.setup();
  render(<UserForm />);
  
  // Submit empty form
  await user.click(screen.getByRole('button', { name: 'Submit' }));
  
  // Should show error
  expect(await screen.findByText('Username is required')).toBeInTheDocument();
  
  // Fill form
  await user.type(screen.getByLabelText('Username'), 'testuser');
  
  // Error should disappear
  expect(screen.queryByText('Username is required')).not.toBeInTheDocument();
});
```

## Test Coverage

### Coverage Goals

- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

### View Coverage Report

```bash
npm run test:coverage
```

Coverage report sẽ được tạo trong `coverage/` directory.

### Exclude from Coverage

Files excluded:
- `node_modules/`
- `src/test/`
- `**/*.test.{ts,tsx}`
- `**/*.spec.{ts,tsx}`
- `**/types/`
- `**/*.d.ts`

## Best Practices

### 1. Test User Behavior, Not Implementation

```tsx
// ✅ Good - tests user behavior
it('should display user name', () => {
  render(<UserProfile user={mockUser} />);
  expect(screen.getByText('John Doe')).toBeInTheDocument();
});

// ❌ Bad - tests implementation
it('should call setName', () => {
  const setName = vi.fn();
  render(<UserProfile setName={setName} />);
  expect(setName).toHaveBeenCalled();
});
```

### 2. Use Accessible Queries

```tsx
// ✅ Good - accessible queries
screen.getByRole('button', { name: 'Submit' })
screen.getByLabelText('Username')
screen.getByText('Welcome')

// ❌ Bad - implementation details
screen.getByTestId('submit-button')
screen.getByClassName('input')
```

### 3. Avoid Testing Library Implementation

```tsx
// ✅ Good - tests component behavior
it('should call API on submit', async () => {
  render(<Form />);
  await user.click(screen.getByRole('button', { name: 'Submit' }));
  expect(api.create).toHaveBeenCalled();
});

// ❌ Bad - tests library behavior
it('should call useState', () => {
  // Don't test React hooks directly
});
```

### 4. Clean Up After Each Test

```tsx
// Automatic cleanup with setup.ts
import { cleanup } from '@testing-library/react';
afterEach(() => {
  cleanup();
});
```

### 5. Mock External Dependencies

```tsx
// Mock API calls
vi.mock('@/api/user.api', () => ({
  userApi: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock stores
vi.mock('@/store/authStore', () => ({
  useAuthStore: vi.fn(),
}));
```

### 6. Test Accessibility

```tsx
it('should have proper ARIA labels', () => {
  render(<Button>Submit</Button>);
  
  const button = screen.getByRole('button');
  expect(button).toHaveAccessibleName('Submit');
});

it('should have proper form labels', () => {
  render(<Input label="Username" />);
  
  const input = screen.getByLabelText('Username');
  expect(input).toBeInTheDocument();
});
```

## Common Test Patterns

### Table Testing

```tsx
it('should render table with data', async () => {
  render(<Table data={mockData} />);
  
  // Check headers
  expect(screen.getByText('Name')).toBeInTheDocument();
  
  // Check data
  mockData.forEach(row => {
    expect(screen.getByText(row.name)).toBeInTheDocument();
  });
});
```

### Modal Testing

```tsx
it('should validate form in modal', async () => {
  const user = userEvent.setup();
  render(<ModalForm />);
  
  // Open modal
  await user.click(screen.getByRole('button', { name: 'Add' }));
  
  // Submit without data
  await user.click(screen.getByRole('button', { name: 'Save' }));
  
  // Should show errors
  expect(screen.getByText('Name is required')).toBeInTheDocument();
});
```

### Permission Testing

```tsx
it('should hide button when no permission', () => {
  vi.mocked(usePermissions).mockReturnValue({
    can: () => false,
  });
  
  render(<UserList />);
  
  // Button should not be visible
  expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
});
```

## Debugging Tests

### Screen.debug()

```tsx
it('should render', () => {
  render(<MyComponent />);
  screen.debug(); // Prints DOM to console
});
```

### Query with getAllBy

```tsx
// Find all matching elements
const buttons = screen.getAllByRole('button');
console.log(buttons.length);
```

### Wait for Element

```tsx
// Wait for async element
const element = await screen.findByText('Loaded');
expect(element).toBeInTheDocument();
```

## Troubleshooting

### Test fails with "Not wrapped in act()"

```tsx
// ✅ Use async/await with userEvent
await user.click(button);

// ❌ Don't use sync events for async operations
fireEvent.click(button);
```

### Can't find element

```tsx
// Use screen.debug() to see what's rendered
screen.debug();

// Check if element exists
expect(screen.queryByText('Hello')).toBeInTheDocument();

// Wait for async elements
await screen.findByText('Hello');
```

### Mock not working

```tsx
// Ensure mock is before import
vi.mock('@/api/user.api');

// Clear mocks between tests
beforeEach(() => {
  vi.clearAllMocks();
});
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Library Queries](https://testing-library.com/docs/queries/about)
- [User Event API](https://testing-library.com/docs/user-event/intro)
