# AI Task Breakdown

Mục tiêu của tài liệu này là chia dự án thành các task cực nhỏ để AI agent hoặc team có thể làm từng bước độc lập, không quên input, output, và điều kiện xong.

## 0. Quy tắc điều phối

- Mỗi task chỉ có 1 mục tiêu duy nhất.
- Mỗi task phải có `Input`, `Output`, `Done condition`.
- Mỗi task nên đủ nhỏ để hoàn thành trong 1 ngày hoặc ít hơn.
- Task xong phải kiểm chứng được bằng build, test, endpoint, hoặc compose.
- Không bắt đầu task phụ nếu task cha chưa có output rõ ràng.

## 1. EPIC 1 - Foundation

Mục tiêu: tạo skeleton hệ thống microservices chạy được, có discovery, gateway, và nền tảng compose.

### Task 1.1 - Chuẩn hóa repo structure

- Input: danh sách service hiện có trong repo.
- Output: folder structure rõ ràng cho `api-gateway`, `auth-service`, `hr-service`, `kms`, `eureka-server`, `frontend`, `redis`, `observability`, `docker-compose`.
- Done condition: mỗi service nằm một chỗ, không còn code lẫn ranh giới.

### Task 1.2 - Khởi động Eureka Server

- Input: Spring Boot project cho discovery.
- Output: service discovery hoạt động và dashboard mở được tại `localhost:8761`.
- Done condition: các service khác có thể register lên Eureka thành công.

### Task 1.3 - Gateway entrypoint

- Input: danh sách route public/protected.
- Output: gateway route được `/api/iam/*`, `/employees/*`, `/kms/*`, và các route nội bộ cần thiết.
- Done condition: client chỉ đi vào gateway, không gọi trực tiếp service nội bộ.

### Task 1.4 - Compose tách lớp

- Input: topology infra/iam/hr/edge.
- Output: compose chia thành `compose.infra.yml`, `compose.iam.yml`, `compose.hr.yml`, `compose.edge.yml`.
- Done condition: có thể bật từng lớp riêng và thấy dependency chạy đúng thứ tự.

## 2. EPIC 2 - Auth Service

Mục tiêu: đăng ký, đăng nhập, cấp token, verify/revoke token, đổi mật khẩu.

### Task 2.1 - User entity tối thiểu

- Input: model user cần cho IAM.
- Output: entity có `id`, `username`, `passwordHash`, `role`, `createdAt`.
- Done condition: entity lưu/đọc được từ DB.

### Task 2.2 - Password hashing

- Input: plaintext password từ register/change password.
- Output: password hash bằng BCrypt hoặc encoder đang dùng trong codebase.
- Done condition: không còn lưu plaintext trong DB.

### Task 2.3 - Register endpoint

- Input: `username`, `password`, `role` nếu cần.
- Output: `POST /api/iam/register` hoặc route tương đương.
- Done condition: tạo user thành công; username trùng bị chặn; dữ liệu hợp lệ được validate.

### Task 2.4 - Login endpoint

- Input: `username`, `password`.
- Output: `POST /api/iam/login` trả token.
- Done condition: credential đúng thì login thành công; credential sai bị từ chối rõ ràng.

### Task 2.5 - JWT generation

- Input: user đã xác thực.
- Output: JWT chứa `userId`, `username`, `role(s)`, `exp`, `jti`.
- Done condition: token có thể verify lại bằng JWKS/public key.

### Task 2.6 - Validate token endpoint

- Input: token từ client hoặc gateway.
- Output: `POST /api/iam/verify` hoặc endpoint tương đương.
- Done condition: token hợp lệ trả claims; token sai/hết hạn bị chặn.

### Task 2.7 - Revoke token

- Input: token đã cấp.
- Output: endpoint revoke hoặc blacklist token.
- Done condition: token bị revoke thì request sau bị từ chối.

### Task 2.8 - Change password

- Input: username, old password, new password.
- Output: endpoint đổi mật khẩu.
- Done condition: old password đúng mới đổi được; mật khẩu mới không vi phạm policy.

## 3. EPIC 3 - KMS Service

Mục tiêu: quản lý khóa ký và JWKS cho JWT.

### Task 3.1 - Key management entity/service

- Input: yêu cầu sinh key cho signing.
- Output: service quản lý key pair hiện hành và key rotation.
- Done condition: có key active để ký token.

### Task 3.2 - Public JWKS endpoint

- Input: public key hiện hành.
- Output: `GET /.well-known/jwks.json` hoặc route tương đương.
- Done condition: gateway/auth có thể lấy JWKS để verify token.

### Task 3.3 - Sign endpoint

- Input: payload cần ký từ auth-service.
- Output: chữ ký hợp lệ cho JWT hoặc message signing.
- Done condition: chữ ký sinh ra và verify được bởi public key tương ứng.

### Task 3.4 - Cache key material

- Input: key được dùng nhiều lần.
- Output: cache key/JWKS với TTL hợp lý.
- Done condition: giảm số lần truy xuất/generate key không cần thiết.

## 4. EPIC 4 - HR Service

Mục tiêu: quản lý dữ liệu nhân sự và nhận sync nội bộ từ auth.

### Task 4.1 - Employee entity

- Input: model nhân sự tối thiểu.
- Output: entity có `id`, `name`, `username`, `authUserId`, `position`, `departmentId` hoặc cấu trúc tương đương.
- Done condition: entity map được DB và dùng trong CRUD.

### Task 4.2 - Department entity

- Input: model phòng ban.
- Output: entity cho department với quan hệ rõ với organization unit nếu cần.
- Done condition: department lưu/đọc được qua repository/service.

### Task 4.3 - CRUD employee

- Input: dữ liệu nhân viên từ UI hoặc API.
- Output: `GET/POST/PUT/DELETE /employees`.
- Done condition: có thể tạo, sửa, xóa, xem nhân viên; validate dữ liệu hợp lệ.

### Task 4.4 - CRUD department

- Input: dữ liệu phòng ban.
- Output: `GET/POST/PUT/DELETE /departments`.
- Done condition: phòng ban hoạt động ổn định, không tạo bản ghi lỗi.

### Task 4.5 - Internal sync endpoint

- Input: user mới từ auth-service.
- Output: `POST /employees/internal/users/sync` hoặc route nội bộ tương đương.
- Done condition: endpoint chỉ nhận được từ luồng nội bộ có secret; sync thành công tạo/ cập nhật employee mapping.

### Task 4.6 - Sync idempotency

- Input: event sync lặp lại cùng `eventId` hoặc `userId`.
- Output: chống ghi trùng.
- Done condition: cùng một event không làm sinh record nhân sự trùng.

## 5. EPIC 5 - Gateway Security

Mục tiêu: chặn request sai, route đúng, giảm tải sớm ở điểm vào.

### Task 5.1 - JWT filter ở gateway

- Input: request có/không có token.
- Output: gateway tự validate token trước khi forward.
- Done condition: request không hợp lệ bị chặn; request hợp lệ đi tiếp.

### Task 5.2 - Route protection

- Input: danh sách route public/protected.
- Output: route metadata cho phép public, yêu cầu JWT, hoặc yêu cầu internal secret.
- Done condition: endpoint quan trọng không bị mở nhầm ra public.

### Task 5.3 - Rate limit login/register

- Input: traffic nóng từ login/register.
- Output: throttle để giảm spam và brute-force.
- Done condition: giới hạn request hiệu quả và có message 429 rõ ràng.

### Task 5.4 - Header sanitization

- Input: request từ client có header giả mạo.
- Output: gateway strip `X-Auth-*` và header nội bộ không cho client tự set.
- Done condition: client không thể tự spoof quyền nội bộ.

## 6. EPIC 6 - Authorization

Mục tiêu: phân quyền rõ ràng theo role/permission.

### Task 6.1 - Role model

- Input: tập role cần hỗ trợ.
- Output: role chuẩn như `ADMIN`, `MANAGER`, `USER`.
- Done condition: role có chuẩn hóa, không bị ghi lung tung giữa service.

### Task 6.2 - Permission model

- Input: tác vụ cần bảo vệ.
- Output: permission mapping cho CRUD, assign, approve, admin operations.
- Done condition: endpoint có thể gắn permission rõ ràng.

### Task 6.3 - Middleware/annotation check

- Input: token claims hoặc header nội bộ.
- Output: cơ chế check quyền trước khi vào business logic.
- Done condition: user không đủ quyền bị chặn đúng status code.

### Task 6.4 - Task-level authorization

- Input: task thuộc project và user đang thao tác.
- Output: chỉ member hợp lệ mới được assign/update.
- Done condition: user ngoài project không thể sửa task không thuộc phạm vi.

## 7. EPIC 7 - Redis Cache

Mục tiêu: giảm tải và tăng tốc cho các luồng đọc lặp lại.

### Task 7.1 - Cache JWKS

- Input: JWKS từ KMS.
- Output: cache JWKS với TTL.
- Done condition: gateway/auth không phải gọi KMS mỗi request.

### Task 7.2 - Cache user info

- Input: thông tin user đọc nhiều.
- Output: cache profile hoặc lookup user.
- Done condition: đọc lặp lại nhanh hơn và có invalidation hợp lý.

### Task 7.3 - Cache permission/role

- Input: role/permission ít đổi.
- Output: cache mapping quyền.
- Done condition: check quyền giảm truy vấn DB.

### Task 7.4 - Token blacklist cache

- Input: token revoked.
- Output: blacklist token trong Redis.
- Done condition: token đã revoke không dùng lại được.

## 8. EPIC 8 - Project Service

Mục tiêu: quản lý dự án và thành viên dự án.

### Task 8.1 - Project entity

- Input: model dự án.
- Output: entity `project` với `id`, `name`, `ownerId`.
- Done condition: project lưu/đọc được.

### Task 8.2 - Create project

- Input: thông tin project mới.
- Output: `POST /projects`.
- Done condition: project tạo được và gắn owner đúng.

### Task 8.3 - Add project member

- Input: project id, user id, member role.
- Output: endpoint thêm thành viên.
- Done condition: member chỉ được thêm nếu user hợp lệ và không trùng bất thường.

### Task 8.4 - Get project list

- Input: filter theo user/owner.
- Output: endpoint list project.
- Done condition: người dùng thấy đúng project của mình.

## 9. EPIC 9 - Task Service

Mục tiêu: quản lý công việc theo project và người được assign.

### Task 9.1 - Task entity

- Input: model công việc.
- Output: entity có `title`, `description`, `status`, `assignedTo`, `projectId`.
- Done condition: task map được DB.

### Task 9.2 - Create task

- Input: title, description, project.
- Output: `POST /tasks`.
- Done condition: task tạo đúng project.

### Task 9.3 - Assign task

- Input: task id, user id.
- Output: assign task cho member.
- Done condition: chỉ member project mới được assign.

### Task 9.4 - Update task status

- Input: status mới.
- Output: cập nhật `TODO -> DOING -> DONE`.
- Done condition: luồng trạng thái hợp lệ, không bị nhảy sai.

### Task 9.5 - Get tasks by user

- Input: user id/token.
- Output: list task theo user.
- Done condition: user chỉ thấy task đúng phạm vi.

## 10. EPIC 10 - Deployment

Mục tiêu: đóng gói, chạy, và triển khai theo lớp.

### Task 10.1 - Dockerize each service

- Input: source từng service.
- Output: Dockerfile riêng cho `gateway`, `auth-service`, `hr-service`, `kms`, `eureka-server`, `frontend`.
- Done condition: build image từng service chạy được.

### Task 10.2 - Compose orchestration

- Input: topology service và dependencies.
- Output: compose files theo lớp chạy được độc lập.
- Done condition: infra -> iam -> hr -> edge chạy đúng thứ tự.

### Task 10.3 - Healthcheck tuning

- Input: startup time của từng service.
- Output: healthcheck/start_period phù hợp.
- Done condition: service chậm khởi động không bị đánh fail giả.

## 11. EPIC 11 - Observability

Mục tiêu: biết hệ thống đang làm gì và lỗi ở đâu.

### Task 11.1 - Logging chuẩn

- Input: request/response/error.
- Output: log có trace đủ để lần theo flow.
- Done condition: đọc log là biết request đi qua service nào và fail ở đâu.

### Task 11.2 - Metrics và monitoring

- Input: metric runtime và HTTP status.
- Output: Prometheus/Grafana dashboard.
- Done condition: nhìn dashboard biết service nào quá tải hoặc lỗi tăng.

### Task 11.3 - Alert rule cơ bản

- Input: ngưỡng error/latency/rate limit.
- Output: alert cho 429, 5xx, startup fail.
- Done condition: có cảnh báo sớm khi hệ thống bất thường.

## 12. EPIC 12 - Frontend (Optional)

Mục tiêu: giao diện tối thiểu để test end-to-end.

### Task 12.1 - Login page

- Input: username/password.
- Output: trang login gọi API thật.
- Done condition: login thành công và lưu token.

### Task 12.2 - Dashboard

- Input: token + claims.
- Output: dashboard sau login.
- Done condition: user thấy thông tin đúng vai trò.

### Task 12.3 - Task UI

- Input: task list, create task, assign task.
- Output: màn hình thao tác task.
- Done condition: thao tác task qua UI được end-to-end.

## 13. Checklist chống AI làm sai

Trước khi kết luận task xong, phải check từng câu sau:

- Có tách service chưa?
- Có validate JWT chưa?
- Có check role chưa?
- Có tách DB chưa?
- Có route qua gateway chưa?
- Có chặn endpoint nội bộ chưa?
- Có cache/rate limit ở chỗ cần thiết chưa?
- Có output rõ ràng cho task chưa?
- Có done condition kiểm được chưa?

## 14. Cách giao việc cho AI

- `Làm Task 2.4: viết Login API bằng Spring Boot, có JWT, trả access token`.
- `Làm Task 5.1: viết JWT filter ở gateway`.
- `Làm Task 9.3: viết logic assign task chỉ cho member project`.
- `Làm Task 10.2: viết compose orchestration theo lớp`.

## 15. Ghi chú vận hành

- Nếu task vượt quá 1 ngày, phải tách tiếp thành task nhỏ hơn.
- Mỗi task xong nên có lệnh kiểm tra hoặc test đi kèm.
- Không mở task phụ nếu task cha chưa ra output rõ.
- Ưu tiên làm Foundation -> Auth -> Security -> HR/Task -> Deploy -> Observability -> Frontend.
