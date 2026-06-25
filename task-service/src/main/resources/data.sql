-- Task Service seed data — INSERT IGNORE để idempotent
-- project_id tham chiếu projects (1-8), assignee_id tham chiếu employee (1-20)

INSERT IGNORE INTO tasks (id, title, description, status, priority, assignee_id, project_id, created_at, updated_at) VALUES
    -- Dự án 1: HR Microservices (ACTIVE)
    (1,  'Thiết kế API Gateway routing',       'Cấu hình route và rate-limit cho tất cả microservices.',           'COMPLETED',  'HIGH',   5,  1, '2024-01-12 09:00:00', NOW()),
    (2,  'Implement auth-service JWT',          'Xây dựng luồng đăng nhập, token signing với Ed25519.',             'COMPLETED',  'URGENT', 3,  1, '2024-01-15 09:00:00', NOW()),
    (3,  'Tích hợp Eureka service discovery',  'Cài đặt Eureka cluster 3 peer, kiểm tra health và failover.',      'COMPLETED',  'HIGH',   5,  1, '2024-01-20 09:00:00', NOW()),
    (4,  'Viết seed data cho hr-service',       'Tạo dữ liệu mẫu cho org units, departments và employees.',        'IN_PROGRESS','MEDIUM', 3,  1, '2024-06-20 09:00:00', NOW()),
    (5,  'Fix timeout KMS RestClient',          'Thêm connect/read timeout để tránh login bị treo vô thời hạn.',   'IN_PROGRESS','HIGH',   3,  1, '2024-06-24 09:00:00', NOW()),
    (6,  'Unit test AuthService.login()',       'Viết test cho các trường hợp: sai pass, locked, MFA required.',   'OPEN',       'MEDIUM', 6,  1, '2024-06-25 09:00:00', NOW()),
    (7,  'CI/CD pipeline GitHub Actions',       'Build, test, push image lên GHCR và deploy staging tự động.',    'OPEN',       'HIGH',   5,  1, '2024-06-25 09:00:00', NOW()),
    -- Dự án 2: Cổng thông tin nhân viên (ACTIVE)
    (8,  'Thiết kế UI Employee Portal',         'Mockup màn hình tra cứu lương, phúc lợi và lịch sử công.',        'COMPLETED',  'MEDIUM', 4,  2, '2024-02-16 09:00:00', NOW()),
    (9,  'Implement trang bảng lương',          'Hiển thị payroll history, tải PDF slip hằng tháng.',               'IN_PROGRESS','HIGH',   4,  2, '2024-02-20 09:00:00', NOW()),
    (10, 'API tích hợp payroll-service',        'Kết nối frontend với hr-service /payroll endpoints.',               'IN_PROGRESS','HIGH',   3,  2, '2024-02-22 09:00:00', NOW()),
    (11, 'Responsive mobile cho portal',        'Đảm bảo portal hoạt động tốt trên iOS và Android browser.',       'OPEN',       'LOW',    4,  2, '2024-06-25 09:00:00', NOW()),
    -- Dự án 3: Hệ thống chấm công (ACTIVE)
    (12, 'Kết nối máy chấm công vân tay',       'Tích hợp API máy Suprema BioStation với hr-service.',             'IN_PROGRESS','URGENT', 15, 3, '2024-03-05 09:00:00', NOW()),
    (13, 'Tính công theo ca làm việc',           'Logic tính giờ OT, ca đêm, ngày lễ theo Luật Lao động.',          'IN_PROGRESS','HIGH',   15, 3, '2024-03-10 09:00:00', NOW()),
    (14, 'Báo cáo chấm công hằng tháng',        'Sinh báo cáo Excel tổng hợp công tháng cho HR.',                  'OPEN',       'MEDIUM', 16, 3, '2024-06-25 09:00:00', NOW()),
    (15, 'Test chấm công edge cases',           'Kiểm tra: quên chấm ra, chấm 2 lần, thay đổi ca giữa tháng.',    'OPEN',       'MEDIUM', 17, 3, '2024-06-25 09:00:00', NOW()),
    -- Dự án 4: Tái cấu trúc Frontend (PAUSED)
    (16, 'Migrate từ Material UI sang Tailwind','Refactor toàn bộ component library sang Tailwind CSS.',            'OPEN',       'MEDIUM', 4,  4, '2024-01-22 09:00:00', NOW()),
    (17, 'Setup Vite + TypeScript strict',       'Cấu hình bundler và tsconfig cho build tối ưu.',                  'COMPLETED',  'HIGH',   4,  4, '2024-01-21 09:00:00', NOW()),
    -- Dự án 5: Tích hợp ERP (PAUSED)
    (18, 'Phân tích API SAP HR module',         'Tài liệu hóa các endpoint SAP cần tích hợp.',                     'COMPLETED',  'HIGH',   16, 5, '2023-11-05 09:00:00', NOW()),
    (19, 'PoC kết nối SAP qua REST API',        'Xây dựng proof-of-concept đồng bộ nhân viên từ SAP sang HR.',     'OPEN',       'HIGH',   5,  5, '2023-11-15 09:00:00', NOW()),
    -- Dự án 6: Tuyển dụng Q2 (COMPLETED)
    (20, 'Đăng tin tuyển dụng Backend Dev',     'Đăng 10 vị trí Backend trên TopDev, LinkedIn.',                   'COMPLETED',  'HIGH',   8,  6, '2024-04-02 09:00:00', NOW()),
    (21, 'Lọc CV và sắp xếp phỏng vấn',        'Review 200+ CV, lên lịch phỏng vấn vòng 1.',                     'COMPLETED',  'HIGH',   9,  6, '2024-04-10 09:00:00', NOW()),
    (22, 'Offer letter và onboarding plan',     'Gửi offer cho 20 ứng viên được chọn, lên kế hoạch onboard.',     'COMPLETED',  'MEDIUM', 7,  6, '2024-05-01 09:00:00', NOW()),
    -- Dự án 7: Đào tạo onboarding (COMPLETED)
    (23, 'Xây dựng tài liệu onboarding',        'Soạn bộ tài liệu giới thiệu công ty, quy trình, văn hóa.',        'COMPLETED',  'HIGH',   10, 7, '2024-01-08 09:00:00', NOW()),
    (24, 'Tổ chức buổi orientation Q1',         'Tổ chức 2 buổi orientation cho 15 nhân viên mới.',                'COMPLETED',  'MEDIUM', 7,  7, '2024-01-15 09:00:00', NOW()),
    (25, 'Khảo sát phản hồi nhân viên mới',     'Thu thập feedback sau 30 ngày làm việc.',                          'COMPLETED',  'LOW',    8,  7, '2024-02-15 09:00:00', NOW()),
    -- Dự án 8: Hệ thống KPI cũ (ARCHIVED — tasks cancelled)
    (26, 'Migrate dữ liệu KPI sang hệ mới',    'Export và import lịch sử KPI 3 năm sang hệ thống mới.',           'CANCELLED',  'MEDIUM', 16, 8, '2023-06-01 09:00:00', NOW()),
    (27, 'Shutdown KPI legacy service',         'Tắt service cũ sau khi migration hoàn tất.',                      'CANCELLED',  'LOW',    5,  8, '2023-07-01 09:00:00', NOW()),
    -- Tasks bổ sung cho coverage phong phú
    (28, 'Code review PR backend sprint 12',    'Review và merge 8 pull request trong sprint 12.',                  'IN_PROGRESS','MEDIUM', 2,  1, '2024-06-23 09:00:00', NOW()),
    (29, 'Performance testing auth-service',    'Load test với 500 concurrent users, mục tiêu p95 < 500ms.',       'OPEN',       'URGENT', 5,  1, '2024-06-25 09:00:00', NOW()),
    (30, 'Cập nhật tài liệu API Swagger',       'Sync Swagger docs cho tất cả endpoint mới trong sprint 12-13.',   'OPEN',       'LOW',    3,  1, '2024-06-25 09:00:00', NOW());
