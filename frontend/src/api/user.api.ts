import apiClient from '@/utils/axios';
import { ApiResponse } from '@/types/common';

// ============================================================================
// Error Types
// ============================================================================

export enum ApiErrorCode {
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  SERVER_ERROR = 'SERVER_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface ApiErrorResponse {
  code: ApiErrorCode;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

export class ApiError extends Error implements ApiErrorResponse {
  code: ApiErrorCode;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
  statusCode?: number;

  constructor(
    code: ApiErrorCode,
    message: string,
    details?: Record<string, unknown>,
    statusCode?: number,
  ) {
    super(message);
    this.code = code;
    this.message = message;
    this.details = details;
    this.statusCode = statusCode;
    this.timestamp = new Date().toISOString();
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

// ============================================================================
// Data Transfer Objects (DTOs)
// ============================================================================

export interface UserAccount {
  id: string;
  username: string;
  role: string;
  locked: boolean;
  createdAt?: string;
}

interface UserDto {
  id: string;
  username: string;
  role: string;
  locked: boolean;
  createdAt?: string | null;
}

interface RegisterResponse {
  userId: string;
  username: string;
  role: string;
}

export interface LockAccountRequest {
  username: string;
}

export interface UnlockAccountRequest {
  username: string;
}

// ============================================================================
// Request Payloads
// ============================================================================

export interface CreateUserRequest {
  username: string;
  password: string;
  role: string;
}

export interface UpdateUserRequest {
  role?: string;
  locked?: boolean;
}

// ============================================================================
// Generic API Response Wrapper
// ============================================================================

export interface ApiResponseSuccess<T> {
  success: true;
  data: T;
  timestamp: string;
}

export interface ApiResponseFailure {
  success: false;
  error: ApiErrorResponse;
}

export type ApiResponseEnvelope<T> = ApiResponseSuccess<T> | ApiResponseFailure;

// ============================================================================
// API Configuration
// ============================================================================

const API_CONFIG = {
  DEFAULT_TIMEOUT: 15000, // 15 seconds
  RETRY_MAX_ATTEMPTS: 3,
  RETRY_DELAY_MS: 1000,
  RETRY_BACKOFF_MULTIPLIER: 2,
  RETRYABLE_STATUS_CODES: [408, 429, 500, 502, 503, 504],
} as const;

// ============================================================================
// Error Handling Utilities
// ============================================================================

/**
 * Map HTTP status code to ApiErrorCode
 */
export function mapStatusToErrorCode(status?: number): ApiErrorCode {
  if (!status) return ApiErrorCode.NETWORK_ERROR;
  if (status === 408 || status === 504) return ApiErrorCode.TIMEOUT;
  if (status === 400) return ApiErrorCode.VALIDATION_ERROR;
  if (status === 401) return ApiErrorCode.UNAUTHORIZED;
  if (status === 403) return ApiErrorCode.FORBIDDEN;
  if (status === 404) return ApiErrorCode.NOT_FOUND;
  if (status === 409) return ApiErrorCode.CONFLICT;
  if (status >= 500) return ApiErrorCode.SERVER_ERROR;
  return ApiErrorCode.UNKNOWN_ERROR;
}

/**
 * Extract meaningful error message from API response or error object
 */
export function extractErrorMessage(error: unknown): string {
  if (error instanceof ApiError || error instanceof Error) {
    return error.message;
  }

  const axiosError = error as Record<string, unknown> | undefined;
  if (!axiosError) return 'An unknown error occurred';

  // Try to extract from response.data.message
  if (axiosError.response && typeof axiosError.response === 'object') {
    const data = (axiosError.response as Record<string, unknown>).data;
    if (data && typeof data === 'object' && typeof (data as Record<string, unknown>).message === 'string') {
      return (data as Record<string, unknown>).message as string;
    }
  }

  // Fall back to axiosError.message
  if (typeof axiosError.message === 'string') return axiosError.message;
  return 'An unknown error occurred';
}

/**
 * Safely extract status code from error response
 */
export function extractStatusCode(error: unknown): number | undefined {
  if (error instanceof ApiError) return error.statusCode;
  if (typeof error === 'object' && error !== null) {
    const axiosError = error as Record<string, unknown>;
    if (axiosError.response && typeof axiosError.response === 'object') {
      const responseObj = axiosError.response as Record<string, unknown>;
      const status = responseObj.status;
      if (typeof status === 'number') return status;
    }
  }
  return undefined;
}

/**
 * Determine if error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof ApiError) {
    const statusCode = error.statusCode ?? 0;
    return (API_CONFIG.RETRYABLE_STATUS_CODES as readonly number[]).includes(statusCode);
  }
  if (typeof error === 'object' && error !== null) {
    const axiosError = error as Record<string, unknown>;
    if (typeof axiosError.code === 'string') {
      return ['ECONNABORTED', 'ENOTFOUND', 'ECONNREFUSED'].includes(axiosError.code);
    }
    if (typeof axiosError.response === 'object' && axiosError.response !== null) {
      const status = (axiosError.response as Record<string, unknown>).status as number | undefined;
      return status ? (API_CONFIG.RETRYABLE_STATUS_CODES as readonly number[]).includes(status) : false;
    }
  }
  return false;
}

// ============================================================================
// Retry Strategy
// ============================================================================

/**
 * Exponential backoff retry utility
 */
export async function retryWithExponentialBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts: number = API_CONFIG.RETRY_MAX_ATTEMPTS,
  initialDelayMs: number = API_CONFIG.RETRY_DELAY_MS,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (!isRetryableError(error) || attempt === maxAttempts) {
        throw error;
      }

      const delayMs = initialDelayMs * Math.pow(API_CONFIG.RETRY_BACKOFF_MULTIPLIER, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw lastError;
}

// ============================================================================
// Response Mapping & Normalization
// ============================================================================

/**
 * Normalize ISO date string to consistent format (YYYY-MM-DD HH:mm:ss)
 * Returns undefined if null/invalid
 */
export function normalizeDate(dateStr: string | null | undefined): string | undefined {
  if (!dateStr) return undefined;
  try {
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return undefined;
    return date.toLocaleString('en-CA').replace(',', '');
  } catch {
    return undefined;
  }
}

/**
 * Mapper class for response normalization with strict validation
 */
export class UserResponseMapper {
  /**
   * Map backend UserDto to frontend UserAccount with safe null handling
   * @throws ApiError if user data is invalid
   */
  static toUserAccount(user: unknown): UserAccount {
    if (!user || typeof user !== 'object') {
      throw new ApiError(
        ApiErrorCode.VALIDATION_ERROR,
        'Invalid user data received from server',
        { received: typeof user },
      );
    }

    const userData = user as Record<string, unknown>;

    // Validate required fields
    if (typeof userData.id !== 'string' || !userData.id.trim()) {
      throw new ApiError(
        ApiErrorCode.VALIDATION_ERROR,
        'User ID is missing or invalid',
      );
    }

    if (typeof userData.username !== 'string' || !userData.username.trim()) {
      throw new ApiError(
        ApiErrorCode.VALIDATION_ERROR,
        'Username is missing or invalid',
      );
    }

    if (typeof userData.role !== 'string' || !userData.role.trim()) {
      throw new ApiError(
        ApiErrorCode.VALIDATION_ERROR,
        'User role is missing or invalid',
      );
    }

    return {
      id: userData.id,
      username: userData.username,
      role: userData.role,
      locked: Boolean(userData.locked ?? false),
      createdAt: normalizeDate(userData.createdAt as string | null | undefined),
    };
  }

  /**
   * Map array of UserDto to UserAccount[]
   * @throws ApiError if array is invalid or contains invalid items
   */
  static toUserAccountList(users: unknown): UserAccount[] {
    if (!Array.isArray(users)) {
      throw new ApiError(
        ApiErrorCode.VALIDATION_ERROR,
        'Expected array of users from server',
        { received: typeof users },
      );
    }

    return users.map((user, index) => {
      try {
        return this.toUserAccount(user);
      } catch (error) {
        if (error instanceof ApiError) {
          throw new ApiError(
            error.code,
            `Invalid user at index ${index}: ${error.message}`,
            error.details,
          );
        }
        throw error;
      }
    });
  }

  /**
   * Map RegisterResponse to UserAccount
   * @throws ApiError if response is invalid
   */
  static fromRegisterResponse(response: unknown): UserAccount {
    if (!response || typeof response !== 'object') {
      throw new ApiError(
        ApiErrorCode.VALIDATION_ERROR,
        'Invalid registration response from server',
        { received: typeof response },
      );
    }

    const responseData = response as Record<string, unknown>;

    if (typeof responseData.userId !== 'string' || !responseData.userId.trim()) {
      throw new ApiError(
        ApiErrorCode.VALIDATION_ERROR,
        'User ID missing in registration response',
      );
    }

    if (typeof responseData.username !== 'string' || !responseData.username.trim()) {
      throw new ApiError(
        ApiErrorCode.VALIDATION_ERROR,
        'Username missing in registration response',
      );
    }

    if (typeof responseData.role !== 'string' || !responseData.role.trim()) {
      throw new ApiError(
        ApiErrorCode.VALIDATION_ERROR,
        'Role missing in registration response',
      );
    }

    return {
      id: responseData.userId,
      username: responseData.username,
      role: responseData.role,
      locked: false,
      createdAt: normalizeDate(new Date().toISOString()),
    };
  }
}

// ============================================================================
// User API Client
// ============================================================================

export const userApi = {
  /**
   * Fetch all users with retry logic and error handling
   * @throws ApiError on failure
   */
  getAll: async (): Promise<ApiResponse<UserAccount[]>> => {
    return retryWithExponentialBackoff(async () => {
      try {
        const response = await apiClient.get<UserDto[]>('/xac-thuc/quan-tri/tai-khoan', {
          timeout: API_CONFIG.DEFAULT_TIMEOUT,
        });

        const normalizedData = UserResponseMapper.toUserAccountList(response.data);

        return {
          success: true,
          data: normalizedData,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        // SonarQube: intentional error transformation and rethrow
        const statusCode = extractStatusCode(error);
        const message = extractErrorMessage(error);
        const errorCode = mapStatusToErrorCode(statusCode);

        throw new ApiError(errorCode, message, undefined, statusCode);
      }
    });
  },

  /**
   * Create new user with validation and error handling
   * @throws ApiError on failure
   */
  create: async (data: CreateUserRequest): Promise<ApiResponse<UserAccount>> => {
    // Validate request payload
    if (!data.username?.trim()) {
      throw new ApiError(ApiErrorCode.VALIDATION_ERROR, 'Username is required');
    }

    if (!data.password?.trim()) {
      throw new ApiError(ApiErrorCode.VALIDATION_ERROR, 'Password is required');
    }

    if (!data.role?.trim()) {
      throw new ApiError(ApiErrorCode.VALIDATION_ERROR, 'Role is required');
    }

    return retryWithExponentialBackoff(async () => {
      try {
        const response = await apiClient.post<RegisterResponse>(
          '/xac-thuc/dang-ky',
          data,
          { timeout: API_CONFIG.DEFAULT_TIMEOUT },
        );

        const normalizedData = UserResponseMapper.fromRegisterResponse(response.data);

        return {
          success: true,
          data: normalizedData,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        // SonarQube: intentional error transformation and rethrow
        const statusCode = extractStatusCode(error);
        const message = extractErrorMessage(error);
        const errorCode = mapStatusToErrorCode(statusCode);

        throw new ApiError(errorCode, message, undefined, statusCode);
      }
    });
  },

  /**
   * Update existing user with retry logic and error handling
   * @throws ApiError on failure
   */
  update: async (id: string, data: UpdateUserRequest): Promise<ApiResponse<UserAccount>> => {
    if (!id?.trim()) {
      throw new ApiError(ApiErrorCode.VALIDATION_ERROR, 'User ID is required');
    }

    return retryWithExponentialBackoff(async () => {
      try {
        const response = await apiClient.put<UserDto>(
          `/xac-thuc/quan-tri/tai-khoan/${id}`,
          data,
          { timeout: API_CONFIG.DEFAULT_TIMEOUT },
        );

        const normalizedData = UserResponseMapper.toUserAccount(response.data);

        return {
          success: true,
          data: normalizedData,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        // SonarQube: intentional error transformation and rethrow
        const statusCode = extractStatusCode(error);
        const message = extractErrorMessage(error);
        const errorCode = mapStatusToErrorCode(statusCode);

        throw new ApiError(errorCode, message, undefined, statusCode);
      }
    });
  },

  /**
   * Delete user account
   * @throws ApiError on failure
   */
  delete: async (id: string): Promise<ApiResponse<null>> => {
    if (!id?.trim()) {
      throw new ApiError(ApiErrorCode.VALIDATION_ERROR, 'User ID is required');
    }

    return retryWithExponentialBackoff(async () => {
      try {
        await apiClient.delete(`/xac-thuc/quan-tri/tai-khoan/${id}`, {
          timeout: API_CONFIG.DEFAULT_TIMEOUT,
        });

        return {
          success: true,
          data: null,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        // SonarQube: intentional error transformation and rethrow
        const statusCode = extractStatusCode(error);
        const message = extractErrorMessage(error);
        const errorCode = mapStatusToErrorCode(statusCode);

        throw new ApiError(errorCode, message, undefined, statusCode);
      }
    });
  },

  /**
   * Lock user account
   * @throws ApiError on failure
   */
  lockAccount: async (username: string): Promise<ApiResponse<null>> => {
    if (!username?.trim()) {
      throw new ApiError(ApiErrorCode.VALIDATION_ERROR, 'Username is required');
    }

    const payload: LockAccountRequest = { username };

    return retryWithExponentialBackoff(async () => {
      try {
        await apiClient.post('/xac-thuc/quan-tri/khoa-tai-khoan', payload, {
          timeout: API_CONFIG.DEFAULT_TIMEOUT,
        });

        return {
          success: true,
          data: null,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        // SonarQube: intentional error transformation and rethrow
        const statusCode = extractStatusCode(error);
        const message = extractErrorMessage(error);
        const errorCode = mapStatusToErrorCode(statusCode);

        throw new ApiError(errorCode, message, undefined, statusCode);
      }
    });
  },

  /**
   * Unlock user account
   * @throws ApiError on failure
   */
  unlockAccount: async (username: string): Promise<ApiResponse<null>> => {
    if (!username?.trim()) {
      throw new ApiError(ApiErrorCode.VALIDATION_ERROR, 'Username is required');
    }

    const payload: UnlockAccountRequest = { username };

    return retryWithExponentialBackoff(async () => {
      try {
        await apiClient.post('/xac-thuc/quan-tri/mo-tai-khoan', payload, {
          timeout: API_CONFIG.DEFAULT_TIMEOUT,
        });

        return {
          success: true,
          data: null,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        // SonarQube: intentional error transformation and rethrow
        const statusCode = extractStatusCode(error);
        const message = extractErrorMessage(error);
        const errorCode = mapStatusToErrorCode(statusCode);

        throw new ApiError(errorCode, message, undefined, statusCode);
      }
    });
  },
};
