import { describe, it, expect } from 'vitest';
import {
  PERMISSIONS,
  ROLES,
  ROLE_PERMISSIONS,
  getUserPermissions,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  hasRole,
  hasAnyRole,
  isAdmin,
} from './permissions';

describe('permissions utility', () => {
  describe('getUserPermissions', () => {
    it('should return permissions from roles', () => {
      const permissions = getUserPermissions(['ADMIN'], []);
      expect(permissions).toContain(PERMISSIONS.USER_CREATE);
      expect(permissions).toContain(PERMISSIONS.USER_DELETE);
      expect(permissions.length).toBeGreaterThan(0);
    });

    it('should combine role permissions with explicit permissions', () => {
      const permissions = getUserPermissions(['USER'], ['custom:permission']);
      expect(permissions).toContain('custom:permission');
      expect(permissions).toContain(PERMISSIONS.EMPLOYEE_VIEW);
    });

    it('should handle empty arrays', () => {
      const permissions = getUserPermissions([], []);
      expect(permissions).toEqual([]);
    });

    it('should not duplicate permissions', () => {
      const permissions = getUserPermissions(['ADMIN'], [PERMISSIONS.USER_VIEW]);
      const uniquePerms = new Set(permissions);
      expect(permissions.length).toBe(uniquePerms.size);
    });
  });

  describe('hasPermission', () => {
    it('should return true if user has permission', () => {
      const userPerms = [PERMISSIONS.USER_CREATE, PERMISSIONS.USER_VIEW];
      expect(hasPermission(userPerms, PERMISSIONS.USER_CREATE)).toBe(true);
    });

    it('should return false if user does not have permission', () => {
      const userPerms = [PERMISSIONS.USER_VIEW];
      expect(hasPermission(userPerms, PERMISSIONS.USER_DELETE)).toBe(false);
    });
  });

  describe('hasAnyPermission', () => {
    it('should return true if user has any of the permissions', () => {
      const userPerms = [PERMISSIONS.USER_VIEW, PERMISSIONS.EMPLOYEE_VIEW];
      expect(
        hasAnyPermission(userPerms, [PERMISSIONS.USER_DELETE, PERMISSIONS.USER_VIEW])
      ).toBe(true);
    });

    it('should return false if user has none of the permissions', () => {
      const userPerms = [PERMISSIONS.USER_VIEW];
      expect(
        hasAnyPermission(userPerms, [PERMISSIONS.USER_DELETE, PERMISSIONS.USER_CREATE])
      ).toBe(false);
    });
  });

  describe('hasAllPermissions', () => {
    it('should return true if user has all permissions', () => {
      const userPerms = [PERMISSIONS.USER_VIEW, PERMISSIONS.USER_CREATE, PERMISSIONS.USER_UPDATE];
      expect(
        hasAllPermissions(userPerms, [PERMISSIONS.USER_VIEW, PERMISSIONS.USER_CREATE])
      ).toBe(true);
    });

    it('should return false if user is missing any permission', () => {
      const userPerms = [PERMISSIONS.USER_VIEW];
      expect(
        hasAllPermissions(userPerms, [PERMISSIONS.USER_VIEW, PERMISSIONS.USER_CREATE])
      ).toBe(false);
    });
  });

  describe('hasRole', () => {
    it('should return true if user has role', () => {
      const userRoles = [ROLES.ADMIN, ROLES.USER];
      expect(hasRole(userRoles, ROLES.ADMIN)).toBe(true);
    });

    it('should return false if user does not have role', () => {
      const userRoles = [ROLES.USER];
      expect(hasRole(userRoles, ROLES.ADMIN)).toBe(false);
    });
  });

  describe('hasAnyRole', () => {
    it('should return true if user has any role', () => {
      const userRoles = [ROLES.USER];
      expect(hasAnyRole(userRoles, [ROLES.ADMIN, ROLES.USER])).toBe(true);
    });

    it('should return false if user has none of the roles', () => {
      const userRoles = [ROLES.USER];
      expect(hasAnyRole(userRoles, [ROLES.ADMIN, ROLES.HR_MANAGER])).toBe(false);
    });
  });

  describe('isAdmin', () => {
    it('should return true for admin users', () => {
      const userRoles = [ROLES.ADMIN];
      expect(isAdmin(userRoles)).toBe(true);
    });

    it('should return false for non-admin users', () => {
      const userRoles = [ROLES.USER, ROLES.MANAGER];
      expect(isAdmin(userRoles)).toBe(false);
    });
  });

  describe('ROLE_PERMISSIONS', () => {
    it('should have permissions for all roles', () => {
      expect(ROLE_PERMISSIONS[ROLES.ADMIN]).toBeDefined();
      expect(ROLE_PERMISSIONS[ROLES.HR_MANAGER]).toBeDefined();
      expect(ROLE_PERMISSIONS[ROLES.MANAGER]).toBeDefined();
      expect(ROLE_PERMISSIONS[ROLES.USER]).toBeDefined();
    });

    it('ADMIN should have all permissions', () => {
      const adminPerms = ROLE_PERMISSIONS[ROLES.ADMIN];
      expect(adminPerms).toContain(PERMISSIONS.USER_DELETE);
      expect(adminPerms).toContain(PERMISSIONS.SYSTEM_SETTINGS);
      expect(adminPerms.length).toBeGreaterThan(10);
    });

    it('USER should have limited permissions', () => {
      const userPerms = ROLE_PERMISSIONS[ROLES.USER];
      expect(userPerms).toContain(PERMISSIONS.EMPLOYEE_VIEW);
      expect(userPerms).not.toContain(PERMISSIONS.USER_DELETE);
      expect(userPerms).not.toContain(PERMISSIONS.SYSTEM_SETTINGS);
    });

    it('HR_MANAGER should have HR-related permissions', () => {
      const hrPerms = ROLE_PERMISSIONS[ROLES.HR_MANAGER];
      expect(hrPerms).toContain(PERMISSIONS.EMPLOYEE_CREATE);
      expect(hrPerms).toContain(PERMISSIONS.EMPLOYEE_UPDATE);
      expect(hrPerms).toContain(PERMISSIONS.EMPLOYEE_DELETE);
      expect(hrPerms).not.toContain(PERMISSIONS.SYSTEM_SETTINGS);
    });
  });
});
