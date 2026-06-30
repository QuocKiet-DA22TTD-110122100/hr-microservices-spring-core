# Hướng dẫn Chạy Project Frontend

## Yêu cầu hệ thống

- Node.js >= 18.x
- npm >= 9.x hoặc yarn >= 1.22.x

## Cài đặt

1. Di chuyển vào thư mục frontend:
```bash
cd frontend
```

2. Cài đặt dependencies:
```bash
npm install
```

## Chạy Development Server

```bash
npm run dev
```

Ứng dụng sẽ chạy tại: `http://localhost:3000`

## Build Production

```bash
npm run build
```

Output sẽ được tạo trong thư mục `dist/`

## Preview Production Build

```bash
npm run preview
```

## Kiểm tra Lỗi

### TypeScript
```bash
npx tsc --noEmit
```

### ESLint
```bash
npm run lint
```

## Cấu hình Backend API

Mặc định, frontend sẽ proxy tất cả requests `/api/*` đến `http://localhost:8080`

Để thay đổi, chỉnh sửa file `vite.config.ts`:

```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://your-backend-url:port',
      changeOrigin: true,
    },
  },
}
```

## Cấu trúc Thư mục

```
frontend/
├── public/              # Static assets
├── src/
│   ├── api/            # API service calls
│   ├── components/     # React components
│   │   ├── Layout/    # Layout components
│   │   └── UI/        # Reusable UI components
│   ├── pages/         # Page components
│   ├── store/         # Zustand state management
│   ├── types/         # TypeScript type definitions
│   ├── utils/         # Utility functions
│   ├── App.tsx        # Main app component
│   ├── main.tsx       # Entry point
│   └── index.css      # Global styles
├── index.html         # HTML template
├── package.json       # Dependencies
├── tsconfig.json      # TypeScript config
├── vite.config.ts     # Vite config
└── tailwind.config.js # Tailwind CSS config
```

## Tính năng Đã Implement

✅ Authentication (Login/Logout)
✅ JWT Token Management (Auto refresh)
✅ Rate Limiting Handler
✅ Account Lock Handler
✅ Password Expiry Warning
✅ Change Password
✅ Employee Management (List, Search, Pagination)
✅ Department Management (List)
✅ Dashboard
✅ Responsive Design
✅ Toast Notifications

## Tính năng Cần Phát triển Thêm

- [ ] Form thêm/sửa nhân viên
- [ ] Form thêm/sửa phòng ban
- [ ] Chi tiết nhân viên
- [ ] Chi tiết phòng ban
- [ ] Quản lý phân quyền
- [ ] Xem logs/audit trail
- [ ] Export data (Excel, PDF)
- [ ] Upload avatar nhân viên
- [ ] Biểu đồ thống kê
- [ ] Lọc và sắp xếp nâng cao

## Troubleshooting

### Port 3000 đã được sử dụng

Thay đổi port trong `vite.config.ts`:
```typescript
server: {
  port: 3001, // Đổi sang port khác
}
```

### CORS Error

Đảm bảo backend đã cấu hình CORS cho phép origin `http://localhost:3000`

### Module not found

Xóa `node_modules` và cài lại:
```bash
rm -rf node_modules
npm install
```

## Liên hệ

Nếu gặp vấn đề, vui lòng liên hệ team leader hoặc tạo issue trong repository.
