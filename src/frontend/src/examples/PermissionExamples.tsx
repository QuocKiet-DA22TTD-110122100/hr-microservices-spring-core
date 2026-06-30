import { usePermissions } from '@/hooks/usePermissions';
import { PermissionGate } from '@/components/Auth/PermissionGate';
import { ProtectedButton } from '@/components/Auth/ProtectedButton';
import { PERMISSIONS, ROLES } from '@/utils/permissions';
import { Button } from '@/components/UI/Button';
import { Shield, Users, FileText, Settings } from 'lucide-react';

/**
 * Permission Examples Component
 * 
 * Demonstrates various ways to implement permission-based UI controls
 */
export const PermissionExamples = () => {
  const { can, canAny, canAll, hasRole, isAdmin, permissions, roles } = usePermissions();

  return (
    <div className="p-8 space-y-8">
      {/* Current User Info */}
      <section className="bg-white rounded-lg border p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Shield size={20} />
          Thông tin người dùng hiện tại
        </h2>
        <div className="space-y-2">
          <p><strong>Vai trò:</strong> {roles.join(', ') || 'Không có'}</p>
          <p><strong>Số lượng quyền:</strong> {permissions.length}</p>
          <p><strong>Là Admin:</strong> {isAdmin() ? 'Có' : 'Không'}</p>
          <details className="mt-4">
            <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
              Xem tất cả quyền ({permissions.length})
            </summary>
            <ul className="mt-2 space-y-1 text-sm text-gray-600 ml-4">
              {permissions.map((perm) => (
                <li key={perm}>• {perm}</li>
              ))}
            </ul>
          </details>
        </div>
      </section>

      {/* Example 1: Simple Permission Gate */}
      <section className="bg-white rounded-lg border p-6">
        <h2 className="text-xl font-semibold mb-4">1. PermissionGate - Ẩn nội dung</h2>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">Chỉ hiển thị nếu có quyền "user:create":</p>
            <PermissionGate permission={PERMISSIONS.USER_CREATE}>
              <div className="bg-green-50 border border-green-200 rounded p-3 text-sm text-green-800">
                ✓ Bạn có quyền tạo người dùng mới
              </div>
            </PermissionGate>
            {!can(PERMISSIONS.USER_CREATE) && (
              <div className="bg-gray-50 border border-gray-200 rounded p-3 text-sm text-gray-600">
                ℹ Nội dung bị ẩn do không có quyền "user:create"
              </div>
            )}
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-2">Chỉ hiển thị nếu có quyền "user:delete":</p>
            <PermissionGate permission={PERMISSIONS.USER_DELETE}>
              <div className="bg-green-50 border border-green-200 rounded p-3 text-sm text-green-800">
                ✓ Bạn có quyền xóa người dùng
              </div>
            </PermissionGate>
            {!can(PERMISSIONS.USER_DELETE) && (
              <div className="bg-gray-50 border border-gray-200 rounded p-3 text-sm text-gray-600">
                ℹ Nội dung bị ẩn do không có quyền "user:delete"
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Example 2: Multiple Permissions */}
      <section className="bg-white rounded-lg border p-6">
        <h2 className="text-xl font-semibold mb-4">2. Nhiều quyền (ANY hoặc ALL)</h2>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">
              Hiển thị nếu có BẤT KỲ quyền nào: user:update HOẶC user:delete
            </p>
            <PermissionGate 
              permissions={[PERMISSIONS.USER_UPDATE, PERMISSIONS.USER_DELETE]}
              requireAll={false}
            >
              <div className="bg-green-50 border border-green-200 rounded p-3 text-sm text-green-800">
                ? Bạn có ít nhất một trong các quyền: user:update hoặc user:delete
              </div>
            </PermissionGate>
            {!canAny([PERMISSIONS.USER_UPDATE, PERMISSIONS.USER_DELETE]) && (
              <div className="bg-gray-50 border border-gray-200 rounded p-3 text-sm text-gray-600">
                ℹ Bạn không có quyền user:update hoặc user:delete
              </div>
            )}
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-2">
              Hiển thị nếu có TẤT CẢ quyền: user:update VÀ user:lock
            </p>
            <PermissionGate 
              permissions={[PERMISSIONS.USER_UPDATE, PERMISSIONS.USER_LOCK]}
              requireAll={true}
            >
              <div className="bg-green-50 border border-green-200 rounded p-3 text-sm text-green-800">
                ✓ Bạn có cả hai quyền: user:update và user:lock
              </div>
            </PermissionGate>
            {!canAll([PERMISSIONS.USER_UPDATE, PERMISSIONS.USER_LOCK]) && (
              <div className="bg-gray-50 border border-gray-200 rounded p-3 text-sm text-gray-600">
                ℹ Bạn không có đủ cả hai quyền user:update và user:lock
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Example 3: Role-Based Access */}
      <section className="bg-white rounded-lg border p-6">
        <h2 className="text-xl font-semibold mb-4">3. Kiểm tra theo vai trò</h2>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">Chỉ dành cho ADMIN:</p>
            <PermissionGate role={ROLES.ADMIN}>
              <div className="bg-purple-50 border border-purple-200 rounded p-3 text-sm text-purple-800">
                ✓ Bạn là ADMIN
              </div>
            </PermissionGate>
            {!hasRole(ROLES.ADMIN) && (
              <div className="bg-gray-50 border border-gray-200 rounded p-3 text-sm text-gray-600">
                ℹ Nội dung chỉ dành cho ADMIN
              </div>
            )}
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-2">Cho HR_MANAGER hoặc ADMIN:</p>
            <PermissionGate roles={[ROLES.HR_MANAGER, ROLES.ADMIN]}>
              <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-800">
                ✓ Bạn là HR_MANAGER hoặc ADMIN
              </div>
            </PermissionGate>
          </div>
        </div>
      </section>

      {/* Example 4: Protected Buttons */}
      <section className="bg-white rounded-lg border p-6">
        <h2 className="text-xl font-semibold mb-4">4. Protected Buttons</h2>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-3">Nút ẩn khi không có quyền (mặc định):</p>
            <div className="flex gap-2 flex-wrap">
              <ProtectedButton
                permission={PERMISSIONS.USER_CREATE}
                variant="primary"
              >
                <Users size={16} className="mr-2" />
                Tạo người dùng
              </ProtectedButton>

              <ProtectedButton
                permission={PERMISSIONS.EMPLOYEE_DELETE}
                variant="danger"
              >
                Xóa nhân viên
              </ProtectedButton>

              <ProtectedButton
                permission={PERMISSIONS.SYSTEM_SETTINGS}
                variant="secondary"
              >
                <Settings size={16} className="mr-2" />
                Cài đặt hệ thống
              </ProtectedButton>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-3">Nút vô hiệu hóa khi không có quyền:</p>
            <div className="flex gap-2 flex-wrap">
              <ProtectedButton
                permission={PERMISSIONS.USER_UPDATE}
                unauthorizedBehavior="disable"
                unauthorizedMessage="Bạn không có quyền cập nhật người dùng"
                variant="primary"
              >
                Cập nhật người dùng
              </ProtectedButton>

              <ProtectedButton
                permission={PERMISSIONS.ROLE_DELETE}
                unauthorizedBehavior="disable"
                variant="danger"
              >
                Xóa vai trò
              </ProtectedButton>
            </div>
          </div>
        </div>
      </section>

      {/* Example 5: PermissionGate with Fallback */}
      <section className="bg-white rounded-lg border p-6">
        <h2 className="text-xl font-semibold mb-4">5. PermissionGate với nội dung thay thế</h2>
        <PermissionGate
          permission={PERMISSIONS.ROLE_CREATE}
          hideOnUnauthorized={false}
          fallback={
            <div className="bg-yellow-50 border border-yellow-200 rounded p-4 text-sm">
              <p className="font-medium text-yellow-800">Quyền truy cập bị hạn chế</p>
              <p className="text-yellow-700 mt-1">
                Bạn không có quyền tạo vai trò mới. Vui lòng liên hệ quản trị viên để được cấp quyền.
              </p>
            </div>
          }
        >
          <div className="bg-green-50 border border-green-200 rounded p-4">
            <p className="font-medium text-green-800">Tạo vai trò mới</p>
            <p className="text-green-700 mt-1 text-sm">Bạn có quyền tạo vai trò trong hệ thống.</p>
            <Button variant="primary" className="mt-3">
              <FileText size={16} className="mr-2" />
              Tạo vai trò
            </Button>
          </div>
        </PermissionGate>
      </section>

      {/* Example 6: Programmatic Checks */}
      <section className="bg-white rounded-lg border p-6">
        <h2 className="text-xl font-semibold mb-4">6. Kiểm tra theo chương trình</h2>
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-2">
            <span className={can(PERMISSIONS.USER_VIEW) ? 'text-green-600' : 'text-red-600'}>
              {can(PERMISSIONS.USER_VIEW) ? '✓' : '✗'}
            </span>
            <code>can(PERMISSIONS.USER_VIEW)</code>
            <span className="text-gray-600">= {can(PERMISSIONS.USER_VIEW).toString()}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className={can(PERMISSIONS.USER_DELETE) ? 'text-green-600' : 'text-red-600'}>
              {can(PERMISSIONS.USER_DELETE) ? '✓' : '✗'}
            </span>
            <code>can(PERMISSIONS.USER_DELETE)</code>
            <span className="text-gray-600">= {can(PERMISSIONS.USER_DELETE).toString()}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className={canAny([PERMISSIONS.EMPLOYEE_CREATE, PERMISSIONS.EMPLOYEE_UPDATE]) ? 'text-green-600' : 'text-red-600'}>
              {canAny([PERMISSIONS.EMPLOYEE_CREATE, PERMISSIONS.EMPLOYEE_UPDATE]) ? '✓' : '✗'}
            </span>
            <code>canAny([EMPLOYEE_CREATE, EMPLOYEE_UPDATE])</code>
            <span className="text-gray-600">= {canAny([PERMISSIONS.EMPLOYEE_CREATE, PERMISSIONS.EMPLOYEE_UPDATE]).toString()}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className={isAdmin() ? 'text-green-600' : 'text-red-600'}>
              {isAdmin() ? '✓' : '✗'}
            </span>
            <code>isAdmin()</code>
            <span className="text-gray-600">= {isAdmin().toString()}</span>
          </div>
        </div>
      </section>
    </div>
  );
};
