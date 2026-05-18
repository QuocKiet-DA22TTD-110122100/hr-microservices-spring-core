# Jira Agent Cards

Tài liệu này bẻ nhỏ backlog P0/P1 thành các ticket đủ nhỏ để giao song song cho nhiều AI agent hoặc dev. Mỗi card có phạm vi hẹp, một đầu ra rõ, và điều kiện xong kiểm được ngay.

## Quy ước

- Mỗi card chỉ nên sửa một cụm file hoặc một luồng nghiệp vụ rất hẹp.
- Không ghép nhiều concern khác nhau trong cùng một card.
- Nếu một card có thể làm trong một PR nhỏ thì đủ nhỏ.
- Ưu tiên làm theo dependency, nhưng các card cùng tầng và không phụ thuộc nhau có thể chạy song song.

## Wave 1: Foundation

### CARD-F01 - Inventory repository structure
- Parent: JIRA-1.1
- Depends on: none
- Input: tree repo hiện tại và danh sách service chuẩn.
- Output: sơ đồ thư mục thực tế theo service và layer.
- Done: có bản map rõ các module, compose file, observability, frontend, scripts.

### CARD-F02 - Normalize root docs
- Parent: JIRA-1.1
- Depends on: CARD-F01
- Input: file README, deployment guide, checklist, backlog.
- Output: các file tài liệu root dẫn link đúng sang nhau.
- Done: người mới vào repo hiểu được luồng triển khai trong 1 lần đọc.

### CARD-F03 - Eureka bootstrap skeleton
- Parent: JIRA-1.2
- Depends on: JIRA-1.1
- Input: module eureka-server.
- Output: application class, config tối thiểu, dashboard boot được.
- Done: service chạy ở `localhost:8761` và mở dashboard được.

### CARD-F04 - Eureka registration sanity
- Parent: JIRA-1.2
- Depends on: CARD-F03
- Input: một service client thử register.
- Output: cấu hình client tối thiểu và log register thành công.
- Done: service khác thấy được trên Eureka registry.

### CARD-F05 - Gateway bootstrap skeleton
- Parent: JIRA-1.3
- Depends on: JIRA-1.2
- Input: module api-gateway.
- Output: gateway app chạy và expose health endpoint.
- Done: gateway lên được độc lập trước khi gắn route.

### CARD-F06 - Gateway route map public
- Parent: JIRA-1.3
- Depends on: CARD-F05
- Input: danh sách route public hiện có.
- Output: route public forward đúng về service đích.
- Done: ít nhất một route công khai đi xuyên qua gateway thành công.

### CARD-F07 - Gateway route map protected
- Parent: JIRA-1.3
- Depends on: CARD-F05, JIRA-2.5
- Input: route cần token.
- Output: route protected có metadata và filter hook.
- Done: request không có token bị chặn.

### CARD-F08 - Compose infra split
- Parent: JIRA-1.4
- Depends on: JIRA-1.1
- Input: docker-compose gốc và topology infra.
- Output: `compose.infra.yml`.
- Done: infra layer chạy riêng được.

### CARD-F09 - Compose iam split
- Parent: JIRA-1.4
- Depends on: JIRA-1.1, CARD-F08
- Input: topology IAM.
- Output: `compose.iam.yml`.
- Done: auth và kms chạy riêng được sau infra.

### CARD-F10 - Compose hr split
- Parent: JIRA-1.4
- Depends on: JIRA-1.1, CARD-F08
- Input: topology HR.
- Output: `compose.hr.yml`.
- Done: HR layer chạy riêng được sau infra.

### CARD-F11 - Compose edge split
- Parent: JIRA-1.4
- Depends on: JIRA-1.1, CARD-F09, CARD-F10
- Input: topology edge.
- Output: `compose.edge.yml`.
- Done: edge layer chỉ kéo gateway/frontend và không phá dependency.

## Wave 2: Auth Service

### CARD-A01 - User entity fields
- Parent: JIRA-2.1
- Depends on: JIRA-1.1
- Input: model user tối thiểu.
- Output: entity và migration/DDL cho `id`, `username`, `passwordHash`, `role`, `createdAt`.
- Done: đọc/ghi user được qua repository.

### CARD-A02 - User repository query set
- Parent: JIRA-2.1
- Depends on: CARD-A01
- Input: truy vấn theo username/id.
- Output: repository methods đủ cho register/login.
- Done: service layer không phải query thủ công bằng string.

### CARD-A03 - Password encoder wiring
- Parent: JIRA-2.2
- Depends on: CARD-A01
- Input: plaintext password.
- Output: bean encoder và helper hash/verify.
- Done: plaintext không còn được lưu.

### CARD-A04 - Register request validation
- Parent: JIRA-2.3
- Depends on: CARD-A01, CARD-A03
- Input: payload register.
- Output: DTO validation, error response chuẩn.
- Done: request sai format bị reject sớm.

### CARD-A05 - Register service flow
- Parent: JIRA-2.3
- Depends on: CARD-A02, CARD-A03, CARD-A04
- Input: username/password/role.
- Output: use case tạo user mới.
- Done: username trùng bị chặn và user mới lưu thành công.

### CARD-A06 - Login request validation
- Parent: JIRA-2.4
- Depends on: CARD-A01
- Input: payload login.
- Output: DTO validation cho login.
- Done: payload thiếu field trả lỗi rõ.

### CARD-A07 - Login authentication flow
- Parent: JIRA-2.4
- Depends on: CARD-A02, CARD-A03, CARD-A06
- Input: username/password.
- Output: auth flow xác thực đúng/sai.
- Done: credential đúng thành công, sai bị từ chối.

### CARD-A08 - JWT claims builder
- Parent: JIRA-2.5
- Depends on: CARD-A07
- Input: user hợp lệ.
- Output: builder tạo claims `userId`, `username`, `role(s)`, `exp`, `jti`.
- Done: token sinh ra có claim ổn định.

### CARD-A09 - JWKS client wiring
- Parent: JIRA-2.5, JIRA-3.2
- Depends on: CARD-A08
- Input: JWKS URI.
- Output: cấu hình client đọc key public.
- Done: auth/gateway verify được token bằng public key.

### CARD-A10 - Token verify endpoint
- Parent: JIRA-2.6
- Depends on: CARD-A08, CARD-A09
- Input: token từ client/gateway.
- Output: endpoint verify trả claims hoặc lỗi.
- Done: token hợp lệ pass, token lỗi fail.

### CARD-A11 - Change password flow
- Parent: JIRA-2.8
- Depends on: CARD-A03, CARD-A07
- Input: old password, new password.
- Output: use case đổi mật khẩu.
- Done: chỉ đổi khi old password đúng và new password hợp policy.

## Wave 3: KMS Service

### CARD-K01 - Key store model
- Parent: JIRA-3.1
- Depends on: JIRA-1.1
- Input: requirement key pair active.
- Output: model lưu active key và metadata rotation.
- Done: có khung dữ liệu cho key management.

### CARD-K02 - Key generation bootstrap
- Parent: JIRA-3.1
- Depends on: CARD-K01
- Input: startup service.
- Output: active key pair sinh khi service khởi động.
- Done: service luôn có key active sẵn.

### CARD-K03 - JWKS endpoint contract
- Parent: JIRA-3.2
- Depends on: CARD-K02
- Input: public key active.
- Output: response contract cho `/.well-known/jwks.json`.
- Done: consumer đọc được JWKS hợp lệ.

### CARD-K04 - Signing service contract
- Parent: JIRA-3.3
- Depends on: CARD-K02
- Input: payload cần ký.
- Output: service sign/verify helper.
- Done: chữ ký verify lại được bằng public key.

### CARD-K05 - KMS health and startup tuning
- Parent: JIRA-3.1, JIRA-10.3
- Depends on: CARD-K02
- Input: startup timing thực tế.
- Output: healthcheck/start_period phù hợp.
- Done: compose không đánh fail giả khi KMS khởi động chậm.

## Wave 4: HR Service

### CARD-H01 - Employee entity fields
- Parent: JIRA-4.1
- Depends on: JIRA-1.1
- Input: model nhân viên.
- Output: entity `id`, `name`, `username`, `authUserId`, `position`, `departmentId`.
- Done: entity map DB được.

### CARD-H02 - Department entity fields
- Parent: JIRA-4.2
- Depends on: JIRA-1.1
- Input: model phòng ban.
- Output: entity department và relation cơ bản.
- Done: lưu/đọc department được.

### CARD-H03 - Employee repository/service
- Parent: JIRA-4.3
- Depends on: CARD-H01
- Input: thao tác CRUD employee.
- Output: repository + service methods.
- Done: tạo/sửa/xóa/xem employee chạy qua service layer.

### CARD-H04 - Department repository/service
- Parent: JIRA-4.4
- Depends on: CARD-H02
- Input: thao tác CRUD department.
- Output: repository + service methods.
- Done: tạo/sửa/xóa/xem department chạy qua service layer.

### CARD-H05 - Internal sync DTO contract
- Parent: JIRA-4.5
- Depends on: JIRA-2.3, CARD-H01
- Input: payload sync user từ auth.
- Output: DTO contract cho internal sync.
- Done: auth và HR dùng cùng schema.

### CARD-H06 - Internal sync endpoint security
- Parent: JIRA-4.5
- Depends on: CARD-H05
- Input: `X-Internal-Secret`.
- Output: filter/guard cho sync endpoint.
- Done: request thiếu secret bị chặn.

### CARD-H07 - Internal sync idempotent write
- Parent: JIRA-4.6
- Depends on: CARD-H05, CARD-H06
- Input: sync event lặp.
- Output: create-or-update logic chống trùng.
- Done: cùng user/event không sinh record duplicate.

## Wave 5: Gateway Security

### CARD-G01 - JWT filter skeleton
- Parent: JIRA-5.1
- Depends on: JIRA-1.3, JIRA-2.5, JIRA-3.2
- Input: request bất kỳ.
- Output: filter xác định public/protected.
- Done: gateway có điểm chặn auth duy nhất.

### CARD-G02 - JWT validation branch
- Parent: JIRA-5.1
- Depends on: CARD-G01
- Input: token header.
- Output: verify token bằng JWKS cache.
- Done: token sai/hết hạn bị chặn.

### CARD-G03 - Route protection metadata schema
- Parent: JIRA-5.2
- Depends on: JIRA-1.3
- Input: danh sách route.
- Output: schema public/protected/internal.
- Done: không route quan trọng nào bị mở nhầm.

### CARD-G04 - Header sanitization rules
- Parent: JIRA-5.4
- Depends on: JIRA-1.3
- Input: header client giả mạo.
- Output: strip headers nội bộ trước khi forward.
- Done: client không spoof được quyền nội bộ.

### CARD-G05 - Login/register rate limit hooks
- Parent: JIRA-5.3
- Depends on: CARD-G01, JIRA-7.4
- Input: traffic login/register.
- Output: rule throttle.
- Done: vượt ngưỡng trả 429.

## Wave 6: Authorization and Redis

### CARD-R01 - Role enum normalization
- Parent: JIRA-6.1
- Depends on: JIRA-2.1, JIRA-4.1
- Input: role names từ auth/hr.
- Output: enum/constant role chuẩn.
- Done: role không bị lệch giữa service.

### CARD-R02 - Permission matrix skeleton
- Parent: JIRA-6.2
- Depends on: CARD-R01
- Input: tác vụ CRUD/assign/approve.
- Output: map permission cơ bản.
- Done: có bảng quyền để gắn vào endpoint.

### CARD-R03 - Permission check middleware
- Parent: JIRA-6.3
- Depends on: CARD-R01, JIRA-5.1
- Input: token claims/header nội bộ.
- Output: middleware check quyền trước business logic.
- Done: user thiếu quyền bị chặn.

### CARD-R04 - Token blacklist data model
- Parent: JIRA-7.4, JIRA-2.7
- Depends on: JIRA-2.5
- Input: token revoked.
- Output: key format blacklist trong Redis.
- Done: token revocation có chỗ lưu nhất quán.

### CARD-R05 - Redis cache wiring
- Parent: JIRA-7.1, JIRA-7.2, JIRA-7.3
- Depends on: JIRA-1.1
- Input: cache needs from JWT/user/role lookups.
- Output: Redis config và cache helper chung.
- Done: các service dùng cache theo cùng pattern.

## Wave 7: Project and Task

### CARD-P01 - Project entity fields
- Parent: JIRA-8.1
- Depends on: JIRA-1.1
- Input: model project.
- Output: entity `id`, `name`, `ownerId`.
- Done: project map DB được.

### CARD-P02 - Project create flow
- Parent: JIRA-8.2
- Depends on: CARD-P01
- Input: project info.
- Output: create use case.
- Done: project tạo được và owner gắn đúng.

### CARD-P03 - Project member flow
- Parent: JIRA-8.3
- Depends on: CARD-P01, CARD-R01
- Input: project id, user id, member role.
- Output: add-member use case.
- Done: member được thêm đúng phạm vi.

### CARD-T01 - Task entity fields
- Parent: JIRA-9.1
- Depends on: JIRA-1.1, JIRA-8.1
- Input: model task.
- Output: entity `title`, `description`, `status`, `assignedTo`, `projectId`.
- Done: task map DB được.

### CARD-T02 - Task create flow
- Parent: JIRA-9.2
- Depends on: CARD-T01
- Input: title, description, project.
- Output: create task use case.
- Done: task tạo đúng project.

### CARD-T03 - Task assignment flow
- Parent: JIRA-9.3
- Depends on: CARD-P03, CARD-T01
- Input: task id, user id.
- Output: assign use case.
- Done: chỉ member project mới được assign.

### CARD-T04 - Task status transition rules
- Parent: JIRA-9.4
- Depends on: CARD-T01
- Input: status mới.
- Output: rule `TODO -> DOING -> DONE`.
- Done: không nhảy trạng thái sai.

### CARD-T05 - Task visibility by user
- Parent: JIRA-9.5
- Depends on: CARD-T01, CARD-R03
- Input: user token.
- Output: query lọc task theo phạm vi.
- Done: user chỉ thấy task thuộc quyền.

## Wave 8: Deployment and Observability

### CARD-D01 - Dockerfile audit per service
- Parent: JIRA-10.1
- Depends on: JIRA-1.1
- Input: source từng service.
- Output: checklist Dockerfile cần có cho từng module.
- Done: từng service có build context rõ.

### CARD-D02 - Compose startup order check
- Parent: JIRA-10.2
- Depends on: CARD-D01
- Input: compose split files.
- Output: order infra -> iam -> hr -> edge.
- Done: có thể chạy đúng thứ tự.

### CARD-D03 - Healthcheck timings matrix
- Parent: JIRA-10.3
- Depends on: CARD-D02
- Input: startup time từng service.
- Output: bảng timing healthcheck.
- Done: không còn fail giả do warm-up chậm.

### CARD-O01 - Logging correlation format
- Parent: JIRA-11.1
- Depends on: JIRA-1.3
- Input: request flow.
- Output: log format có trace/request id.
- Done: truy vết được request qua nhiều service.

### CARD-O02 - Metrics scrape readiness
- Parent: JIRA-11.2
- Depends on: JIRA-10.2
- Input: endpoints actuator/metrics.
- Output: metrics scrape checklist.
- Done: Prometheus/Grafana đọc được metric chuẩn.

### CARD-O03 - Basic alert thresholds
- Parent: JIRA-11.3
- Depends on: CARD-O02
- Input: error/latency baseline.
- Output: ngưỡng alert cơ bản.
- Done: có cảnh báo cho 429, 5xx, startup fail.

## Wave 9: Frontend Optional

### CARD-U01 - Login page wiring
- Parent: JIRA-12.1
- Depends on: JIRA-2.4, JIRA-5.1
- Input: username/password.
- Output: login page gọi API thật.
- Done: token lưu được sau login.

### CARD-U02 - Dashboard shell
- Parent: JIRA-12.2
- Depends on: CARD-U01
- Input: token + claims.
- Output: dashboard shell theo role.
- Done: user thấy đúng state sau login.

### CARD-U03 - Task UI skeleton
- Parent: JIRA-12.3
- Depends on: JIRA-9.2, JIRA-9.4
- Input: task list/create/assign.
- Output: UI task tối thiểu.
- Done: thao tác task end-to-end được.

## Cách giao cho AI

- Chỉ giao 1 card cho 1 agent nếu card đó chạm vào cùng file chính.
- Nếu 2 card khác module và không phụ thuộc nhau, có thể chạy song song.
- Nếu card cần đổi API contract, làm contract trước rồi mới làm implement.
- Sau khi xong wave nào, chạy build/test cho wave đó trước khi sang wave kế tiếp.
