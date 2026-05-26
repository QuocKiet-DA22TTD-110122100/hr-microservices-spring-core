# Hệ thống Quản lý Nhân sự - Frontend

Frontend application cho hệ thống quản lý nhân sự, được xây dựng với React + TypeScript + Vite.

## Công nghệ sử dụng

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Router** - Routing
- **Zustand** - State management
- **Axios** - HTTP client
- **React Hook Form** - Form handling
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **date-fns** - Date formatting

## Cài đặt

```bash
# Cài đặt dependencies
npm install

# Hoặc sử dụng yarn
yarn install
```

## Chạy ứng dụng

```bash
# Development mode
npm run dev

# Build production
npm run build

# Preview production build
npm run preview
```

## Cấu trúc thư mục

```
src/
├── api/              # API service calls
├── components/       # Reusable components
│   ├── Layout/      # Layout components
│   └── UI/          # UI components
├── pages/           # Page components
├── store/           # Zustand stores
├── types/           # TypeScript types
├── utils/           # Utility functions
├── App.tsx          # Main app component
└── main.tsx         # Entry point
```

## Tính năng

### Xác thực & Bảo mật
- Đăng nhập với JWT
- Tự động refresh token
- Xử lý rate limiting (429)
- Xử lý account locked (423)
- Đổi mật khẩu với validation
- Cảnh báo mật khẩu sắp hết hạn

### Quản lý Nhân viên
- Danh sách nhân viên với phân trang
- Tìm kiếm nhân viên
- Thêm/Sửa/Xóa nhân viên
- Xem chi tiết nhân viên

### Quản lý Phòng ban
- Danh sách phòng ban
- Cấu trúc phòng ban dạng cây
- Thêm/Sửa/Xóa phòng ban

### UI/UX
- Responsive design
- Loading states
- Error handling
- Toast notifications
- Modal dialogs

## API Configuration

API endpoint được cấu hình trong `vite.config.ts`:

```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8080',
      changeOrigin: true,
    },
  },
}
```

Thay đổi `target` để trỏ đến backend server của bạn.

## Environment Variables

Tạo file `.env` trong thư mục frontend:

```env
VITE_API_URL=http://localhost:8080/api
```

## Build & Deploy

```bash
# Build production
npm run build

# Output sẽ ở thư mục dist/
# Deploy thư mục dist/ lên web server
```

## Yêu cầu Backend API

Frontend này yêu cầu backend API với các endpoints:

### Auth
- POST `/api/auth/login` - Đăng nhập
- POST `/api/auth/logout` - Đăng xuất
- POST `/api/auth/refresh` - Refresh token
- POST `/api/auth/change-password` - Đổi mật khẩu
- GET `/api/auth/profile` - Lấy thông tin user

### HR Service
- GET `/api/hr/employees` - Danh sách nhân viên
- GET `/api/hr/employees/:id` - Chi tiết nhân viên
- POST `/api/hr/employees` - Tạo nhân viên
- PUT `/api/hr/employees/:id` - Cập nhật nhân viên
- DELETE `/api/hr/employees/:id` - Xóa nhân viên
- GET `/api/hr/departments` - Danh sách phòng ban
- GET `/api/hr/departments/:id` - Chi tiết phòng ban
- POST `/api/hr/departments` - Tạo phòng ban
- PUT `/api/hr/departments/:id` - Cập nhật phòng ban
- DELETE `/api/hr/departments/:id` - Xóa phòng ban

## License

Private - Dự án thực tập 2026
