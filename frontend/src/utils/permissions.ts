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

  // Payroll Management
  PAYROLL_VIEW: 'payroll:view',
  PAYROLL_MANAGE: 'payroll:manage',
  
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
  PAYROLL_OFFICER: 'PAYROLL_OFFICER',
  EMPLOYEE: 'EMPLOYEE',
  USER: 'USER',
} as const;

const BACKEND_PERMISSION_ALIASES: Record<string, string> = {
  READ_USER: PERMISSIONS.USER_VIEW,
  WRITE_USER: PERMISSIONS.USER_UPDATE,
  DELETE_USER: PERMISSIONS.USER_DELETE,
  READ_ROLE: PERMISSIONS.ROLE_VIEW,
  WRITE_ROLE: PERMISSIONS.ROLE_UPDATE,
  DELETE_ROLE: PERMISSIONS.ROLE_DELETE,
  READ_EMPLOYEE: PERMISSIONS.EMPLOYEE_VIEW,
  WRITE_EMPLOYEE: PERMISSIONS.EMPLOYEE_UPDATE,
  DELETE_EMPLOYEE: PERMISSIONS.EMPLOYEE_DELETE,
  'HR.READ': PERMISSIONS.EMPLOYEE_VIEW,
  'HR.WRITE': PERMISSIONS.EMPLOYEE_UPDATE,
  READ_DEPARTMENT: PERMISSIONS.DEPARTMENT_VIEW,
  WRITE_DEPARTMENT: PERMISSIONS.DEPARTMENT_UPDATE,
  DELETE_DEPARTMENT: PERMISSIONS.DEPARTMENT_DELETE,
  READ_ORGANIZATION: PERMISSIONS.ORGANIZATION_VIEW,
  WRITE_ORGANIZATION: PERMISSIONS.ORGANIZATION_UPDATE,
  DELETE_ORGANIZATION: PERMISSIONS.ORGANIZATION_DELETE,
  READ_PROJECT: PERMISSIONS.PROJECT_VIEW,
  WRITE_PROJECT: PERMISSIONS.PROJECT_UPDATE,
  DELETE_PROJECT: PERMISSIONS.PROJECT_DELETE,
  READ_TASK: PERMISSIONS.TASK_VIEW,
  WRITE_TASK: PERMISSIONS.TASK_UPDATE,
  DELETE_TASK: PERMISSIONS.TASK_DELETE,
  READ_PAYROLL: PERMISSIONS.PAYROLL_VIEW,
  WRITE_PAYROLL: PERMISSIONS.PAYROLL_MANAGE,
  'PAYROLL.READ': PERMISSIONS.PAYROLL_VIEW,
  'PAYROLL.WRITE': PERMISSIONS.PAYROLL_MANAGE,
  ALL: '*',
};

const normalizeRoleName = (role: string): string => role.trim().toUpperCase();

export const normalizePermission = (permission: string): string => {
  const normalized = permission.trim();
  if (!normalized) return normalized;

  const backendPermission = BACKEND_PERMISSION_ALIASES[normalized.toUpperCase()];
  return backendPermission ?? normalized;
};

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
    PERMISSIONS.PAYROLL_VIEW,
    PERMISSIONS.PAYROLL_MANAGE,
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
    PERMISSIONS.PAYROLL_VIEW,
  ],
  [ROLES.PAYROLL_OFFICER]: [
    PERMISSIONS.EMPLOYEE_VIEW,
    PERMISSIONS.PAYROLL_VIEW,
    PERMISSIONS.PAYROLL_MANAGE,
  ],
  [ROLES.MANAGER]: [
    PERMISSIONS.EMPLOYEE_VIEW,
    PERMISSIONS.DEPARTMENT_VIEW,
    PERMISSIONS.PROJECT_VIEW,
    PERMISSIONS.PROJECT_CREATE,
    PERMISSIONS.PROJECT_UPDATE,
    PERMISSIONS.PROJECT_MEMBER_MANAGE,
    PERMISSIONS.TASK_VIEW,
    PERMISSIONS.TASK_CREATE,
    PERMISSIONS.TASK_UPDATE,
  ],
  [ROLES.DEPARTMENT_HEAD]: [
    PERMISSIONS.EMPLOYEE_VIEW,
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
  const normalizedRoles = userRoles.map(normalizeRoleName);
  const normalizedExplicitPermissions = userPermissions.map(normalizePermission).filter(Boolean);
  const permissions = new Set(normalizedExplicitPermissions);

  if (permissions.has('*')) {
    return ROLE_PERMISSIONS[ROLES.ADMIN];
  }
  
  // Add role-based permissions
  normalizedRoles.forEach((role) => {
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
  const normalizedRequiredRole = normalizeRoleName(requiredRole);
  return userRoles.map(normalizeRoleName).includes(normalizedRequiredRole);
};

/**
 * Check if user has any of the specified roles
 * @param userRoles - User's role array
 * @param requiredRoles - Array of roles (user needs at least one)
 * @returns True if user has any of the roles
 */
export const hasAnyRole = (userRoles: string[], requiredRoles: string[]): boolean => {
  const normalizedUserRoles = userRoles.map(normalizeRoleName);
  return requiredRoles.some((role) => normalizedUserRoles.includes(normalizeRoleName(role)));
};

/**
 * Check if user is admin
 * @param userRoles - User's role array
 * @returns True if user is admin
 */
export const isAdmin = (userRoles: string[]): boolean => {
  return hasRole(userRoles, ROLES.ADMIN);
};
