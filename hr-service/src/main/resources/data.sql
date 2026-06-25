-- HR Service seed data — chạy mỗi lần khởi động (INSERT IGNORE)
-- auth_user_id khớp với users trong auth-service/data.sql

INSERT IGNORE INTO organization_units (id, name, code, level, parent_id) VALUES
    (1, 'Tập đoàn HR Holdings',      'HR-CORP',    'CORPORATION',    NULL),
    (2, 'Công ty TNHH HR Tech',       'HR-TECH',    'TOTAL_COMPANY',  1),
    (3, 'Trung tâm Công nghệ',        'ORG-IT',     'MEMBER_COMPANY', 2),
    (4, 'Trung tâm Hành chính',       'ORG-ADMIN',  'MEMBER_COMPANY', 2),
    (5, 'Trung tâm Kinh doanh',       'ORG-BIZ',    'MEMBER_COMPANY', 2);

INSERT IGNORE INTO departments (id, name, code, organization_unit_id) VALUES
    (1, 'Công nghệ thông tin', 'IT',    3),
    (2, 'Nhân sự',             'HR',    4),
    (3, 'Tài chính',           'FIN',   4),
    (4, 'Vận hành',            'OPS',   5),
    (5, 'Marketing',           'MKT',   5);

INSERT IGNORE INTO employee
    (id, auth_user_id, username, name, position, base_salary, currency, job_level, hire_date, status, department_id, created_at)
VALUES
    -- Phòng IT (dept_id=1)
    (1,  '28759924-7b71-4220-bf8d-06d64ce7cae6', 'admin',           'Nguyễn Quản Trị',    'System Administrator', 35000000, 'VND', 'L5', '2020-01-15', 'ACTIVE', 1, NOW()),
    (2,  '49ca806e-2725-4af8-a049-2625ea5bc8ac', 'manager',         'Lê Văn Quản Lý',     'Engineering Manager',  30000000, 'VND', 'L4', '2020-03-01', 'ACTIVE', 1, NOW()),
    (3,  'a1000001-0000-0000-0000-000000000001', 'nguyen.van.an',   'Nguyễn Văn An',      'Backend Developer',    18000000, 'VND', 'L2', '2021-06-01', 'ACTIVE', 1, NOW()),
    (4,  'a1000004-0000-0000-0000-000000000004', 'le.hoang.minh',   'Lê Hoàng Minh',      'Frontend Developer',   17000000, 'VND', 'L2', '2021-08-15', 'ACTIVE', 1, NOW()),
    (5,  'a1000010-0000-0000-0000-000000000010', 'bui.quang.vinh',  'Bùi Quang Vinh',     'DevOps Engineer',      20000000, 'VND', 'L3', '2021-02-20', 'ACTIVE', 1, NOW()),
    (6,  'a1000011-0000-0000-0000-000000000011', 'do.thi.thuy',     'Đỗ Thị Thủy',        'QA Engineer',          16000000, 'VND', 'L2', '2022-01-10', 'ACTIVE', 1, NOW()),
    -- Phòng HR (dept_id=2)
    (7,  '3c07be88-39df-4e33-8e20-71ba6ad4af5a', 'hr.manager',      'Trần Thị HR',        'HR Manager',           28000000, 'VND', 'L4', '2019-11-01', 'ACTIVE', 2, NOW()),
    (8,  'a1000014-0000-0000-0000-000000000014', 'nguyen.minh.tuan','Nguyễn Minh Tuấn',   'HR Specialist',        15000000, 'VND', 'L2', '2022-04-01', 'ACTIVE', 2, NOW()),
    (9,  'a1000007-0000-0000-0000-000000000007', 'truong.thi.lan',  'Trương Thị Lan',     'Recruitment Officer',  14000000, 'VND', 'L1', '2022-07-01', 'ACTIVE', 2, NOW()),
    (10, 'a1000009-0000-0000-0000-000000000009', 'dang.thi.huong',  'Đặng Thị Hương',     'Training Coordinator', 13500000, 'VND', 'L1', '2023-01-15', 'ACTIVE', 2, NOW()),
    -- Phòng Tài chính (dept_id=3)
    (11, 'f6f8b8a7-7df7-42f4-a3e1-c34daed22755', 'payroll.officer', 'Phạm Payroll',       'Payroll Officer',      22000000, 'VND', 'L3', '2020-09-01', 'ACTIVE', 3, NOW()),
    (12, 'a1000015-0000-0000-0000-000000000015', 'pham.thu.hoa',    'Phạm Thu Hoa',       'Accountant',           18000000, 'VND', 'L2', '2021-03-15', 'ACTIVE', 3, NOW()),
    (13, 'a1000012-0000-0000-0000-000000000012', 'ly.van.hoa',      'Lý Văn Hoa',         'Finance Analyst',      17500000, 'VND', 'L2', '2021-10-01', 'ACTIVE', 3, NOW()),
    -- Phòng Vận hành (dept_id=4)
    (14, 'a1000013-0000-0000-0000-000000000013', 'tran.duc.hung',   'Trần Đức Hùng',      'Department Head',      32000000, 'VND', 'L5', '2018-05-01', 'ACTIVE', 4, NOW()),
    (15, 'a1000003-0000-0000-0000-000000000003', 'tran.duc.thanh',  'Trần Đức Thành',     'Operations Lead',      24000000, 'VND', 'L3', '2020-07-15', 'ACTIVE', 4, NOW()),
    (16, 'a1000006-0000-0000-0000-000000000006', 'nguyen.thanh.long','Nguyễn Thanh Long',  'Operations Manager',   26000000, 'VND', 'L4', '2019-12-01', 'ACTIVE', 4, NOW()),
    (17, 'a1000005-0000-0000-0000-000000000005', 'vo.kim.chi',      'Võ Kim Chi',         'Operations Analyst',   15000000, 'VND', 'L2', '2022-02-28', 'ACTIVE', 4, NOW()),
    -- Phòng Marketing (dept_id=5)
    (18, 'a1000002-0000-0000-0000-000000000002', 'pham.bich.ngoc',  'Phạm Bích Ngọc',     'Marketing Manager',    27000000, 'VND', 'L4', '2020-04-01', 'ACTIVE', 5, NOW()),
    (19, 'f9831e0f-9b28-43d9-b3ab-94df70f2e33e', 'employee',        'Nhân Viên Mẫu',      'Marketing Specialist', 14000000, 'VND', 'L1', '2023-03-01', 'ACTIVE', 5, NOW()),
    (20, 'a1000008-0000-0000-0000-000000000008', 'hoang.duc.nam',   'Hoàng Đức Nam',      'Content Creator',      13000000, 'VND', 'L1', '2023-05-15', 'ACTIVE', 5, NOW());
