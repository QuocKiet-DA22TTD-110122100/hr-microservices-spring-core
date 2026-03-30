import apiClient from '@/utils/axios';
import { ApiResponse, PaginatedResponse, SearchParams } from '@/types/common';
import { Department, CreateDepartmentRequest, UpdateDepartmentRequest } from '@/types/department';

export const departmentApi = {
  getAll: async (params?: SearchParams): Promise<ApiResponse<PaginatedResponse<Department>>> => {
    const response = await apiClient.get('/hr/departments', { params });
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<Department>> => {
    const response = await apiClient.get(`/hr/departments/${id}`);
    return response.data;
  },

  create: async (data: CreateDepartmentRequest): Promise<ApiResponse<Department>> => {
    const response = await apiClient.post('/hr/departments', data);
    return response.data;
  },

  update: async (id: string, data: UpdateDepartmentRequest): Promise<ApiResponse<Department>> => {
    const response = await apiClient.put(`/hr/departments/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/hr/departments/${id}`);
    return response.data;
  },

  getTree: async (): Promise<ApiResponse<Department[]>> => {
    const response = await apiClient.get('/hr/departments/tree');
    return response.data;
  },
};
