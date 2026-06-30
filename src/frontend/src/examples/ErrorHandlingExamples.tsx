/**
 * API Error Handling Examples
 * 
 * Demonstrates proper usage of error normalization utilities
 * from Task 5.1
 */

import { useState } from 'react';
import { 
  getApiErrorMessage, 
  getApiErrorDetails,
  isStatusCode,
  isNetworkError,
  isValidationError,
  getValidationErrors,
} from '@/utils/error';
import { Button } from '@/components/UI/Button';
import { useUIStore } from '@/store/uiStore';
import { userApi } from '@/api/user.api';

export const ErrorHandlingExamples = () => {
  const [loading, setLoading] = useState(false);
  const { addNotification } = useUIStore();

  // ========================================================================
  // Example 1: Basic Error Handling
  // ========================================================================
  const handleBasicOperation = async () => {
    setLoading(true);
    try {
      await userApi.getAll();
      addNotification({ type: 'success', message: 'Thành công!' });
    } catch (error) {
      // Simple error message extraction with fallback
      const message = getApiErrorMessage(error, 'Không thể từi danh sách người dùng');
      addNotification({ type: 'error', message });
    } finally {
      setLoading(false);
    }
  };

  // ========================================================================
  // Example 2: Status Code Specific Handling
  // ========================================================================
  const handleStatusSpecificOperation = async () => {
    setLoading(true);
    try {
      await userApi.delete('user-id');
      addNotification({ type: 'success', message: 'Đã xóa người dùng' });
    } catch (error) {
      // Handle specific status codes differently
      if (isStatusCode(error, 404)) {
        addNotification({ 
          type: 'warning', 
          message: 'Người dùng không tồn tại hoặc đã bị xóa'
        });
      } else if (isStatusCode(error, 403)) {
        addNotification({ 
          type: 'error', 
          message: 'Bạn không có quyền xóa người dùng này' 
        });
      } else {
        const message = getApiErrorMessage(error, 'Không thể xóa người dùng');
        addNotification({ type: 'error', message });
      }
    } finally {
      setLoading(false);
    }
  };

  // ========================================================================
  // Example 3: Network Error Handling
  // ========================================================================
  const handleNetworkAwareOperation = async () => {
    setLoading(true);
    try {
      await userApi.create({ username: 'test', password: 'test', role: 'USER' });
      addNotification({ type: 'success', message: 'Tạo người dùng thành công' });
    } catch (error) {
      if (isNetworkError(error)) {
        // Special handling for network issues
        addNotification({ 
          type: 'warning', 
          message: 'Mất kết nối mạng. Dữ liệu đã được lưu tạm và sẽ đồng bộ khi có kết nối.',
          duration: 5000,
        });
        // Queue operation for later...
      } else {
        const message = getApiErrorMessage(error, 'Không thể tạo người dùng');
        addNotification({ type: 'error', message });
      }
    } finally {
      setLoading(false);
    }
  };

  // ========================================================================
  // Example 4: Validation Error Handling
  // ========================================================================
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handleFormSubmission = async (formData: unknown) => {
    setLoading(true);
    setFormErrors({});
    
    try {
      await userApi.create(formData as any);
      addNotification({ type: 'success', message: 'Tạo thành công' });
    } catch (error) {
      if (isValidationError(error)) {
        // Extract field-specific validation errors
        const validationErrors = getValidationErrors(error);
        setFormErrors(validationErrors);
        
        // Show general notification
        addNotification({ 
          type: 'error', 
          message: 'Dữ liệu không h?p l?. Vui lòng kiểm tra các trường bị lỗi.' 
        });
      } else {
        const message = getApiErrorMessage(error, 'Không thể lưu dữ liệu');
        addNotification({ type: 'error', message });
      }
    } finally {
      setLoading(false);
    }
  };

  // ========================================================================
  // Example 5: Detailed Error Logging
  // ========================================================================
  const handleOperationWithLogging = async () => {
    setLoading(true);
    try {
      await userApi.update('user-id', { role: 'ADMIN', locked: false });
      addNotification({ type: 'success', message: 'Cập nhật thành công' });
    } catch (error) {
      // Get detailed error information for logging
      const errorDetails = getApiErrorDetails(error);
      
      // TODO: Send error to monitoring service (e.g., Sentry, LogRocket)
      // logToMonitoring('Update user failed', errorDetails);

      // Show user-friendly message
      addNotification({ 
        type: 'error', 
        message: errorDetails.message 
      });
    } finally {
      setLoading(false);
    }
  };

  // ========================================================================
  // Example 6: Retry Logic with Error Classification
  // ========================================================================
  const handleOperationWithRetry = async () => {
    const maxRetries = 3;
    let retries = 0;
    setLoading(true);

    while (retries < maxRetries) {
      try {
        await userApi.getAll();
        addNotification({ type: 'success', message: 'Tải dữ liệu thành công' });
        break;
      } catch (error) {
        const errorDetails = getApiErrorDetails(error);
        
        // Don't retry client errors (4xx) - user needs to fix the request
        if (errorDetails.statusCode && errorDetails.statusCode >= 400 && errorDetails.statusCode < 500) {
          addNotification({ 
            type: 'error', 
            message: getApiErrorMessage(error, 'Yêu cầu không hợp lệ') 
          });
          break;
        }

        // Retry server errors and network errors
        retries++;
        if (retries >= maxRetries) {
          addNotification({ 
            type: 'error', 
            message: `Không thể tải dữ liệu sau ${maxRetries} lần thử` 
          });
        } else {
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
        }
      }
    }
    
    setLoading(false);
  };

  // ========================================================================
  // Example 7: Optimistic Update with Error Rollback
  // ========================================================================
  const [userData, setUserData] = useState({ name: 'John', role: 'USER' });

  const handleOptimisticUpdate = async () => {
    const originalData = { ...userData };
    const newData = { ...userData, role: 'ADMIN' };

    // Update UI immediately
    setUserData(newData);
    
    try {
      await userApi.update('user-id', newData as any);
      addNotification({ type: 'success', message: 'Cập nhật thành công' });
    } catch (error) {
      // Rollback on error
      setUserData(originalData);
      
      const message = getApiErrorMessage(error, 'Không thể cập nhật. Đã hoàn tác thay Đổi.');
      addNotification({ type: 'error', message });
    }
  };

  // ========================================================================
  // Render UI Examples
  // ========================================================================
  return (
    <div className="p-8 space-y-6 bg-gray-50">
      <h1 className="text-2xl font-bold text-gray-800">Error Handling Examples</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold mb-2">1. Basic Error Handling</h3>
          <p className="text-sm text-gray-600 mb-3">Simple error message extraction</p>
          <Button onClick={handleBasicOperation} isLoading={loading} size="sm">
            Test Basic
          </Button>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold mb-2">2. Status-Specific Handling</h3>
          <p className="text-sm text-gray-600 mb-3">Different handling for 404, 403, etc.</p>
          <Button onClick={handleStatusSpecificOperation} isLoading={loading} size="sm">
            Test Status
          </Button>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold mb-2">3. Network Error Handling</h3>
          <p className="text-sm text-gray-600 mb-3">Detect and handle network issues</p>
          <Button onClick={handleNetworkAwareOperation} isLoading={loading} size="sm">
            Test Network
          </Button>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold mb-2">4. Validation Errors</h3>
          <p className="text-sm text-gray-600 mb-3">Field-specific error handling</p>
          <Button onClick={() => handleFormSubmission({})} isLoading={loading} size="sm">
            Test Validation
          </Button>
          {Object.keys(formErrors).length > 0 && (
            <div className="mt-2 text-xs text-red-600">
              {Object.entries(formErrors).map(([field, error]) => (
                <div key={field}>{field}: {error}</div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold mb-2">5. Detailed Logging</h3>
          <p className="text-sm text-gray-600 mb-3">Extract full error details</p>
          <Button onClick={handleOperationWithLogging} isLoading={loading} size="sm">
            Test Logging
          </Button>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold mb-2">6. Retry Logic</h3>
          <p className="text-sm text-gray-600 mb-3">Smart retry with error classification</p>
          <Button onClick={handleOperationWithRetry} isLoading={loading} size="sm">
            Test Retry
          </Button>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold mb-2">7. Optimistic Update</h3>
          <p className="text-sm text-gray-600 mb-3">Update UI first, rollback on error</p>
          <div className="text-xs mb-2">Current: {userData.role}</div>
          <Button onClick={handleOptimisticUpdate} isLoading={loading} size="sm">
            Test Optimistic
          </Button>
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">📝 Best Practices</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Always provide a fallback message</li>
          <li>• Use specific status code handling for critical operations</li>
          <li>• Check for network errors before showing generic error</li>
          <li>• Extract validation errors for form field highlighting</li>
          <li>• Log detailed error info to monitoring services</li>
          <li>• Don't retry 4xx errors (client errors)</li>
          <li>• Use optimistic updates for better perceived performance</li>
        </ul>
      </div>
    </div>
  );
};
