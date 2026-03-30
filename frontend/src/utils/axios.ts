import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ApiError } from '@/types/common';

const apiClient = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 - Token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post('/api/auth/refresh', { refreshToken });
          const { accessToken } = response.data.data;
          
          localStorage.setItem('accessToken', accessToken);
          
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }
          
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Handle 429 - Rate limit
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'];
      const message = `Quá nhiều yêu cầu. Vui lòng thử lại sau ${retryAfter || 60} giây.`;
      return Promise.reject({ ...error, message });
    }

    // Handle 423 - Account locked
    if (error.response?.status === 423) {
      const lockedUntil = error.response.data.message;
      return Promise.reject({ ...error, message: `Tài khoản bị khóa. ${lockedUntil}` });
    }

    return Promise.reject(error);
  }
);

export default apiClient;
