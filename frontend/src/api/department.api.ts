import apiClient from '@/utils/axios';
import { ApiResponse, PaginatedResponse, SearchParams } from '@/types/common';
import { Department, CreateDepartmentRequest, UpdateDepartmentRequest } from '@/types/department';

const toPaginated = (payload: unknown): PaginatedResponse<Department> => {
  const data = payload as Record<string, unknown>;

  if (Array.isArray(payload)) {
    return {
      content: payload as Department[],
      page: 0,
      size: payload.length,
      totalElements: payload.length,
      totalPages: 1,
    };
  }

  if (Array.isArray(data?.content)) {
    return {
      content: data.content as Department[],
      page: Number(data.page ?? 0),
      size: Number(data.size ?? (data.content as Department[]).length),
      totalElements: Number(data.totalElements ?? (data.content as Department[]).length),
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

export const departmentApi = {
  getAll: async (params?: SearchParams): Promise<ApiResponse<PaginatedResponse<Department>>> => {
    const response = await apiClient.get('/hr/departments', { params });
    return {
      success: true,
      data: toPaginated(response.data),
      timestamp: new Date().toISOString(),
    };
  },

  getByOrganizationUnitId: async (organizationUnitId: number, params?: SearchParams): Promise<ApiResponse<PaginatedResponse<Department>>> => {
    const response = await apiClient.get('/hr/departments', { 
      params: { organizationUnitId, ...params } 
    });
    return {
      success: true,
      data: toPaginated(response.data),
      timestamp: new Date().toISOString(),
    };
  },

  getById: async (id: number): Promise<ApiResponse<Department>> => {
    const response = await apiClient.get(`/hr/departments/${id}`);
    return {
      success: true,
      data: response.data,
      timestamp: new Date().toISOString(),
    };
  },

  create: async (data: CreateDepartmentRequest): Promise<ApiResponse<Department>> => {
    const response = await apiClient.post('/hr/departments', data);
    return {
      success: true,
      data: response.data,
      timestamp: new Date().toISOString(),
    };
  },

  update: async (id: number, data: UpdateDepartmentRequest): Promise<ApiResponse<Department>> => {
    const response = await apiClient.put(`/hr/departments/${id}`, data);
    return {
      success: true,
      data: response.data,
      timestamp: new Date().toISOString(),
    };
  },

  delete: async (id: number): Promise<ApiResponse<null>> => {
    await apiClient.delete(`/hr/departments/${id}`);
    return {
      success: true,
      data: null,
      timestamp: new Date().toISOString(),
    };
  },
};
