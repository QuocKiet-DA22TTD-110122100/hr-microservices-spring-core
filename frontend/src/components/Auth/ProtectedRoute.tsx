import { ReactNode, useEffect } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Home, Shield } from 'lucide-react';
import { Button } from '@/components/UI/Button';
import { Card } from '@/components/UI/Card';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';

interface ProtectedRouteProps {
  children: ReactNode;
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  role?: string;
  roles?: string[];
  redirectTo?: string;
  showNotification?: boolean;
}

export const ProtectedRoute = ({
  children,
  permission,
  permissions,
  requireAll = false,
  role,
  roles,
  redirectTo = '/unauthorized',
  showNotification = true,
}: ProtectedRouteProps) => {
  const { isAuthenticated } = useAuthStore();
  const { can, canAny, canAll, hasRole, hasAnyRole } = usePermissions();
  const { addNotification } = useUIStore();
  const location = useLocation();

  let hasAccess = isAuthenticated;

  if (hasAccess && permission) {
    hasAccess = can(permission);
  }

  if (hasAccess && permissions && permissions.length > 0) {
    hasAccess = requireAll ? canAll(permissions) : canAny(permissions);
  }

  if (hasAccess && role) {
    hasAccess = hasRole(role);
  }

  if (hasAccess && roles && roles.length > 0) {
    hasAccess = hasAnyRole(roles);
  }

  useEffect(() => {
    if (isAuthenticated && !hasAccess && showNotification) {
      addNotification({
        type: 'error',
        message: 'Bạn không có quyền truy cập trang này.',
        duration: 5000,
      });
    }
  }, [addNotification, hasAccess, isAuthenticated, showNotification]);

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!hasAccess) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export const UnauthorizedPage = () => {
  const location = useLocation();
  const fromPath = (location.state as { from?: Location })?.from?.pathname;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <Card className="relative w-full max-w-md overflow-hidden p-8 text-center shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-rose-500 via-amber-300 to-transparent" />
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl border border-rose-100 bg-rose-50">
          <Shield size={40} className="text-rose-600" />
        </div>

        <h1 className="text-2xl font-semibold tracking-[-0.02em] text-slate-950">Truy cập bị từ chối</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Tài khoản hiện tại chưa có quyền mở trang này. Vui lòng liên hệ quản trị viên nếu đây là chức năng cần cho công việc.
        </p>

        {fromPath && (
          <p className="mt-5 text-sm text-slate-500">
            Trang yêu cầu: <code className="rounded-md border border-slate-200 bg-slate-100 px-2 py-1">{fromPath}</code>
          </p>
        )}

        <div className="mt-6 flex justify-center gap-3">
          <Button type="button" variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft size={16} />
            Quay lại
          </Button>
          <Link to="/">
            <Button type="button">
              <Home size={16} />
              Trang chủ
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
};
