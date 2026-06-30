-- ============================================================
-- FULL BUSINESS SEED — ECC Group HR System (MySQL)
-- DBs: project_db (projects, assignments) + task_db (tasks, history)
-- 7 dự án · 54 task · 22 task history
-- ============================================================

-- ══════════════════════════════════════════════════════════════
-- PROJECT DB
-- ══════════════════════════════════════════════════════════════
USE project_db;

-- ── 1. Projects ──────────────────────────────────────────────
-- lead_id = employee_id (HR employee)
INSERT INTO projects (id, name, description, status, lead_id, created_at, updated_at)
VALUES
    (1, 'ECC HR Platform v2.0',
     'Nâng cấp toàn diện nền tảng quản lý nhân sự: employee lifecycle, phân quyền RBAC, API chuẩn hoá. Là dự án nền tảng cho toàn hệ thống ECC.',
     'ACTIVE', 3, '2025-10-01 08:00:00', NOW(6)),

    (2, 'Payroll Automation System',
     'Tự động hoá quy trình tính lương, quản lý khấu trừ BHXH/BHYT/BHTN, thuế TNCN luỹ tiến, phê duyệt bảng lương đa cấp và xuất báo cáo quyết toán.',
     'ACTIVE', 9, '2025-11-15 08:00:00', NOW(6)),

    (3, 'Employee Self-Service Portal',
     'Cổng tự phục vụ dành cho nhân viên: xem hợp đồng, phiếu lương, yêu cầu nghỉ phép, cập nhật thông tin cá nhân và theo dõi KPI.',
     'PAUSED', 3, '2025-12-01 08:00:00', NOW(6)),

    (4, 'ECC Mobile App',
     'Ứng dụng di động (iOS/Android) cho quản lý dự án và task theo thời gian thực, thông báo push, check-in địa điểm và báo cáo nhanh.',
     'ACTIVE', 9, '2026-01-15 08:00:00', NOW(6)),

    (5, 'CRM Integration',
     'Tích hợp hệ thống CRM nội bộ với Salesforce: đồng bộ khách hàng, cơ hội kinh doanh, lịch sử tương tác và báo cáo doanh số tự động.',
     'COMPLETED', 19, '2025-08-01 08:00:00', '2026-02-28 17:00:00'),

    (6, 'Cloud Infrastructure Migration',
     'Di chuyển toàn bộ hạ tầng on-premise sang AWS (EKS + RDS + S3 + CloudFront). Bao gồm CI/CD pipeline, blue-green deployment và disaster recovery.',
     'COMPLETED', 26, '2025-06-01 08:00:00', '2026-01-31 17:00:00'),

    (7, 'Data Analytics Dashboard',
     'Xây dựng hệ thống phân tích dữ liệu nhân sự và kinh doanh với Grafana, Metabase và pipeline ETL từ MySQL/PostgreSQL sang Data Warehouse.',
     'ACTIVE', 25, '2026-03-01 08:00:00', NOW(6))
ON DUPLICATE KEY UPDATE
    name = VALUES(name), description = VALUES(description),
    status = VALUES(status), lead_id = VALUES(lead_id),
    updated_at = NOW(6);

-- ── 2. Project Assignments ───────────────────────────────────
-- Gán nhân viên vào dự án với vai trò cụ thể
-- active: 1=đang hoạt động, 0=đã rời
INSERT INTO project_assignments (id, project_id, employee_id, role, active, assigned_at)
VALUES
    -- Dự án 1: HR Platform v2.0
    (1,  1,  3,  'MANAGER',   b'1', '2025-10-01 08:00:00'),
    (2,  1,  14, 'DEVELOPER', b'1', '2025-10-05 08:00:00'),
    (3,  1,  4,  'DEVELOPER', b'1', '2025-10-05 08:00:00'),
    (4,  1,  5,  'DEVELOPER', b'1', '2025-10-10 08:00:00'),
    (5,  1,  21, 'DEVELOPER', b'1', '2025-12-01 08:00:00'),
    (6,  1,  7,  'QA',        b'1', '2025-10-10 08:00:00'),
    (7,  1,  16, 'QA',        b'1', '2026-01-15 08:00:00'),
    (8,  1,  8,  'MEMBER',    b'1', '2025-10-05 08:00:00'),

    -- Dự án 2: Payroll Automation
    (9,  2,  9,  'MANAGER',   b'1', '2025-11-15 08:00:00'),
    (10, 2,  13, 'DEVELOPER', b'1', '2025-11-15 08:00:00'),
    (11, 2,  4,  'DEVELOPER', b'1', '2025-11-20 08:00:00'),
    (12, 2,  28, 'MEMBER',    b'1', '2025-11-20 08:00:00'),
    (13, 2,  7,  'QA',        b'1', '2025-12-01 08:00:00'),
    (14, 2,  22, 'MEMBER',    b'1', '2025-12-01 08:00:00'),

    -- Dự án 3: Employee Portal (tạm dừng)
    (15, 3,  3,  'MANAGER',   b'1', '2025-12-01 08:00:00'),
    (16, 3,  6,  'DEVELOPER', b'1', '2025-12-05 08:00:00'),
    (17, 3,  15, 'DEVELOPER', b'1', '2025-12-05 08:00:00'),
    (18, 3,  10, 'MEMBER',    b'1', '2025-12-10 08:00:00'),

    -- Dự án 4: Mobile App
    (19, 4,  9,  'MANAGER',   b'1', '2026-01-15 08:00:00'),
    (20, 4,  15, 'DEVELOPER', b'1', '2026-01-20 08:00:00'),
    (21, 4,  21, 'DEVELOPER', b'1', '2026-01-20 08:00:00'),
    (22, 4,  23, 'DEVELOPER', b'1', '2026-02-01 08:00:00'),
    (23, 4,  16, 'QA',        b'1', '2026-01-25 08:00:00'),
    (24, 4,  8,  'MEMBER',    b'1', '2026-01-20 08:00:00'),

    -- Dự án 5: CRM Integration (đã hoàn thành — active=0)
    (25, 5,  19, 'MANAGER',   b'0', '2025-08-01 08:00:00'),
    (26, 5,  14, 'DEVELOPER', b'0', '2025-08-05 08:00:00'),
    (27, 5,  6,  'DEVELOPER', b'0', '2025-08-05 08:00:00'),
    (28, 5,  7,  'QA',        b'0', '2025-08-10 08:00:00'),

    -- Dự án 6: Cloud Migration (đã hoàn thành)
    (29, 6,  26, 'MANAGER',   b'0', '2025-06-01 08:00:00'),
    (30, 6,  11, 'DEVELOPER', b'0', '2025-06-05 08:00:00'),
    (31, 6,  17, 'DEVELOPER', b'0', '2025-06-05 08:00:00'),
    (32, 6,  5,  'MEMBER',    b'0', '2025-06-10 08:00:00'),

    -- Dự án 7: Data Analytics
    (33, 7,  25, 'MANAGER',   b'1', '2026-03-01 08:00:00'),
    (34, 7,  14, 'DEVELOPER', b'1', '2026-03-05 08:00:00'),
    (35, 7,  11, 'DEVELOPER', b'1', '2026-03-05 08:00:00'),
    (36, 7,  22, 'MEMBER',    b'1', '2026-03-10 08:00:00')
ON DUPLICATE KEY UPDATE
    role = VALUES(role), active = VALUES(active),
    assigned_at = VALUES(assigned_at);

-- ══════════════════════════════════════════════════════════════
-- TASK DB
-- ══════════════════════════════════════════════════════════════
USE task_db;

-- Thêm cột priority nếu chưa có (backward-compatible)
SET @col_exists := (
    SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name   = 'tasks'
      AND column_name  = 'priority'
);
SET @sql := IF(@col_exists = 0,
    'ALTER TABLE tasks ADD COLUMN priority ENUM(''HIGH'',''LOW'',''MEDIUM'',''URGENT'') NOT NULL DEFAULT ''MEDIUM'' AFTER status',
    'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- ── 3. Tasks ─────────────────────────────────────────────────
-- assignee_id = employee_id (HR), project_id = project_db.projects.id
INSERT INTO tasks (id, title, description, status, priority, assignee_id, project_id, created_at, updated_at)
VALUES
-- ════ Dự án 1: HR Platform v2.0 (8 tasks) ════
(1,  'Thiết kế API employee CRUD',
     'Định nghĩa OpenAPI 3.0 cho toàn bộ endpoint nhân viên: tạo, cập nhật, xem danh sách, vô hiệu hoá. Bao gồm phân trang và filter.',
     'COMPLETED','HIGH',   14, 1,'2025-10-05 08:00:00','2025-11-20 17:00:00'),

(2,  'Xây dựng Department API & phân cấp',
     'REST endpoint cho phòng ban: tạo, chỉnh sửa, xem cây tổ chức theo organization_unit. Validate unique department code.',
     'COMPLETED','HIGH',    4, 1,'2025-10-10 08:00:00','2025-12-10 17:00:00'),

(3,  'Tích hợp RBAC vào API Gateway',
     'Thêm JWT claims check và middleware kiểm tra quyền RBAC (READ_EMPLOYEE, WRITE_EMPLOYEE...) tại api-gateway trước khi chuyển tiếp request.',
     'IN_PROGRESS','URGENT', 5, 1,'2025-11-01 08:00:00', NOW(6)),

(4,  'Xây dựng Employee List UI',
     'Trang danh sách nhân viên với bộ lọc (phòng ban, chức vụ, trạng thái), phân trang, export Excel. Dùng DataListPage component.',
     'IN_PROGRESS','HIGH',  21, 1,'2025-11-15 08:00:00', NOW(6)),

(5,  'Viết test E2E cho luồng onboarding',
     'Test Playwright cho toàn bộ luồng thêm nhân viên mới: tạo user Auth → tạo Employee HR → gán phòng ban → kiểm tra hiển thị dashboard.',
     'OPEN','HIGH',          7, 1,'2025-12-01 08:00:00', NOW(6)),

(6,  'Tối ưu truy vấn Employee + Department',
     'Phân tích slow query log: thêm index (department_id, status, hire_date), chuyển N+1 sang JOIN, cache Redis cho danh sách phòng ban.',
     'OPEN','MEDIUM',       14, 1,'2026-01-10 08:00:00', NOW(6)),

(7,  'Cập nhật tài liệu API (Swagger)',
     'Bổ sung mô tả tiếng Việt, ví dụ request/response, mã lỗi cho tất cả endpoint HR. Deploy Swagger UI lên /api-docs.',
     'OPEN','LOW',           8, 1,'2026-02-01 08:00:00', NOW(6)),

(8,  'Review bảo mật endpoint nhân sự',
     'Kiểm tra SQL injection, XSS header, rate limit, validate input tất cả endpoint /nhan-vien và /phong-ban. Báo cáo penetration test.',
     'OPEN','URGENT',       16, 1,'2026-03-01 08:00:00', NOW(6)),

-- ════ Dự án 2: Payroll Automation (8 tasks) ════
(9,  'Thiết kế quy trình duyệt lương đa cấp',
     'Sơ đồ luồng: DRAFT → APPROVED (Payroll Officer) → PROCESSED (HR Manager) → PAID. Định nghĩa rule & permission từng bước.',
     'COMPLETED','HIGH',    9, 2,'2025-11-15 08:00:00','2025-12-20 17:00:00'),

(10, 'Implement engine tính thuế TNCN',
     'Tính thuế luỹ tiến VN 2024 từ TaxConfig. Trừ giảm trừ bản thân (11tr), gia cảnh (4.4tr/người), BHXH trước khi tính thuế.',
     'COMPLETED','URGENT', 13, 2,'2025-11-20 08:00:00','2026-01-15 17:00:00'),

(11, 'Giao diện bảng lương (Payroll UI)',
     'Trang xem bảng lương theo kỳ: lọc theo trạng thái, tải PDF phiếu lương cá nhân, tổng kết theo phòng ban.',
     'IN_PROGRESS','HIGH',   4, 2,'2025-12-10 08:00:00', NOW(6)),

(12, 'Xuất báo cáo quyết toán thuế',
     'Tạo file Excel/PDF báo cáo quyết toán thuế hàng tháng & năm theo mẫu quy định, bao gồm tổng hợp BHXH doanh nghiệp.',
     'IN_PROGRESS','HIGH',  28, 2,'2026-01-15 08:00:00', NOW(6)),

(13, 'Kiểm thử tính lương tự động (100+ TH)',
     'Tạo 100+ test case tính lương: lương cơ bản, thưởng, phụ cấp, làm thêm giờ, nghỉ phép, nghỉ không lương, ốm đau...',
     'OPEN','URGENT',        7, 2,'2026-02-01 08:00:00', NOW(6)),

(14, 'Tích hợp thông báo duyệt lương qua email',
     'Gửi email tự động khi bảng lương chuyển trạng thái (APPROVED, PROCESSED). Dùng RabbitMQ message queue, template HTML.',
     'OPEN','MEDIUM',       22, 2,'2026-02-15 08:00:00', NOW(6)),

(15, 'API export phiếu lương PDF',
     'Endpoint /api/payroll/{id}/export-pdf tạo phiếu lương cá nhân định dạng A4, ký số điện tử, tải xuống hoặc gửi email.',
     'OPEN','MEDIUM',       13, 2,'2026-03-01 08:00:00', NOW(6)),

(16, 'Lưu lịch sử thay đổi lương (audit)',
     'Ghi PayrollHistory mỗi khi bảng lương thay đổi trạng thái. Hiển thị timeline audit trên UI. Export CSV cho kiểm toán.',
     'OPEN','LOW',          28, 2,'2026-03-15 08:00:00', NOW(6)),

-- ════ Dự án 3: Employee Self-Service Portal (6 tasks — PAUSED) ════
(17, 'Thiết kế wireframe cổng tự phục vụ',
     'Figma wireframe cho tất cả màn hình portal: trang chủ, xem lương, yêu cầu nghỉ phép, cập nhật thông tin, tra cứu nội quy.',
     'COMPLETED','HIGH',    8, 3,'2025-12-01 08:00:00','2026-01-10 17:00:00'),

(18, 'Xây dựng trang xem phiếu lương cá nhân',
     'Nhân viên xem phiếu lương, lịch sử 12 tháng gần nhất, so sánh tháng trước. Yêu cầu JWT employee scope.',
     'IN_PROGRESS','HIGH',  6, 3,'2025-12-15 08:00:00', NOW(6)),

(19, 'Chức năng đặt lịch nghỉ phép online',
     'Form yêu cầu nghỉ phép: ngày nghỉ, loại nghỉ (phép, ốm, không lương), lý do, người thay thế. Thông báo quản lý phê duyệt.',
     'OPEN','MEDIUM',      15, 3,'2026-01-05 08:00:00', NOW(6)),

(20, 'Trang hồ sơ cá nhân (tự cập nhật)',
     'Nhân viên tự cập nhật số điện thoại, địa chỉ, CCCD, người liên hệ khẩn cấp. HR phê duyệt thay đổi thông tin quan trọng.',
     'OPEN','LOW',         15, 3,'2026-01-10 08:00:00', NOW(6)),

(21, 'Tích hợp Single Sign-On (SSO)',
     'Kết nối portal với auth-service qua OAuth 2.0 Authorization Code Flow. Hỗ trợ Google Workspace SSO cho nội bộ ECC.',
     'OPEN','HIGH',         3, 3,'2026-01-20 08:00:00', NOW(6)),

(22, 'Responsive mobile layout cho portal',
     'Đảm bảo toàn bộ portal hiển thị tốt trên mobile (320px-768px). Test trên iOS Safari, Android Chrome. Lighthouse ≥90.',
     'OPEN','MEDIUM',      6, 3,'2026-01-25 08:00:00', NOW(6)),

-- ════ Dự án 4: ECC Mobile App (8 tasks) ════
(23, 'Thiết kế kiến trúc Mobile App (React Native)',
     'Chọn tech stack: React Native + Expo. Thiết kế navigation, state management (Zustand), API client, push notification.',
     'COMPLETED','HIGH',    9, 4,'2026-01-15 08:00:00','2026-02-10 17:00:00'),

(24, 'Màn hình đăng nhập & xác thực 2FA',
     'Login screen → nhập OTP → lưu JWT token bảo mật (Keychain iOS / Keystore Android). Hỗ trợ biometric (Face ID, fingerprint).',
     'COMPLETED','URGENT', 15, 4,'2026-01-20 08:00:00','2026-03-15 17:00:00'),

(25, 'Dashboard tổng quan dự án & task',
     'Home screen hiển thị task được giao, deadline sắp đến, tiến độ dự án, hoạt động gần đây. Pull-to-refresh, skeleton loading.',
     'IN_PROGRESS','HIGH', 21, 4,'2026-02-01 08:00:00', NOW(6)),

(26, 'Màn hình quản lý task (create/update)',
     'Form tạo/sửa task: title, description, priority, assignee, deadline, project. Validate form, gọi API task-service.',
     'IN_PROGRESS','HIGH', 23, 4,'2026-02-15 08:00:00', NOW(6)),

(27, 'Push notification khi task thay đổi',
     'Tích hợp Firebase FCM: push khi được giao task, task deadline hôm nay, task được duyệt. Quản lý subscription theo user.',
     'OPEN','HIGH',        21, 4,'2026-03-01 08:00:00', NOW(6)),

(28, 'Offline mode & data sync',
     'Cache task và project data offline (SQLite). Sync tự động khi có mạng, conflict resolution cho thay đổi offline.',
     'OPEN','MEDIUM',      23, 4,'2026-03-15 08:00:00', NOW(6)),

(29, 'Testing E2E trên thiết bị thật',
     'Test Detox E2E trên iPhone 14 và Samsung Galaxy S23. Coverage: đăng nhập, xem task, cập nhật trạng thái, push notification.',
     'OPEN','HIGH',        16, 4,'2026-04-01 08:00:00', NOW(6)),

(30, 'App Store & Play Store submission',
     'Chuẩn bị metadata, screenshot, privacy policy. Submit iOS/Android build cho review. Giải quyết feedback từ Apple/Google.',
     'OPEN','MEDIUM',       9, 4,'2026-05-01 08:00:00', NOW(6)),

-- ════ Dự án 5: CRM Integration (6 tasks — COMPLETED) ════
(31, 'Phân tích yêu cầu tích hợp CRM',
     'Workshop với team kinh doanh: xác định data fields cần đồng bộ, tần suất sync, xử lý conflict, mapping schema ECC ↔ Salesforce.',
     'COMPLETED','HIGH',   19, 5,'2025-08-01 08:00:00','2025-08-31 17:00:00'),

(32, 'Xây dựng ETL pipeline Salesforce ↔ MySQL',
     'Apache Kafka pipeline: ECC HR → Salesforce Contact sync. Xử lý dedup, error retry, dead-letter queue.',
     'COMPLETED','URGENT', 14, 5,'2025-09-01 08:00:00','2025-11-30 17:00:00'),

(33, 'API webhook nhận update từ Salesforce',
     'Endpoint nhận Salesforce outbound message khi deal thắng/thua. Cập nhật HR assignments tự động.',
     'COMPLETED','HIGH',   6, 5,'2025-09-15 08:00:00','2025-12-15 17:00:00'),

(34, 'Dashboard đồng bộ CRM',
     'Trang admin xem trạng thái đồng bộ: records synced, errors, lag time, queue depth. Alert khi sync bị lỗi >5 phút.',
     'COMPLETED','MEDIUM', 22, 5,'2025-10-01 08:00:00','2025-12-31 17:00:00'),

(35, 'Kiểm thử tích hợp end-to-end',
     'Test toàn bộ luồng: tạo lead Salesforce → sync HR → assign employee → notify. UAT với team kinh doanh.',
     'COMPLETED','HIGH',    7, 5,'2025-11-01 08:00:00','2026-01-31 17:00:00'),

(36, 'Go-live & handover tài liệu',
     'Deploy production, monitoring 2 tuần, viết SOP vận hành cho IT Ops, training team kinh doanh sử dụng dashboard.',
     'COMPLETED','MEDIUM', 19, 5,'2026-01-15 08:00:00','2026-02-28 17:00:00'),

-- ════ Dự án 6: Cloud Migration (6 tasks — COMPLETED) ════
(37, 'Lập kế hoạch di chuyển cloud (Cloud Strategy)',
     'Phân tích workload, chọn AWS region ap-southeast-1, thiết kế VPC, subnet, security group, IAM roles theo Well-Architected.',
     'COMPLETED','HIGH',   26, 6,'2025-06-01 08:00:00','2025-07-31 17:00:00'),

(38, 'Setup Kubernetes cluster (EKS)',
     'Provision EKS 1.29 với node group auto-scaling (t3.medium). Config kubectl, Helm, ArgoCD GitOps, Horizontal Pod Autoscaler.',
     'COMPLETED','URGENT', 11, 6,'2025-07-01 08:00:00','2025-09-30 17:00:00'),

(39, 'Di chuyển database lên RDS Aurora',
     'Migrate MySQL → Aurora MySQL 8.0, PostgreSQL → Aurora PostgreSQL 15. Zero-downtime migration dùng AWS DMS với CDC.',
     'COMPLETED','URGENT', 17, 6,'2025-08-01 08:00:00','2025-10-31 17:00:00'),

(40, 'Setup CI/CD pipeline (GitHub Actions → ECR → EKS)',
     'Pipeline build Docker image → push ECR → deploy ArgoCD. Blue-green deployment, canary release, rollback tự động khi lỗi.',
     'COMPLETED','HIGH',    5, 6,'2025-09-01 08:00:00','2025-11-15 17:00:00'),

(41, 'Cấu hình monitoring & alerting',
     'Prometheus + Grafana trên cluster. Alert PagerDuty khi CPU>80%, memory>90%, error rate>1%, latency p99>500ms.',
     'COMPLETED','HIGH',   11, 6,'2025-10-01 08:00:00','2025-12-15 17:00:00'),

(42, 'Kiểm thử tải & disaster recovery',
     'Load test 10,000 req/s bằng k6. DR drill: tắt az-1, verify traffic failover sang az-2. RTO<15 phút, RPO<5 phút.',
     'COMPLETED','URGENT', 17, 6,'2025-11-01 08:00:00','2026-01-31 17:00:00'),

-- ════ Dự án 7: Data Analytics Dashboard (6 tasks) ════
(43, 'Thiết kế Data Warehouse schema',
     'Star schema cho HR analytics: dim_employee, dim_department, fact_payroll, fact_attendance, fact_project_hours. Dùng dbt.',
     'COMPLETED','HIGH',   25, 7,'2026-03-01 08:00:00','2026-04-15 17:00:00'),

(44, 'Xây dựng ETL pipeline từ OLTP sang DWH',
     'Apache Airflow DAG chạy mỗi đêm 2h: extract từ MySQL/PostgreSQL, transform dbt, load Redshift. Retry 3 lần, alert Slack.',
     'IN_PROGRESS','HIGH', 14, 7,'2026-03-15 08:00:00', NOW(6)),

(45, 'Dashboard nhân sự tổng quan (Grafana)',
     'Board: tổng nhân viên, tỷ lệ nghỉ việc, phân bổ theo phòng ban, biểu đồ tuyển dụng theo tháng. Drill-down theo chi nhánh.',
     'IN_PROGRESS','HIGH', 25, 7,'2026-04-01 08:00:00', NOW(6)),

(46, 'Dashboard lương & chi phí nhân sự',
     'Metabase report: tổng quỹ lương, chi phí BHXH/BHYT, phân tích lương theo level/department, so sánh YoY.',
     'OPEN','MEDIUM',      11, 7,'2026-04-15 08:00:00', NOW(6)),

(47, 'Tích hợp dữ liệu project & task vào DWH',
     'Sync project_db và task_db vào DWH: fact_task (trạng thái, thời gian hoàn thành), fact_project_progress theo sprint.',
     'OPEN','MEDIUM',      22, 7,'2026-05-01 08:00:00', NOW(6)),

(48, 'Phân quyền truy cập báo cáo theo role',
     'Row-level security trong Grafana/Metabase: HR_MANAGER xem tất cả, DEPARTMENT_HEAD xem phòng mình, EMPLOYEE xem bản thân.',
     'OPEN','LOW',         25, 7,'2026-05-15 08:00:00', NOW(6))
ON DUPLICATE KEY UPDATE
    title        = VALUES(title),
    description  = VALUES(description),
    status       = VALUES(status),
    priority     = VALUES(priority),
    assignee_id  = VALUES(assignee_id),
    project_id   = VALUES(project_id),
    updated_at   = NOW(6);

-- ── 4. Task History ──────────────────────────────────────────
-- Lịch sử thay đổi trạng thái task — changedBy = employee_id
INSERT INTO task_history (id, task_id, project_id, previous_status, new_status, reason, changed_at, changed_by)
VALUES
    -- Task 1: Thiết kế API employee (OPEN → IN_PROGRESS → COMPLETED)
    (1,  1, 1, 'OPEN',        'IN_PROGRESS','Bắt đầu thiết kế API spec trên Swagger Editor',            '2025-10-06 08:30:00', 14),
    (2,  1, 1, 'IN_PROGRESS', 'COMPLETED',  'API spec đã review và được PM approve, merge vào main',   '2025-11-20 16:00:00', 3),

    -- Task 2: Department API (OPEN → IN_PROGRESS → COMPLETED)
    (3,  2, 1, 'OPEN',        'IN_PROGRESS','Bắt đầu code DepartmentController và service layer',       '2025-10-12 08:00:00', 4),
    (4,  2, 1, 'IN_PROGRESS', 'COMPLETED',  'Đã pass hết unit test và integration test, deploy staging','2025-12-10 15:00:00', 4),

    -- Task 3: RBAC Gateway (OPEN → IN_PROGRESS)
    (5,  3, 1, 'OPEN',        'IN_PROGRESS','Bắt đầu implement JWT claims middleware tại api-gateway',  '2025-11-05 09:00:00', 5),

    -- Task 9: Quy trình duyệt lương (OPEN → IN_PROGRESS → COMPLETED)
    (6,  9, 2, 'OPEN',        'IN_PROGRESS','Bắt đầu vẽ flowchart và định nghĩa state machine lương',   '2025-11-18 08:00:00', 9),
    (7,  9, 2, 'IN_PROGRESS', 'COMPLETED',  'Tài liệu quy trình được HR Director duyệt và ký',         '2025-12-20 14:00:00', 27),

    -- Task 10: Engine thuế (OPEN → IN_PROGRESS → COMPLETED)
    (8,  10, 2,'OPEN',        'IN_PROGRESS','Bắt đầu implement thuế luỹ tiến từ TaxConfig table',      '2025-11-22 08:00:00', 13),
    (9,  10, 2,'IN_PROGRESS', 'COMPLETED',  'Đã test 150 test case, coverage 98%. Deploy production',  '2026-01-15 16:00:00', 13),

    -- Task 17: Wireframe portal (OPEN → IN_PROGRESS → COMPLETED)
    (10, 17, 3,'OPEN',        'IN_PROGRESS','Bắt đầu thiết kế wireframe Figma, họp kick-off với HR',   '2025-12-03 09:00:00', 8),
    (11, 17, 3,'IN_PROGRESS', 'COMPLETED',  'Figma prototype được approve, link shared với dev team',  '2026-01-10 16:00:00', 8),

    -- Task 23: Kiến trúc Mobile App (OPEN → IN_PROGRESS → COMPLETED)
    (12, 23, 4,'OPEN',        'IN_PROGRESS','Họp kiến trúc, bắt đầu POC React Native + Expo',          '2026-01-17 09:00:00', 9),
    (13, 23, 4,'IN_PROGRESS', 'COMPLETED',  'POC xong, team đồng thuận tech stack, tạo repo',          '2026-02-10 16:00:00', 9),

    -- Task 24: Login 2FA Mobile (OPEN → IN_PROGRESS → COMPLETED)
    (14, 24, 4,'OPEN',        'IN_PROGRESS','Implement OAuth2 flow và TOTP 2FA trên React Native',      '2026-01-22 09:00:00', 15),
    (15, 24, 4,'IN_PROGRESS', 'COMPLETED',  'Login flow test OK trên iOS và Android, biometric hoạt động','2026-03-15 15:00:00', 16),

    -- Task 31: CRM Analysis (OPEN → IN_PROGRESS → COMPLETED)
    (16, 31, 5,'OPEN',        'IN_PROGRESS','Bắt đầu workshop và thu thập yêu cầu từ sales team',      '2025-08-05 09:00:00', 19),
    (17, 31, 5,'IN_PROGRESS', 'COMPLETED',  'Hoàn thành tài liệu BRD và mapping schema CRM ↔ ECC',     '2025-08-31 16:00:00', 19),

    -- Task 37: Cloud Strategy (OPEN → IN_PROGRESS → COMPLETED)
    (18, 37, 6,'OPEN',        'IN_PROGRESS','Bắt đầu phân tích workload và thiết kế VPC architecture', '2025-06-05 08:00:00', 26),
    (19, 37, 6,'IN_PROGRESS', 'COMPLETED',  'AWS Well-Architected Review pass, approved by CTO',        '2025-07-31 16:00:00', 1),

    -- Task 43: DWH Schema (OPEN → IN_PROGRESS → COMPLETED)
    (20, 43, 7,'OPEN',        'IN_PROGRESS','Bắt đầu thiết kế star schema, họp với stakeholders',      '2026-03-05 09:00:00', 25),
    (21, 43, 7,'IN_PROGRESS', 'COMPLETED',  'Schema đã review và approve, dbt models tạo xong',        '2026-04-15 15:00:00', 25),

    -- Task 44: ETL Pipeline (OPEN → IN_PROGRESS)
    (22, 44, 7,'OPEN',        'IN_PROGRESS','Setup Airflow DAG, bắt đầu viết dbt models cho HR data',  '2026-03-18 09:00:00', 14)
ON DUPLICATE KEY UPDATE
    previous_status = VALUES(previous_status),
    new_status      = VALUES(new_status),
    reason          = VALUES(reason),
    changed_at      = VALUES(changed_at),
    changed_by      = VALUES(changed_by);
