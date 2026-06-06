import { AxiosError } from 'axios';

interface ErrorPayload {
  message?: string;
  error?: string;
  details?: string | string[];
  code?: string;
  statusCode?: number;
  timestamp?: string;
}

interface ApiErrorDetails {
  message: string;
  statusCode?: number;
  originalError?: unknown;
  details?: string[];
  code?: string;
}

/**
 * Maps HTTP status codes to user-friendly Vietnamese messages
 */
const STATUS_CODE_MESSAGES: Record<number, string> = {
  // 4xx Client Errors
  400: 'Yêu cầu không hợp lệ. Vui lòng kiểm tra lại thông tin.',
  401: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
  403: 'Bạn không có quyền thực hiện thao tác này.',
  404: 'Không tìm thấy tài nguyên yêu cầu.',
  405: 'Phương thức không được hỗ trợ.',
  408: 'Yêu cầu hết thời gian chờ. Vui lòng thử lại.',
  409: 'Dữ liệu bị xung đột. Vui lòng làm mới trang và thử lại.',
  410: 'Tài nguyên không còn tồn tại.',
  413: 'Dữ liệu quá lớn. Vui lòng giảm kích thước và thử lại.',
  415: 'Định dạng dữ liệu không được hỗ trợ.',
  422: 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.',
  423: 'Tài nguyên đang bị khóa.',
  429: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.',

  // 5xx Server Errors
  500: 'Lỗi máy chủ. Vui lòng thể lỗi sau.',
  501: 'Chức năng chưa được triển khai.',
  502: 'Lỗi kết nối máy chủ.',
  503: 'Dịch vụ tạm thời không khả dụng. Vui lòng thử lại sau.',
  504: 'Máy chủ không phản hồi. Vui lòng thử lại.',
};

/**
 * Network error messages
 */
const NETWORK_ERROR_MESSAGES: Record<string, string> = {
  'Network Error': 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.',
  'timeout': 'Yêu cầu hết thời gian chờ. Vui lòng thử lại.',
  'ECONNABORTED': 'Kết nối bị ngắt. Vui lòng thử lại.',
  'ERR_NETWORK': 'Lỗi mạng. Vui lòng kiểm tra kết nối của bạn.',
  'ERR_CANCELED': 'Yêu cầu đã bị hủy.',
};

/**
 * Extracts detailed error information from an Axios error
 */
function extractErrorDetails(error: unknown): ApiErrorDetails {
  // Handle non-Axios errors
  if (!error || typeof error !== 'object') {
    return {
      message: 'Đã xảy ra lỗi không xác định.',
      originalError: error,
    };
  }

  const axiosError = error as AxiosError<ErrorPayload>;

  // Network errors (no response from server)
  if (!axiosError.response) {
    const networkMessage = Object.entries(NETWORK_ERROR_MESSAGES).find(([key]) =>
      axiosError.message?.includes(key)
    )?.[1];

    return {
      message: networkMessage || NETWORK_ERROR_MESSAGES['Network Error'],
      originalError: error,
    };
  }

  const { status, data } = axiosError.response;
  const statusCode = status;

  // Extract error message from response
  let message = data?.message || data?.error;

  // Extract error details if available
  let details: string[] | undefined;
  if (data?.details) {
    details = Array.isArray(data.details) ? data.details : [data.details];
  }

  // Use status code message if no specific message provided
  if (!message) {
    message = STATUS_CODE_MESSAGES[statusCode] || `Lỗi HTTP ${statusCode}`;
  }

  return {
    message,
    statusCode,
    originalError: error,
    details,
    code: data?.code,
  };
}

/**
 * Formats error details into a user-friendly message
 */
function formatErrorMessage(errorDetails: ApiErrorDetails): string {
  let message = errorDetails.message;

  // Append details if available
  if (errorDetails.details && errorDetails.details.length > 0) {
    const detailsText = errorDetails.details.join(', ');
    message = `${message} Chi tiết: ${detailsText}`;
  }

  return message;
}

/**
 * Main error normalization function
 * 
 * @param error - The error object (usually from an API call)
 * @param fallback - Fallback message if error cannot be parsed
 * @returns Normalized error message in Vietnamese
 * 
 * @example
 * try {
 *   await api.createUser(data);
 * } catch (error) {
 *   const message = getApiErrorMessage(error, 'Không thể tạo người dùng');
 *   showNotification({ type: 'error', message });
 * }
 */
export const getApiErrorMessage = (
  error: unknown,
  fallback: string
): string => {
  try {
    const errorDetails = extractErrorDetails(error);
    const message = formatErrorMessage(errorDetails);
    return message || fallback;
  } catch {
    // If error parsing fails, return fallback
    return fallback;
  }
};

/**
 * Returns detailed error information for advanced error handling
 * 
 * @param error - The error object
 * @returns Detailed error information
 * 
 * @example
 * try {
 *   await api.updateUser(id, data);
 * } catch (error) {
 *   const details = getApiErrorDetails(error);
 *   if (details.statusCode === 403) {
 *     showPermissionDeniedDialog();
 *   } else {
 *     showErrorMessage(details.message);
 *   }
 * }
 */
export const getApiErrorDetails = (error: unknown): ApiErrorDetails => {
  return extractErrorDetails(error);
};

/**
 * Checks if an error is a specific HTTP status code
 * 
 * @param error - The error object
 * @param statusCode - The HTTP status code to check
 * @returns True if the error has the specified status code
 * 
 * @example
 * try {
 *   await api.deleteUser(id);
 * } catch (error) {
 *   if (isStatusCode(error, 404)) {
 *     showNotification({ type: 'info', message: 'Người dùng không tồn tại' });
 *   } else {
 *     showNotification({ type: 'error', message: getApiErrorMessage(error) });
 *   }
 * }
 */
export const isStatusCode = (error: unknown, statusCode: number): boolean => {
  const axiosError = error as AxiosError;
  return axiosError?.response?.status === statusCode;
};

/**
 * Checks if an error is a network error (no response from server)
 * 
 * @param error - The error object
 * @returns True if the error is a network error
 */
export const isNetworkError = (error: unknown): boolean => {
  const axiosError = error as AxiosError;
  return !axiosError?.response && !!axiosError?.message;
};

/**
 * Checks if an error is a client error (4xx)
 * 
 * @param error - The error object
 * @returns True if the error is a 4xx client error
 */
export const isClientError = (error: unknown): boolean => {
  const axiosError = error as AxiosError;
  const status = axiosError?.response?.status;
  return status ? status >= 400 && status < 500 : false;
};

/**
 * Checks if an error is a server error (5xx)
 * 
 * @param error - The error object
 * @returns True if the error is a 5xx server error
 */
export const isServerError = (error: unknown): boolean => {
  const axiosError = error as AxiosError;
  const status = axiosError?.response?.status;
  return status ? status >= 500 && status < 600 : false;
};

/**
 * Type guard for validation errors (422)
 * Validation errors typically include field-specific details
 */
export const isValidationError = (error: unknown): boolean => {
  return isStatusCode(error, 422);
};

/**
 * Returns validation error details as a structured object
 * 
 * @param error - The error object
 * @returns Object mapping field names to error messages
 */
export const getValidationErrors = (error: unknown): Record<string, string> => {
  if (!isValidationError(error)) {
    return {};
  }

  const errorDetails = getApiErrorDetails(error);
  const errors: Record<string, string> = {};

  if (errorDetails.details) {
    errorDetails.details.forEach((detail) => {
      // Try to parse field-specific errors like "field: message"
      const match = detail.match(/^(\w+):\s*(.+)$/);
      if (match) {
        errors[match[1]] = match[2];
      } else {
        errors['_general'] = detail;
      }
    });
  }

  return errors;
};
