-- Project Service seed data — INSERT IGNORE để idempotent
-- lead_id và employee_id tham chiếu employee.id từ hr-service

INSERT IGNORE INTO projects (id, name, description, status, lead_id, created_at, updated_at) VALUES
    (1, 'Hệ thống HR Microservices',  'Xây dựng nền tảng quản lý nhân sự dạng microservices hiện đại.',      'ACTIVE',    2,  '2024-01-10 08:00:00', NOW()),
    (2, 'Cổng thông tin nhân viên',   'Portal tự phục vụ cho nhân viên tra cứu thông tin lương và phúc lợi.','ACTIVE',    2,  '2024-02-15 09:00:00', NOW()),
    (3, 'Hệ thống chấm công',         'Tích hợp máy chấm công và tự động tính công theo ca.',                'ACTIVE',    15, '2024-03-01 08:30:00', NOW()),
    (4, 'Tái cấu trúc Frontend',       'Nâng cấp UI từ legacy sang React + Tailwind CSS.',                   'PAUSED',    2,  '2024-01-20 10:00:00', NOW()),
    (5, 'Tích hợp ERP',               'Kết nối hệ thống HR với phần mềm kế toán SAP.',                      'PAUSED',    16, '2023-11-01 08:00:00', NOW()),
    (6, 'Chiến dịch tuyển dụng Q2',   'Tuyển 20 vị trí kỹ thuật và 5 vị trí kinh doanh trong Q2/2024.',    'COMPLETED', 7,  '2024-04-01 08:00:00', NOW()),
    (7, 'Đào tạo onboarding 2024',    'Xây dựng chương trình onboarding chuẩn hóa cho nhân viên mới.',      'COMPLETED', 7,  '2024-01-05 08:00:00', NOW()),
    (8, 'Hệ thống KPI cũ',            'Hệ thống đánh giá hiệu suất thế hệ trước — đã lưu trữ.',            'ARCHIVED',  16, '2023-01-01 08:00:00', NOW());

INSERT IGNORE INTO project_assignments (id, project_id, employee_id, role, active, assigned_at) VALUES
    -- Dự án 1: HR Microservices
    (1,  1, 2,  'MANAGER',   true,  '2024-01-10 08:00:00'),
    (2,  1, 3,  'DEVELOPER', true,  '2024-01-10 08:00:00'),
    (3,  1, 4,  'DEVELOPER', true,  '2024-01-15 08:00:00'),
    (4,  1, 5,  'DEVELOPER', true,  '2024-01-15 08:00:00'),
    (5,  1, 6,  'QA',        true,  '2024-01-20 08:00:00'),
    -- Dự án 2: Cổng thông tin nhân viên
    (6,  2, 2,  'MANAGER',   true,  '2024-02-15 09:00:00'),
    (7,  2, 4,  'DEVELOPER', true,  '2024-02-15 09:00:00'),
    (8,  2, 3,  'DEVELOPER', true,  '2024-02-20 09:00:00'),
    (9,  2, 6,  'QA',        true,  '2024-02-20 09:00:00'),
    -- Dự án 3: Hệ thống chấm công
    (10, 3, 15, 'MANAGER',   true,  '2024-03-01 08:30:00'),
    (11, 3, 16, 'MEMBER',    true,  '2024-03-01 08:30:00'),
    (12, 3, 17, 'MEMBER',    true,  '2024-03-05 08:30:00'),
    (13, 3, 5,  'DEVELOPER', true,  '2024-03-05 08:30:00'),
    -- Dự án 4: Tái cấu trúc Frontend (paused)
    (14, 4, 2,  'MANAGER',   false, '2024-01-20 10:00:00'),
    (15, 4, 4,  'DEVELOPER', false, '2024-01-20 10:00:00'),
    (16, 4, 19, 'MEMBER',    false, '2024-01-25 10:00:00'),
    -- Dự án 5: Tích hợp ERP (paused)
    (17, 5, 16, 'MANAGER',   false, '2023-11-01 08:00:00'),
    (18, 5, 12, 'MEMBER',    false, '2023-11-01 08:00:00'),
    (19, 5, 13, 'MEMBER',    false, '2023-11-05 08:00:00'),
    -- Dự án 6: Tuyển dụng Q2 (completed)
    (20, 6, 7,  'MANAGER',   false, '2024-04-01 08:00:00'),
    (21, 6, 8,  'MEMBER',    false, '2024-04-01 08:00:00'),
    (22, 6, 9,  'MEMBER',    false, '2024-04-01 08:00:00'),
    -- Dự án 7: Đào tạo onboarding (completed)
    (23, 7, 7,  'MANAGER',   false, '2024-01-05 08:00:00'),
    (24, 7, 10, 'MEMBER',    false, '2024-01-05 08:00:00'),
    (25, 7, 8,  'MEMBER',    false, '2024-01-10 08:00:00');
