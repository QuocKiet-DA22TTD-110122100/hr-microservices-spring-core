import { useAuthStore } from '@/store/authStore';

// Mapping global role → permissions
const ROLE_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: ['*'],
  HR_ADMIN: ['hr:read', 'hr:write', 'employee:read', 'employee:write', 'org:read', 'org:write', 'user:read', 'user:write', 'role:read', 'role:write'],
  HR_MANAGER: ['hr:read', 'hr:write', 'employee:read', 'employee:write', 'org:read'],
  EMPLOYEE: ['hr:read', 'employee:read', 'org:read'],
};

export function usePermission() {
  const user = useAuthStore((s) => s.user);
  const roles: string[] = user?.roles ?? [];
  const permissions: string[] = user?.permissions ?? [];

  /** Kiểm tra permission theo action string, ví dụ 'hr:write' */
  function can(action: string): boolean {
    if (!user) return false;

    // SUPER_ADMIN bypass tất cả
    if (roles.includes('SUPER_ADMIN')) return true;

    // Kiểm tra permissions trực tiếp từ token
    if (permissions.includes(action)) return true;

    // Fallback: kiểm tra qua role mapping
    return roles.some((role) => {
      const perms = ROLE_PERMISSIONS[role] ?? [];
      return perms.includes('*') || perms.includes(action);
    });
  }

  /** Kiểm tra user có ít nhất một trong các roles */
  function hasRole(...requiredRoles: string[]): boolean {
    return requiredRoles.some((r) => roles.includes(r));
  }

  return { can, hasRole, user, roles, permissions };
}
