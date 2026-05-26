import { ReactNode } from 'react';
import { usePermission } from '@/hooks/usePermission';

interface PermissionGateProps {
  /** Action cần kiểm tra, ví dụ 'hr:write' */
  action?: string;
  /** Roles được phép, ví dụ ['HR_ADMIN', 'SUPER_ADMIN'] */
  roles?: string[];
  children: ReactNode;
  /** Render khi không có quyền, mặc định null */
  fallback?: ReactNode;
}

/**
 * Ẩn/hiện children theo permission hoặc role.
 *
 * @example
 * // Theo action
 * <PermissionGate action="hr:write">
 *   <button>Tạo nhân viên</button>
 * </PermissionGate>
 *
 * // Theo role
 * <PermissionGate roles={['HR_ADMIN', 'SUPER_ADMIN']}>
 *   <AdminPanel />
 * </PermissionGate>
 */
export function PermissionGate({ action, roles, children, fallback = null }: PermissionGateProps) {
  const { can, hasRole } = usePermission();

  const allowed =
    (action !== undefined ? can(action) : true) &&
    (roles !== undefined ? hasRole(...roles) : true);

  return allowed ? <>{children}</> : <>{fallback}</>;
}
