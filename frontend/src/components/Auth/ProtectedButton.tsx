import { ButtonHTMLAttributes } from 'react';
import { Button } from '@/components/UI/Button';
import { usePermissions } from '@/hooks/usePermissions';
import { Shield } from 'lucide-react';

interface ProtectedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
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
   * Behavior when unauthorized
   * - "hide": Don't render button at all
   * - "disable": Render button but disabled with tooltip
   */
  unauthorizedBehavior?: 'hide' | 'disable';

  /**
   * Message to show when button is disabled due to permissions
   */
  unauthorizedMessage?: string;

  /**
   * Button variant
   */
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';

  /**
   * Button is loading
   */
  isLoading?: boolean;

  /**
   * Button children
   */
  children: React.ReactNode;
}

/**
 * Protected Button Component
 * 
 * Button that enforces permission checks
 * 
 * @example
 * <ProtectedButton 
 *   permission="user:create"
 *   onClick={handleCreate}
 * >
 *   Create User
 * </ProtectedButton>
 * 
 * @example
 * <ProtectedButton 
 *   permissions={["user:update", "user:delete"]}
 *   unauthorizedBehavior="disable"
 *   unauthorizedMessage="Bạn không có quyền chỉnh sửa người dùng"
 * >
 *   Edit
 * </ProtectedButton>
 */
export const ProtectedButton = ({
  permission,
  permissions,
  requireAll = false,
  role,
  roles,
  unauthorizedBehavior = 'hide',
  unauthorizedMessage = 'Bạn không có quyền thực hiện thao tác này',
  variant = 'primary',
  isLoading = false,
  disabled = false,
  children,
  ...props
}: ProtectedButtonProps) => {
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

  // Hide button if unauthorized
  if (!hasAccess && unauthorizedBehavior === 'hide') {
    return null;
  }

  // Disable button if unauthorized
  const isDisabled = disabled || !hasAccess;
  const title = !hasAccess ? unauthorizedMessage : props.title;

  return (
    <Button
      {...props}
      variant={variant}
      disabled={isDisabled}
      isLoading={isLoading}
      title={title}
      className={`${props.className || ''} ${!hasAccess ? 'relative' : ''}`}
    >
      {!hasAccess && (
        <Shield size={14} className="mr-1 text-gray-400" aria-hidden="true" />
      )}
      {children}
    </Button>
  );
};
