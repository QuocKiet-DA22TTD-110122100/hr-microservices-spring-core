# Integration Tests

## Tổng quan

Integration tests kiểm tra toàn bộ flow của ứng dụng, từ user interaction đến API calls và state management.

## Test Files

### 1. user-crud-flow.test.tsx

**Tests complete user lifecycle:**
- Create new user
- View user in list
- Edit user details
- Lock/unlock account
- Delete user

**Key Scenarios:**
- Full CRUD cycle
- Form validation
- Concurrent operations
- Duplicate submission prevention
- Optimistic updates

**Test Count:** 9 integration tests

### 2. role-permission-flow.test.tsx

**Tests permission-based access control:**
- Admin full access
- Regular user limited access
- HR Manager specific permissions
- Permission matrix display
- Role change impact

**Key Scenarios:**
- Different user roles
- Permission-based UI hiding
- Permission-based action blocking
- Role change and permission updates

**Test Count:** 12 integration tests

### 3. api-error-handling.test.tsx

**Tests error scenarios and recovery:**
- Server errors (500, 503)
- Network errors (timeout, no internet)
- Client errors (400, 401, 403, 404, 422, 429)
- Form validation errors
- Retry mechanisms
- Fallback data
- Optimistic updates with rollback

**Key Scenarios:**
- All HTTP error codes
- Network failures
- Validation error mapping
- Error recovery
- Concurrent errors

**Test Count:** 15 integration tests

## Running Integration Tests

### Run all integration tests

```bash
npm test integration
```

### Run specific integration test file

```bash
npm test user-crud-flow
npm test role-permission-flow
npm test api-error-handling
```

### Run with coverage

```bash
npm run test:coverage -- integration
```

### Watch mode

```bash
npm test -- --watch integration
```

## Test Structure

Each integration test follows this pattern:

```tsx
describe('Integration: Feature Name', () => {
  // Setup
  beforeEach(() => {
    // Mock stores
    // Mock APIs
    // Reset state
  });

  describe('Scenario Group', () => {
    it('should complete full flow', async () => {
      // 1. Render component
      renderWithRouter(<Component />);

      // 2. Wait for initial load
      await screen.findByText('Expected Text');

      // 3. User interactions
      const user = userEvent.setup();
      await user.click(button);
      await user.type(input, 'text');

      // 4. Verify API calls
      expect(api.method).toHaveBeenCalledWith(expectedData);

      // 5. Verify UI updates
      expect(screen.getByText('Result')).toBeInTheDocument();

      // 6. Verify notifications
      expect(mockUIStore.addNotification).toHaveBeenCalledWith({
        type: 'success',
        message: expect.stringContaining('success'),
      });
    });
  });
});
```

## Key Patterns

### 1. Mock API Responses

```tsx
beforeEach(() => {
  // Success response
  vi.mocked(api.getAll).mockResolvedValue({ data: mockData });

  // Error response
  vi.mocked(api.create).mockRejectedValue({
    response: {
      status: 500,
      data: { message: 'Error' },
    },
  });

  // Conditional response
  vi.mocked(api.update).mockImplementation((id) => {
    if (id === 'fail') {
      return Promise.reject(new Error('Failed'));
    }
    return Promise.resolve({ data: updatedData });
  });
});
```

### 2. Test Complete Flow

```tsx
it('should complete create → view → edit → delete', async () => {
  // CREATE
  await user.click(addButton);
  await user.type(input, 'data');
  await user.click(submitButton);
  expect(api.create).toHaveBeenCalled();

  // VIEW
  await screen.findByText('data');

  // EDIT
  await user.click(editButton);
  await user.clear(input);
  await user.type(input, 'updated');
  await user.click(updateButton);
  expect(api.update).toHaveBeenCalled();

  // DELETE
  await user.click(deleteButton);
  await user.click(confirmButton);
  expect(api.delete).toHaveBeenCalled();
});
```

### 3. Test Error Recovery

```tsx
it('should retry on error', async () => {
  let attemptCount = 0;
  
  vi.mocked(api.getAll).mockImplementation(() => {
    attemptCount++;
    if (attemptCount === 1) {
      return Promise.reject(new Error('Failed'));
    }
    return Promise.resolve({ data: mockData });
  });

  renderWithRouter(<Component />);

  // First attempt fails
  await screen.findByText('Retry');

  // Get retry function
  const retryCall = mockUIStore.addNotification.mock.calls.find(
    call => call[0].onRetry
  );

  // Trigger retry
  if (retryCall?.onRetry) {
    retryCall.onRetry();
  }

  // Second attempt succeeds
  await screen.findByText('Success');
  expect(attemptCount).toBe(2);
});
```

### 4. Test Optimistic Updates

```tsx
it('should rollback on API failure', async () => {
  // Initial state
  await screen.findByText('Active');

  // Mock API failure
  vi.mocked(api.lock).mockRejectedValue(new Error('Failed'));

  // Optimistic update (UI changes immediately)
  await user.click(lockButton);

  // API fails, should rollback
  await waitFor(() => {
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  // Should show error notification
  expect(mockUIStore.addNotification).toHaveBeenCalledWith(
    expect.objectContaining({
      type: 'error',
      message: expect.stringContaining('rollback'),
    })
  );
});
```

### 5. Test Permission-Based UI

```tsx
describe('Admin Permissions', () => {
  beforeEach(() => {
    vi.mocked(useAuthStore).mockReturnValue(
      createMockAuthStore(mockAdminUser)
    );
  });

  it('should show all actions for admin', () => {
    renderWithRouter(<Component />);

    // Admin should see everything
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
  });
});

describe('Regular User Permissions', () => {
  beforeEach(() => {
    vi.mocked(useAuthStore).mockReturnValue(
      createMockAuthStore(mockUser)
    );
  });

  it('should hide restricted actions', () => {
    renderWithRouter(<Component />);

    // Regular user should not see admin actions
    expect(screen.queryByRole('button', { name: 'Create' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
  });
});
```

## Best Practices

### 1. Test Real User Flows

```tsx
// ✅ Good - tests actual user behavior
it('should create user and see it in list', async () => {
  await user.click(addButton);
  await user.type(nameInput, 'John');
  await user.click(saveButton);
  expect(await screen.findByText('John')).toBeInTheDocument();
});

// ❌ Bad - tests implementation
it('should call setState', () => {
  // Don't test implementation details
});
```

### 2. Mock External Dependencies Only

```tsx
// ✅ Good - mock API and stores
vi.mock('@/api/user.api');
vi.mock('@/store/authStore');

// ❌ Bad - mock internal components
vi.mock('@/components/Table');
```

### 3. Test Error Paths

```tsx
it('should handle all error scenarios', async () => {
  // Test 400
  mockApi.mockRejectedValueOnce({ response: { status: 400 } });
  
  // Test 500
  mockApi.mockRejectedValueOnce({ response: { status: 500 } });
  
  // Test network error
  mockApi.mockRejectedValueOnce({ code: 'ERR_NETWORK' });
});
```

### 4. Clean Up Between Tests

```tsx
beforeEach(() => {
  vi.clearAllMocks();
  // Reset any global state
  mockUsers.length = 0;
  mockUsers.push(...initialUsers);
});
```

### 5. Use Realistic Data

```tsx
// ✅ Good - realistic mock data
const mockUser = {
  id: '1',
  username: 'john.doe',
  email: 'john@example.com',
  role: 'USER',
  permissions: ['employee:view'],
  createdAt: '2024-01-01T00:00:00Z',
};

// ❌ Bad - minimal mock data
const mockUser = { id: '1' };
```

## Debugging Integration Tests

### 1. Use screen.debug()

```tsx
it('should do something', async () => {
  render(<Component />);
  screen.debug(); // Prints current DOM
  
  await user.click(button);
  screen.debug(); // Prints updated DOM
});
```

### 2. Check API Mock Calls

```tsx
it('should call API', async () => {
  await user.click(button);
  
  console.log(mockApi.create.mock.calls);
  // [[arg1, arg2], [arg1, arg2], ...]
  
  expect(mockApi.create).toHaveBeenCalledWith(expectedData);
});
```

### 3. Wait for Async Updates

```tsx
// Use waitFor for async assertions
await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument();
});

// Use findBy for async elements
const element = await screen.findByText('Loaded');
expect(element).toBeInTheDocument();
```

### 4. Check Notification Calls

```tsx
console.log(mockUIStore.addNotification.mock.calls);
// Verify notification was called with expected data
expect(mockUIStore.addNotification).toHaveBeenCalledWith(
  expect.objectContaining({
    type: 'success',
    message: expect.stringContaining('success'),
  })
);
```

## Common Issues

### Issue: Test times out

**Cause:** Waiting for element that never appears

**Solution:**
```tsx
// Use queryBy to check non-existence
expect(screen.queryByText('Missing')).not.toBeInTheDocument();

// Don't wait for something that won't appear
// await screen.findByText('Missing'); // ❌ Will timeout
```

### Issue: Mock not working

**Cause:** Mock is not set up before component render

**Solution:**
```tsx
beforeEach(() => {
  // Set up all mocks BEFORE rendering
  vi.mocked(api.getAll).mockResolvedValue({ data: [] });
});

it('test', () => {
  render(<Component />); // Now mock is ready
});
```

### Issue: State not updating

**Cause:** Not waiting for async updates

**Solution:**
```tsx
// Wait for updates
await waitFor(() => {
  expect(screen.getByText('Updated')).toBeInTheDocument();
});

// Or use findBy
await screen.findByText('Updated');
```

## Coverage Goals

Integration tests should cover:
- ✅ Complete user workflows
- ✅ All error scenarios
- ✅ Permission-based access
- ✅ Form validation
- ✅ API integration
- ✅ State management
- ✅ Error recovery

**Target Coverage:**
- User flows: 100%
- Error paths: 90%+
- Permission scenarios: 100%

## Resources

- [Testing Library](https://testing-library.com/)
- [Vitest](https://vitest.dev/)
- [User Event](https://testing-library.com/docs/user-event/intro)
