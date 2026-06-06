import { ReactNode } from 'react';
import { usePermissions } from '@/hooks/usePermissions';

interface PermissionGateProps {
  /**
   * Single permission required
   */
  permission?: string;

  /**
   * Array of permissions - user needs at least one
   */
  permissions?: string[];

  /**
   * Require all specified permissions
   */
  requireAll?: boolean;

  /**
   * Single role required
   */
  role?: string;

  /**
   * Array of roles - user needs at least one
   */
  roles?: string[];

  /**
   * Content to render if user has permission
   */
  children: ReactNode;

  /**
   * Optional fallback content if user doesn't have permission
   */
  fallback?: ReactNode;

  /**
   * If true, render nothing instead of fallback when unauthorized
   */
  hideOnUnauthorized?: boolean;
}

/**
 * Permission Gate Component
 * 
 * Conditionally renders children based on user permissions or roles
 * 
 * @example
 * // Single permission check
 * <PermissionGate permission="user:create">
 *   <Button>Create User</Button>
 * </PermissionGate>
 * 
 * @example
 * // Multiple permissions (any)
 * <PermissionGate permissions={["user:update", "user:delete"]}>
 *   <Button>Edit User</Button>
 * </PermissionGate>
 * 
 * @example
 * // Multiple permissions (all required)
 * <PermissionGate permissions={["user:update", "user:lock"]} requireAll>
 *   <Button>Lock User</Button>
 * </PermissionGate>
 * 
 * @example
 * // Role-based check
 * <PermissionGate role="ADMIN">
 *   <AdminPanel />
 * </PermissionGate>
 * 
 * @example
 * // With fallback
 * <PermissionGate 
 *   permission="user:delete"
 *   fallback={<Button disabled>Delete (No Permission)</Button>}
 * >
 *   <Button>Delete</Button>
 * </PermissionGate>
 */
export const PermissionGate = ({
  permission,
  permissions,
  requireAll = false,
  role,
  roles,
  children,
  fallback = null,
  hideOnUnauthorized = true,
}: PermissionGateProps) => {
  const { can, canAny, canAll, hasRole, hasAnyRole } = usePermissions();

  let hasAccess = true;

  // Check single permission
  if (permission) {
    hasAccess = hasAccess && can(permission);
  }

  // Check multiple permissions
  if (permissions && permissions.length > 0) {
    if (requireAll) {
      hasAccess = hasAccess && canAll(permissions);
    } else {
      hasAccess = hasAccess && canAny(permissions);
    }
  }

  // Check single role
  if (role) {
    hasAccess = hasAccess && hasRole(role);
  }

  // Check multiple roles
  if (roles && roles.length > 0) {
    hasAccess = hasAccess && hasAnyRole(roles);
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  if (hideOnUnauthorized) {
    return null;
  }

  return <>{fallback}</>;
};
