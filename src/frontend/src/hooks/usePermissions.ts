import { useMemo } from 'react';
import { useAuthStore } from '@/store/authStore';
import {
  getUserPermissions,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  hasRole,
  hasAnyRole,
  isAdmin,
} from '@/utils/permissions';

/**
 * Hook for permission-based access control
 * 
 * @returns Object with permission checking functions and user permissions
 * 
 * @example
 * const { can, canAny, canAll, hasRole, isAdmin } = usePermissions();
 * 
 * if (can('user:create')) {
 *   // Show create user button
 * }
 */
export const usePermissions = () => {
  const { user } = useAuthStore();

  // Compute user's full permission set
  const userPermissions = useMemo(() => {
    if (!user) return [];
    return getUserPermissions(user.roles || [], user.permissions || []);
  }, [user]);

  const userRoles = user?.roles || [];

  return {
    /**
     * Check if user has a specific permission
     * @param permission - Permission string to check
     */
    can: (permission: string): boolean => {
      return hasPermission(userPermissions, permission);
    },

    /**
     * Check if user has any of the specified permissions
     * @param permissions - Array of permissions (user needs at least one)
     */
    canAny: (permissions: string[]): boolean => {
      return hasAnyPermission(userPermissions, permissions);
    },

    /**
     * Check if user has all of the specified permissions
     * @param permissions - Array of permissions (user needs all)
     */
    canAll: (permissions: string[]): boolean => {
      return hasAllPermissions(userPermissions, permissions);
    },

    /**
     * Check if user has a specific role
     * @param role - Role string to check
     */
    hasRole: (role: string): boolean => {
      return hasRole(userRoles, role);
    },

    /**
     * Check if user has any of the specified roles
     * @param roles - Array of roles (user needs at least one)
     */
    hasAnyRole: (roles: string[]): boolean => {
      return hasAnyRole(userRoles, roles);
    },

    /**
     * Check if user is admin
     */
    isAdmin: (): boolean => {
      return isAdmin(userRoles);
    },

    /**
     * Get all user permissions
     */
    permissions: userPermissions,

    /**
     * Get all user roles
     */
    roles: userRoles,

    /**
     * Check if user is authenticated
     */
    isAuthenticated: !!user,
  };
};
