# Permission-Based UI Components

## Tổng quan

Hệ thống phân quyền dựa trên UI cho phép kiểm soát hiển thị và quyền truy cập các thành phần dựa trên permissions và roles của người dùng.

## Các thành phần chính

### 1. `usePermissions` Hook

Hook để kiểm tra quyền của người dùng hiện tại.

```tsx
import { usePermissions } from '@/hooks/usePermissions';

const MyComponent = () => {
  const { can, canAny, canAll, hasRole, isAdmin } = usePermissions();
  
  if (can('user:create')) {
    // Hiển thị nút tạo user
  }
};
```

**API:**
- `can(permission: string)` - Kiểm tra một quyền
- `canAny(permissions: string[])` - Có ít nhất một quyền
- `canAll(permissions: string[])` - Có tất cả quyền
- `hasRole(role: string)` - Kiểm tra vai trò
- `hasAnyRole(roles: string[])` - Có ít nhất một vai trò
- `isAdmin()` - Kiểm tra có phải admin không
- `permissions` - Danh sách tất cả quyền
- `roles` - Danh sách tất cả vai trò
- `isAuthenticated` - Trạng thái đăng nhập

### 2. `PermissionGate` Component

Component để ẩn/hiện nội dung dựa trên quyền.

```tsx
import { PermissionGate } from '@/components/Auth/PermissionGate';
import { PERMISSIONS } from '@/utils/permissions';

// Ẩn hoàn toàn nếu không có quyền
<PermissionGate permission={PERMISSIONS.USER_CREATE}>
  <Button>Tạo người dùng</Button>
</PermissionGate>

// Nhiều quyền (ANY)
<PermissionGate permissions={['user:update', 'user:delete']}>
  <Button>Chỉnh sửa</Button>
</PermissionGate>

// Nhiều quyền (ALL - yêu cầu tất cả)
<PermissionGate 
  permissions={['user:update', 'user:lock']} 
  requireAll
>
  <Button>Khóa người dùng</Button>
</PermissionGate>

// Kiểm tra vai trò
<PermissionGate role="ADMIN">
  <AdminPanel />
</PermissionGate>

// Với fallback (hiển thị nội dung thay thế)
<PermissionGate
  permission="user:delete"
  hideOnUnauthorized={false}
  fallback={<p>Bạn không có quyền xóa</p>}
>
  <Button variant="danger">Xóa</Button>
</PermissionGate>
```

**Props:**
- `permission?: string` - Quyền đơn lẻ
- `permissions?: string[]` - Mảng quyền
- `requireAll?: boolean` - Yêu cầu tất cả quyền (mặc định: false)
- `role?: string` - Vai trò đơn lẻ
- `roles?: string[]` - Mảng vai trò
- `children: ReactNode` - Nội dung hiển thị nếu có quyền
- `fallback?: ReactNode` - Nội dung thay thế nếu không có quyền
- `hideOnUnauthorized?: boolean` - Ẩn hoàn toàn (mặc định: true)

### 3. `ProtectedButton` Component

Button tự động kiểm tra quyền và vô hiệu hóa/ẩn nếu không có quyền.

```tsx
import { ProtectedButton } from '@/components/Auth/ProtectedButton';
import { PERMISSIONS } from '@/utils/permissions';

// Ẩn button nếu không có quyền (mặc định)
<ProtectedButton 
  permission={PERMISSIONS.USER_CREATE}
  onClick={handleCreate}
>
  Tạo người dùng
</ProtectedButton>

// Vô hiệu hóa button (disable) thay vì ẩn
<ProtectedButton 
  permission={PERMISSIONS.USER_UPDATE}
  unauthorizedBehavior="disable"
  unauthorizedMessage="Bạn không có quyền cập nhật"
  onClick={handleUpdate}
>
  Cập nhật
</ProtectedButton>

// Nhiều quyền
<ProtectedButton 
  permissions={[PERMISSIONS.USER_UPDATE, PERMISSIONS.USER_DELETE]}
  variant="danger"
>
  Xóa người dùng
</ProtectedButton>
```

**Props:** (kế thừa tất cả props của Button)
- `permission?: string` - Quyền đơn lẻ
- `permissions?: string[]` - Mảng quyền
- `requireAll?: boolean` - Yêu cầu tất cả quyền
- `role?: string` - Vai trò đơn lẻ
- `roles?: string[]` - Mảng vai trò
- `unauthorizedBehavior?: 'hide' | 'disable'` - Hành vi khi không có quyền (mặc định: 'hide')
- `unauthorizedMessage?: string` - Thông báo khi disabled

## Constants

### PERMISSIONS

```tsx
import { PERMISSIONS } from '@/utils/permissions';

PERMISSIONS.USER_VIEW       // 'user:view'
PERMISSIONS.USER_CREATE     // 'user:create'
PERMISSIONS.USER_UPDATE     // 'user:update'
PERMISSIONS.USER_DELETE     // 'user:delete'
PERMISSIONS.USER_LOCK       // 'user:lock'

PERMISSIONS.ROLE_VIEW       // 'role:view'
PERMISSIONS.ROLE_CREATE     // 'role:create'
PERMISSIONS.ROLE_UPDATE     // 'role:update'
PERMISSIONS.ROLE_DELETE     // 'role:delete'

PERMISSIONS.EMPLOYEE_VIEW   // 'employee:view'
PERMISSIONS.EMPLOYEE_CREATE // 'employee:create'
PERMISSIONS.EMPLOYEE_UPDATE // 'employee:update'
PERMISSIONS.EMPLOYEE_DELETE // 'employee:delete'

PERMISSIONS.DEPARTMENT_VIEW   // 'department:view'
PERMISSIONS.DEPARTMENT_CREATE // 'department:create'
PERMISSIONS.DEPARTMENT_UPDATE // 'department:update'
PERMISSIONS.DEPARTMENT_DELETE // 'department:delete'

PERMISSIONS.ORGANIZATION_VIEW   // 'organization:view'
PERMISSIONS.ORGANIZATION_CREATE // 'organization:create'
PERMISSIONS.ORGANIZATION_UPDATE // 'organization:update'
PERMISSIONS.ORGANIZATION_DELETE // 'organization:delete'

PERMISSIONS.SYSTEM_SETTINGS // 'system:settings'
PERMISSIONS.SYSTEM_LOGS     // 'system:logs'
```

### ROLES

```tsx
import { ROLES } from '@/utils/permissions';

ROLES.ADMIN      // 'ADMIN'
ROLES.HR_MANAGER // 'HR_MANAGER'
ROLES.MANAGER    // 'MANAGER'
ROLES.USER       // 'USER'
```

## Ví dụ thực tế

### 1. UserManagementPage

```tsx
import { PermissionGate } from '@/components/Auth/PermissionGate';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/utils/permissions';

export const UserManagementPage = () => {
  const { can } = usePermissions();
  
  return (
    <div>
      {/* Nút thêm - chỉ hiển thị nếu có quyền */}
      <PermissionGate permission={PERMISSIONS.USER_CREATE}>
        <Button onClick={handleAdd}>Thêm người dùng</Button>
      </PermissionGate>
      
      {/* Cột action trong table */}
      <Table
        columns={[
          // ... other columns
          {
            key: 'actions',
            render: (_, record) => (
              <div>
                <PermissionGate permission={PERMISSIONS.USER_UPDATE}>
                  <button onClick={() => handleEdit(record)}>Sửa</button>
                </PermissionGate>
                
                <PermissionGate permission={PERMISSIONS.USER_DELETE}>
                  <button onClick={() => handleDelete(record)}>Xóa</button>
                </PermissionGate>
                
                <PermissionGate permission={PERMISSIONS.USER_LOCK}>
                  <button onClick={() => handleLock(record)}>
                    {record.locked ? 'Mở khóa' : 'Khóa'}
                  </button>
                </PermissionGate>
              </div>
            )
          }
        ]}
      />
    </div>
  );
};
```

### 2. EmployeeFormPage

```tsx
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/utils/permissions';

export const EmployeeFormPage = () => {
  const { id } = useParams();
  const { can } = usePermissions();
  
  const canCreate = can(PERMISSIONS.EMPLOYEE_CREATE);
  const canUpdate = can(PERMISSIONS.EMPLOYEE_UPDATE);
  
  // Redirect nếu không có quyền
  useEffect(() => {
    if (!id && !canCreate) {
      navigate('/employees');
    } else if (id && !canUpdate) {
      navigate('/employees');
    }
  }, [id, canCreate, canUpdate]);
  
  const hasSubmitPermission = id ? canUpdate : canCreate;
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Hiển thị cảnh báo nếu không có quyền */}
      {!hasSubmitPermission && (
        <div className="alert alert-warning">
          Bạn không có quyền chỉnh sửa. Chế độ chỉ xem.
        </div>
      )}
      
      {/* Vô hiệu hóa submit button */}
      <Button 
        type="submit" 
        disabled={!hasSubmitPermission}
      >
        {id ? 'Cập nhật' : 'Tạo mới'}
      </Button>
    </form>
  );
};
```

### 3. Conditional Rendering

```tsx
const { can, hasRole, isAdmin } = usePermissions();

// Kiểm tra theo chương trình
if (can(PERMISSIONS.USER_DELETE)) {
  // Logic xóa người dùng
}

if (hasRole('ADMIN')) {
  // Logic dành riêng cho admin
}

if (isAdmin()) {
  // Cách khác để kiểm tra admin
}

// Render có điều kiện
return (
  <div>
    {can(PERMISSIONS.SYSTEM_SETTINGS) && (
      <SettingsPanel />
    )}
    
    {hasRole('HR_MANAGER') && (
      <HRDashboard />
    )}
  </div>
);
```

## Best Practices

1. **Sử dụng constants** - Luôn dùng `PERMISSIONS` và `ROLES` constants thay vì hardcode strings
2. **Kiểm tra backend** - UI permissions chỉ là UX, backend phải validate lại
3. **Ưu tiên PermissionGate** - Dùng cho layout, ProtectedButton cho buttons cụ thể
4. **Fallback hợp lý** - Cung cấp feedback rõ ràng khi user không có quyền
5. **Redirect khi cần** - Redirect khỏi page nếu user không có quyền truy cập
6. **Loading states** - Hiển thị loading khi đang kiểm tra permissions

## Cấu trúc quyền

Mỗi permission có định dạng: `<resource>:<action>`

- `resource`: user, role, employee, department, organization, system
- `action`: view, create, update, delete, lock, settings, logs

Ví dụ: `user:create`, `employee:update`, `system:settings`
