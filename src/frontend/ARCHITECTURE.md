# 📐 Kiến trúc Frontend - Hệ thống Quản lý Nhân sự

## 📁 Cấu trúc thư mục tổng quan

```
frontend/
├── public/                 # Tài nguyên tĩnh (images, icons)
├── src/                   # Mã nguồn chính
│   ├── api/              # API service layer
│   ├── components/       # React components
│   │   ├── Layout/      # Layout components
│   │   └── UI/          # UI components tái sử dụng
│   ├── pages/           # Page components (màn hình)
│   ├── store/           # State management (Zustand)
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions
│   ├── App.tsx          # Component chính
│   ├── main.tsx         # Entry point
│   └── index.css        # Global styles
├── index.html           # HTML template
├── package.json         # Dependencies và scripts
├── tsconfig.json        # TypeScript configuration
├── vite.config.ts       # Vite build tool config
└── tailwind.config.js   # Tailwind CSS config
```

---

## 🔍 Chi tiết từng thư mục

### 1️⃣ `/src/api/` - API Service Layer

**Mục đích:** Tập trung tất cả các API calls, dễ quản lý và bảo trì

**Các file:**

#### `auth.api.ts`
```typescript
// Xử lý các API liên quan đến xác thực
- login()          // Đăng nhập
- logout()         // Đăng xuất
- refreshToken()   // Làm mới token
- changePassword() // Đổi mật khẩu
- getProfile()     // Lấy thông tin user
```

#### `employee.api.ts`
```typescript
// Xử lý các API liên quan đến nhân viên
- getAll()    // Lấy danh sách nhân viên
- getById()   // Lấy chi tiết nhân viên
- create()    // Tạo nhân viên mới
- update()    // Cập nhật nhân viên
- delete()    // Xóa nhân viên
- search()    // Tìm kiếm nhân viên
```

#### `department.api.ts`
```typescript
// Xử lý các API liên quan đến phòng ban
- getAll()    // Lấy danh sách phòng ban
- getById()   // Lấy chi tiết phòng ban
- create()    // Tạo phòng ban mới
- update()    // Cập nhật phòng ban
- delete()    // Xóa phòng ban
- getTree()   // Lấy cây phòng ban
```

**Lợi ích:**
- ✅ Tách biệt logic API khỏi UI components
- ✅ Dễ dàng thay đổi endpoint
- ✅ Có thể mock data dễ dàng cho testing
- ✅ Type-safe với TypeScript

---

### 2️⃣ `/src/components/` - React Components

#### **A. `/components/UI/` - UI Components tái sử dụng**

Các component cơ bản có thể dùng lại nhiều nơi:

**`Button.tsx`**
```typescript
// Component nút bấm với nhiều variants
Props:
- variant: 'primary' | 'secondary' | 'danger' | 'success'
- size: 'sm' | 'md' | 'lg'
- isLoading: boolean
- disabled: boolean

Ví dụ:
<Button variant="primary" size="md" isLoading={false}>
  Đăng nhập
</Button>
```

**`Input.tsx`**
```typescript
// Component input với label và error message
Props:
- label: string
- error: string
- type: 'text' | 'email' | 'password' | 'tel'
- placeholder: string
- required: boolean

Ví dụ:
<Input 
  label="Email" 
  type="email" 
  error="Email không hợp lệ"
  required 
/>
```

**`Table.tsx`**
```typescript
// Component bảng dữ liệu với generic type
Props:
- columns: Column<T>[]  // Định nghĩa các cột
- data: T[]             // Dữ liệu hiển thị
- loading: boolean      // Trạng thái loading
- onRowClick: (record: T) => void

Ví dụ:
<Table 
  columns={[
    { key: 'name', title: 'Tên' },
    { key: 'email', title: 'Email' }
  ]}
  data={employees}
  loading={false}
/>
```

**`Modal.tsx`**
```typescript
// Component popup dialog
Props:
- isOpen: boolean
- onClose: () => void
- title: string
- size: 'sm' | 'md' | 'lg' | 'xl'
- children: ReactNode

Ví dụ:
<Modal isOpen={true} onClose={handleClose} title="Thêm nhân viên">
  <form>...</form>
</Modal>
```

#### **B. `/components/Layout/` - Layout Components**

**`MainLayout.tsx`**
```typescript
// Layout chính của ứng dụng
Bao gồm:
- Header: Logo, tên user, nút đăng xuất
- Sidebar: Menu navigation
- Main content area: Nội dung trang

Cấu trúc:
┌─────────────────────────────────┐
│         Header (Fixed)          │
├──────────┬──────────────────────┤
│          │                      │
│ Sidebar  │   Main Content       │
│ (Fixed)  │   (Scrollable)       │
│          │                      │
└──────────┴──────────────────────┘
```

---

### 3️⃣ `/src/pages/` - Page Components

Mỗi page là một màn hình hoàn chỉnh trong ứng dụng:

#### **Authentication Pages**

**`LoginPage.tsx`**
- Form đăng nhập với username và password
- Validation: required fields
- Links: Đăng ký, Quên mật khẩu
- Xử lý: Gọi API login, lưu token, redirect

**`RegisterPage.tsx`**
- Form đăng ký: username, email, fullName, phone, password
- Validation: email format, password strength, confirm password
- Success screen: Hiển thị sau khi đăng ký thành công

**`ForgotPasswordPage.tsx`**
- Form nhập email
- Success screen: Xác nhận đã gửi email

**`ChangePasswordPage.tsx`**
- Form: oldPassword, newPassword, confirmPassword
- Validation: password strength, match confirmation
- Yêu cầu mật khẩu: 8+ ký tự, chữ hoa, chữ thường, số, ký tự đặc biệt

#### **Management Pages**

**`DashboardPage.tsx`**
- Cards thống kê: Tổng nhân viên, phòng ban, nhân viên mới
- Cảnh báo mật khẩu sắp hết hạn
- Hoạt động gần đây

**`EmployeeListPage.tsx`**
- Table danh sách nhân viên
- Search box: Tìm kiếm theo tên, email, mã NV
- Pagination: Phân trang
- Status badges: Đang làm, Nghỉ việc, Nghỉ phép

**`DepartmentListPage.tsx`**
- Table danh sách phòng ban
- Hiển thị: Mã, tên, trưởng phòng, số nhân viên
- Status: Active/Inactive

**`ProfilePage.tsx`**
- Thông tin cá nhân: Avatar, tên, email, phone
- Vai trò và quyền hạn
- Hoạt động gần đây

---

### 4️⃣ `/src/store/` - State Management (Zustand)

**Zustand** là thư viện state management nhẹ, đơn giản hơn Redux.

#### **`authStore.ts`**
```typescript
// Quản lý trạng thái xác thực
State:
- user: User | null           // Thông tin user hiện tại
- isAuthenticated: boolean    // Đã đăng nhập chưa
- isLoading: boolean         // Đang xử lý

Actions:
- setUser(user)              // Lưu thông tin user
- setTokens(access, refresh) // Lưu tokens
- logout()                   // Đăng xuất, xóa data
- checkAuth()                // Kiểm tra trạng thái đăng nhập

Sử dụng:
const { user, isAuthenticated, logout } = useAuthStore();
```

#### **`uiStore.ts`**
```typescript
// Quản lý UI state (notifications, loading)
State:
- notifications: Notification[]  // Danh sách thông báo
- isLoading: boolean            // Loading toàn cục

Actions:
- addNotification(notification) // Thêm thông báo
- removeNotification(id)        // Xóa thông báo
- setLoading(isLoading)         // Set loading state

Sử dụng:
const { addNotification } = useUIStore();
addNotification({
  type: 'success',
  message: 'Đăng nhập thành công!'
});
```

**Lợi ích Zustand:**
- ✅ Đơn giản, ít boilerplate
- ✅ Không cần Provider wrapper
- ✅ TypeScript support tốt
- ✅ Performance cao

---

### 5️⃣ `/src/types/` - TypeScript Type Definitions

Định nghĩa các kiểu dữ liệu cho TypeScript.

#### **`common.ts`**
```typescript
// Các type dùng chung
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

interface PaginatedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}
```

#### **`auth.ts`**
```typescript
// Types cho authentication
interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  roles: string[];
  permissions: string[];
  passwordExpiresAt: string;
}

interface LoginRequest {
  username: string;
  password: string;
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}
```

#### **`employee.ts`**
```typescript
// Types cho nhân viên
interface Employee {
  id: string;
  employeeCode: string;
  fullName: string;
  email: string;
  phone: string;
  position: string;
  departmentId: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE';
  // ... các field khác
}
```

**Lợi ích TypeScript:**
- ✅ Type safety: Phát hiện lỗi sớm
- ✅ Autocomplete: IDE gợi ý code
- ✅ Refactoring: Đổi tên an toàn
- ✅ Documentation: Code tự document

---

### 6️⃣ `/src/utils/` - Utility Functions

Các hàm tiện ích dùng chung.

#### **`axios.ts`**
```typescript
// Cấu hình Axios client
- Base URL: /api
- Timeout: 30s
- Request interceptor: Tự động thêm JWT token vào header
- Response interceptor: 
  * Xử lý 401 (token expired) → Auto refresh token
  * Xử lý 429 (rate limit) → Hiển thị thông báo
  * Xử lý 423 (account locked) → Hiển thị thông báo

Flow refresh token:
1. Request bị 401
2. Gọi API refresh token
3. Lưu token mới
4. Retry request ban đầu
5. Nếu refresh fail → Redirect login
```

#### **`storage.ts`**
```typescript
// Quản lý localStorage
Functions:
- getAccessToken()      // Lấy access token
- setAccessToken(token) // Lưu access token
- getRefreshToken()     // Lấy refresh token
- setRefreshToken(token)// Lưu refresh token
- getUser()            // Lấy thông tin user
- setUser(user)        // Lưu thông tin user
- clear()              // Xóa tất cả

Lưu ý: Dùng localStorage để persist data khi refresh page
```

#### **`format.ts`**
```typescript
// Format dữ liệu hiển thị
Functions:
- formatDate(date, format)           // Format ngày tháng
- formatDateTime(date)               // Format ngày giờ
- formatCurrency(amount)             // Format tiền tệ VND
- getDaysUntilPasswordExpiry(date)   // Tính số ngày đến hết hạn
- getPasswordExpiryWarning(date)     // Tạo cảnh báo hết hạn

Ví dụ:
formatDate('2024-01-15') → '15/01/2024'
formatCurrency(1000000) → '1.000.000 ₫'
```

---

### 7️⃣ Root Files - Các file cấu hình

#### **`App.tsx`**
```typescript
// Component chính của ứng dụng
Chức năng:
- Setup React Router với tất cả routes
- PrivateRoute: Bảo vệ routes cần authentication
- Notification container: Hiển thị toast notifications

Routes:
/login              → LoginPage
/register           → RegisterPage
/forgot-password    → ForgotPasswordPage
/                   → DashboardPage (protected)
/employees          → EmployeeListPage (protected)
/departments        → DepartmentListPage (protected)
/profile            → ProfilePage (protected)
/change-password    → ChangePasswordPage (protected)
```

#### **`main.tsx`**
```typescript
// Entry point của ứng dụng
- Import React và ReactDOM
- Import App component
- Import global CSS
- Render App vào DOM element #root
- Wrap với React.StrictMode
```

#### **`index.css`**
```css
/* Global styles */
- Tailwind directives: @tailwind base, components, utilities
- Reset CSS: margin, padding, box-sizing
- Custom scrollbar styles
- Font family
```

#### **`vite.config.ts`**
```typescript
// Cấu hình Vite build tool
- Plugin: @vitejs/plugin-react
- Alias: @ → src/
- Dev server:
  * Port: 3000
  * Proxy: /api → http://localhost:8080
- Build output: dist/
```

#### **`tsconfig.json`**
```json
// Cấu hình TypeScript
- Target: ES2020
- Module: ESNext
- JSX: react-jsx
- Strict mode: enabled
- Path alias: @/* → src/*
```

#### **`tailwind.config.js`**
```javascript
// Cấu hình Tailwind CSS
- Content: Scan src/**/*.{js,ts,jsx,tsx}
- Theme: Extend với custom colors, spacing
- Plugins: []
```

#### **`package.json`**
```json
// Dependencies và scripts
Scripts:
- dev: Chạy dev server
- build: Build production
- preview: Preview production build
- lint: Chạy ESLint

Dependencies:
- react, react-dom: UI library
- react-router-dom: Routing
- axios: HTTP client
- zustand: State management
- react-hook-form: Form handling
- tailwindcss: CSS framework
- lucide-react: Icons
- date-fns: Date utilities
```

---

## 🔄 Luồng dữ liệu (Data Flow)

### 1. Authentication Flow

```
User nhập form login
    ↓
LoginPage gọi authApi.login()
    ↓
axios gửi POST /api/auth/login
    ↓
Backend trả về { accessToken, refreshToken, user }
    ↓
authStore.setTokens() lưu tokens
authStore.setUser() lưu user info
    ↓
storage.setAccessToken() lưu vào localStorage
storage.setUser() lưu vào localStorage
    ↓
Navigate to Dashboard
```

### 2. Protected Route Flow

```
User truy cập /employees
    ↓
PrivateRoute check authStore.isAuthenticated
    ↓
Nếu false → Redirect to /login
Nếu true → Render EmployeeListPage
```

### 3. API Call Flow

```
Component gọi employeeApi.getAll()
    ↓
axios interceptor thêm Authorization header
    ↓
Gửi GET /api/hr/employees
    ↓
Nếu 401 (token expired):
  - Gọi authApi.refreshToken()
  - Lưu token mới
  - Retry request
    ↓
Nếu 429 (rate limit):
  - Hiển thị notification
  - Reject promise
    ↓
Nếu 200 OK:
  - Return data
  - Component update state
  - Re-render UI
```

### 4. Form Submission Flow

```
User điền form và submit
    ↓
react-hook-form validate
    ↓
Nếu có lỗi → Hiển thị error messages
Nếu OK → Gọi onSubmit handler
    ↓
Set isLoading = true
    ↓
Gọi API (create/update)
    ↓
Nếu thành công:
  - addNotification('success')
  - Navigate hoặc refresh data
Nếu lỗi:
  - addNotification('error')
    ↓
Set isLoading = false
```

---

## 🎨 Styling Strategy

### Tailwind CSS Utility-First

**Ưu điểm:**
- ✅ Không cần viết CSS riêng
- ✅ Consistent design system
- ✅ Responsive dễ dàng
- ✅ Tree-shaking: Chỉ build CSS được dùng

**Ví dụ:**
```tsx
<button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
  Click me
</button>
```

**Responsive:**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Mobile: 1 cột, Tablet: 2 cột, Desktop: 3 cột */}
</div>
```

---

## 🔒 Security Features

### 1. JWT Token Management
- Access token: Lưu trong localStorage
- Refresh token: Lưu trong localStorage
- Auto refresh khi token expired
- Clear tokens khi logout

### 2. Protected Routes
- Check authentication trước khi render
- Redirect to login nếu chưa đăng nhập

### 3. Request Interceptor
- Tự động thêm Authorization header
- Xử lý token expired
- Xử lý rate limiting
- Xử lý account locked

### 4. Form Validation
- Client-side validation với react-hook-form
- Password strength validation
- Email format validation
- Required fields validation

---

## 📊 Performance Optimization

### 1. Code Splitting
- React Router tự động split code theo routes
- Lazy loading components khi cần

### 2. Memoization
- React.memo cho components không thay đổi thường xuyên
- useMemo cho computed values
- useCallback cho functions

### 3. Optimized Re-renders
- Zustand chỉ re-render components subscribe state thay đổi
- React Hook Form không re-render toàn form khi input change

### 4. Build Optimization
- Vite: Fast HMR (Hot Module Replacement)
- Tree-shaking: Loại bỏ code không dùng
- Minification: Nén code production
- Code splitting: Chia nhỏ bundle

---

## 🧪 Testing Strategy (Khuyến nghị)

### Unit Tests
- Test utility functions (format, storage)
- Test API services (mock axios)
- Test custom hooks

### Component Tests
- Test UI components render đúng
- Test user interactions (click, input)
- Test form validation

### Integration Tests
- Test authentication flow
- Test CRUD operations
- Test navigation

### E2E Tests
- Test user journeys hoàn chỉnh
- Test với Cypress hoặc Playwright

---

## 📚 Best Practices

### 1. Component Organization
```
✅ Tốt:
- Một component một file
- Tên file PascalCase (Button.tsx)
- Props interface đặt trên component
- Export default ở cuối file

❌ Tránh:
- Nhiều components trong một file
- Component quá lớn (>300 lines)
- Logic phức tạp trong JSX
```

### 2. State Management
```
✅ Tốt:
- Local state cho UI state (isOpen, isLoading)
- Zustand store cho global state (user, auth)
- React Query cho server state (nếu dùng)

❌ Tránh:
- Prop drilling sâu quá 3 levels
- Duplicate state ở nhiều nơi
- State không cần thiết
```

### 3. API Calls
```
✅ Tốt:
- Tập trung trong api/ folder
- Error handling đầy đủ
- Loading states
- TypeScript types

❌ Tránh:
- API calls trực tiếp trong components
- Không handle errors
- Không có loading states
```

### 4. TypeScript
```
✅ Tốt:
- Định nghĩa types rõ ràng
- Tránh 'any' type
- Interface cho objects
- Type cho primitives

❌ Tránh:
- Dùng 'any' everywhere
- Không type props
- Không type API responses
```

---

## 🚀 Deployment

### Build Production
```bash
npm run build
```

Output: `dist/` folder

### Deploy Options
1. **Static Hosting:**
   - Vercel
   - Netlify
   - GitHub Pages

2. **Server:**
   - Nginx
   - Apache
   - Node.js (serve static)

3. **CDN:**
   - Cloudflare
   - AWS CloudFront

### Environment Variables
Tạo `.env` file:
```
VITE_API_URL=https://api.production.com
VITE_APP_NAME=HR Management
```

Sử dụng:
```typescript
const apiUrl = import.meta.env.VITE_API_URL;
```

---

## 📖 Tài liệu tham khảo

- **React:** https://react.dev
- **TypeScript:** https://www.typescriptlang.org
- **Vite:** https://vitejs.dev
- **Tailwind CSS:** https://tailwindcss.com
- **React Router:** https://reactrouter.com
- **Zustand:** https://github.com/pmndrs/zustand
- **React Hook Form:** https://react-hook-form.com
- **Axios:** https://axios-http.com

---

**Tạo bởi:** Nhóm thực tập 2026
**Cập nhật:** March 2026
