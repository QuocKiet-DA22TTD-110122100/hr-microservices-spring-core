# API Error Handling Quick Reference

## 🚀 Quick Start

```typescript
import { getApiErrorMessage } from '@/utils/error';

try {
  await api.operation();
} catch (error) {
  const message = getApiErrorMessage(error, 'Không thể thực hiện');
  showNotification({ type: 'error', message });
}
```

---

## 📖 Common Functions

### Basic Error Message
```typescript
import { getApiErrorMessage } from '@/utils/error';

const message = getApiErrorMessage(error, 'Fallback message');
// Returns: "User-friendly Vietnamese message"
```

### Check Status Code
```typescript
import { isStatusCode } from '@/utils/error';

if (isStatusCode(error, 404)) {
  console.log('Not found');
}
```

### Network Error
```typescript
import { isNetworkError } from '@/utils/error';

if (isNetworkError(error)) {
  queueForLater(data);
}
```

### Validation Errors
```typescript
import { isValidationError, getValidationErrors } from '@/utils/error';

if (isValidationError(error)) {
  const errors = getValidationErrors(error);
  // errors = { username: 'Required', email: 'Invalid' }
  setFormErrors(errors);
}
```

---

## 🎯 Common Patterns

### Pattern 1: Simple Operation
```typescript
const handleSave = async () => {
  try {
    await api.save(data);
    showSuccess('Đã lưu');
  } catch (error) {
    showError(getApiErrorMessage(error, 'Không thể lưu'));
  }
};
```

### Pattern 2: Status-Specific
```typescript
const handleDelete = async (id: string) => {
  try {
    await api.delete(id);
    showSuccess('Đã xóa');
  } catch (error) {
    if (isStatusCode(error, 404)) {
      showInfo('Đã xóa trước đó');
    } else if (isStatusCode(error, 403)) {
      showError('Không có quyền');
    } else {
      showError(getApiErrorMessage(error, 'Lỗi xóa'));
    }
  }
};
```

### Pattern 3: Network-Aware
```typescript
const handleCreate = async (data: Data) => {
  try {
    await api.create(data);
    showSuccess('Thành công');
  } catch (error) {
    if (isNetworkError(error)) {
      saveOffline(data);
      showWarning('Lưu tạm. Đồng bộ sau');
    } else {
      showError(getApiErrorMessage(error, 'Lỗi tạo'));
    }
  }
};
```

### Pattern 4: Form Validation
```typescript
const handleSubmit = async (formData: FormData) => {
  try {
    await api.submit(formData);
    showSuccess('Đã gửi');
  } catch (error) {
    if (isValidationError(error)) {
      const errors = getValidationErrors(error);
      setFormErrors(errors);
      showError('Kiểm tra lỗi form');
    } else {
      showError(getApiErrorMessage(error, 'Lỗi gửi'));
    }
  }
};
```

---

## 📋 Status Codes

| Code | Meaning | Message |
|------|---------|---------|
| 400 | Bad Request | Yêu cầu không hợp lệ |
| 401 | Unauthorized | Phiên hết hạn |
| 403 | Forbidden | Không có quyền |
| 404 | Not Found | Không tìm thấy |
| 422 | Validation | Dữ liệu không hợp lệ |
| 500 | Server Error | Lỗi máy chủ |

---

## 🛠️ All Functions

```typescript
// Main function
getApiErrorMessage(error, fallback): string

// Detailed info
getApiErrorDetails(error): { message, statusCode, details, code }

// Status checking
isStatusCode(error, code): boolean

// Error classification
isNetworkError(error): boolean
isClientError(error): boolean  // 4xx
isServerError(error): boolean  // 5xx
isValidationError(error): boolean  // 422

// Validation helpers
getValidationErrors(error): Record<string, string>
```

---

## ✅ Best Practices

1. ✅ Always provide fallback message
2. ✅ Handle 404/403 specifically for delete operations
3. ✅ Check network errors before generic handling
4. ✅ Extract validation errors for forms
5. ✅ Don't retry 4xx errors (client errors)
6. ✅ Log detailed errors to monitoring

## ❌ Anti-Patterns

1. ❌ Don't show raw error objects to users
2. ❌ Don't use alert() for errors
3. ❌ Don't ignore error details
4. ❌ Don't retry client errors (4xx)
5. ❌ Don't silently swallow errors

---

## 📦 Import Paths

```typescript
// All error utilities
import { 
  getApiErrorMessage,
  getApiErrorDetails,
  isStatusCode,
  isNetworkError,
  isClientError,
  isServerError,
  isValidationError,
  getValidationErrors,
} from '@/utils/error';
```

---

## 🔗 See Also

- Full documentation: `TASK-5.1-ERROR-NORMALIZATION-SUMMARY.md`
- Examples: `frontend/src/examples/ErrorHandlingExamples.tsx`
- Tests: `frontend/src/utils/error.test.ts`
