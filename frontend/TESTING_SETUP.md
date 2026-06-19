# Testing Setup Instructions

## Prerequisites

Ensure you have the following dependencies installed:

```bash
cd frontend
npm install --save-dev @testing-library/user-event @testing-library/jest-dom
```

## Package Dependencies

The following packages should be in your `package.json`:

```json
{
  "devDependencies": {
    "@testing-library/react": "^14.0.0",
    "@testing-library/user-event": "^14.5.1",
    "@testing-library/jest-dom": "^6.1.5",
    "vitest": "^1.3.0",
    "jsdom": "^22.1.0"
  }
}
```

## Running Tests

### Run all tests

```bash
npm test
```

### Run tests in watch mode

```bash
npm run test:watch
```

### Run tests with coverage

```bash
npm run test:coverage
```

### Run specific test file

```bash
npm test Table.test
```

## Test Files Created

1. **`src/test/setup.ts`** - Test environment setup
2. **`src/test/utils.tsx`** - Test utilities and helpers
3. **`src/test/README.md`** - Testing documentation
4. **`src/components/UI/Table.test.tsx`** - Table component tests
5. **`src/components/UI/Modal.test.tsx`** - Modal component tests
6. **`src/pages/UserManagementPage.test.tsx`** - User management page tests

## Coverage Report

After running `npm run test:coverage`, view the report:

```bash
# Open HTML coverage report
open coverage/index.html  # macOS
start coverage/index.html # Windows
xdg-open coverage/index.html # Linux
```

## Integration with CI/CD

Add to your CI pipeline (e.g., GitHub Actions):

```yaml
- name: Run tests
  run: |
    cd frontend
    npm test -- --run
    
- name: Generate coverage
  run: |
    cd frontend
    npm run test:coverage
```

## Troubleshooting

### Issue: "Cannot find module @testing-library/user-event"

**Solution:**
```bash
npm install --save-dev @testing-library/user-event
```

### Issue: "Cannot find module @testing-library/jest-dom"

**Solution:**
```bash
npm install --save-dev @testing-library/jest-dom
```

### Issue: Tests failing with "Not wrapped in act()"

**Solution:** Ensure you're using async/await with userEvent:
```tsx
// ✅ Correct
await user.click(button);

// ❌ Wrong
fireEvent.click(button);
```

### Issue: "window.matchMedia is not a function"

**Solution:** Already handled in `src/test/setup.ts`

## VS Code Integration

Install the Vitest extension for VS Code:

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "Vitest"
4. Install "Vitest" extension by Anthony Fu

This enables:
- Run tests from editor
- View test results inline
- Debug tests
- Code coverage highlights

## Test Structure

Follow the Arrange-Act-Assert pattern:

```tsx
it('should do something', async () => {
  // Arrange - setup
  const user = userEvent.setup();
  render(<Component />);
  
  // Act - perform action
  await user.click(screen.getByRole('button'));
  
  // Assert - verify result
  expect(screen.getByText('Result')).toBeInTheDocument();
});
```

## Next Steps

1. Install missing dependencies
2. Run `npm test` to verify setup
3. Run `npm run test:coverage` to see coverage
4. Add more tests for remaining components
5. Integrate with CI/CD pipeline
