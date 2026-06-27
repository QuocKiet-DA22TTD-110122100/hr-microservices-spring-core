import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ApiError } from '@/types/common';
import { isJwtExpired } from '@/utils/authSession';
import { storage } from '@/utils/storage';

type ApiErrorPayload = ApiError & {
  error?: string;
  reason?: string;
  detail?: string;
  title?: string;
};

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

const isTokenVerificationRequest = (url?: string) =>
  !!url && url.includes('/xac-thuc/kiem-tra');

const isTokenAuthFailure = (error: AxiosError<ApiErrorPayload>): boolean => {
  if (error.response?.status !== 401) {
    return false;
  }

  const data = error.response.data;
  const message = [
    data?.message,
    data?.error,
    data?.reason,
    data?.detail,
    data?.title,
    data?.code,
    error.message,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return (
    message.includes('token') ||
    message.includes('jwt') ||
    message.includes('expired') ||
    message.includes('invalid token') ||
    message.includes('revoked') ||
    message.includes('hết hạn') ||
    message.includes('het han') ||
    message.includes('thu hồi') ||
    message.includes('thu hoi')
  );
};

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
  async (error: AxiosError<ApiErrorPayload>) => {
    if (error.response?.status === 401) {
      if (isAuthLoginRequest(error.config?.url)) {
        throw error;
      }

      if (isTokenVerificationRequest(error.config?.url) || isTokenAuthFailure(error)) {
        redirectToLogin();
        throw toApiError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', error);
      }

      throw error;
    }

    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'];
      throw toApiError(`Quá nhiều yêu cầu. Vui lòng thử lại sau ${retryAfter || 60} giây.`, error);
    }

    throw error;
  }
);

export default apiClient;
