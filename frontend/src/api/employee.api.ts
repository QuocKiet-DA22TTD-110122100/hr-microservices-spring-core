import apiClient from '@/utils/axios';
import { ApiResponse, PaginatedResponse, SearchParams } from '@/types/common';
import { Employee, CreateEmployeeRequest, UpdateEmployeeRequest } from '@/types/employee';

const toPaginated = (payload: unknown): PaginatedResponse<Employee> => {
  const data = payload as Record<string, unknown>;

  if (Array.isArray(payload)) {
    return {
      content: payload as Employee[],
      page: 0,
      size: payload.length,
      totalElements: payload.length,
      totalPages: 1,
    };
  }

  if (Array.isArray(data?.content)) {
    return {
      content: data.content as Employee[],
      page: Number(data.page ?? 0),
      size: Number(data.size ?? (data.content as Employee[]).length),
      totalElements: Number(data.totalElements ?? (data.content as Employee[]).length),
      totalPages: Number(data.totalPages ?? 1),
    };
  }

  if (data?.data && typeof data.data === 'object') {
    return toPaginated(data.data);
  }

  return {
    content: [],
    page: 0,
    size: 0,
    totalElements: 0,
    totalPages: 0,
  };
};

export const employeeApi = {
  getAll: async (params?: SearchParams): Promise<ApiResponse<PaginatedResponse<Employee>>> => {
    const response = await apiClient.get('/hr/employees', { params });
    return {
      success: true,
      data: toPaginated(response.data),
      timestamp: new Date().toISOString(),
    };
  },

  getById: async (id: string): Promise<ApiResponse<Employee>> => {
    const response = await apiClient.get(`/hr/employees/${id}`);
    return response.data;
  },

  create: async (data: CreateEmployeeRequest): Promise<ApiResponse<Employee>> => {
    const response = await apiClient.post('/hr/employees', data);
    return response.data;
  },

  update: async (id: string, data: UpdateEmployeeRequest): Promise<ApiResponse<Employee>> => {
    const response = await apiClient.put(`/hr/employees/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/hr/employees/${id}`);
    return response.data;
  },

  search: async (keyword: string, params?: SearchParams): Promise<ApiResponse<PaginatedResponse<Employee>>> => {
    const response = await apiClient.get('/hr/employees/search', {
      params: { keyword, ...params },
    });
    return {
      success: true,
      data: toPaginated(response.data),
      timestamp: new Date().toISOString(),
    };
  },
};
