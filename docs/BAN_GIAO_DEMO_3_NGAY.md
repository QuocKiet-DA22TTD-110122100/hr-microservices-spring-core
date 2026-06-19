# Bàn giao demo 3 ngày cuối

## 1. Phạm vi demo đã chuẩn bị

Các luồng ưu tiên cho báo cáo/bàn giao:

- Đăng nhập và phân quyền qua API Gateway.
- Quản lý nhân viên, phòng ban, tổ chức.
- Quản lý dự án, phân bổ thành viên, quản lý task.
- Quản lý bảng lương tối thiểu: tạo kỳ lương, tính lương, phê duyệt, từ chối, xử lý chi trả.
- Smoke test và load test đăng nhập.

## 2. Lệnh chạy minimal stack

Chạy từ thư mục gốc repository:

```powershell
.\scripts\run-minimal-demo.ps1 -Build
```

Nếu image đã build rồi:

```powershell
.\scripts\run-minimal-demo.ps1
```

Nếu chỉ muốn bật stack, chưa nạp seed:

```powershell
.\scripts\run-minimal-demo.ps1 -SkipSeed
```

Script này thực hiện:

- `docker compose -f compose.minimal.yml up -d`
- Chờ health các service: KMS, Auth, HR, Project, Task, Gateway.
- Copy và nạp các file seed:
  - `docker/seed/minimal-auth-seed.sql`
  - `docker/seed/minimal-hr-seed.sql`
  - `docker/seed/minimal-business-seed.sql`

## 3. Lệnh chạy frontend

```powershell
cd frontend
npm run dev -- --host 127.0.0.1 --port 5173
```

URL:

- Frontend: `http://127.0.0.1:5173`
- Payroll page: `http://127.0.0.1:5173/payroll`
- Gateway: `http://localhost:8080`

## 4. Tài khoản demo

Các tài khoản seed dùng chung mật khẩu demo hiện có trong hệ thống:

| Username | Vai trò | Mục đích demo |
|---|---|---|
| `admin` | `ADMIN` | Quản trị toàn hệ thống |
| `hr.manager` | `HR_MANAGER` | Quản lý nhân sự, xem payroll |
| `payroll.officer` | `PAYROLL_OFFICER` | Phê duyệt, từ chối, xử lý lương |
| `manager` | `MANAGER` | Quản lý dự án/task |
| `employee` | `USER` | Tài khoản người dùng cơ bản |

## 5. Dữ liệu mẫu đã chuẩn bị

| Nhóm dữ liệu | File seed | Nội dung |
|---|---|---|
| Auth | `minimal-auth-seed.sql` | Admin, HR manager, Payroll officer, Manager, Employee |
| HR | `minimal-hr-seed.sql` | Organization units, departments, 13 employees, payroll run/result/history |
| Project/Task | `minimal-business-seed.sql` | 4 projects, 12 assignments, 14 tasks |

Payroll seed có sẵn:

- Payroll `PROCESSED` cho employee `#4`.
- Payroll `APPROVED` cho employee `#5`.
- Payroll `DRAFT` cho employee `#6`.
- Payroll `DRAFT` cho payroll officer `#13`.

## 6. Smoke test

Sau khi stack chạy và seed xong:

```powershell
.\scripts\smoke-minimal-demo.ps1
```

Script kiểm tra:

- Gateway health.
- Login qua `/api/xac-thuc/dang-nhap`.
- Token có tồn tại.
- Validate token.
- Gọi HR employees qua gateway.
- Gọi Projects qua gateway.
- Gọi Tasks qua gateway.
- Gọi Payroll current employee `#4` qua gateway.

## 6.1. Demo Payroll bằng HTTP/Postman

Nếu cần demo nghiệp vụ payroll bằng API thay vì UI, dùng file:

```text
payroll-demo.http
```

File này có sẵn các request:

- Login.
- Validate token.
- List employees.
- Create payroll run.
- Calculate payroll.
- Get current payroll.
- Approve payroll.
- Reject payroll.
- Process payroll.
- Payroll history.

## 7. Load test đăng nhập

Mốc 50 user:

```powershell
.\scripts\load-test-login.ps1 -ConcurrentUsers 50 -TimeoutSeconds 60 -TotalTimeoutSeconds 180
```

Mốc 100 user:

```powershell
.\scripts\load-test-login.ps1 -ConcurrentUsers 100 -TimeoutSeconds 90 -TotalTimeoutSeconds 240
```

Chỉ chạy mốc 200 user nếu 100 user ổn định:

```powershell
.\scripts\load-test-login.ps1 -ConcurrentUsers 200
```

Chỉ số script xuất ra:

- Tổng request.
- Số request thành công.
- Số request lỗi.
- Tỷ lệ lỗi.
- Response time trung bình.
- P95.
- P99.

Cấu hình minimal runtime dùng cho bài đo tải đăng nhập:

```text
APP_RATE_LIMIT_LOGIN_LIMIT=120
APP_RATE_LIMIT_LOGIN_WINDOW_SECONDS=60
```

Ngưỡng này chỉ áp dụng cho `compose.minimal.yml` để đo hiệu năng. Mặc định ứng dụng vẫn giữ policy bảo vệ login thấp hơn.

## 8. Thứ tự demo đề xuất

1. Đăng nhập bằng `admin`.
2. Mở danh sách nhân viên để chứng minh HR data.
3. Mở danh sách dự án.
4. Vào chi tiết dự án, xem thành viên và task.
5. Tạo task mới, chọn dự án và người phụ trách.
6. Mở `Bang luong`.
7. Chọn nhân viên, tháng lương, bấm `Tinh luong`.
8. Phê duyệt bảng lương.
9. Xử lý chi trả.
10. Chạy smoke test và trình bày kết quả pass/fail.
11. Chạy load test đăng nhập mốc 50 hoặc 100 user và ghi số liệu.

## 9. Trạng thái kiểm chứng hiện tại

Đã kiểm chứng:

- `frontend` build pass bằng `npm run build`.
- Các script PowerShell mới parse OK:
  - `scripts/run-minimal-demo.ps1`
  - `scripts/smoke-minimal-demo.ps1`
  - `scripts/load-test-login.ps1`
- Docker minimal runtime đang chạy đủ các container chính và ở trạng thái healthy:
  - `minimal-gateway`
  - `minimal-auth`
  - `minimal-hr`
  - `minimal-project`
  - `minimal-task`
  - `minimal-kms`
  - `minimal-redis`
  - `minimal-auth-postgres`
  - `minimal-hr-mysql`
  - `minimal-business-mysql`
- Smoke test sau restart ngày 2026-06-08 PASS 8/8:
  - Gateway health.
  - Login admin.
  - Token available.
  - Validate token.
  - HR employees.
  - Projects.
  - Tasks.
  - Payroll current employee `#4`.
- Load test đăng nhập sau khi tách rate-limit cho minimal/performance runtime:
  - Tổng request: 3.
  - Thành công: 3.
  - Lỗi: 0.
  - Error rate: 0%.
  - Avg: 2674.33 ms.
  - P95/P99: 2808 ms.
  - Mốc 50: 45/50 success, error rate 10%, avg 13112.1 ms, p95 31447 ms, p99 31489 ms.
  - Mốc 100: 57/100 success, error rate 43%, avg 20061.41 ms, p95 30028 ms, p99 30148 ms.
  - Smoke test sau tải vẫn PASS 8/8.

Giới hạn còn lại:

- Mốc 50/100 concurrent login đã có số liệu nhưng chưa đạt KPI. Sau khi tăng ngưỡng rate-limit cho minimal runtime, Gateway không còn trả 429; lỗi còn lại là connection receive bị đóng khi tải cao.
- Đây là hạn chế hiệu năng/vận hành của minimal runtime hiện tại, cần ghi rõ trong báo cáo thay vì ghi là đã chịu tải 50/100 user ổn định.

Lệnh kiểm tra lại nhanh:

```powershell
docker ps
.\scripts\smoke-minimal-demo.ps1
.\scripts\load-test-login.ps1 -ConcurrentUsers 3 -TimeoutSeconds 60 -TotalTimeoutSeconds 120
.\scripts\load-test-login.ps1 -ConcurrentUsers 50 -TimeoutSeconds 60 -TotalTimeoutSeconds 180
```

## 10. Câu ghi vào báo cáo trạng thái hiện tại

> Nhóm đã chạy được minimal runtime bằng Docker, nạp dữ liệu mẫu và kiểm chứng smoke test qua API Gateway. Kết quả ngày 2026-06-08 cho thấy các luồng gateway, đăng nhập, xác thực token, HR, project, task và payroll current đều PASS 8/8. Với bài đo tải đăng nhập, nhóm đã tách cấu hình rate-limit cho minimal runtime để đo mốc 50/100 request đồng thời từ cùng một máy/IP. Kết quả hiện tại: 3 request đồng thời PASS 0% lỗi; 50 request đồng thời đạt 45/50 thành công, lỗi 10%, p95 31.447s; 100 request đồng thời đạt 57/100 thành công, lỗi 43%, p95 30.028s. Vì vậy hệ thống demo chạy ổn cho luồng chức năng, nhưng chưa đạt KPI hiệu năng đăng nhập ở mốc 50/100 user.
