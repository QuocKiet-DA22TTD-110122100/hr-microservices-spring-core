import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ApiError } from '@/types/common';
import { isJwtExpired } from '@/utils/authSession';
import { storage } from '@/utils/storage';

const toApiError = (message: string, source: unknown): Error => {
  const error = new Error(message);
  (error as Error & { cause?: unknown }).cause = source;
  return error;
};

const apiClient = axios.create({
  baseURL: '/api',
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const redirectToLogin = () => {
  storage.clear();

  if (globalThis.location.pathname !== '/login') {
    globalThis.location.href = '/login';
  }
};

const isAuthLoginRequest = (url?: string) =>
  !!url && (url.includes('/xac-thuc/dang-nhap') || url.includes('/xac-thuc/oauth2/token'));

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = storage.getAccessToken();
    if (token) {
      if (isJwtExpired(token)) {
        redirectToLogin();
        throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      }

      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    throw error;
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    if (error.response?.status === 401) {
      if (isAuthLoginRequest(error.config?.url)) {
        throw error;
      }

      redirectToLogin();
      throw toApiError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', error);
    }

    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'];
      throw toApiError(`Quá nhiều yêu cầu. Vui lòng thử lại sau ${retryAfter || 60} giây.`, error);
    }

    if (error.response?.status === 423) {
      throw toApiError(`Tài khoản bị khóa. ${error.response.data.message}`, error);
    }

    throw error;
  }
);

export default apiClient;
