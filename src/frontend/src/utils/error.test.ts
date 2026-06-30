import { describe, it, expect } from 'vitest';
import { AxiosError } from 'axios';
import {
  getApiErrorMessage,
  getApiErrorDetails,
  isStatusCode,
  isNetworkError,
  isClientError,
  isServerError,
  isValidationError,
  getValidationErrors,
} from './error';

// Helper to create mock Axios errors
const createAxiosError = (
  status: number,
  data?: { message?: string; error?: string; details?: string | string[]; code?: string }
): AxiosError => {
  return {
    isAxiosError: true,
    message: 'Request failed',
    name: 'AxiosError',
    config: {} as any,
    toJSON: () => ({}),
    response: {
      status,
      statusText: 'Error',
      data: data || {},
      headers: {},
      config: {} as any,
    },
  } as AxiosError;
};

const createNetworkError = (message: string): AxiosError => {
  return {
    isAxiosError: true,
    message,
    name: 'AxiosError',
    config: {} as any,
    toJSON: () => ({}),
  } as AxiosError;
};

describe('getApiErrorMessage', () => {
  describe('HTTP Status Code Errors', () => {
    it('should handle 400 Bad Request', () => {
      const error = createAxiosError(400);
      const message = getApiErrorMessage(error, 'Fallback');
      expect(message).toContain('không hợp lệ');
    });

    it('should handle 401 Unauthorized', () => {
      const error = createAxiosError(401);
      const message = getApiErrorMessage(error, 'Fallback');
      expect(message).toContain('đăng nhập');
    });

    it('should handle 403 Forbidden', () => {
      const error = createAxiosError(403);
      const message = getApiErrorMessage(error, 'Fallback');
      expect(message).toContain('không có quyền');
    });

    it('should handle 404 Not Found', () => {
      const error = createAxiosError(404);
      const message = getApiErrorMessage(error, 'Fallback');
      expect(message).toContain('Không tìm thấy');
    });

    it('should handle 500 Internal Server Error', () => {
      const error = createAxiosError(500);
      const message = getApiErrorMessage(error, 'Fallback');
      expect(message).toContain('Lỗi máy chủ');
    });
  });

  describe('Custom Error Messages', () => {
    it('should prioritize server-provided message over status code message', () => {
      const error = createAxiosError(400, { message: 'Custom error message' });
      const message = getApiErrorMessage(error, 'Fallback');
      expect(message).toBe('Custom error message');
    });

    it('should use error field if message is not available', () => {
      const error = createAxiosError(400, { error: 'Error field message' });
      const message = getApiErrorMessage(error, 'Fallback');
      expect(message).toBe('Error field message');
    });

    it('should include error details when available', () => {
      const error = createAxiosError(400, {
        message: 'Validation failed',
        details: ['Field A is required', 'Field B is invalid'],
      });
      const message = getApiErrorMessage(error, 'Fallback');
      expect(message).toContain('Validation failed');
      expect(message).toContain('Field A is required');
      expect(message).toContain('Field B is invalid');
    });

    it('should handle single detail string', () => {
      const error = createAxiosError(400, {
        message: 'Error occurred',
        details: 'Single detail message',
      });
      const message = getApiErrorMessage(error, 'Fallback');
      expect(message).toContain('Single detail message');
    });
  });

  describe('Network Errors', () => {
    it('should handle Network Error', () => {
      const error = createNetworkError('Network Error');
      const message = getApiErrorMessage(error, 'Fallback');
      expect(message).toContain('Không thể kết nối');
    });

    it('should handle timeout errors', () => {
      const error = createNetworkError('timeout of 30000ms exceeded');
      const message = getApiErrorMessage(error, 'Fallback');
      expect(message).toContain('thời gian chờ');
    });

    it('should handle ERR_NETWORK', () => {
      const error = createNetworkError('ERR_NETWORK');
      const message = getApiErrorMessage(error, 'Fallback');
      expect(message).toContain('Lỗi mạng');
    });
  });

  describe('Fallback Handling', () => {
    it('should return fallback for unknown errors', () => {
      const message = getApiErrorMessage('random string', 'Fallback message');
      expect(message).toBe('Fallback message');
    });

    it('should return fallback for null error', () => {
      const message = getApiErrorMessage(null, 'Fallback message');
      expect(message).toBe('Fallback message');
    });

    it('should return fallback for undefined error', () => {
      const message = getApiErrorMessage(undefined, 'Fallback message');
      expect(message).toBe('Fallback message');
    });
  });
});

describe('getApiErrorDetails', () => {
  it('should extract status code', () => {
    const error = createAxiosError(404);
    const details = getApiErrorDetails(error);
    expect(details.statusCode).toBe(404);
  });

  it('should extract message', () => {
    const error = createAxiosError(400, { message: 'Custom message' });
    const details = getApiErrorDetails(error);
    expect(details.message).toBe('Custom message');
  });

  it('should extract error code', () => {
    const error = createAxiosError(400, { code: 'VALIDATION_ERROR' });
    const details = getApiErrorDetails(error);
    expect(details.code).toBe('VALIDATION_ERROR');
  });

  it('should extract details array', () => {
    const error = createAxiosError(422, {
      details: ['Error 1', 'Error 2'],
    });
    const details = getApiErrorDetails(error);
    expect(details.details).toEqual(['Error 1', 'Error 2']);
  });

  it('should preserve original error', () => {
    const error = createAxiosError(500);
    const details = getApiErrorDetails(error);
    expect(details.originalError).toBe(error);
  });
});

describe('isStatusCode', () => {
  it('should return true for matching status code', () => {
    const error = createAxiosError(404);
    expect(isStatusCode(error, 404)).toBe(true);
  });

  it('should return false for non-matching status code', () => {
    const error = createAxiosError(404);
    expect(isStatusCode(error, 500)).toBe(false);
  });

  it('should return false for network errors', () => {
    const error = createNetworkError('Network Error');
    expect(isStatusCode(error, 404)).toBe(false);
  });
});

describe('isNetworkError', () => {
  it('should return true for network errors', () => {
    const error = createNetworkError('Network Error');
    expect(isNetworkError(error)).toBe(true);
  });

  it('should return false for HTTP errors', () => {
    const error = createAxiosError(404);
    expect(isNetworkError(error)).toBe(false);
  });
});

describe('isClientError', () => {
  it('should return true for 4xx errors', () => {
    expect(isClientError(createAxiosError(400))).toBe(true);
    expect(isClientError(createAxiosError(404))).toBe(true);
    expect(isClientError(createAxiosError(422))).toBe(true);
  });

  it('should return false for 5xx errors', () => {
    expect(isClientError(createAxiosError(500))).toBe(false);
    expect(isClientError(createAxiosError(503))).toBe(false);
  });

  it('should return false for network errors', () => {
    expect(isClientError(createNetworkError('Network Error'))).toBe(false);
  });
});

describe('isServerError', () => {
  it('should return true for 5xx errors', () => {
    expect(isServerError(createAxiosError(500))).toBe(true);
    expect(isServerError(createAxiosError(502))).toBe(true);
    expect(isServerError(createAxiosError(503))).toBe(true);
  });

  it('should return false for 4xx errors', () => {
    expect(isServerError(createAxiosError(400))).toBe(false);
    expect(isServerError(createAxiosError(404))).toBe(false);
  });

  it('should return false for network errors', () => {
    expect(isServerError(createNetworkError('Network Error'))).toBe(false);
  });
});

describe('isValidationError', () => {
  it('should return true for 422 status code', () => {
    const error = createAxiosError(422);
    expect(isValidationError(error)).toBe(true);
  });

  it('should return false for other status codes', () => {
    expect(isValidationError(createAxiosError(400))).toBe(false);
    expect(isValidationError(createAxiosError(500))).toBe(false);
  });
});

describe('getValidationErrors', () => {
  it('should parse field-specific validation errors', () => {
    const error = createAxiosError(422, {
      message: 'Validation failed',
      details: ['username: Username is required', 'email: Invalid email format'],
    });
    const validationErrors = getValidationErrors(error);
    expect(validationErrors).toEqual({
      username: 'Username is required',
      email: 'Invalid email format',
    });
  });

  it('should handle general validation errors', () => {
    const error = createAxiosError(422, {
      message: 'Validation failed',
      details: ['General validation error'],
    });
    const validationErrors = getValidationErrors(error);
    expect(validationErrors).toEqual({
      _general: 'General validation error',
    });
  });

  it('should return empty object for non-validation errors', () => {
    const error = createAxiosError(404);
    const validationErrors = getValidationErrors(error);
    expect(validationErrors).toEqual({});
  });

  it('should handle mixed validation errors', () => {
    const error = createAxiosError(422, {
      details: [
        'username: Required',
        'General error',
        'password: Too short',
      ],
    });
    const validationErrors = getValidationErrors(error);
    expect(validationErrors).toEqual({
      username: 'Required',
      password: 'Too short',
      _general: 'General error',
    });
  });
});
