import apiClient from '@/utils/axios';
import { ApiResponse } from '@/types/common';
import {
  LoginRequest,
  LoginResponse,
  ChangePasswordApiRequest,
  ProfileResponse,
  VerifyTokenResponse,
} from '@/types/auth';
import { storage } from '@/utils/storage';

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
    const response = await apiClient.post('/xac-thuc/dang-nhap', data);
    const payload = response.data as {
      token?: string;
      access_token?: string;
      data?: { token?: string; accessToken?: string };
    };

    const token = payload.token ?? payload.access_token ?? payload.data?.token ?? payload.data?.accessToken;

    if (!token) {
      throw new Error('Login response does not include token');
    }

    return { token };
  },

  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    const response = await apiClient.post('/xac-thuc/dang-ky', data);
    return response.data;
  },

  logout: async (token: string): Promise<{ message: string }> => {
    const response = await apiClient.post('/xac-thuc/dang-xuat', { token });
    return response.data;
  },

  refreshToken: async (refreshToken: string): Promise<ApiResponse<{ accessToken: string }>> => {
    const response = await apiClient.post('/xac-thuc/lam-moi-token', { refreshToken });
    return response.data;
  },

  changePassword: async (data: ChangePasswordApiRequest): Promise<ApiResponse<void>> => {
    const response = await apiClient.post('/xac-thuc/doi-mat-khau', data);
    return response.data;
  },

  getProfile: async (): Promise<VerifyTokenResponse> => {
    const token = storage.getAccessToken() || '';
    const response = await apiClient.post('/xac-thuc/kiem-tra', { token });
    return response.data;
  },

  getProfileV1: async (): Promise<ProfileResponse> => {
    const response = await apiClient.get<ProfileResponse>('/v1/auth/profile', {
      timeout: 5000,
      headers: {
        'Cache-Control': 'max-age=60',
      },
    });
    return response.data;
  },
};
