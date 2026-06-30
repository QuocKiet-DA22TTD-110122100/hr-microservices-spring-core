# Kết quả kiểm thử bàn giao

## 1. Thông tin môi trường

| Hạng mục | Giá trị |
|---|---|
| Ngày kiểm thử | 2026-06-08 |
| Máy kiểm thử | Local development machine |
| Stack | `compose.minimal.yml` |
| Gateway | `http://localhost:8080` |
| Frontend | `http://127.0.0.1:5173` |
| Ghi chú | Docker minimal runtime đang chạy đủ các service chính và database seed |

## 2. Build check

| Thành phần | Lệnh | Kết quả | Ghi chú |
|---|---|---|---|
| Frontend | `npm run build` | PASS | TypeScript + Vite build thành công |
| Permission unit test | `npx vitest run src/utils/permissions.test.ts` | PASS | 22 tests passed; xác nhận `PAYROLL_OFFICER` có quyền payroll |
| HR service | `.\mvnw.cmd -pl hr-service -am -DskipTests compile` | PASS | Đã ghi nhận trong tài liệu cập nhật kiểm thử |

## 3. Smoke test E2E

Lệnh chạy:

```powershell
.\scripts\smoke-minimal-demo.ps1
```

Kết quả sau restart ngày 2026-06-08:

| Luồng | Kết quả | Bằng chứng/Ghi chú |
|---|---|---|
| Gateway health | PASS | Gateway phản hồi healthcheck |
| Login admin | PASS | Login qua `/api/xac-thuc/dang-nhap` |
| Token available | PASS | Response trả token |
| Validate token | PASS | Validate qua `/api/xac-thuc/kiem-tra` |
| HR employees qua gateway | PASS | Gọi `/api/hr/employees` |
| Projects qua gateway | PASS | Gọi `/api/projects` |
| Tasks qua gateway | PASS | Gọi `/api/tasks` |
| Payroll current employee `#4` | PASS | Gọi `/api/payroll/4/current` |

Tổng kết: 8/8 PASS.

## 4. Load test đăng nhập

Gateway minimal đã được cấu hình riêng cho bài đo hiệu năng đăng nhập:

```text
APP_RATE_LIMIT_LOGIN_LIMIT=120
APP_RATE_LIMIT_LOGIN_WINDOW_SECONDS=60
```

Cấu hình mặc định trong ứng dụng vẫn giữ ngưỡng bảo vệ login `3 request / 5 giây`; ngưỡng `120 / 60 giây` chỉ áp dụng cho minimal Docker runtime để đo tải từ cùng một máy/IP.

Lệnh chạy mốc nhỏ đã xác nhận:

```powershell
.\scripts\load-test-login.ps1 -ConcurrentUsers 3 -TimeoutSeconds 60
```

Lệnh chạy mốc 50 user:

```powershell
.\scripts\load-test-login.ps1 -ConcurrentUsers 50 -TimeoutSeconds 60 -TotalTimeoutSeconds 180
```

Lệnh chạy mốc 100 user:

```powershell
.\scripts\load-test-login.ps1 -ConcurrentUsers 100 -TimeoutSeconds 90 -TotalTimeoutSeconds 240
```

| Mốc tải | Tổng request | Thành công | Lỗi | Error rate | Avg | P95 | P99 | Kết luận |
|---:|---:|---:|---:|---:|---:|---:|---:|---|
| 3 user | 3 | 3 | 0 | 0% | 2674.33 ms | 2808 ms | 2808 ms | PASS |
| 50 user | 50 | 45 | 5 | 10% | 13112.1 ms | 31447 ms | 31489 ms | Chưa đạt KPI, không còn bị 429 rate-limit |
| 100 user | 100 | 57 | 43 | 43% | 20061.41 ms | 30028 ms | 30148 ms | Chưa đạt KPI |
| 200 user | Chưa chạy | Chưa chạy | Chưa chạy | Chưa chạy | Chưa chạy | Chưa chạy | Chưa chạy | Chỉ chạy nếu 100 user ổn |

Ghi chú: sau khi tách cấu hình rate-limit, Gateway không còn trả 429 ở mốc 50/100. Lỗi còn lại là dạng connection receive bị đóng khi tải tăng, cần xem là giới hạn hiệu năng/vận hành của minimal runtime hiện tại. Smoke test sau tải vẫn PASS 8/8.

## 5. Checklist demo chức năng

| Chức năng | Trạng thái code | Trạng thái runtime | Ghi chú |
|---|---|---|---|
| Đăng nhập | Có backend/frontend | PASS API | Đăng nhập admin qua gateway |
| Danh sách nhân viên | Có frontend/API | PASS API | Smoke test gọi HR employees |
| Danh sách dự án | Có frontend/API | PASS API | Smoke test gọi Projects |
| Chi tiết dự án | Đã nâng cấp | Chưa chụp UI | Cần mở frontend và chụp minh họa |
| Phân bổ thành viên | Đã nâng cấp | Chưa chụp UI | Cần mở frontend và chụp minh họa |
| Tạo/sửa task | Đã nâng cấp | Chưa chụp UI | Cần mở frontend và chụp minh họa |
| Payroll page | Đã thêm | PASS API tối thiểu | Payroll current employee `#4` pass qua gateway |
| Smoke test script | Có | PASS | 8/8 |
| Load test script | Có | Có số liệu 3/50/100 user | Mốc 50 và 100 chưa đạt KPI |

## 6. Kết luận hiện tại

Minimal Docker runtime đã chạy đủ cho demo API. Smoke test qua Gateway PASS 8/8, chứng minh các luồng chính gồm gateway, login, token, HR, project, task và payroll current hoạt động được sau restart.

Phần còn lại cần làm trước khi bàn giao cuối là chụp ảnh UI cho các luồng Project/Task/Payroll và ghi rõ hạn chế hiệu năng: minimal runtime hiện tại chưa đạt KPI load login 50/100 user dù đã tách rate-limit cho bài đo.
