import apiClient from '@/utils/axios';
import { ApiResponse } from '@/types/common';
import { LoginRequest, LoginResponse, ChangePasswordRequest } from '@/types/auth';

interface RegisterRequest {
  username: string;
  password: string;
  role?: string;
}

interface RegisterResponse {
  userId: string;
  username: string;
  role: string;
}

export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post('/iam/login', data);
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    const response = await apiClient.post('/iam/register', data);
    return response.data;
  },

  logout: async (token: string): Promise<{ message: string }> => {
    const response = await apiClient.post('/iam/logout', { token });
    return response.data;
  },

  refreshToken: async (refreshToken: string): Promise<ApiResponse<{ accessToken: string }>> => {
    const response = await apiClient.post('/auth/refresh', { refreshToken });
    return response.data;
  },

  changePassword: async (data: ChangePasswordRequest): Promise<ApiResponse<void>> => {
    const response = await apiClient.post('/iam/change-password', data);
    return response.data;
  },

  getProfile: async (): Promise<ApiResponse<unknown>> => {
    const token = localStorage.getItem('accessToken') || '';
    const response = await apiClient.post('/iam/verify', { token });
    return response.data;
  },
};
