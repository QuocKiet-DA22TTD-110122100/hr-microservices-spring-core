-- ============================================================
-- FULL AUTH SEED — ECC Group HR System (PostgreSQL)
-- DB: auth_service
-- Mật khẩu tất cả tài khoản: Admin@123456
-- Hash: Argon2id (m=16384, t=2, p=1)
-- ============================================================

-- ── 1. Role Definitions ──────────────────────────────────────
INSERT INTO role_definitions (name, description, permissions, system_role, created_at, updated_at)
VALUES
    ('ADMIN',           'Quản trị hệ thống toàn quyền',
     'ALL', true, '2024-01-01 07:00:00+07', '2024-01-01 07:00:00+07'),

    ('HR_MANAGER',      'Quản lý nhân sự — toàn quyền HR, đọc dự án/task, duyệt lương',
     'READ_EMPLOYEE,WRITE_EMPLOYEE,DELETE_EMPLOYEE,READ_DEPARTMENT,WRITE_DEPARTMENT,DELETE_DEPARTMENT,READ_ORGANIZATION,WRITE_ORGANIZATION,READ_USER,WRITE_USER,READ_PROJECT,READ_TASK,READ_PAYROLL,WRITE_PAYROLL,APPROVE_PAYROLL',
     true, '2024-01-01 07:00:00+07', '2024-01-01 07:00:00+07'),

    ('PAYROLL_OFFICER', 'Chuyên viên tính lương — xem/tạo/duyệt bảng lương',
     'READ_EMPLOYEE,READ_PAYROLL,WRITE_PAYROLL,APPROVE_PAYROLL,PROCESS_PAYROLL',
     true, '2024-01-01 07:00:00+07', '2024-01-01 07:00:00+07'),

    ('DEPARTMENT_HEAD', 'Trưởng phòng — xem nhân sự phòng, quản lý task',
     'READ_EMPLOYEE,READ_DEPARTMENT,READ_ORGANIZATION,READ_PROJECT,READ_TASK,WRITE_TASK',
     true, '2024-01-01 07:00:00+07', '2024-01-01 07:00:00+07'),

    ('MANAGER',         'Quản lý dự án / nhóm kỹ thuật',
     'READ_EMPLOYEE,READ_DEPARTMENT,READ_PROJECT,WRITE_PROJECT,READ_TASK,WRITE_TASK,DELETE_TASK',
     true, '2024-01-01 07:00:00+07', '2024-01-01 07:00:00+07'),

    ('EMPLOYEE',        'Nhân viên — tự phục vụ, xem dự án và task được giao',
     'READ_EMPLOYEE,READ_DEPARTMENT,READ_ORGANIZATION,READ_PROJECT,READ_TASK',
     true, '2024-01-01 07:00:00+07', '2024-01-01 07:00:00+07'),

    ('USER',            'Người dùng hệ thống, chưa phân quyền nghiệp vụ',
     '', true, '2024-01-01 07:00:00+07', '2024-01-01 07:00:00+07')
ON CONFLICT (name) DO UPDATE SET
    description  = EXCLUDED.description,
    permissions  = EXCLUDED.permissions,
    system_role  = EXCLUDED.system_role,
    updated_at   = NOW();

-- ── 2. Users ─────────────────────────────────────────────────
-- Giữ nguyên 5 user cũ + thêm 15 user mới = 20 tổng
INSERT INTO users (id, username, password_hash, role, password_updated_at, created_at, updated_at, locked, two_factor_enabled)
VALUES
    -- ── Ban lãnh đạo & Admin ──
    ('28759924-7b71-4220-bf8d-06d64ce7cae6', 'admin',
     '$argon2id$v=19$m=16384,t=2,p=1$tx1aVLo9IlrzWnRAAvNPoA$c657rxfjyeCKx34jfs5YjL9wHOdAvFNCB0I3zLhDZ/k',
     'ADMIN',           '2024-01-02 08:00:00+07', '2024-01-02 08:00:00+07', '2024-01-02 08:00:00+07', false, false),

    ('a1000013-0000-0000-0000-000000000013', 'tran.duc.hung',
     '$argon2id$v=19$m=16384,t=2,p=1$tx1aVLo9IlrzWnRAAvNPoA$c657rxfjyeCKx34jfs5YjL9wHOdAvFNCB0I3zLhDZ/k',
     'DEPARTMENT_HEAD', '2023-12-01 08:00:00+07', '2023-12-01 08:00:00+07', '2023-12-01 08:00:00+07', false, false),

    -- ── Nhân sự & Lương ──
    ('3c07be88-39df-4e33-8e20-71ba6ad4af5a', 'hr.manager',
     '$argon2id$v=19$m=16384,t=2,p=1$tx1aVLo9IlrzWnRAAvNPoA$c657rxfjyeCKx34jfs5YjL9wHOdAvFNCB0I3zLhDZ/k',
     'HR_MANAGER',      '2024-02-01 08:00:00+07', '2024-02-01 08:00:00+07', '2024-02-01 08:00:00+07', false, false),

    ('a1000014-0000-0000-0000-000000000014', 'nguyen.minh.tuan',
     '$argon2id$v=19$m=16384,t=2,p=1$tx1aVLo9IlrzWnRAAvNPoA$c657rxfjyeCKx34jfs5YjL9wHOdAvFNCB0I3zLhDZ/k',
     'HR_MANAGER',      '2023-11-01 08:00:00+07', '2023-11-01 08:00:00+07', '2023-11-01 08:00:00+07', false, false),

    ('f6f8b8a7-7df7-42f4-a3e1-c34daed22755', 'payroll.officer',
     '$argon2id$v=19$m=16384,t=2,p=1$tx1aVLo9IlrzWnRAAvNPoA$c657rxfjyeCKx34jfs5YjL9wHOdAvFNCB0I3zLhDZ/k',
     'PAYROLL_OFFICER', '2024-05-15 08:00:00+07', '2024-05-15 08:00:00+07', '2024-05-15 08:00:00+07', false, false),

    ('a1000015-0000-0000-0000-000000000015', 'pham.thu.hoa',
     '$argon2id$v=19$m=16384,t=2,p=1$tx1aVLo9IlrzWnRAAvNPoA$c657rxfjyeCKx34jfs5YjL9wHOdAvFNCB0I3zLhDZ/k',
     'PAYROLL_OFFICER', '2024-01-15 08:00:00+07', '2024-01-15 08:00:00+07', '2024-01-15 08:00:00+07', false, false),

    -- ── Quản lý dự án ──
    ('49ca806e-2725-4af8-a049-2625ea5bc8ac', 'manager',
     '$argon2id$v=19$m=16384,t=2,p=1$tx1aVLo9IlrzWnRAAvNPoA$c657rxfjyeCKx34jfs5YjL9wHOdAvFNCB0I3zLhDZ/k',
     'MANAGER',         '2024-03-15 08:00:00+07', '2024-03-15 08:00:00+07', '2024-03-15 08:00:00+07', false, false),

    ('a1000002-0000-0000-0000-000000000002', 'pham.bich.ngoc',
     '$argon2id$v=19$m=16384,t=2,p=1$tx1aVLo9IlrzWnRAAvNPoA$c657rxfjyeCKx34jfs5YjL9wHOdAvFNCB0I3zLhDZ/k',
     'MANAGER',         '2024-03-20 08:00:00+07', '2024-03-20 08:00:00+07', '2024-03-20 08:00:00+07', false, false),

    ('a1000003-0000-0000-0000-000000000003', 'tran.duc.thanh',
     '$argon2id$v=19$m=16384,t=2,p=1$tx1aVLo9IlrzWnRAAvNPoA$c657rxfjyeCKx34jfs5YjL9wHOdAvFNCB0I3zLhDZ/k',
     'MANAGER',         '2024-02-28 08:00:00+07', '2024-02-28 08:00:00+07', '2024-02-28 08:00:00+07', false, false),

    ('a1000006-0000-0000-0000-000000000006', 'nguyen.thanh.long',
     '$argon2id$v=19$m=16384,t=2,p=1$tx1aVLo9IlrzWnRAAvNPoA$c657rxfjyeCKx34jfs5YjL9wHOdAvFNCB0I3zLhDZ/k',
     'MANAGER',         '2024-07-01 08:00:00+07', '2024-07-01 08:00:00+07', '2024-07-01 08:00:00+07', false, false),

    -- ── Nhân viên kỹ thuật ──
    ('f9831e0f-9b28-43d9-b3ab-94df70f2e33e', 'employee',
     '$argon2id$v=19$m=16384,t=2,p=1$tx1aVLo9IlrzWnRAAvNPoA$c657rxfjyeCKx34jfs5YjL9wHOdAvFNCB0I3zLhDZ/k',
     'EMPLOYEE',        '2024-06-01 08:00:00+07', '2024-06-01 08:00:00+07', '2024-06-01 08:00:00+07', false, false),

    ('a1000001-0000-0000-0000-000000000001', 'nguyen.van.an',
     '$argon2id$v=19$m=16384,t=2,p=1$tx1aVLo9IlrzWnRAAvNPoA$c657rxfjyeCKx34jfs5YjL9wHOdAvFNCB0I3zLhDZ/k',
     'EMPLOYEE',        '2024-04-10 08:00:00+07', '2024-04-10 08:00:00+07', '2024-04-10 08:00:00+07', false, false),

    ('a1000004-0000-0000-0000-000000000004', 'le.hoang.minh',
     '$argon2id$v=19$m=16384,t=2,p=1$tx1aVLo9IlrzWnRAAvNPoA$c657rxfjyeCKx34jfs5YjL9wHOdAvFNCB0I3zLhDZ/k',
     'EMPLOYEE',        '2024-05-05 08:00:00+07', '2024-05-05 08:00:00+07', '2024-05-05 08:00:00+07', false, false),

    ('a1000008-0000-0000-0000-000000000008', 'hoang.duc.nam',
     '$argon2id$v=19$m=16384,t=2,p=1$tx1aVLo9IlrzWnRAAvNPoA$c657rxfjyeCKx34jfs5YjL9wHOdAvFNCB0I3zLhDZ/k',
     'EMPLOYEE',        '2024-08-01 08:00:00+07', '2024-08-01 08:00:00+07', '2024-08-01 08:00:00+07', false, false),

    ('a1000010-0000-0000-0000-000000000010', 'bui.quang.vinh',
     '$argon2id$v=19$m=16384,t=2,p=1$tx1aVLo9IlrzWnRAAvNPoA$c657rxfjyeCKx34jfs5YjL9wHOdAvFNCB0I3zLhDZ/k',
     'EMPLOYEE',        '2024-09-01 08:00:00+07', '2024-09-01 08:00:00+07', '2024-09-01 08:00:00+07', false, false),

    -- ── Nhân viên nghiệp vụ ──
    ('a1000005-0000-0000-0000-000000000005', 'vo.kim.chi',
     '$argon2id$v=19$m=16384,t=2,p=1$tx1aVLo9IlrzWnRAAvNPoA$c657rxfjyeCKx34jfs5YjL9wHOdAvFNCB0I3zLhDZ/k',
     'EMPLOYEE',        '2024-06-15 08:00:00+07', '2024-06-15 08:00:00+07', '2024-06-15 08:00:00+07', false, false),

    ('a1000007-0000-0000-0000-000000000007', 'truong.thi.lan',
     '$argon2id$v=19$m=16384,t=2,p=1$tx1aVLo9IlrzWnRAAvNPoA$c657rxfjyeCKx34jfs5YjL9wHOdAvFNCB0I3zLhDZ/k',
     'EMPLOYEE',        '2024-07-15 08:00:00+07', '2024-07-15 08:00:00+07', '2024-07-15 08:00:00+07', false, false),

    ('a1000009-0000-0000-0000-000000000009', 'dang.thi.huong',
     '$argon2id$v=19$m=16384,t=2,p=1$tx1aVLo9IlrzWnRAAvNPoA$c657rxfjyeCKx34jfs5YjL9wHOdAvFNCB0I3zLhDZ/k',
     'EMPLOYEE',        '2024-08-15 08:00:00+07', '2024-08-15 08:00:00+07', '2024-08-15 08:00:00+07', false, false),

    ('a1000011-0000-0000-0000-000000000011', 'do.thi.thuy',
     '$argon2id$v=19$m=16384,t=2,p=1$tx1aVLo9IlrzWnRAAvNPoA$c657rxfjyeCKx34jfs5YjL9wHOdAvFNCB0I3zLhDZ/k',
     'EMPLOYEE',        '2024-09-15 08:00:00+07', '2024-09-15 08:00:00+07', '2024-09-15 08:00:00+07', false, false),

    ('a1000012-0000-0000-0000-000000000012', 'ly.van.hoa',
     '$argon2id$v=19$m=16384,t=2,p=1$tx1aVLo9IlrzWnRAAvNPoA$c657rxfjyeCKx34jfs5YjL9wHOdAvFNCB0I3zLhDZ/k',
     'EMPLOYEE',        '2024-10-01 08:00:00+07', '2024-10-01 08:00:00+07', '2024-10-01 08:00:00+07', false, false)
ON CONFLICT (id) DO UPDATE SET
    username   = EXCLUDED.username,
    role       = EXCLUDED.role,
    updated_at = NOW(),
    locked     = false;

-- ── 3. Password History ──────────────────────────────────────
INSERT INTO user_password_history (id, user_id, password_hash, created_at)
VALUES
    ('5b6f808e-9cae-4f2d-8a9f-d0f3e25f68cf', '28759924-7b71-4220-bf8d-06d64ce7cae6', '$argon2id$v=19$m=16384,t=2,p=1$tx1aVLo9IlrzWnRAAvNPoA$c657rxfjyeCKx34jfs5YjL9wHOdAvFNCB0I3zLhDZ/k', '2024-01-02 08:00:00+07'),
    ('9fffe7be-0d4d-4b79-8d93-7159306123cd', '3c07be88-39df-4e33-8e20-71ba6ad4af5a', '$argon2id$v=19$m=16384,t=2,p=1$tx1aVLo9IlrzWnRAAvNPoA$c657rxfjyeCKx34jfs5YjL9wHOdAvFNCB0I3zLhDZ/k', '2024-02-01 08:00:00+07'),
    ('f0974040-ce86-4f2b-a91f-9fe905ce45b0', 'f6f8b8a7-7df7-42f4-a3e1-c34daed22755', '$argon2id$v=19$m=16384,t=2,p=1$tx1aVLo9IlrzWnRAAvNPoA$c657rxfjyeCKx34jfs5YjL9wHOdAvFNCB0I3zLhDZ/k', '2024-05-15 08:00:00+07'),
    ('9268f0ac-d193-4baa-aea1-84fe40b437f0', '49ca806e-2725-4af8-a049-2625ea5bc8ac', '$argon2id$v=19$m=16384,t=2,p=1$tx1aVLo9IlrzWnRAAvNPoA$c657rxfjyeCKx34jfs5YjL9wHOdAvFNCB0I3zLhDZ/k', '2024-03-15 08:00:00+07'),
    ('c4b2747a-155e-4f37-a93b-fd473f75d514', 'f9831e0f-9b28-43d9-b3ab-94df70f2e33e', '$argon2id$v=19$m=16384,t=2,p=1$tx1aVLo9IlrzWnRAAvNPoA$c657rxfjyeCKx34jfs5YjL9wHOdAvFNCB0I3zLhDZ/k', '2024-06-01 08:00:00+07'),
    ('b2000001-0000-0000-0000-000000000001', 'a1000001-0000-0000-0000-000000000001', '$argon2id$v=19$m=16384,t=2,p=1$tx1aVLo9IlrzWnRAAvNPoA$c657rxfjyeCKx34jfs5YjL9wHOdAvFNCB0I3zLhDZ/k', '2024-04-10 08:00:00+07'),
    ('b2000002-0000-0000-0000-000000000002', 'a1000002-0000-0000-0000-000000000002', '$argon2id$v=19$m=16384,t=2,p=1$tx1aVLo9IlrzWnRAAvNPoA$c657rxfjyeCKx34jfs5YjL9wHOdAvFNCB0I3zLhDZ/k', '2024-03-20 08:00:00+07'),
    ('b2000003-0000-0000-0000-000000000003', 'a1000003-0000-0000-0000-000000000003', '$argon2id$v=19$m=16384,t=2,p=1$tx1aVLo9IlrzWnRAAvNPoA$c657rxfjyeCKx34jfs5YjL9wHOdAvFNCB0I3zLhDZ/k', '2024-02-28 08:00:00+07'),
    ('b2000004-0000-0000-0000-000000000004', 'a1000004-0000-0000-0000-000000000004', '$argon2id$v=19$m=16384,t=2,p=1$tx1aVLo9IlrzWnRAAvNPoA$c657rxfjyeCKx34jfs5YjL9wHOdAvFNCB0I3zLhDZ/k', '2024-05-05 08:00:00+07'),
    ('b2000005-0000-0000-0000-000000000005', 'a1000005-0000-0000-0000-000000000005', '$argon2id$v=19$m=16384,t=2,p=1$tx1aVLo9IlrzWnRAAvNPoA$c657rxfjyeCKx34jfs5YjL9wHOdAvFNCB0I3zLhDZ/k', '2024-06-15 08:00:00+07'),
    ('b2000006-0000-0000-0000-000000000006', 'a1000006-0000-0000-0000-000000000006', '$argon2id$v=19$m=16384,t=2,p=1$tx1aVLo9IlrzWnRAAvNPoA$c657rxfjyeCKx34jfs5YjL9wHOdAvFNCB0I3zLhDZ/k', '2024-07-01 08:00:00+07'),
    ('b2000007-0000-0000-0000-000000000007', 'a1000007-0000-0000-0000-000000000007', '$argon2id$v=19$m=16384,t=2,p=1$tx1aVLo9IlrzWnRAAvNPoA$c657rxfjyeCKx34jfs5YjL9wHOdAvFNCB0I3zLhDZ/k', '2024-07-15 08:00:00+07'),
    ('b2000008-0000-0000-0000-000000000008', 'a1000008-0000-0000-0000-000000000008', '$argon2id$v=19$m=16384,t=2,p=1$tx1aVLo9IlrzWnRAAvNPoA$c657rxfjyeCKx34jfs5YjL9wHOdAvFNCB0I3zLhDZ/k', '2024-08-01 08:00:00+07'),
    ('b2000009-0000-0000-0000-000000000009', 'a1000009-0000-0000-0000-000000000009', '$argon2id$v=19$m=16384,t=2,p=1$tx1aVLo9IlrzWnRAAvNPoA$c657rxfjyeCKx34jfs5YjL9wHOdAvFNCB0I3zLhDZ/k', '2024-08-15 08:00:00+07'),
    ('b2000010-0000-0000-0000-000000000010', 'a1000010-0000-0000-0000-000000000010', '$argon2id$v=19$m=16384,t=2,p=1$tx1aVLo9IlrzWnRAAvNPoA$c657rxfjyeCKx34jfs5YjL9wHOdAvFNCB0I3zLhDZ/k', '2024-09-01 08:00:00+07'),
    ('b2000011-0000-0000-0000-000000000011', 'a1000011-0000-0000-0000-000000000011', '$argon2id$v=19$m=16384,t=2,p=1$tx1aVLo9IlrzWnRAAvNPoA$c657rxfjyeCKx34jfs5YjL9wHOdAvFNCB0I3zLhDZ/k', '2024-09-15 08:00:00+07'),
    ('b2000012-0000-0000-0000-000000000012', 'a1000012-0000-0000-0000-000000000012', '$argon2id$v=19$m=16384,t=2,p=1$tx1aVLo9IlrzWnRAAvNPoA$c657rxfjyeCKx34jfs5YjL9wHOdAvFNCB0I3zLhDZ/k', '2024-10-01 08:00:00+07'),
    ('b2000013-0000-0000-0000-000000000013', 'a1000013-0000-0000-0000-000000000013', '$argon2id$v=19$m=16384,t=2,p=1$tx1aVLo9IlrzWnRAAvNPoA$c657rxfjyeCKx34jfs5YjL9wHOdAvFNCB0I3zLhDZ/k', '2023-12-01 08:00:00+07'),
    ('b2000014-0000-0000-0000-000000000014', 'a1000014-0000-0000-0000-000000000014', '$argon2id$v=19$m=16384,t=2,p=1$tx1aVLo9IlrzWnRAAvNPoA$c657rxfjyeCKx34jfs5YjL9wHOdAvFNCB0I3zLhDZ/k', '2023-11-01 08:00:00+07'),
    ('b2000015-0000-0000-0000-000000000015', 'a1000015-0000-0000-0000-000000000015', '$argon2id$v=19$m=16384,t=2,p=1$tx1aVLo9IlrzWnRAAvNPoA$c657rxfjyeCKx34jfs5YjL9wHOdAvFNCB0I3zLhDZ/k', '2024-01-15 08:00:00+07')
ON CONFLICT (id) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    created_at    = EXCLUDED.created_at;
