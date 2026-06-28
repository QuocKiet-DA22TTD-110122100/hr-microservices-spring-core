import apiClient from '@/utils/axios';
import { ApiResponse, PaginatedResponse, SearchParams } from '@/types/common';
import { Employee, CreateEmployeeRequest, UpdateEmployeeRequest } from '@/types/employee';

const EMPLOYEE_LEGACY_PATH = '/hr/employees';

const normalizeEmployee = (employee: Employee | Record<string, unknown>): Employee => {
  const source = employee as Record<string, unknown>;

  return {
    ...(employee as Employee),
    id: Number(source.id ?? source.employee_id ?? 0),
    employeeCode: String(source.employeeCode ?? source.employee_id ?? source.employee_code ?? ''),
    fullName: String(source.fullName ?? source.full_name ?? source.name ?? ''),
    name: String(source.name ?? source.fullName ?? source.full_name ?? ''),
    position: source.position ? String(source.position) : source.role ? String(source.role) : undefined,
    email: source.email ? String(source.email) : undefined,
    departmentName: source.departmentName ? String(source.departmentName) : source.department ? String(source.department) : undefined,
    status: source.status ? String(source.status) : undefined,
    hireDate: source.hireDate ? String(source.hireDate) : source.joined_date ? String(source.joined_date) : undefined,
  };
};

const toPaginated = (payload: unknown): PaginatedResponse<Employee> => {
  const data = payload as Record<string, unknown>;

  if (Array.isArray(payload)) {
    const content = (payload as Array<Employee | Record<string, unknown>>).map(normalizeEmployee);
    return {
      content,
      page: 0,
      size: content.length,
      totalElements: content.length,
      totalPages: 1,
    };
  }

  if (Array.isArray(data?.content)) {
    const content = (data.content as Array<Employee | Record<string, unknown>>).map(normalizeEmployee);
    return {
      content,
      page: Number(data.page ?? 0),
      size: Number(data.size ?? content.length),
      totalElements: Number(data.totalElements ?? content.length),
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
    const response = await apiClient.get(EMPLOYEE_LEGACY_PATH, { params });
    return {
      success: true,
      data: toPaginated(response.data),
      timestamp: new Date().toISOString(),
    };
  },

  getDirectory: async (params?: SearchParams): Promise<ApiResponse<PaginatedResponse<Employee>>> => {
    const response = await apiClient.get(EMPLOYEE_LEGACY_PATH, {
      params: {
        page: params?.page,
        size: params?.size,
        keyword: params?.search ?? params?.keyword,
        department: params?.department,
        status: params?.status,
        sort: params?.sort,
      },
    });
    return {
      success: true,
      data: toPaginated(response.data),
      timestamp: new Date().toISOString(),
    };
  },

  getByDepartmentId: async (departmentId: number, params?: SearchParams): Promise<ApiResponse<PaginatedResponse<Employee>>> => {
    const response = await apiClient.get(EMPLOYEE_LEGACY_PATH, { 
      params: { departmentId, ...params } 
    });
    return {
      success: true,
      data: toPaginated(response.data),
      timestamp: new Date().toISOString(),
    };
  },

  getById: async (id: number): Promise<ApiResponse<Employee>> => {
    const response = await apiClient.get(`${EMPLOYEE_LEGACY_PATH}/${id}`);
    return {
      success: true,
      data: response.data,
      timestamp: new Date().toISOString(),
    };
  },

  create: async (data: CreateEmployeeRequest): Promise<ApiResponse<Employee>> => {
    const response = await apiClient.post(EMPLOYEE_LEGACY_PATH, data);
    return {
      success: true,
      data: response.data,
      timestamp: new Date().toISOString(),
    };
  },

  update: async (id: number, data: UpdateEmployeeRequest): Promise<ApiResponse<Employee>> => {
    const response = await apiClient.put(`${EMPLOYEE_LEGACY_PATH}/${id}`, data);
    return {
      success: true,
      data: response.data,
      timestamp: new Date().toISOString(),
    };
  },

  delete: async (id: number): Promise<ApiResponse<null>> => {
    await apiClient.delete(`${EMPLOYEE_LEGACY_PATH}/${id}`);
    return {
      success: true,
      data: null,
      timestamp: new Date().toISOString(),
    };
  },

  search: async (keyword: string, params?: SearchParams): Promise<ApiResponse<PaginatedResponse<Employee>>> => {
    const response = await apiClient.get(`${EMPLOYEE_LEGACY_PATH}/search`, {
      params: { keyword, ...params },
    });
    return {
      success: true,
      data: toPaginated(response.data),
      timestamp: new Date().toISOString(),
    };
  },
};
