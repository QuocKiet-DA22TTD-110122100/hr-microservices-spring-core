import apiClient from '@/utils/axios';
import { ApiResponse } from '@/types/common';
import { OrganizationUnit, CreateOrganizationUnitRequest, UpdateOrganizationUnitRequest, OrganizationUnitTreeNode } from '@/types/organization';

export const organizationApi = {
  getAll: async (): Promise<ApiResponse<OrganizationUnit[]>> => {
    const response = await apiClient.get('/hr/organization-units');
    return {
      success: true,
      data: response.data,
      timestamp: new Date().toISOString(),
    };
  },

  getTree: async (): Promise<ApiResponse<OrganizationUnitTreeNode[]>> => {
    const response = await apiClient.get('/hr/organization-units/tree');
    return {
      success: true,
      data: response.data,
      timestamp: new Date().toISOString(),
    };
  },

  getById: async (id: number): Promise<ApiResponse<OrganizationUnit>> => {
    const response = await apiClient.get(`/hr/organization-units/${id}`);
    return {
      success: true,
      data: response.data,
      timestamp: new Date().toISOString(),
    };
  },

  create: async (data: CreateOrganizationUnitRequest): Promise<ApiResponse<OrganizationUnit>> => {
    const response = await apiClient.post('/hr/organization-units', data);
    return {
      success: true,
      data: response.data,
      timestamp: new Date().toISOString(),
    };
  },

  update: async (id: number, data: UpdateOrganizationUnitRequest): Promise<ApiResponse<OrganizationUnit>> => {
    const response = await apiClient.put(`/hr/organization-units/${id}`, data);
    return {
      success: true,
      data: response.data,
      timestamp: new Date().toISOString(),
    };
  },

  delete: async (id: number): Promise<ApiResponse<null>> => {
    await apiClient.delete(`/hr/organization-units/${id}`);
    return {
      success: true,
      data: null,
      timestamp: new Date().toISOString(),
    };
  },
};
