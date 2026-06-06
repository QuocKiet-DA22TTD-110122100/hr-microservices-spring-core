import { PERMISSIONS } from '@/utils/permissions';

/**
 * Route configuration with permission requirements
 * Used for navigation and access control
 */

export interface RouteConfig {
  path: string;
  name: string;
  icon?: string;
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  role?: string;
  roles?: string[];
  children?: RouteConfig[];
  showInMenu?: boolean;
  group?: string;
}

/**
 * Application routes with permission requirements
 */
export const ROUTES: Record<string, RouteConfig> = {
  // Public routes
  LOGIN: {
    path: '/login',
    name: 'đăng nhập',
    showInMenu: false,
  },
  REGISTER: {
    path: '/register',
    name: 'đăng ký',
    showInMenu: false,
  },
  FORGOT_PASSWORD: {
    path: '/forgot-password',
    name: 'Quên mật khẩu',
    showInMenu: false,
  },
  UNAUTHORIZED: {
    path: '/unauthorized',
    name: 'Truy cập bị từ chối',
    showInMenu: false,
  },

  // Dashboard
  DASHBOARD: {
    path: '/',
    name: 'Trang chủ',
    icon: 'Home',
    showInMenu: true,
    group: 'main',
  },

  // Employee Management
  EMPLOYEES: {
    path: '/employees',
    name: 'Quản lý nhân viên',
    icon: 'Users',
    permission: PERMISSIONS.EMPLOYEE_VIEW,
    showInMenu: true,
    group: 'hr',
  },
  EMPLOYEE_ADD: {
    path: '/employees/add',
    name: 'Thêm nhân viên',
    permission: PERMISSIONS.EMPLOYEE_CREATE,
    showInMenu: false,
  },
  EMPLOYEE_EDIT: {
    path: '/employees/edit/:id',
    name: 'Sửa nhân viên',
    permission: PERMISSIONS.EMPLOYEE_UPDATE,
    showInMenu: false,
  },
  EMPLOYEE_DETAIL: {
    path: '/employees/:id',
    name: 'Chi tiết nhân viên',
    permission: PERMISSIONS.EMPLOYEE_VIEW,
    showInMenu: false,
  },

  // Department Management
  DEPARTMENTS: {
    path: '/departments',
    name: 'Quản lý phòng ban',
    icon: 'Building',
    permission: PERMISSIONS.DEPARTMENT_VIEW,
    showInMenu: true,
    group: 'hr',
  },
  DEPARTMENT_ADD: {
    path: '/departments/add',
    name: 'Thêm phòng ban',
    permission: PERMISSIONS.DEPARTMENT_CREATE,
    showInMenu: false,
  },
  DEPARTMENT_EDIT: {
    path: '/departments/edit/:id',
    name: 'Sửa phòng ban',
    permission: PERMISSIONS.DEPARTMENT_UPDATE,
    showInMenu: false,
  },

  // Organization Management
  ORGANIZATIONS: {
    path: '/organizations',
    name: 'Quản lý tổ chức',
    icon: 'Briefcase',
    permission: PERMISSIONS.ORGANIZATION_VIEW,
    showInMenu: true,
    group: 'hr',
  },
  ORGANIZATION_ADD: {
    path: '/organizations/add',
    name: 'Thêm tổ chức',
    permission: PERMISSIONS.ORGANIZATION_CREATE,
    showInMenu: false,
  },
  ORGANIZATION_EDIT: {
    path: '/organizations/edit/:id',
    name: 'Sửa tổ chức',
    permission: PERMISSIONS.ORGANIZATION_UPDATE,
    showInMenu: false,
  },

  // User Management - Admin only
  USERS: {
    path: '/users',
    name: 'Quản lý người dùng',
    icon: 'UserCog',
    permission: PERMISSIONS.USER_VIEW,
    showInMenu: true,
    group: 'admin',
  },

  // Role Management - Admin only
  ROLES: {
    path: '/roles',
    name: 'Quản lý vai trò',
    icon: 'Shield',
    permission: PERMISSIONS.ROLE_VIEW,
    showInMenu: true,
    group: 'admin',
  },

  // Profile & Settings
  PROFILE: {
    path: '/profile',
    name: 'Hồ sơ cá nhân',
    icon: 'User',
    showInMenu: true,
    group: 'user',
  },
  CHANGE_PASSWORD: {
    path: '/change-password',
    name: 'Đổi mật khẩu',
    icon: 'Key',
    showInMenu: true,
    group: 'user',
  },
};

/**
 * Get routes grouped by category
 */
export const getGroupedRoutes = (): Record<string, RouteConfig[]> => {
  const grouped: Record<string, RouteConfig[]> = {
    main: [],
    hr: [],
    admin: [],
    user: [],
  };

  Object.values(ROUTES).forEach((route) => {
    if (route.showInMenu && route.group) {
      grouped[route.group].push(route);
    }
  });

  return grouped;
};

/**
 * Get menu items that user has permission to access
 */
export const getAccessibleRoutes = (userPermissions: string[]): RouteConfig[] => {
  return Object.values(ROUTES).filter((route) => {
    if (!route.showInMenu) return false;
    
    // No permission required - accessible to all authenticated users
    if (!route.permission && !route.permissions && !route.role && !route.roles) {
      return true;
    }

    // Check single permission
    if (route.permission && !userPermissions.includes(route.permission)) {
      return false;
    }

    // Check multiple permissions
    if (route.permissions) {
      if (route.requireAll) {
        // User must have all permissions
        return route.permissions.every((perm) => userPermissions.includes(perm));
      } else {
        // User must have at least one permission
        return route.permissions.some((perm) => userPermissions.includes(perm));
      }
    }

    return true;
  });
};

/**
 * Check if user can access a specific route
 */
export const canAccessRoute = (
  routePath: string,
  userPermissions: string[]
): boolean => {
  const route = Object.values(ROUTES).find((r) => r.path === routePath);
  if (!route) return false;

  // No permission required
  if (!route.permission && !route.permissions) return true;

  // Check single permission
  if (route.permission) {
    return userPermissions.includes(route.permission);
  }

  // Check multiple permissions
  if (route.permissions) {
    if (route.requireAll) {
      return route.permissions.every((perm) => userPermissions.includes(perm));
    } else {
      return route.permissions.some((perm) => userPermissions.includes(perm));
    }
  }

  return true;
};

/**
 * Route groups for menu organization
 */
export const ROUTE_GROUPS = {
  main: {
    name: 'Trang chính',
    order: 1,
  },
  hr: {
    name: 'Quản lý nhân sự',
    order: 2,
  },
  admin: {
    name: 'Quản trị hệ thống',
    order: 3,
  },
  user: {
    name: 'Tài khoản',
    order: 4,
  },
} as const;
