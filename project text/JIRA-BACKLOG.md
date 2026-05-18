# Jira Backlog

Tài liệu này là backlog triển khai theo kiểu Jira để có thể giao từng task nhỏ cho AI agent hoặc team. Mỗi task đều có mục tiêu rõ, input, output, done condition, dependency và mức ưu tiên.

## Quy ước

- `EPIC`: nhóm lớn theo chủ đề.
- `STORY`: task có thể giao độc lập.
- `DONE`: tiêu chí xong rõ ràng, kiểm được ngay.
- `DEPENDS ON`: task cần hoàn thành trước.
- `PRIORITY`: P0 cao nhất, P1 cao, P2 bình thường.

## EPIC-1: Foundation

Mục tiêu: dựng nền tảng repo, service discovery, gateway, compose chạy được.

### JIRA-1.1 - Standardize repository structure
- Type: STORY
- Priority: P0
- Depends on: none
- Input: danh sách service hiện có và kiến trúc mục tiêu.
- Output: cấu trúc thư mục rõ ràng cho `api-gateway`, `auth-service`, `hr-service`, `kms`, `eureka-server`, `frontend`, `observability`, `compose`.
- Done: mỗi service có ranh giới riêng, không còn code lẫn không kiểm soát.

### JIRA-1.2 - Boot Eureka server
- Type: STORY
- Priority: P0
- Depends on: JIRA-1.1
- Input: project Spring Boot cho discovery.
- Output: Eureka Server chạy được ở `localhost:8761`.
- Done: service khác register lên Eureka thành công và dashboard mở được.

### JIRA-1.3 - Boot API Gateway
- Type: STORY
- Priority: P0
- Depends on: JIRA-1.1, JIRA-1.2
- Input: yêu cầu entrypoint duy nhất và danh sách route.
- Output: gateway route được request public/protected về đúng service.
- Done: client chỉ đi vào gateway, không gọi trực tiếp service nội bộ.

### JIRA-1.4 - Split compose by layer
- Type: STORY
- Priority: P0
- Depends on: JIRA-1.1
- Input: topology infra/iam/hr/edge.
- Output: `compose.infra.yml`, `compose.iam.yml`, `compose.hr.yml`, `compose.edge.yml`.
- Done: có thể up/down từng lớp độc lập và chạy đúng thứ tự phụ thuộc.

## EPIC-2: Auth Service

Mục tiêu: đăng ký, đăng nhập, cấp token, validate token, revoke token, đổi mật khẩu.

### JIRA-2.1 - Design user entity
- Type: STORY
- Priority: P0
- Depends on: JIRA-1.1
- Input: model user tối thiểu cho IAM.
- Output: entity có `id`, `username`, `passwordHash`, `role`, `createdAt`.
- Done: entity lưu/đọc được từ database.

### JIRA-2.2 - Implement password hashing
- Type: STORY
- Priority: P0
- Depends on: JIRA-2.1
- Input: plaintext password từ register/change password.
- Output: password hash bằng BCrypt hoặc encoder đang dùng.
- Done: DB không lưu plaintext; login vẫn verify đúng.

### JIRA-2.3 - Implement register API
- Type: STORY
- Priority: P0
- Depends on: JIRA-2.1, JIRA-2.2
- Input: `username`, `password`, `role`.
- Output: `POST /api/iam/register` tạo user.
- Done: tạo thành công user mới; username trùng bị chặn; request sai format bị validate.

### JIRA-2.4 - Implement login API
- Type: STORY
- Priority: P0
- Depends on: JIRA-2.1, JIRA-2.2
- Input: `username`, `password`.
- Output: `POST /api/iam/login` trả token.
- Done: credential đúng thì login thành công; credential sai bị từ chối rõ ràng.

### JIRA-2.5 - Implement JWT generation
- Type: STORY
- Priority: P0
- Depends on: JIRA-2.4
- Input: user hợp lệ sau login.
- Output: JWT chứa `userId`, `username`, `role(s)`, `exp`, `jti`.
- Done: token verify lại được bằng JWKS/public key.

### JIRA-2.6 - Implement validate token API
- Type: STORY
- Priority: P0
- Depends on: JIRA-2.5
- Input: token từ client hoặc gateway.
- Output: `POST /api/iam/verify` hoặc endpoint tương đương.
- Done: token hợp lệ trả claims; token sai/hết hạn bị chặn.

### JIRA-2.7 - Implement revoke token
- Type: STORY
- Priority: P1
- Depends on: JIRA-2.5, JIRA-7.4
- Input: token đã cấp.
- Output: blacklist token hoặc endpoint revoke.
- Done: token bị revoke không dùng lại được.

### JIRA-2.8 - Implement change password
- Type: STORY
- Priority: P1
- Depends on: JIRA-2.2, JIRA-2.4
- Input: username, old password, new password.
- Output: endpoint đổi mật khẩu.
- Done: old password đúng mới đổi được; new password phải qua policy.

## EPIC-3: KMS Service

Mục tiêu: quản lý khóa ký và JWKS cho JWT.

### JIRA-3.1 - Key management service
- Type: STORY
- Priority: P0
- Depends on: JIRA-1.1
- Input: yêu cầu sinh key để ký token.
- Output: service quản lý key pair active và rotation.
- Done: có key active sẵn để ký JWT.

### JIRA-3.2 - Public JWKS endpoint
- Type: STORY
- Priority: P0
- Depends on: JIRA-3.1
- Input: public key hiện hành.
- Output: `GET /.well-known/jwks.json`.
- Done: gateway/auth lấy được JWKS để verify token.

### JIRA-3.3 - Sign endpoint
- Type: STORY
- Priority: P0
- Depends on: JIRA-3.1
- Input: payload cần ký từ auth-service.
- Output: chữ ký hợp lệ cho JWT hoặc message signing.
- Done: chữ ký verify được bằng public key tương ứng.

### JIRA-3.4 - Cache key material
- Type: STORY
- Priority: P1
- Depends on: JIRA-3.2, JIRA-3.3
- Input: key/JWKS dùng nhiều lần.
- Output: cache key material với TTL.
- Done: giảm số lần truy xuất/generate key không cần thiết.

## EPIC-4: HR Service

Mục tiêu: quản lý nhân sự và nhận sync nội bộ từ auth.

### JIRA-4.1 - Design employee entity
- Type: STORY
- Priority: P0
- Depends on: JIRA-1.1
- Input: model nhân sự tối thiểu.
- Output: entity có `id`, `name`, `username`, `authUserId`, `position`, `departmentId`.
- Done: entity map được DB và dùng trong CRUD.

### JIRA-4.2 - Design department entity
- Type: STORY
- Priority: P0
- Depends on: JIRA-4.1
- Input: model phòng ban.
- Output: entity department với quan hệ rõ với tổ chức nếu cần.
- Done: department lưu/đọc được qua repository/service.

### JIRA-4.3 - CRUD employee
- Type: STORY
- Priority: P0
- Depends on: JIRA-4.1
- Input: dữ liệu nhân viên từ UI hoặc API.
- Output: `GET/POST/PUT/DELETE /employees`.
- Done: tạo, sửa, xóa, xem nhân viên hoạt động ổn định.

### JIRA-4.4 - CRUD department
- Type: STORY
- Priority: P0
- Depends on: JIRA-4.2
- Input: dữ liệu phòng ban.
- Output: `GET/POST/PUT/DELETE /departments`.
- Done: phòng ban hoạt động ổn định và validate đúng.

### JIRA-4.5 - Internal sync endpoint
- Type: STORY
- Priority: P0
- Depends on: JIRA-4.1, JIRA-2.3
- Input: user mới từ auth-service.
- Output: `POST /employees/internal/users/sync`.
- Done: endpoint chỉ nhận qua luồng nội bộ có secret; sync tạo/update employee mapping đúng.

### JIRA-4.6 - Sync idempotency
- Type: STORY
- Priority: P1
- Depends on: JIRA-4.5
- Input: event sync lặp lại cùng `eventId` hoặc `userId`.
- Output: chống ghi trùng.
- Done: cùng một event không sinh record trùng.

## EPIC-5: Gateway Security

Mục tiêu: bảo vệ request, route đúng, giảm tải sớm.

### JIRA-5.1 - JWT gateway filter
- Type: STORY
- Priority: P0
- Depends on: JIRA-1.3, JIRA-2.5, JIRA-3.2
- Input: request có/không có token.
- Output: gateway kiểm tra token trước khi forward.
- Done: request không hợp lệ bị chặn; request hợp lệ đi tiếp.

### JIRA-5.2 - Route protection metadata
- Type: STORY
- Priority: P0
- Depends on: JIRA-1.3
- Input: danh sách route public/protected/internal.
- Output: route metadata yêu cầu JWT, public, hoặc internal secret.
- Done: endpoint quan trọng không bị mở nhầm ra public.

### JIRA-5.3 - Login/register rate limit
- Type: STORY
- Priority: P0
- Depends on: JIRA-5.1, JIRA-7.4
- Input: traffic nóng từ login/register.
- Output: throttle chống spam/brute-force.
- Done: request vượt ngưỡng trả 429 rõ ràng.

### JIRA-5.4 - Header sanitization
- Type: STORY
- Priority: P0
- Depends on: JIRA-1.3
- Input: request client có header giả mạo.
- Output: gateway strip `X-Auth-*` và internal headers.
- Done: client không thể tự spoof quyền nội bộ.

## EPIC-6: Authorization

Mục tiêu: phân quyền rõ theo role/permission.

### JIRA-6.1 - Role model
- Type: STORY
- Priority: P0
- Depends on: JIRA-2.1, JIRA-4.1
- Input: tập role cần hỗ trợ.
- Output: role chuẩn như `ADMIN`, `MANAGER`, `USER`.
- Done: role có chuẩn hóa, không ghi lung tung giữa service.

### JIRA-6.2 - Permission model
- Type: STORY
- Priority: P1
- Depends on: JIRA-6.1
- Input: tác vụ cần bảo vệ.
- Output: permission mapping cho CRUD, assign, approve, admin operations.
- Done: endpoint có thể gắn permission rõ ràng.

### JIRA-6.3 - Permission check middleware
- Type: STORY
- Priority: P0
- Depends on: JIRA-5.1, JIRA-6.1
- Input: token claims hoặc header nội bộ.
- Output: cơ chế check quyền trước khi vào business logic.
- Done: user không đủ quyền bị chặn đúng status code.

### JIRA-6.4 - Task-level authorization
- Type: STORY
- Priority: P0
- Depends on: JIRA-6.3, JIRA-9.3
- Input: task thuộc project và user đang thao tác.
- Output: chỉ member hợp lệ mới được assign/update.
- Done: user ngoài project không thể sửa task không thuộc phạm vi.

## EPIC-7: Redis Cache

Mục tiêu: giảm tải, giảm latency, tránh gọi chéo quá nhiều.

### JIRA-7.1 - Cache JWKS
- Type: STORY
- Priority: P0
- Depends on: JIRA-3.2, JIRA-5.1
- Input: JWKS từ KMS.
- Output: cache JWKS với TTL.
- Done: gateway/auth không phải gọi KMS mỗi request.

### JIRA-7.2 - Cache user info
- Type: STORY
- Priority: P1
- Depends on: JIRA-2.1, JIRA-4.1
- Input: thông tin user đọc nhiều.
- Output: cache profile hoặc user lookup.
- Done: đọc lặp lại nhanh hơn và có invalidation hợp lý.

### JIRA-7.3 - Cache permission/role
- Type: STORY
- Priority: P1
- Depends on: JIRA-6.1, JIRA-6.2
- Input: role/permission ít đổi.
- Output: cache mapping quyền.
- Done: check quyền giảm truy vấn DB.

### JIRA-7.4 - Token blacklist cache
- Type: STORY
- Priority: P0
- Depends on: JIRA-2.7
- Input: token revoked.
- Output: blacklist token trong Redis.
- Done: token đã revoke không dùng lại được.

## EPIC-8: Project Service

Mục tiêu: quản lý dự án và thành viên dự án.

### JIRA-8.1 - Design project entity
- Type: STORY
- Priority: P0
- Depends on: JIRA-1.1
- Input: model dự án.
- Output: entity `project` với `id`, `name`, `ownerId`.
- Done: project lưu/đọc được.

### JIRA-8.2 - Create project
- Type: STORY
- Priority: P0
- Depends on: JIRA-8.1
- Input: thông tin project mới.
- Output: `POST /projects`.
- Done: project tạo được và gắn owner đúng.

### JIRA-8.3 - Add project member
- Type: STORY
- Priority: P0
- Depends on: JIRA-8.1, JIRA-6.1
- Input: project id, user id, member role.
- Output: endpoint thêm thành viên.
- Done: member chỉ được thêm nếu user hợp lệ và không trùng bất thường.

### JIRA-8.4 - Get project list
- Type: STORY
- Priority: P1
- Depends on: JIRA-8.1
- Input: filter theo user/owner.
- Output: endpoint list project.
- Done: người dùng thấy đúng project của mình.

## EPIC-9: Task Service

Mục tiêu: quản lý công việc theo project và người được assign.

### JIRA-9.1 - Design task entity
- Type: STORY
- Priority: P0
- Depends on: JIRA-1.1, JIRA-8.1
- Input: model công việc.
- Output: entity có `title`, `description`, `status`, `assignedTo`, `projectId`.
- Done: task map được DB.

### JIRA-9.2 - Create task
- Type: STORY
- Priority: P0
- Depends on: JIRA-9.1
- Input: title, description, project.
- Output: `POST /tasks`.
- Done: task tạo đúng project.

### JIRA-9.3 - Assign task
- Type: STORY
- Priority: P0
- Depends on: JIRA-8.3, JIRA-9.1
- Input: task id, user id.
- Output: assign task cho member.
- Done: chỉ member project mới được assign.

### JIRA-9.4 - Update task status
- Type: STORY
- Priority: P1
- Depends on: JIRA-9.1
- Input: status mới.
- Output: cập nhật `TODO -> DOING -> DONE`.
- Done: luồng trạng thái hợp lệ, không nhảy sai.

### JIRA-9.5 - Get tasks by user
- Type: STORY
- Priority: P1
- Depends on: JIRA-9.1, JIRA-6.4
- Input: user id/token.
- Output: list task theo user.
- Done: user chỉ thấy task đúng phạm vi.

## EPIC-10: Deployment

Mục tiêu: container hóa và chạy đồng bộ bằng compose.

### JIRA-10.1 - Dockerize each service
- Type: STORY
- Priority: P0
- Depends on: JIRA-1.1
- Input: source từng service.
- Output: Dockerfile riêng cho `gateway`, `auth-service`, `hr-service`, `kms`, `eureka-server`, `frontend`.
- Done: build image từng service chạy được.

### JIRA-10.2 - Compose orchestration
- Type: STORY
- Priority: P0
- Depends on: JIRA-10.1
- Input: topology service và dependencies.
- Output: compose files theo lớp chạy được độc lập.
- Done: infra -> iam -> hr -> edge chạy đúng thứ tự.

### JIRA-10.3 - Healthcheck tuning
- Type: STORY
- Priority: P1
- Depends on: JIRA-10.2
- Input: startup time của từng service.
- Output: healthcheck/start_period phù hợp.
- Done: service chậm khởi động không bị đánh fail giả.

## EPIC-11: Observability

Mục tiêu: biết hệ thống đang làm gì và lỗi ở đâu.

### JIRA-11.1 - Logging chuẩn
- Type: STORY
- Priority: P1
- Depends on: JIRA-1.3
- Input: request/response/error.
- Output: log có trace đủ để lần theo flow.
- Done: đọc log là biết request đi qua service nào và fail ở đâu.

### JIRA-11.2 - Metrics và monitoring
- Type: STORY
- Priority: P1
- Depends on: JIRA-10.2
- Input: metric runtime và HTTP status.
- Output: Prometheus/Grafana dashboard.
- Done: nhìn dashboard biết service nào quá tải hoặc lỗi tăng.

### JIRA-11.3 - Alert rule cơ bản
- Type: STORY
- Priority: P2
- Depends on: JIRA-11.2
- Input: ngưỡng error/latency/rate limit.
- Output: alert cho 429, 5xx, startup fail.
- Done: có cảnh báo sớm khi hệ thống bất thường.

## EPIC-12: Frontend (Optional)

Mục tiêu: giao diện tối thiểu để test end-to-end.

### JIRA-12.1 - Login page
- Type: STORY
- Priority: P1
- Depends on: JIRA-2.4, JIRA-5.1
- Input: username/password.
- Output: trang login gọi API thật.
- Done: login thành công và lưu token.

### JIRA-12.2 - Dashboard
- Type: STORY
- Priority: P2
- Depends on: JIRA-12.1
- Input: token + claims.
- Output: dashboard sau login.
- Done: user thấy thông tin đúng vai trò.

### JIRA-12.3 - Task UI
- Type: STORY
- Priority: P2
- Depends on: JIRA-9.2, JIRA-9.4
- Input: task list, create task, assign task.
- Output: màn hình thao tác task.
- Done: thao tác task qua UI được end-to-end.

## EPIC-13: Control Checklist

Mục tiêu: chống AI hoặc team làm sai phạm vi.

### JIRA-13.1 - Verify service split
- Type: CHECK
- Priority: P0
- Depends on: all epics relevant
- Input: source code và compose.
- Output: xác nhận service đã tách ranh giới.
- Done: không service nào chứa logic của service khác một cách lẫn lộn.

### JIRA-13.2 - Verify JWT and role checks
- Type: CHECK
- Priority: P0
- Depends on: JIRA-5.1, JIRA-6.3
- Input: token test cases.
- Output: xác nhận token và role được kiểm.
- Done: endpoint protected chặn đúng người, đúng quyền.

### JIRA-13.3 - Verify DB separation
- Type: CHECK
- Priority: P0
- Depends on: JIRA-2.1, JIRA-4.1, JIRA-8.1, JIRA-9.1
- Input: kết nối DB của từng service.
- Output: mỗi service có DB riêng hoặc schema riêng theo design.
- Done: không trộn chung data domain sai phạm vi.

### JIRA-13.4 - Verify deployment order
- Type: CHECK
- Priority: P0
- Depends on: JIRA-10.2
- Input: compose files.
- Output: thứ tự up service đúng.
- Done: infra -> iam -> hr -> edge chạy không vỡ dependency.

## Cách dùng backlog này

- Mỗi lần giao cho AI, chỉ chọn 1 task.
- Mô tả rõ `Input`, `Output`, `Done condition` của task đó.
- Nếu task lớn, tách tiếp thành subtasks nhỏ hơn thay vì làm một lần.
- Ưu tiên theo thứ tự: Foundation -> Auth -> KMS -> Security -> HR/Task -> Deploy -> Observability -> Frontend.
