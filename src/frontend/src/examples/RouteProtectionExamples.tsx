import { useRouteAccess } from '@/hooks/useRouteAccess';
import { usePermissions } from '@/hooks/usePermissions';
import { ROUTE_GROUPS } from '@/config/routes';
import { Shield, Lock, CheckCircle, XCircle, Navigation } from 'lucide-react';

/**
 * Route Protection Examples
 * 
 * Demonstrates route access control and navigation with permissions
 */
export const RouteProtectionExamples = () => {
  const { navigateTo, canAccess, getAccessibleMenuItems, routes } = useRouteAccess();
  const { permissions, roles, isAdmin } = usePermissions();

  const menuItems = getAccessibleMenuItems();

  return (
    <div className="p-8 space-y-8">
      {/* Current User Access Info */}
      <section className="bg-white rounded-lg border p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Shield size={20} />
          Quyền truy cập hiện tại
        </h2>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-600">Vai trò:</p>
            <div className="flex gap-2 mt-1">
              {roles.map((role) => (
                <span
                  key={role}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                >
                  {role}
                </span>
              ))}
              {roles.length === 0 && (
                <span className="text-gray-400 text-sm">Không có vai trò</span>
              )}
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-600">Trạng thái Admin:</p>
            <p className="font-medium mt-1">
              {isAdmin() ? (
                <span className="text-green-600 flex items-center gap-1">
                  <CheckCircle size={16} />
                  Là Admin
                </span>
              ) : (
                <span className="text-gray-600 flex items-center gap-1">
                  <XCircle size={16} />
                  Không phải Admin
                </span>
              )}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Số lượng quyền:</p>
            <p className="font-medium mt-1">{permissions.length} quyền</p>
          </div>
        </div>
      </section>

      {/* Route Access Check */}
      <section className="bg-white rounded-lg border p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Lock size={20} />
          Kiểm tra quyền truy cập cóc route
        </h2>
        <div className="space-y-2">
          {Object.entries(routes).map(([key, route]) => {
            if (!route.showInMenu) return null;
            const hasAccess = canAccess(route.path);
            
            return (
              <div
                key={key}
                className={`flex items-center justify-between p-3 rounded border ${
                  hasAccess
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  {hasAccess ? (
                    <CheckCircle size={18} className="text-green-600" />
                  ) : (
                    <XCircle size={18} className="text-red-600" />
                  )}
                  <div>
                    <p className="font-medium text-sm">{route.name}</p>
                    <p className="text-xs text-gray-600">{route.path}</p>
                    {route.permission && (
                      <p className="text-xs text-gray-500 mt-1">
                        Yêu cầu: {route.permission}
                      </p>
                    )}
                  </div>
                </div>
                {hasAccess && (
                  <button
                    onClick={() => navigateTo(route.path)}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    Đi đến
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Accessible Menu Items */}
      <section className="bg-white rounded-lg border p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Navigation size={20} />
          Menu có thể truy cập
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Các mục menu mà bạn có quyền truy cập, được nhóm theo danh mục
        </p>
        
        <div className="space-y-6">
          {Object.entries(menuItems).map(([groupKey, items]) => {
            if (items.length === 0) return null;
            
            const groupInfo = ROUTE_GROUPS[groupKey as keyof typeof ROUTE_GROUPS];
            
            return (
              <div key={groupKey}>
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                  {groupInfo?.name || groupKey}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {items.map((item) => (
                    <button
                      key={item.path}
                      onClick={() => navigateTo(item.path)}
                      className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-600 text-sm font-bold">
                          {item.icon?.charAt(0) || '•'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{item.name}</p>
                        <p className="text-xs text-gray-500 truncate">{item.path}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {Object.values(menuItems).every((items) => items.length === 0) && (
          <div className="text-center py-8 text-gray-500">
            <p>Bạn không có quyền truy cập menu nào</p>
          </div>
        )}
      </section>

      {/* Navigation Examples */}
      <section className="bg-white rounded-lg border p-6">
        <h2 className="text-xl font-semibold mb-4">Ví dụ Navigation</h2>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">
              navigateTo() - Tự động kiểm tra quyền và hiển thị notification
            </p>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => navigateTo('/users')}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
              >
                Đi đến User Management
              </button>
              <button
                onClick={() => navigateTo('/employees')}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm"
              >
                Đi đến Employee List
              </button>
              <button
                onClick={() => navigateTo('/roles')}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors text-sm"
              >
                Đi đến Role Management
              </button>
            </div>
          </div>

          <div className="border-t pt-4">
            <p className="text-sm text-gray-600 mb-2">
              Conditional rendering dựa trên canAccess()
            </p>
            <div className="flex gap-2 flex-wrap">
              {canAccess('/users') && (
                <div className="px-3 py-2 bg-green-50 border border-green-200 rounded text-sm text-green-800">
                  ✓ Bạn có thể truy cập User Management
                </div>
              )}
              {!canAccess('/users') && (
                <div className="px-3 py-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                  ✗ Bạn không thể truy cập User Management
                </div>
              )}
              
              {canAccess('/employees') && (
                <div className="px-3 py-2 bg-green-50 border border-green-200 rounded text-sm text-green-800">
                  ✓ Bạn có thể truy cập Employee List
                </div>
              )}
              {!canAccess('/employees') && (
                <div className="px-3 py-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                  ✗ Bạn không thể truy cập Employee List
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Permission Summary */}
      <section className="bg-gray-50 rounded-lg border p-6">
        <h2 className="text-xl font-semibold mb-4">Tóm tắt Permissions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">{permissions.length}</p>
            <p className="text-sm text-gray-600 mt-1">Tổng quyền</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">
              {Object.values(menuItems).reduce((acc, items) => acc + items.length, 0)}
            </p>
            <p className="text-sm text-gray-600 mt-1">Routes truy cập được</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-purple-600">{roles.length}</p>
            <p className="text-sm text-gray-600 mt-1">Số vai trò</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-orange-600">
              {isAdmin() ? '1' : '0'}
            </p>
            <p className="text-sm text-gray-600 mt-1">Admin access</p>
          </div>
        </div>
      </section>
    </div>
  );
};
