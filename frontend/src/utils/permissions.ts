/**
 * Permission constants for the application
 */
export const PERMISSIONS = {
  // User Management
  USER_VIEW: 'user:view',
  USER_CREATE: 'user:create',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  USER_LOCK: 'user:lock',
  
  // Role Management
  ROLE_VIEW: 'role:view',
  ROLE_CREATE: 'role:create',
  ROLE_UPDATE: 'role:update',
  ROLE_DELETE: 'role:delete',
  
  // Employee Management
  EMPLOYEE_VIEW: 'employee:view',
  EMPLOYEE_CREATE: 'employee:create',
  EMPLOYEE_UPDATE: 'employee:update',
  EMPLOYEE_DELETE: 'employee:delete',
  
  // Department Management
  DEPARTMENT_VIEW: 'department:view',
  DEPARTMENT_CREATE: 'department:create',
  DEPARTMENT_UPDATE: 'department:update',
  DEPARTMENT_DELETE: 'department:delete',
  
  // Organization Management
  ORGANIZATION_VIEW: 'organization:view',
  ORGANIZATION_CREATE: 'organization:create',
  ORGANIZATION_UPDATE: 'organization:update',
  ORGANIZATION_DELETE: 'organization:delete',

  // Project Management
  PROJECT_VIEW: 'project:view',
  PROJECT_CREATE: 'project:create',
  PROJECT_UPDATE: 'project:update',
  PROJECT_DELETE: 'project:delete',
  PROJECT_MEMBER_MANAGE: 'project:member:manage',

  // Task Management
  TASK_VIEW: 'task:view',
  TASK_CREATE: 'task:create',
  TASK_UPDATE: 'task:update',
  TASK_DELETE: 'task:delete',
  
  // System Admin
  SYSTEM_SETTINGS: 'system:settings',
  SYSTEM_LOGS: 'system:logs',
} as const;

/**
 * Role constants
 */
export const ROLES = {
  ADMIN: 'ADMIN',
  HR_MANAGER: 'HR_MANAGER',
  DEPARTMENT_HEAD: 'DEPARTMENT_HEAD',
  MANAGER: 'MANAGER',
  EMPLOYEE: 'EMPLOYEE',
  USER: 'USER',
} as const;

/**
 * Default role-based permissions
 * Used as fallback when backend doesn't return permissions
 */
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  [ROLES.ADMIN]: [
    // All permissions
    PERMISSIONS.USER_VIEW,
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_UPDATE,
    PERMISSIONS.USER_DELETE,
    PERMISSIONS.USER_LOCK,
    PERMISSIONS.ROLE_VIEW,
    PERMISSIONS.ROLE_CREATE,
    PERMISSIONS.ROLE_UPDATE,
    PERMISSIONS.ROLE_DELETE,
    PERMISSIONS.EMPLOYEE_VIEW,
    PERMISSIONS.EMPLOYEE_CREATE,
    PERMISSIONS.EMPLOYEE_UPDATE,
    PERMISSIONS.EMPLOYEE_DELETE,
    PERMISSIONS.DEPARTMENT_VIEW,
    PERMISSIONS.DEPARTMENT_CREATE,
    PERMISSIONS.DEPARTMENT_UPDATE,
    PERMISSIONS.DEPARTMENT_DELETE,
    PERMISSIONS.ORGANIZATION_VIEW,
    PERMISSIONS.ORGANIZATION_CREATE,
    PERMISSIONS.ORGANIZATION_UPDATE,
    PERMISSIONS.ORGANIZATION_DELETE,
    PERMISSIONS.PROJECT_VIEW,
    PERMISSIONS.PROJECT_CREATE,
    PERMISSIONS.PROJECT_UPDATE,
    PERMISSIONS.PROJECT_DELETE,
    PERMISSIONS.PROJECT_MEMBER_MANAGE,
    PERMISSIONS.TASK_VIEW,
    PERMISSIONS.TASK_CREATE,
    PERMISSIONS.TASK_UPDATE,
    PERMISSIONS.TASK_DELETE,
    PERMISSIONS.SYSTEM_SETTINGS,
    PERMISSIONS.SYSTEM_LOGS,
  ],
  [ROLES.HR_MANAGER]: [
    PERMISSIONS.USER_VIEW,
    PERMISSIONS.EMPLOYEE_VIEW,
    PERMISSIONS.EMPLOYEE_CREATE,
    PERMISSIONS.EMPLOYEE_UPDATE,
    PERMISSIONS.EMPLOYEE_DELETE,
    PERMISSIONS.DEPARTMENT_VIEW,
    PERMISSIONS.DEPARTMENT_CREATE,
    PERMISSIONS.DEPARTMENT_UPDATE,
    PERMISSIONS.ORGANIZATION_VIEW,
    PERMISSIONS.PROJECT_VIEW,
    PERMISSIONS.TASK_VIEW,
  ],
  [ROLES.MANAGER]: [
    PERMISSIONS.EMPLOYEE_VIEW,
    PERMISSIONS.EMPLOYEE_UPDATE,
    PERMISSIONS.DEPARTMENT_VIEW,
    PERMISSIONS.PROJECT_VIEW,
    PERMISSIONS.PROJECT_MEMBER_MANAGE,
    PERMISSIONS.TASK_VIEW,
    PERMISSIONS.TASK_UPDATE,
  ],
  [ROLES.DEPARTMENT_HEAD]: [
    PERMISSIONS.EMPLOYEE_VIEW,
    PERMISSIONS.EMPLOYEE_UPDATE,
    PERMISSIONS.DEPARTMENT_VIEW,
    PERMISSIONS.ORGANIZATION_VIEW,
    PERMISSIONS.PROJECT_VIEW,
    PERMISSIONS.TASK_VIEW,
  ],
  [ROLES.EMPLOYEE]: [
    PERMISSIONS.EMPLOYEE_VIEW,
    PERMISSIONS.DEPARTMENT_VIEW,
    PERMISSIONS.ORGANIZATION_VIEW,
    PERMISSIONS.PROJECT_VIEW,
    PERMISSIONS.TASK_VIEW,
  ],
  [ROLES.USER]: [],
};

/**
 * Get permissions for a user based on their roles
 * @param userRoles - Array of role names
 * @param userPermissions - Array of explicit permissions (from backend)
 * @returns Combined set of permissions
 */
export const getUserPermissions = (
  userRoles: string[] = [],
  userPermissions: string[] = []
): string[] => {
  // Start with explicit permissions from backend
  const permissions = new Set(userPermissions);
  
  // Add role-based permissions
  userRoles.forEach((role) => {
    const rolePerms = ROLE_PERMISSIONS[role] || [];
    rolePerms.forEach((perm) => permissions.add(perm));
  });
  
  return Array.from(permissions);
};

/**
 * Check if user has a specific permission
 * @param userPermissions - User's permission array
 * @param requiredPermission - Required permission to check
 * @returns True if user has the permission
 */
export const hasPermission = (
  userPermissions: string[],
  requiredPermission: string
): boolean => {
  return userPermissions.includes(requiredPermission);
};

/**
 * Check if user has any of the specified permissions
 * @param userPermissions - User's permission array
 * @param requiredPermissions - Array of permissions (user needs at least one)
 * @returns True if user has any of the permissions
 */
export const hasAnyPermission = (
  userPermissions: string[],
  requiredPermissions: string[]
): boolean => {
  return requiredPermissions.some((perm) => userPermissions.includes(perm));
};

/**
 * Check if user has all of the specified permissions
 * @param userPermissions - User's permission array
 * @param requiredPermissions - Array of permissions (user needs all)
 * @returns True if user has all of the permissions
 */
export const hasAllPermissions = (
  userPermissions: string[],
  requiredPermissions: string[]
): boolean => {
  return requiredPermissions.every((perm) => userPermissions.includes(perm));
};

/**
 * Check if user has a specific role
 * @param userRoles - User's role array
 * @param requiredRole - Required role to check
 * @returns True if user has the role
 */
export const hasRole = (userRoles: string[], requiredRole: string): boolean => {
  return userRoles.includes(requiredRole);
};

/**
 * Check if user has any of the specified roles
 * @param userRoles - User's role array
 * @param requiredRoles - Array of roles (user needs at least one)
 * @returns True if user has any of the roles
 */
export const hasAnyRole = (userRoles: string[], requiredRoles: string[]): boolean => {
  return requiredRoles.some((role) => userRoles.includes(role));
};

/**
 * Check if user is admin
 * @param userRoles - User's role array
 * @returns True if user is admin
 */
export const isAdmin = (userRoles: string[]): boolean => {
  return hasRole(userRoles, ROLES.ADMIN);
};
