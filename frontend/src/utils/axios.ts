import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ApiError } from '@/types/common';
import { storage } from '@/utils/storage';

const toApiError = (message: string, source: unknown): Error => {
  const error = new Error(message);
  (error as Error & { cause?: unknown }).cause = source;
  return error;
};

const apiClient = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — tự động gắn Bearer token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = storage.getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    throw error;
  }
);

// Token refresh state
let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token!);
  });
  failedQueue = [];
}

// Response interceptor — tự động refresh token khi nhận 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Nếu 401 và chưa retry, thử refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      const refreshToken = storage.getRefreshToken();

      // Không có refresh token → logout ngay
      if (!refreshToken) {
        storage.clear();
        if (globalThis.location.pathname !== '/login') {
          globalThis.location.href = '/login';
        }
        return Promise.reject(error);
      }

      // Đang refresh → đưa request vào hàng đợi
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post('/api/iam/refresh', { refreshToken });
        const newToken: string = data.token ?? data.accessToken ?? data.data?.accessToken;

        storage.setAccessToken(newToken);
        processQueue(null, newToken);

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        storage.clear();
        if (globalThis.location.pathname !== '/login') {
          globalThis.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle 429 - Rate limit
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'];
      const message = `Quá nhiều yêu cầu. Vui lòng thử lại sau ${retryAfter || 60} giây.`;
      throw toApiError(message, error);
    }

    // Handle 423 - Account locked
    if (error.response?.status === 423) {
      const lockedUntil = error.response.data.message;
      throw toApiError(`Tài khoản bị khóa. ${lockedUntil}`, error);
    }

    throw error;
  }
);

export default apiClient;
