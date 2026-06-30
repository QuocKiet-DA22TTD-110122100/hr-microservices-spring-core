import apiClient from '@/utils/axios';
import { RoleApiResult } from '@/types/common';

// ============================================================================
// Role and Permission Types
// ============================================================================

export type RolePermission =
  | 'ALL'
  | 'READ_EMPLOYEE'
  | 'WRITE_EMPLOYEE'
  | 'DELETE_EMPLOYEE'
  | 'READ_DEPARTMENT'
  | 'WRITE_DEPARTMENT'
  | 'DELETE_DEPARTMENT'
  | 'READ_ORGANIZATION'
  | 'WRITE_ORGANIZATION'
  | 'DELETE_ORGANIZATION'
  | 'READ_PROJECT'
  | 'WRITE_PROJECT'
  | 'DELETE_PROJECT'
  | 'READ_TASK'
  | 'WRITE_TASK'
  | 'DELETE_TASK'
  | 'READ_PAYROLL'
  | 'WRITE_PAYROLL'
  | 'READ_ROLE'
  | 'WRITE_ROLE'
  | 'DELETE_ROLE'
  | 'READ_USER'
  | 'WRITE_USER'
  | 'DELETE_USER';

export const KNOWN_ROLE_PERMISSIONS: readonly RolePermission[] = [
  'ALL',
  'READ_EMPLOYEE',
  'WRITE_EMPLOYEE',
  'DELETE_EMPLOYEE',
  'READ_DEPARTMENT',
  'WRITE_DEPARTMENT',
  'DELETE_DEPARTMENT',
  'READ_ORGANIZATION',
  'WRITE_ORGANIZATION',
  'DELETE_ORGANIZATION',
  'READ_PROJECT',
  'WRITE_PROJECT',
  'DELETE_PROJECT',
  'READ_TASK',
  'WRITE_TASK',
  'DELETE_TASK',
  'READ_PAYROLL',
  'WRITE_PAYROLL',
  'READ_ROLE',
  'WRITE_ROLE',
  'DELETE_ROLE',
  'READ_USER',
  'WRITE_USER',
  'DELETE_USER',
];

export interface RoleDefinition {
  id: string;
  name: string;
  description: string;
  permissions: RolePermission[];
  userCount: number;
}

export interface RoleRequest {
  name: string;
  description: string;
  permissions: RolePermission[];
}

interface RoleDto {
  name: string;
  description: string;
  permissions: unknown;
  userCount: number;
}

export class RoleApiError extends Error {
  code: string;
  details?: Record<string, string[]>;
  statusCode?: number;

  constructor(
    message: string,
    code: string = 'ROLE_API_ERROR',
    details?: Record<string, string[]>,
    statusCode?: number,
  ) {
    super(message);
    this.code = code;
    this.details = details;
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, RoleApiError.prototype);
  }
}

// ============================================================================
// Role API Configuration
// ============================================================================

const ROLE_API_CONFIG = {
  REQUEST_TIMEOUT_MS: 15000,
  RETRYABLE_STATUS_CODES: [408, 429, 500, 502, 503, 504] as const,
};

// ============================================================================
// Normalization Helpers
// ============================================================================

export function isRolePermission(value: unknown): value is RolePermission {
  return typeof value === 'string' && KNOWN_ROLE_PERMISSIONS.includes(value as RolePermission);
}

export function normalizeRolePermission(value: unknown): RolePermission {
  if (isRolePermission(value)) return value;
  throw new RoleApiError(`Invalid role permission value: ${String(value)}`, 'INVALID_PERMISSION');
}

export function normalizeRoleId(name: string): string {
  return name.trim().toUpperCase().replace(/\s+/g, '_');
}

export function normalizeRoleDto(value: unknown): RoleDefinition {
  if (!value || typeof value !== 'object') {
    throw new RoleApiError('Invalid role object received from server', 'INVALID_ROLE_PAYLOAD');
  }

  const role = value as Record<string, unknown>;
  const name = typeof role.name === 'string' ? role.name.trim() : '';
  const description = typeof role.description === 'string' ? role.description.trim() : '';
  const permissionsValue = role.permissions;

  if (!name) {
    throw new RoleApiError('Role name is missing or invalid', 'MISSING_ROLE_NAME');
  }

  if (!description) {
    throw new RoleApiError('Role description is missing or invalid', 'MISSING_ROLE_DESCRIPTION');
  }

  if (typeof role.userCount !== 'number' || !Number.isFinite(role.userCount)) {
    throw new RoleApiError('Role userCount is missing or invalid', 'INVALID_ROLE_USER_COUNT');
  }

  const userCount = role.userCount;

  if (!Array.isArray(permissionsValue)) {
    throw new RoleApiError('Role permissions must be an array', 'INVALID_ROLE_PERMISSIONS');
  }

  const permissions = permissionsValue.map((permission) => normalizeRolePermission(permission));

  return {
    id: normalizeRoleId(name),
    name,
    description,
    permissions,
    userCount,
  };
}

export function normalizeRoleList(value: unknown): RoleDefinition[] {
  if (!Array.isArray(value)) {
    throw new RoleApiError('Expected an array of roles from server', 'INVALID_ROLE_LIST');
  }

  return value.map((item, index) => {
    try {
      return normalizeRoleDto(item);
    } catch (error) {
      if (error instanceof RoleApiError) {
        throw new RoleApiError(`Error normalizing role at index ${index}: ${error.message}`, error.code, error.details);
      }
      throw error;
    }
  });
}

export function extractStatusCode(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null) return undefined;
  const axiosError = error as Record<string, unknown>;
  const response = axiosError.response;
  if (response && typeof response === 'object') {
    const status = (response as Record<string, unknown>).status;
    return typeof status === 'number' ? status : undefined;
  }
  return undefined;
}

export function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null) {
    const axiosError = error as Record<string, unknown>;
    const response = axiosError.response;
    if (response && typeof response === 'object') {
      const data = (response as Record<string, unknown>).data;
      if (data && typeof data === 'object' && typeof (data as Record<string, unknown>).message === 'string') {
        return (data as Record<string, unknown>).message as string;
      }
    }
    if (typeof axiosError.message === 'string') return axiosError.message;
  }
  return 'Không thể tải dữ liệu vai trò.';
}

// ============================================================================
// Role API Client
// ============================================================================

export const FALLBACK_ROLES: RoleDefinition[] = [
  {
    id: 'ADMIN',
    name: 'Admin',
    description: 'System administrator',
    permissions: ['ALL'],
    userCount: 3,
  },
  {
    id: 'HR_MANAGER',
    name: 'HR Manager',
    description: 'Human resources manager',
    permissions: [
      'READ_EMPLOYEE',
      'WRITE_EMPLOYEE',
      'READ_DEPARTMENT',
      'WRITE_DEPARTMENT',
      'READ_USER',
      'WRITE_USER',
      'READ_ROLE',
    ],
    userCount: 5,
  },
  {
    id: 'USER',
    name: 'User',
    description: 'Standard user',
    permissions: ['READ_EMPLOYEE', 'READ_DEPARTMENT', 'READ_PROJECT', 'READ_TASK'],
    userCount: 124,
  },
];

export const roleApi = {
  getAll: async (): Promise<RoleApiResult<RoleDefinition[]>> => {
    try {
      const response = await apiClient.get<RoleDto[]>('/xac-thuc/quan-tri/vai-tro', {
        timeout: ROLE_API_CONFIG.REQUEST_TIMEOUT_MS,
      });

      const normalizedData = normalizeRoleList(response.data);

      return {
        success: true,
        data: normalizedData,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const message = extractErrorMessage(error);
      console.warn('Falling back to sample roles:', message);

      return {
        success: true,
        data: FALLBACK_ROLES,
        message,
        timestamp: new Date().toISOString(),
        _fallback: true,
        _fallbackReason: message,
      };
    }
  },

  getAvailableRoleNames: async (): Promise<string[]> => {
    const response = await roleApi.getAll();
    return response.data.map((role) => role.name);
  },

  create: async (payload: RoleRequest): Promise<RoleDefinition> => {
    const response = await apiClient.post<RoleDto>('/xac-thuc/quan-tri/vai-tro', payload, {
      timeout: ROLE_API_CONFIG.REQUEST_TIMEOUT_MS,
    });
    return normalizeRoleDto(response.data);
  },

  update: async (roleName: string, payload: Pick<RoleRequest, 'description' | 'permissions'>): Promise<RoleDefinition> => {
    const response = await apiClient.put<RoleDto>(`/xac-thuc/quan-tri/vai-tro/${encodeURIComponent(roleName)}`, payload, {
      timeout: ROLE_API_CONFIG.REQUEST_TIMEOUT_MS,
    });
    return normalizeRoleDto(response.data);
  },

  remove: async (roleName: string): Promise<void> => {
    await apiClient.delete(`/xac-thuc/quan-tri/vai-tro/${encodeURIComponent(roleName)}`, {
      timeout: ROLE_API_CONFIG.REQUEST_TIMEOUT_MS,
    });
  },
};

export type { RoleApiResult } from '@/types/common';

