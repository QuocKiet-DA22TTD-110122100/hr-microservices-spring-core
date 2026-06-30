# Route Protection Documentation

## Tổng quan

Hệ thống bảo vệ route dựa trên permissions và roles, tự động redirect người dùng không có quyền đến trang Unauthorized.

## Components

### 1. ProtectedRoute

Component bọc các route cần authentication và/hoặc permissions cụ thể.

#### Props

```typescript
interface ProtectedRouteProps {
  children: ReactNode;
  permission?: string;           // Quyền đơn lẻ
  permissions?: string[];         // Mảng quyền (any/all)
  requireAll?: boolean;           // Yêu cầu tất cả quyền
  role?: string;                  // Vai trò đơn lẻ
  roles?: string[];               // Mảng vai trò
  redirectTo?: string;            // Trang redirect (mặc định: /unauthorized)
  showNotification?: boolean;     // Hiển thị thông báo (mặc định: true)
}
```

#### Ví dụ sử dụng

```tsx
import { ProtectedRoute } from '@/components/Auth/ProtectedRoute';
import { PERMISSIONS } from '@/utils/permissions';

// 1. Chỉ cần authentication
<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <DashboardPage />
    </ProtectedRoute>
  }
/>

// 2. Yêu cầu permission cụ thể
<Route
  path="/users"
  element={
    <ProtectedRoute permission={PERMISSIONS.USER_VIEW}>
      <UserManagementPage />
    </ProtectedRoute>
  }
/>

// 3. Yêu cầu một trong nhiều permissions
<Route
  path="/employees"
  element={
    <ProtectedRoute 
      permissions={[PERMISSIONS.EMPLOYEE_VIEW, PERMISSIONS.EMPLOYEE_CREATE]}
    >
      <EmployeeListPage />
    </ProtectedRoute>
  }
/>

// 4. Yêu cầu tất cả permissions
<Route
  path="/admin"
  element={
    <ProtectedRoute 
      permissions={[PERMISSIONS.USER_VIEW, PERMISSIONS.ROLE_VIEW]}
      requireAll
    >
      <AdminPage />
    </ProtectedRoute>
  }
/>

// 5. Yêu cầu role cụ thể
<Route
  path="/admin"
  element={
    <ProtectedRoute role="ADMIN">
      <AdminPage />
    </ProtectedRoute>
  }
/>

// 6. Custom redirect
<Route
  path="/sensitive"
  element={
    <ProtectedRoute 
      permission={PERMISSIONS.SYSTEM_SETTINGS}
      redirectTo="/dashboard"
      showNotification={true}
    >
      <SensitivePage />
    </ProtectedRoute>
  }
/>
```

### 2. UnauthorizedPage

Trang hiển thị khi người dùng không có quyền truy cập.

#### Features
- Hiển thị icon Shield và thông báo rõ ràng
- Hiển thị đường dẫn trang bị từ chối (nếu có)
- Nút "Quay lại" và "Về trang chủ"
- Responsive design

#### Ví dụ

```tsx
<Route path="/unauthorized" element={<UnauthorizedPage />} />
```

## Hooks

### useRouteAccess

Hook cung cấp utilities để kiểm tra và điều hướng với permission validation.

#### API

```typescript
const {
  navigateTo,              // Navigate với permission check
  canAccess,               // Kiểm tra quyền truy cập route
  getAccessibleRoutes,     // Lấy danh sách routes có thể truy cập
  getAccessibleMenuItems,  // Lấy menu items có thể truy cập
  tryNavigate,             // Navigate an toàn (không throw error)
  routes,                  // ROUTES constant
} = useRouteAccess();
```

#### Ví dụ sử dụng

```tsx
import { useRouteAccess } from '@/hooks/useRouteAccess';

const MyComponent = () => {
  const { navigateTo, canAccess, getAccessibleMenuItems } = useRouteAccess();

  // Navigate với auto permission check
  const handleNavigate = () => {
    navigateTo('/users'); // Tự động hiển thị notification nếu không có quyền
  };

  // Kiểm tra quyền trước khi render
  return (
    <div>
      {canAccess('/users') && (
        <button onClick={() => navigateTo('/users')}>
          Quản lý người dùng
        </button>
      )}
    </div>
  );
};

// Render dynamic menu
const Navigation = () => {
  const { getAccessibleMenuItems } = useRouteAccess();
  const menuItems = getAccessibleMenuItems();

  return (
    <nav>
      {Object.entries(menuItems).map(([group, items]) => (
        <div key={group}>
          <h3>{group}</h3>
          {items.map((item) => (
            <a key={item.path} href={item.path}>
              {item.name}
            </a>
          ))}
        </div>
      ))}
    </nav>
  );
};
```

## Configuration

### routes.ts

File cấu hình tập trung tất cả routes với permissions.

#### RouteConfig

```typescript
interface RouteConfig {
  path: string;           // Đường dẫn route
  name: string;           // Tên hiển thị
  icon?: string;          // Icon (cho menu)
  permission?: string;    // Quyền đơn lẻ
  permissions?: string[]; // Mảng quyền
  requireAll?: boolean;   // Yêu cầu tất cả quyền
  role?: string;          // Vai trò đơn lẻ
  roles?: string[];       // Mảng vai trò
  showInMenu?: boolean;   // Hiển thị trong menu
  group?: string;         // Nhóm menu
}
```

#### Ví dụ cấu hình

```typescript
export const ROUTES: Record<string, RouteConfig> = {
  USERS: {
    path: '/users',
    name: 'Quản lý người dùng',
    icon: 'UserCog',
    permission: PERMISSIONS.USER_VIEW,
    showInMenu: true,
    group: 'admin',
  },
  EMPLOYEES: {
    path: '/employees',
    name: 'Quản lý nhân viên',
    icon: 'Users',
    permission: PERMISSIONS.EMPLOYEE_VIEW,
    showInMenu: true,
    group: 'hr',
  },
  PROFILE: {
    path: '/profile',
    name: 'Hồ sơ cá nhân',
    icon: 'User',
    showInMenu: true,
    group: 'user',
    // Không có permission - accessible cho tất cả authenticated users
  },
};
```

#### Helper Functions

```typescript
// Lấy routes theo nhóm
const grouped = getGroupedRoutes();
// { main: [...], hr: [...], admin: [...], user: [...] }

// Lấy routes user có thể truy cập
const accessible = getAccessibleRoutes(userPermissions);

// Kiểm tra quyền truy cập route cụ thể
const hasAccess = canAccessRoute('/users', userPermissions);
```

## App.tsx Integration

### Cấu trúc Route Protection

```tsx
import { ProtectedRoute, UnauthorizedPage } from '@/components/Auth/ProtectedRoute';
import { PERMISSIONS } from '@/utils/permissions';

function App() {
  return (
    <BrowserRouter>
      <GlobalErrorUI />
      
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        
        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        
        {/* Admin Routes */}
        <Route
          path="/users"
          element={
            <ProtectedRoute permission={PERMISSIONS.USER_VIEW}>
              <UserManagementPage />
            </ProtectedRoute>
          }
        />
        
        {/* HR Routes */}
        <Route
          path="/employees"
          element={
            <ProtectedRoute permission={PERMISSIONS.EMPLOYEE_VIEW}>
              <EmployeeListPage />
            </ProtectedRoute>
          }
        />
        
        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
```

## Flow Diagram

```
User navigates to /users
         ↓
ProtectedRoute checks authentication
         ↓
   Not authenticated? → Redirect to /login (with return URL)
         ↓
   Authenticated ✓
         ↓
ProtectedRoute checks permission (USER_VIEW)
         ↓
   No permission? → Show notification + Redirect to /unauthorized
         ↓
   Has permission ✓
         ↓
   Render <UserManagementPage />
```

## Best Practices

### 1. Sử dụng PERMISSIONS constants

```tsx
// ✅ Good
<ProtectedRoute permission={PERMISSIONS.USER_VIEW}>

// ❌ Bad
<ProtectedRoute permission="user:view">
```

### 2. Group routes theo permissions

```tsx
// User Management Routes - tất cả yêu cầu USER_VIEW base permission
<Route path="/users" element={<ProtectedRoute permission={PERMISSIONS.USER_VIEW}>...} />
<Route path="/users/add" element={<ProtectedRoute permission={PERMISSIONS.USER_CREATE}>...} />
<Route path="/users/edit/:id" element={<ProtectedRoute permission={PERMISSIONS.USER_UPDATE}>...} />
```

### 3. Luôn có /unauthorized route

```tsx
<Route path="/unauthorized" element={<UnauthorizedPage />} />
```

### 4. Sử dụng useRouteAccess cho navigation

```tsx
// ✅ Good - tự động check permissions
const { navigateTo } = useRouteAccess();
navigateTo('/users');

// ❌ Bad - không check permissions
const navigate = useNavigate();
navigate('/users');
```

### 5. Cấu hình routes trong routes.ts

```tsx
// ✅ Good - centralized configuration
import { ROUTES } from '@/config/routes';
<ProtectedRoute permission={ROUTES.USERS.permission}>

// ❌ Bad - scattered permissions
<ProtectedRoute permission="user:view">
```

## Testing

### Unit Test Example

```typescript
import { render, screen } from '@testing-library/react';
import { ProtectedRoute } from './ProtectedRoute';
import { usePermissions } from '@/hooks/usePermissions';

jest.mock('@/hooks/usePermissions');

describe('ProtectedRoute', () => {
  it('should redirect to unauthorized when no permission', () => {
    (usePermissions as jest.Mock).mockReturnValue({
      can: () => false,
      isAuthenticated: true,
    });

    render(
      <ProtectedRoute permission="user:view">
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should render content when has permission', () => {
    (usePermissions as jest.Mock).mockReturnValue({
      can: () => true,
      isAuthenticated: true,
    });

    render(
      <ProtectedRoute permission="user:view">
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });
});
```

## Security Notes

⚠️ **Important:** Route protection chỉ là UX layer. Backend API endpoints PHẢI validate lại permissions ở server-side.

Route guards:
- ✅ Cải thiện UX (không hiển thị trang user không có quyền)
- ✅ Giảm API calls không cần thiết
- ❌ KHÔNG phải security mechanism chính
- ❌ Client-side code có thể bypass

Luôn implement:
1. Route protection (frontend UX)
2. API endpoint authorization (backend security)
3. Permission-based UI hiding (frontend UX)
