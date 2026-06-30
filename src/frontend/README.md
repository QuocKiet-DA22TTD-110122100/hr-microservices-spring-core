# Frontend

Frontend cho hệ thống quản lý nhân sự, xây dựng bằng React + TypeScript + Vite.

## Yêu cầu

- Node.js 20+
- `npm` đi kèm `package-lock.json`

## Cài đặt

```bash
cd frontend
npm ci
```

## Chạy cục bộ

```bash
npm run dev
```

Mặc định ứng dụng chạy bằng Vite dev server. API backend được proxy qua `vite.config.ts` tới `http://localhost:8080`.

## Kiểm tra chất lượng

```bash
npm run lint
npm run test
npm run build
```

Nếu muốn format toàn bộ file:

```bash
npm run format
```

## Cấu hình môi trường

Tạo file `frontend/.env` nếu cần override API URL:

```env
VITE_API_URL=http://localhost:8080/api
```

## Build và deploy

### Build local

```bash
npm run build
```

Kết quả nằm trong thư mục `dist/`.

### Build Docker image

```bash
docker build -t hr-frontend:latest ./frontend
```

### Chạy với compose

`compose.edge.yml` hỗ trợ cả `build` lẫn `image`:

```bash
FRONTEND_IMAGE=hr-frontend:latest docker compose -f compose.edge.yml up -d frontend
```

Nếu muốn build tại chỗ thì chỉ cần:

```bash
docker compose -f compose.edge.yml up -d --build frontend
```

## Ghi chú backend

Frontend cần backend API qua gateway để đăng nhập và gọi các endpoint HR/Auth.
