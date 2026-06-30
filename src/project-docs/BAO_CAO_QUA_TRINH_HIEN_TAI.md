# Báo cáo quá trình hiện tại — HR Microservices

Ngày: 2026-05-14

Mục tiêu: tóm tắt trạng thái hiện tại của các thành phần trong repository — những gì đã làm, vấn đề đã giải quyết, và phần còn đang chờ xử lý.

---

## Tổng quan ngắn
- Hạ tầng core có: Eureka (peer), Redis, Prometheus, Grafana, Jaeger.
- Auth (IAM), KMS, HR, API Gateway, Frontend đều có Dockerfile và compose tách theo lớp (`compose.infra.yml`, `compose.iam.yml`, `compose.hr.yml`, `compose.edge.yml`).
- Đã triển khai nhiều cơ chế bảo mật cơ bản: JWT (KMS), JwtAuthFilter trên gateway, header nội bộ (`X-Auth-User`, `X-Auth-Role`, `X-Auth-Roles`), SecurityValidator cho internal secret.
- Đã có outbox pattern (DB-backed) trên Auth để sync user → HR, kèm DLQ.

---

## Chi tiết theo service

- **Eureka Server**
  - Đã: cấu hình peer/cluster, dockerfile, healthcheck trong `compose.infra.yml`.
  - Giải quyết: service discovery cho toàn bộ stack.
  - Còn thiếu/risks: chưa kiểm chứng thứ tự khởi động peer trong full-stack; cần verify khi chạy toàn bộ.

- **Redis (infra)**
  - Đã: container Redis cấu hình password + healthcheck.
  - Giải quyết: cache, token blacklist (tiềm năng), messaging nhẹ.

- **KMS**
  - Đã: service sign/verify JWT, cung cấp JWKS endpoint, có cơ chế cache nội bộ.
  - Giải quyết: tách key-management, ký JWT an toàn.
  - Cần verify: độ ổn định khi nhiều caller cùng lúc (auth + gateway).

- **Auth Service (IAM)**
  - Đã: register/login, Argon2 password hashing, JWT issuance via KMS, token revoke support, DB-backed outbox (`user_sync_outbox`) + DLQ, account lock and password policy.
  - Giải quyết: authentication + durable user sync (outbox) cho HR.
  - Vấn đề còn tồn: cần check/chuẩn hoá mapping claim role(s) giữa auth ↔ gateway ↔ downstream services (`role` vs `roles`).

- **API Gateway**
  - Đã: Spring Cloud Gateway, `JwtAuthFilter` (xác thực JWT), xuất header nội bộ `X-Auth-User`, `X-Auth-Role`, `X-Auth-Roles`.
  - Giải quyết: trung tâm xác thực cho traffic, truyền thông tin xác thực cho services nội bộ.
  - Cần làm thêm: route metadata (public/protected/internal), token blacklist check (Redis) end-to-end.

- **HR Service**
  - Đã: controllers/repositories cho domain HR, `SecurityValidator` kiểm tra `X-Internal-Secret`, kiểm tra role admin từ `X-Auth-Role`/`X-Auth-Roles`.
  - Giải quyết: business logic HR + bảo vệ endpoint nội bộ.
  - Cần làm thêm: verify sync thực tế từ Auth outbox, rà soát bảo vệ endpoint theo role, rate limit/observability.

- **Frontend**
  - Đã: project + Dockerfile, compose liên kết với gateway.
  - Cần: kiểm thử end-to-end qua gateway, xác nhận routes/headers hợp lệ.

- **Project / Task Services (business)**
  - Trạng thái: scaffolds tồn tại (folder `project-service`, `task-service`), nhiều handler bảo mật (RequireRoles/RoleGuardInterceptor) đã có trong `project-service`.
  - Cần: tích hợp vào compose business, đăng ký Eureka, route qua gateway, hoàn thiện CRUD và tests.

---

## Compose & startup (hiện trạng)
- Compose đã được tách theo lớp; mỗi file chứa healthcheck cho core services.
- Ví dụ thứ tự phụ thuộc hiện hữu:
  - `compose.infra.yml`: `eureka-peer1` → `haproxy` depends_on eureka (service_healthy).
  - `compose.iam.yml`: `auth-service` depends_on `auth-postgres` và `kms-service` (service_healthy).
  - `compose.hr.yml`: `hr-service` depends_on `hr-mysql`.
  - `compose.edge.yml`: `frontend` depends_on `api-gateway`.
- Vấn đề: một số depends/healthcheck chưa chuẩn hóa tổng thể cho luồng khởi động infra → iam → hr → edge; cần chuẩn hoá để tránh false unhealthy và cascade failure.

---

## Những vấn đề đã giải quyết (high-impact)
- Tách compose theo lớp (infra/iam/hr/edge) — giảm phạm vi khi debug.
- DB-backed outbox + DLQ cho sync user — tăng độ bền khi sync user → HR.
- JWT signing tách riêng thành KMS (JWKS) — hợp nhất nguồn xác thực.
- Gateway filter `JwtAuthFilter` đã phát hành header nội bộ giúp downstream không cần parse JWT.

---

## Outstanding / Next priorities (đề xuất)
1. Chuẩn hóa startup sequence & healthcheck (Blocker): chuẩn hoá `depends_on` + healthcheck để đảm bảo infra → iam → hr → edge. (File: `compose.infra.yml`, `compose.iam.yml`, `compose.hr.yml`, `compose.edge.yml`)
2. Verify & fix JWT claim mapping (Blocker): thống nhất `role` vs `roles` giữa `auth-service`, `api-gateway` và downstream. Chạy smoke test auth flow.
3. Route protection metadata: thêm flag public/protected/internal trên gateway routes.
4. Token blacklist Redis: tích hợp revoke token end-to-end (`auth-service` + `api-gateway` JwtAuthFilter).
5. Verify Auth→HR sync: kiểm tra outbox/DLQ chạy end-to-end, giải quyết duplicate/ordering edge-cases.

---

## Đề xuất định dạng báo cáo / follow-up
- Mỗi task ưu tiên chỉ được đánh dấu `Hoàn thành` sau khi đã sửa + qua test end-to-end (không check từng bước nhỏ).
- Khi tôi làm tiếp, sẽ triển khai theo checklist liên tục: thực hiện xong mục #1 rồi mới báo cáo hoàn thành và chuyển sang #2.

---

## Tài liệu tham khảo chính
- `STATUS-NOTE.md`
- `project text/TongKet.md`
- `compose.infra.yml`, `compose.iam.yml`, `compose.hr.yml`, `compose.edge.yml`
- `api-gateway/HELP.md`, `auth-service/HELP.md`, `hr-service/HELP.md`, `eureka-server/HELP.md`

---

Nếu đồng ý, tôi sẽ mark mục #1 trong todo list và bắt tay chuẩn hóa `depends_on` + healthcheck, rồi chạy smoke test auth flow.
