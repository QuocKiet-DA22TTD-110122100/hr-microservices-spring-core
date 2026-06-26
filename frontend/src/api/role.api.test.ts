import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  FALLBACK_ROLES,
  RoleApiError,
  extractErrorMessage,
  extractStatusCode,
  isRolePermission,
  normalizeRoleDto,
  normalizeRoleId,
  normalizeRoleList,
  normalizeRolePermission,
  roleApi,
} from './role.api';

const apiClientMock = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  del: vi.fn(),
}));

vi.mock('@/utils/axios', () => ({
  default: {
    get: apiClientMock.get,
    post: apiClientMock.post,
    put: apiClientMock.put,
    delete: apiClientMock.del,
  },
}));

const { get } = apiClientMock;

describe('role.api helpers', () => {
  it('recognizes and normalizes role permissions', () => {
    expect(isRolePermission('ALL')).toBe(true);
    expect(isRolePermission('NOT_A_PERMISSION')).toBe(false);
    expect(normalizeRolePermission('READ_USER')).toBe('READ_USER');
    expect(normalizeRoleId(' hr manager ')).toBe('HR_MANAGER');
  });

  it('normalizes role payloads and lists', () => {
    const role = normalizeRoleDto({
      name: 'Admin',
      description: 'System admin',
      permissions: ['ALL'],
      userCount: 3,
    });

    expect(role).toMatchObject({
      id: 'ADMIN',
      name: 'Admin',
      description: 'System admin',
      permissions: ['ALL'],
      userCount: 3,
    });

    expect(normalizeRoleList([role])).toEqual([role]);
  });

  it('throws role api errors for invalid role payloads', () => {
    expect(() => normalizeRoleDto(null)).toThrow(RoleApiError);
    expect(() => normalizeRoleList([{ name: 'broken' }])).toThrow('Error normalizing role at index 0');
  });

  it('extracts role api error metadata', () => {
    const error = {
      message: 'failed',
      response: {
        status: 500,
        data: { message: 'server exploded' },
      },
    };

    expect(extractStatusCode(error)).toBe(500);
    expect(extractErrorMessage(error)).toBe('server exploded');
  });
});

describe('role.api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches and normalizes roles', async () => {
    get.mockResolvedValueOnce({
      data: [
        {
          name: 'Admin',
          description: 'System admin',
          permissions: ['ALL'],
          userCount: 2,
        },
      ],
    });

    const result = await roleApi.getAll();

    expect(result.success).toBe(true);
    expect(result.data[0]).toMatchObject({
      id: 'ADMIN',
      name: 'Admin',
      description: 'System admin',
      permissions: ['ALL'],
      userCount: 2,
    });
  });

  it('falls back to sample roles when the api fails', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    get.mockRejectedValueOnce({
      response: { status: 503, data: { message: 'service unavailable' } },
    });

    const result = await roleApi.getAll();

    expect(result.success).toBe(true);
    expect(result._fallback).toBe(true);
    expect(result.data).toHaveLength(FALLBACK_ROLES.length);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('returns role names from the list endpoint', async () => {
    get.mockResolvedValueOnce({
      data: [
        {
          name: 'Admin',
          description: 'System admin',
          permissions: ['ALL'],
          userCount: 1,
        },
      ],
    });

    await expect(roleApi.getAvailableRoleNames()).resolves.toEqual(['Admin']);
  });
});
