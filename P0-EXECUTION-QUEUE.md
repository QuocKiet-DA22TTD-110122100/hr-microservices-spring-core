# P0 Execution Queue

Danh sách ticket ưu tiên P0, sắp theo thứ tự nên làm để hệ thống đi từ nền tảng đến luồng chạy được đầu tiên.

## Cách dùng

- Mỗi ticket dưới đây nên được giao riêng cho một AI agent hoặc một dev.
- Không nhảy ticket nếu ticket trước là dependency trực tiếp.
- Mỗi ticket phải có PR/build/test riêng trước khi sang ticket tiếp theo.

## Ticket Order

### P0-01 - Chuẩn hóa repository structure
- Nguồn: JIRA-1.1
- Mục tiêu: tách rõ ranh giới service và cấu trúc repo.
- Input: danh sách service hiện có, kiến trúc mục tiêu.
- Output: folder structure rõ ràng cho `api-gateway`, `auth-service`, `hr-service`, `kms`, `eureka-server`, `frontend`, `observability`, `compose`.
- Done: mỗi service nằm một chỗ, không còn code lẫn không kiểm soát.
- Ưu tiên: cao nhất vì mọi ticket sau đều dựa vào structure này.

### P0-02 - Boot Eureka server
- Nguồn: JIRA-1.2
- Depends on: P0-01
- Mục tiêu: service discovery hoạt động.
- Input: project Spring Boot cho discovery.
- Output: Eureka Server chạy được ở `localhost:8761`.
- Done: service khác register lên Eureka thành công và dashboard mở được.

### P0-03 - Boot API Gateway
- Nguồn: JIRA-1.3
- Depends on: P0-01, P0-02
- Mục tiêu: tạo entrypoint duy nhất.
- Input: route public/protected.
- Output: gateway route request về đúng service.
- Done: client chỉ đi vào gateway, không gọi trực tiếp service nội bộ.

### P0-04 - Split compose by layer
- Nguồn: JIRA-1.4
- Depends on: P0-01
- Mục tiêu: tách deploy theo lớp.
- Input: topology infra/iam/hr/edge.
- Output: `compose.infra.yml`, `compose.iam.yml`, `compose.hr.yml`, `compose.edge.yml`.
- Done: up/down từng lớp độc lập và đúng thứ tự phụ thuộc.

### P0-05 - Design user entity
- Nguồn: JIRA-2.1
- Depends on: P0-01
- Mục tiêu: dựng model IAM cơ bản.
- Input: model user tối thiểu cho auth.
- Output: entity có `id`, `username`, `passwordHash`, `role`, `createdAt`.
- Done: entity lưu/đọc được từ DB.

### P0-06 - Implement password hashing
- Nguồn: JIRA-2.2
- Depends on: P0-05
- Mục tiêu: không lưu mật khẩu plaintext.
- Input: plaintext password.
- Output: password hash bằng BCrypt hoặc encoder đang dùng.
- Done: DB không lưu plaintext; login vẫn verify đúng.

### P0-07 - Implement register API
- Nguồn: JIRA-2.3
- Depends on: P0-05, P0-06
- Mục tiêu: tạo user mới.
- Input: `username`, `password`, `role`.
- Output: `POST /api/iam/register` tạo user.
- Done: user trùng bị chặn; request sai format bị validate.

### P0-08 - Implement login API
- Nguồn: JIRA-2.4
- Depends on: P0-05, P0-06
- Mục tiêu: cấp token khi xác thực đúng.
- Input: `username`, `password`.
- Output: `POST /api/iam/login` trả token.
- Done: credential đúng thì login thành công; sai credential bị từ chối rõ ràng.

### P0-09 - Implement JWT generation
- Nguồn: JIRA-2.5
- Depends on: P0-08
- Mục tiêu: token stateless có claim chuẩn.
- Input: user hợp lệ sau login.
- Output: JWT chứa `userId`, `username`, `role(s)`, `exp`, `jti`.
- Done: token verify lại được bằng JWKS/public key.

### P0-10 - Implement validate token API
- Nguồn: JIRA-2.6
- Depends on: P0-09
- Mục tiêu: có endpoint check token độc lập.
- Input: token từ client hoặc gateway.
- Output: `POST /api/iam/verify` hoặc endpoint tương đương.
- Done: token hợp lệ trả claims; token sai/hết hạn bị chặn.

### P0-11 - Key management service
- Nguồn: JIRA-3.1
- Depends on: P0-01
- Mục tiêu: có nơi quản lý key ký token.
- Input: yêu cầu sinh key để signing.
- Output: service quản lý key pair active và rotation.
- Done: có key active sẵn để ký JWT.

### P0-12 - Public JWKS endpoint
- Nguồn: JIRA-3.2
- Depends on: P0-11
- Mục tiêu: public key để verify token.
- Input: public key hiện hành.
- Output: `GET /.well-known/jwks.json`.
- Done: gateway/auth lấy được JWKS để verify token.

### P0-13 - Sign endpoint
- Nguồn: JIRA-3.3
- Depends on: P0-11
- Mục tiêu: ký payload cho JWT/message.
- Input: payload cần ký từ auth-service.
- Output: chữ ký hợp lệ.
- Done: chữ ký verify được bằng public key tương ứng.

### P0-14 - Design employee entity
- Nguồn: JIRA-4.1
- Depends on: P0-01
- Mục tiêu: dựng model HR tối thiểu.
- Input: model nhân sự.
- Output: entity có `id`, `name`, `username`, `authUserId`, `position`, `departmentId`.
- Done: entity map được DB và dùng trong CRUD.

### P0-15 - Design department entity
- Nguồn: JIRA-4.2
- Depends on: P0-14
- Mục tiêu: dựng model phòng ban.
- Input: model phòng ban.
- Output: entity department với quan hệ rõ.
- Done: department lưu/đọc được qua repository/service.

### P0-16 - CRUD employee
- Nguồn: JIRA-4.3
- Depends on: P0-14
- Mục tiêu: quản lý nhân viên.
- Input: dữ liệu nhân viên.
- Output: `GET/POST/PUT/DELETE /employees`.
- Done: tạo, sửa, xóa, xem nhân viên hoạt động ổn định.

### P0-17 - CRUD department
- Nguồn: JIRA-4.4
- Depends on: P0-15
- Mục tiêu: quản lý phòng ban.
- Input: dữ liệu phòng ban.
- Output: `GET/POST/PUT/DELETE /departments`.
- Done: phòng ban hoạt động ổn định và validate đúng.

### P0-18 - Internal sync endpoint
- Nguồn: JIRA-4.5
- Depends on: P0-14, P0-05
- Mục tiêu: đồng bộ auth -> hr qua endpoint nội bộ.
- Input: user mới từ auth-service.
- Output: `POST /employees/internal/users/sync`.
- Done: endpoint chỉ nhận qua luồng nội bộ có secret; sync tạo/update employee mapping đúng.

### P0-19 - JWT gateway filter
- Nguồn: JIRA-5.1
- Depends on: P0-03, P0-10, P0-12
- Mục tiêu: gateway chặn request không hợp lệ sớm.
- Input: request có/không có token.
- Output: gateway kiểm tra token trước khi forward.
- Done: request không hợp lệ bị chặn; request hợp lệ đi tiếp.

### P0-20 - Route protection metadata
- Nguồn: JIRA-5.2
- Depends on: P0-03
- Mục tiêu: tách public/protected/internal rõ ràng.
- Input: danh sách route.
- Output: route metadata cho phép public, yêu cầu JWT, hoặc internal secret.
- Done: endpoint quan trọng không bị mở nhầm ra public.

### P0-21 - Login/register rate limit
- Nguồn: JIRA-5.3
- Depends on: P0-19, P0-07, P0-08
- Mục tiêu: giảm spam/brute-force.
- Input: traffic nóng từ login/register.
- Output: throttle chống spam.
- Done: request vượt ngưỡng trả 429 rõ ràng.

### P0-22 - Header sanitization
- Nguồn: JIRA-5.4
- Depends on: P0-03
- Mục tiêu: chặn spoof header.
- Input: request client có header giả mạo.
- Output: gateway strip internal headers.
- Done: client không thể tự spoof quyền nội bộ.

### P0-23 - Token blacklist cache
- Nguồn: JIRA-7.4
- Depends on: P0-09
- Mục tiêu: revoke token bằng Redis.
- Input: token revoked.
- Output: blacklist token trong Redis.
- Done: token đã revoke không dùng lại được.

### P0-24 - Dockerize each service
- Nguồn: JIRA-10.1
- Depends on: P0-02, P0-03, P0-05, P0-11, P0-14
- Mục tiêu: mỗi service có image chạy được.
- Input: source từng service.
- Output: Dockerfile riêng cho từng service.
- Done: build image từng service chạy được.

### P0-25 - Compose orchestration
- Nguồn: JIRA-10.2
- Depends on: P0-24, P0-04
- Mục tiêu: chạy hệ thống bằng compose theo lớp.
- Input: topology service và dependencies.
- Output: compose files theo lớp.
- Done: infra -> iam -> hr -> edge chạy đúng thứ tự.

## Gợi ý thứ tự thực thi ngắn

1. P0-01
2. P0-02
3. P0-03
4. P0-04
5. P0-05 -> P0-06 -> P0-07 -> P0-08 -> P0-09 -> P0-10
6. P0-11 -> P0-12 -> P0-13
7. P0-14 -> P0-15 -> P0-16 -> P0-17 -> P0-18
8. P0-19 -> P0-20 -> P0-21 -> P0-22
9. P0-23
10. P0-24 -> P0-25

## Rule khi giao AI

- Chỉ giao một ticket một lần.
- Nếu ticket có dependency chưa xong thì không giao sớm.
- Mỗi ticket cần output kiểm chứng được trước khi sang ticket tiếp theo.
