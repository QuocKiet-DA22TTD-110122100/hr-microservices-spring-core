-- Seed deterministic: chạy mỗi lần auth-service khởi động.
-- Mật khẩu tất cả tài khoản: Admin@123456
-- Hash: Argon2id (m=16384, t=2, p=1)
DELETE FROM user_password_history;
DELETE FROM users;
DELETE FROM user_sync_outbox;
DELETE FROM user_sync_dlq;
DELETE FROM role_definitions;

INSERT INTO role_definitions (name, description, permissions, system_role)
VALUES
    ('ADMIN',           'Quản trị hệ thống toàn quyền', 'ALL', true),
    ('HR_MANAGER',      'Quản lý nhân sự',               'READ_EMPLOYEE,WRITE_EMPLOYEE,DELETE_EMPLOYEE,READ_DEPARTMENT,WRITE_DEPARTMENT,DELETE_DEPARTMENT,READ_ORGANIZATION,WRITE_ORGANIZATION,READ_USER,READ_PROJECT,READ_TASK,READ_PAYROLL,WRITE_PAYROLL,APPROVE_PAYROLL', true),
    ('PAYROLL_OFFICER', 'Chuyên viên tính lương',         'READ_EMPLOYEE,READ_PAYROLL,WRITE_PAYROLL,APPROVE_PAYROLL,PROCESS_PAYROLL', true),
    ('DEPARTMENT_HEAD', 'Trưởng phòng',                   'READ_EMPLOYEE,READ_DEPARTMENT,READ_ORGANIZATION,READ_PROJECT,READ_TASK,WRITE_TASK', true),
    ('MANAGER',         'Quản lý dự án / nhóm',           'READ_EMPLOYEE,READ_DEPARTMENT,READ_PROJECT,WRITE_PROJECT,READ_TASK,WRITE_TASK,DELETE_TASK', true),
    ('EMPLOYEE',        'Nhân viên tiêu chuẩn',           'READ_EMPLOYEE,READ_DEPARTMENT,READ_ORGANIZATION,READ_PROJECT,READ_TASK', true),
    ('USER',            'Người dùng chưa phân quyền',     '', true);

INSERT INTO users (id, username, password_hash, role, password_updated_at)
VALUES
    -- ── Ban lãnh đạo & Admin ──
    ('28759924-7b71-4220-bf8d-06d64ce7cae6', 'admin',
     '$argon2id$v=19$m=16384,t=2,p=1$8EcW3dyBX1zOpzRDM5yVkw$6WWw2ZyPPKi9/5ttPXrUqzJaTR6koEQW7ph9hXSyMZ0',
     'ADMIN', CURRENT_TIMESTAMP),
    ('a1000013-0000-0000-0000-000000000013', 'tran.duc.hung',
     '$argon2id$v=19$m=16384,t=2,p=1$8EcW3dyBX1zOpzRDM5yVkw$6WWw2ZyPPKi9/5ttPXrUqzJaTR6koEQW7ph9hXSyMZ0',
     'DEPARTMENT_HEAD', CURRENT_TIMESTAMP),

    -- ── Nhân sự ──
    ('3c07be88-39df-4e33-8e20-71ba6ad4af5a', 'hr.manager',
     '$argon2id$v=19$m=16384,t=2,p=1$8EcW3dyBX1zOpzRDM5yVkw$6WWw2ZyPPKi9/5ttPXrUqzJaTR6koEQW7ph9hXSyMZ0',
     'HR_MANAGER', CURRENT_TIMESTAMP),
    ('a1000014-0000-0000-0000-000000000014', 'nguyen.minh.tuan',
     '$argon2id$v=19$m=16384,t=2,p=1$8EcW3dyBX1zOpzRDM5yVkw$6WWw2ZyPPKi9/5ttPXrUqzJaTR6koEQW7ph9hXSyMZ0',
     'HR_MANAGER', CURRENT_TIMESTAMP),

    -- ── Lương ──
    ('f6f8b8a7-7df7-42f4-a3e1-c34daed22755', 'payroll.officer',
     '$argon2id$v=19$m=16384,t=2,p=1$8EcW3dyBX1zOpzRDM5yVkw$6WWw2ZyPPKi9/5ttPXrUqzJaTR6koEQW7ph9hXSyMZ0',
     'PAYROLL_OFFICER', CURRENT_TIMESTAMP),
    ('a1000015-0000-0000-0000-000000000015', 'pham.thu.hoa',
     '$argon2id$v=19$m=16384,t=2,p=1$8EcW3dyBX1zOpzRDM5yVkw$6WWw2ZyPPKi9/5ttPXrUqzJaTR6koEQW7ph9hXSyMZ0',
     'PAYROLL_OFFICER', CURRENT_TIMESTAMP),

    -- ── Quản lý dự án ──
    ('49ca806e-2725-4af8-a049-2625ea5bc8ac', 'manager',
     '$argon2id$v=19$m=16384,t=2,p=1$8EcW3dyBX1zOpzRDM5yVkw$6WWw2ZyPPKi9/5ttPXrUqzJaTR6koEQW7ph9hXSyMZ0',
     'MANAGER', CURRENT_TIMESTAMP),
    ('a1000002-0000-0000-0000-000000000002', 'pham.bich.ngoc',
     '$argon2id$v=19$m=16384,t=2,p=1$8EcW3dyBX1zOpzRDM5yVkw$6WWw2ZyPPKi9/5ttPXrUqzJaTR6koEQW7ph9hXSyMZ0',
     'MANAGER', CURRENT_TIMESTAMP),
    ('a1000003-0000-0000-0000-000000000003', 'tran.duc.thanh',
     '$argon2id$v=19$m=16384,t=2,p=1$8EcW3dyBX1zOpzRDM5yVkw$6WWw2ZyPPKi9/5ttPXrUqzJaTR6koEQW7ph9hXSyMZ0',
     'MANAGER', CURRENT_TIMESTAMP),
    ('a1000006-0000-0000-0000-000000000006', 'nguyen.thanh.long',
     '$argon2id$v=19$m=16384,t=2,p=1$8EcW3dyBX1zOpzRDM5yVkw$6WWw2ZyPPKi9/5ttPXrUqzJaTR6koEQW7ph9hXSyMZ0',
     'MANAGER', CURRENT_TIMESTAMP),

    -- ── Nhân viên ──
    ('f9831e0f-9b28-43d9-b3ab-94df70f2e33e', 'employee',
     '$argon2id$v=19$m=16384,t=2,p=1$8EcW3dyBX1zOpzRDM5yVkw$6WWw2ZyPPKi9/5ttPXrUqzJaTR6koEQW7ph9hXSyMZ0',
     'EMPLOYEE', CURRENT_TIMESTAMP),
    ('a1000001-0000-0000-0000-000000000001', 'nguyen.van.an',
     '$argon2id$v=19$m=16384,t=2,p=1$8EcW3dyBX1zOpzRDM5yVkw$6WWw2ZyPPKi9/5ttPXrUqzJaTR6koEQW7ph9hXSyMZ0',
     'EMPLOYEE', CURRENT_TIMESTAMP),
    ('a1000004-0000-0000-0000-000000000004', 'le.hoang.minh',
     '$argon2id$v=19$m=16384,t=2,p=1$8EcW3dyBX1zOpzRDM5yVkw$6WWw2ZyPPKi9/5ttPXrUqzJaTR6koEQW7ph9hXSyMZ0',
     'EMPLOYEE', CURRENT_TIMESTAMP),
    ('a1000005-0000-0000-0000-000000000005', 'vo.kim.chi',
     '$argon2id$v=19$m=16384,t=2,p=1$8EcW3dyBX1zOpzRDM5yVkw$6WWw2ZyPPKi9/5ttPXrUqzJaTR6koEQW7ph9hXSyMZ0',
     'EMPLOYEE', CURRENT_TIMESTAMP),
    ('a1000007-0000-0000-0000-000000000007', 'truong.thi.lan',
     '$argon2id$v=19$m=16384,t=2,p=1$8EcW3dyBX1zOpzRDM5yVkw$6WWw2ZyPPKi9/5ttPXrUqzJaTR6koEQW7ph9hXSyMZ0',
     'EMPLOYEE', CURRENT_TIMESTAMP),
    ('a1000008-0000-0000-0000-000000000008', 'hoang.duc.nam',
     '$argon2id$v=19$m=16384,t=2,p=1$8EcW3dyBX1zOpzRDM5yVkw$6WWw2ZyPPKi9/5ttPXrUqzJaTR6koEQW7ph9hXSyMZ0',
     'EMPLOYEE', CURRENT_TIMESTAMP),
    ('a1000009-0000-0000-0000-000000000009', 'dang.thi.huong',
     '$argon2id$v=19$m=16384,t=2,p=1$8EcW3dyBX1zOpzRDM5yVkw$6WWw2ZyPPKi9/5ttPXrUqzJaTR6koEQW7ph9hXSyMZ0',
     'EMPLOYEE', CURRENT_TIMESTAMP),
    ('a1000010-0000-0000-0000-000000000010', 'bui.quang.vinh',
     '$argon2id$v=19$m=16384,t=2,p=1$8EcW3dyBX1zOpzRDM5yVkw$6WWw2ZyPPKi9/5ttPXrUqzJaTR6koEQW7ph9hXSyMZ0',
     'EMPLOYEE', CURRENT_TIMESTAMP),
    ('a1000011-0000-0000-0000-000000000011', 'do.thi.thuy',
     '$argon2id$v=19$m=16384,t=2,p=1$8EcW3dyBX1zOpzRDM5yVkw$6WWw2ZyPPKi9/5ttPXrUqzJaTR6koEQW7ph9hXSyMZ0',
     'EMPLOYEE', CURRENT_TIMESTAMP),
    ('a1000012-0000-0000-0000-000000000012', 'ly.van.hoa',
     '$argon2id$v=19$m=16384,t=2,p=1$8EcW3dyBX1zOpzRDM5yVkw$6WWw2ZyPPKi9/5ttPXrUqzJaTR6koEQW7ph9hXSyMZ0',
     'EMPLOYEE', CURRENT_TIMESTAMP);

INSERT INTO user_password_history (id, user_id, password_hash, created_at)
VALUES
    ('5b6f808e-9cae-4f2d-8a9f-d0f3e25f68cf', '28759924-7b71-4220-bf8d-06d64ce7cae6', '$argon2id$v=19$m=16384,t=2,p=1$8EcW3dyBX1zOpzRDM5yVkw$6WWw2ZyPPKi9/5ttPXrUqzJaTR6koEQW7ph9hXSyMZ0', CURRENT_TIMESTAMP),
    ('9fffe7be-0d4d-4b79-8d93-7159306123cd', '3c07be88-39df-4e33-8e20-71ba6ad4af5a', '$argon2id$v=19$m=16384,t=2,p=1$8EcW3dyBX1zOpzRDM5yVkw$6WWw2ZyPPKi9/5ttPXrUqzJaTR6koEQW7ph9hXSyMZ0', CURRENT_TIMESTAMP),
    ('f0974040-ce86-4f2b-a91f-9fe905ce45b0', 'f6f8b8a7-7df7-42f4-a3e1-c34daed22755', '$argon2id$v=19$m=16384,t=2,p=1$8EcW3dyBX1zOpzRDM5yVkw$6WWw2ZyPPKi9/5ttPXrUqzJaTR6koEQW7ph9hXSyMZ0', CURRENT_TIMESTAMP),
    ('9268f0ac-d193-4baa-aea1-84fe40b437f0', '49ca806e-2725-4af8-a049-2625ea5bc8ac', '$argon2id$v=19$m=16384,t=2,p=1$8EcW3dyBX1zOpzRDM5yVkw$6WWw2ZyPPKi9/5ttPXrUqzJaTR6koEQW7ph9hXSyMZ0', CURRENT_TIMESTAMP),
    ('c4b2747a-155e-4f37-a93b-fd473f75d514', 'f9831e0f-9b28-43d9-b3ab-94df70f2e33e', '$argon2id$v=19$m=16384,t=2,p=1$8EcW3dyBX1zOpzRDM5yVkw$6WWw2ZyPPKi9/5ttPXrUqzJaTR6koEQW7ph9hXSyMZ0', CURRENT_TIMESTAMP);
