import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from './usePermissions';
import { useUIStore } from '@/store/uiStore';
import { canAccessRoute, ROUTES } from '@/config/routes';

/**
 * Hook for route access control and navigation
 * 
 * Provides utilities to check route access and navigate with permission validation
 * 
 * @example
 * const { navigateTo, canAccess, getAccessibleRoutes } = useRouteAccess();
 * 
 * // Navigate with permission check
 * navigateTo('/users');
 * 
 * // Check if user can access a route
 * if (canAccess('/users')) {
 *   // Show link
 * }
 */
export const useRouteAccess = () => {
  const navigate = useNavigate();
  const { permissions } = usePermissions();
  const { addNotification } = useUIStore();

  /**
   * Navigate to a route with automatic permission check
   * Shows notification and redirects to dashboard if user doesn't have access
   */
  const navigateTo = useCallback(
    (path: string, options?: { replace?: boolean; state?: unknown }) => {
      const hasAccess = canAccessRoute(path, permissions);

      if (!hasAccess) {
        addNotification({
          type: 'error',
          message: 'Bạn không có quyền truy cập trang này',
          duration: 3000,
        });
        navigate('/', { replace: true });
        return;
      }

      navigate(path, options);
    },
    [navigate, permissions, addNotification]
  );

  /**
   * Check if user can access a specific route
   */
  const canAccess = useCallback(
    (path: string): boolean => {
      return canAccessRoute(path, permissions);
    },
    [permissions]
  );

  /**
   * Get all routes that user has access to
   */
  const getAccessibleRoutes = useCallback(() => {
    return Object.values(ROUTES).filter((route) => {
      if (!route.permission && !route.permissions) return true;
      return canAccessRoute(route.path, permissions);
    });
  }, [permissions]);

  /**
   * Get menu items grouped by category that user can access
   */
  const getAccessibleMenuItems = useCallback(() => {
    const grouped: Record<string, typeof ROUTES[keyof typeof ROUTES][]> = {
      main: [],
      hr: [],
      admin: [],
      user: [],
    };

    Object.values(ROUTES).forEach((route) => {
      if (!route.showInMenu) return;
      
      const hasAccess = canAccessRoute(route.path, permissions);
      if (hasAccess && route.group) {
        grouped[route.group].push(route);
      }
    });

    return grouped;
  }, [permissions]);

  /**
   * Safe navigate that won't fail even if user doesn't have access
   * Just shows notification instead
   */
  const tryNavigate = useCallback(
    (path: string, options?: { replace?: boolean; state?: unknown }) => {
      try {
        navigateTo(path, options);
      } catch (error) {
        addNotification({
          type: 'error',
          message: 'Không thể điều hướng đến trang yêu cầu',
          duration: 3000,
        });
      }
    },
    [navigateTo, addNotification]
  );

  return {
    navigateTo,
    canAccess,
    getAccessibleRoutes,
    getAccessibleMenuItems,
    tryNavigate,
    routes: ROUTES,
  };
};
