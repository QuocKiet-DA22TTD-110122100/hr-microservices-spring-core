-- ============================================================
-- FULL HR SEED — ECC Group HR System (MySQL)
-- DB: hr_service
-- Công ty: ECC Group — 28 nhân viên thực tế, lương VND
-- ============================================================

USE hr_service;

-- ── 1. Organization Units ────────────────────────────────────
-- Cấu trúc: Tập đoàn → Công ty → Khối/Chi nhánh
INSERT INTO organization_units (id, code, level, name, parent_id)
VALUES
    (1, 'ECC',       'CORPORATION',   'ECC Group',              NULL),
    (2, 'ECC-VN',    'TOTAL_COMPANY', 'ECC Việt Nam',           1),
    (3, 'ECC-HCM',   'MEMBER_COMPANY','ECC Hồ Chí Minh',        2),
    (4, 'ECC-DN',    'MEMBER_COMPANY','ECC Đà Nẵng',            2),
    (5, 'ECC-HN',    'MEMBER_COMPANY','ECC Hà Nội',             2)
ON DUPLICATE KEY UPDATE
    code = VALUES(code), level = VALUES(level),
    name = VALUES(name), parent_id = VALUES(parent_id);

-- ── 2. Departments ───────────────────────────────────────────
INSERT INTO departments (id, code, name, organization_unit_id)
VALUES
    -- HCM
    (1,  'HR',      'Nhân sự & Hành chính',          3),
    (2,  'ENG',     'Kỹ thuật phần mềm',             3),
    (3,  'PMO',     'Quản lý dự án (PMO)',            3),
    (4,  'QA',      'Đảm bảo chất lượng (QA/Test)',  3),
    (5,  'DEVOPS',  'Vận hành & Hạ tầng (DevOps)',   3),
    (6,  'FIN',     'Tài chính & Kế toán',           3),
    (7,  'SALES',   'Kinh doanh & Marketing',        3),
    -- Đà Nẵng
    (8,  'OPS-DN',  'Vận hành (Đà Nẵng)',            4),
    (9,  'RD-DN',   'Nghiên cứu & Phát triển',       4),
    (10, 'SUP-DN',  'Hỗ trợ khách hàng',             4),
    -- Hà Nội
    (11, 'ENG-HN',  'Kỹ thuật phần mềm (Hà Nội)',   5),
    (12, 'BD-HN',   'Phát triển kinh doanh (Hà Nội)',5)
ON DUPLICATE KEY UPDATE
    code = VALUES(code), name = VALUES(name),
    organization_unit_id = VALUES(organization_unit_id);

-- ── 3. Employees ─────────────────────────────────────────────
-- 28 nhân viên — lương đơn vị VND
-- employee_id liên kết với auth user_id
INSERT INTO employee (
    id, auth_user_id, username, did, name, position,
    base_salary, currency, job_level, hire_date, status,
    created_at, updated_at, department_id
) VALUES
    -- ── Cấp C-Level / Admin ──
    (1,  '28759924-7b71-4220-bf8d-06d64ce7cae6', 'admin',
     'did:ecc:employee:001', 'Nguyễn Hữu Hùng',       'Giám đốc Công nghệ (CTO)',
     85000000, 'VND', 'L6', '2022-01-10', 'ACTIVE', NOW(6), NOW(6), 2),

    (26, 'a1000013-0000-0000-0000-000000000013', 'tran.duc.hung',
     'did:ecc:employee:026', 'Trần Đức Hùng',          'Trưởng phòng Kỹ thuật',
     72000000, 'VND', 'L5', '2022-03-01', 'ACTIVE', NOW(6), NOW(6), 2),

    -- ── Nhân sự ──
    (2,  '3c07be88-39df-4e33-8e20-71ba6ad4af5a', 'hr.manager',
     'did:ecc:employee:002', 'Nguyễn Hà Linh',         'Quản lý Nhân sự',
     45000000, 'VND', 'L4', '2022-04-01', 'ACTIVE', NOW(6), NOW(6), 1),

    (27, 'a1000014-0000-0000-0000-000000000014', 'nguyen.minh.tuan',
     'did:ecc:employee:027', 'Nguyễn Minh Tuấn',       'Giám đốc Nhân sự (HRD)',
     75000000, 'VND', 'L5', '2022-02-15', 'ACTIVE', NOW(6), NOW(6), 1),

    (10, NULL,                                    'tran.hai.yen',
     'did:ecc:employee:010', 'Trần Hải Yến',           'Chuyên viên Tuyển dụng',
     15000000, 'VND', 'L1', '2024-01-08', 'ACTIVE', NOW(6), NOW(6), 1),

    (18, 'a1000005-0000-0000-0000-000000000005', 'vo.kim.chi',
     'did:ecc:employee:018', 'Võ Thị Kim Chi',         'Chuyên viên Nhân sự',
     18000000, 'VND', 'L2', '2024-06-15', 'ACTIVE', NOW(6), NOW(6), 1),

    -- ── Lương & Thuế ──
    (13, 'f6f8b8a7-7df7-42f4-a3e1-c34daed22755', 'payroll.officer',
     'did:ecc:employee:013', 'Đỗ Bảo Trâm',            'Chuyên viên Tính lương',
     32000000, 'VND', 'L3', '2023-05-15', 'ACTIVE', NOW(6), NOW(6), 1),

    (28, 'a1000015-0000-0000-0000-000000000015', 'pham.thu.hoa',
     'did:ecc:employee:028', 'Phạm Thu Hoà',           'Chuyên viên Lương & Phúc lợi',
     30000000, 'VND', 'L3', '2024-01-15', 'ACTIVE', NOW(6), NOW(6), 1),

    -- ── Quản lý Dự án ──
    (3,  '49ca806e-2725-4af8-a049-2625ea5bc8ac', 'manager',
     'did:ecc:employee:003', 'Trần Minh Quân',         'Quản lý Kỹ thuật',
     55000000, 'VND', 'L4', '2022-05-15', 'ACTIVE', NOW(6), NOW(6), 3),

    (9,  NULL,                                    'dang.quoc.bao',
     'did:ecc:employee:009', 'Đặng Quốc Bảo',          'Quản lý Dự án (PM)',
     42000000, 'VND', 'L3', '2023-03-11', 'ACTIVE', NOW(6), NOW(6), 3),

    (8,  NULL,                                    'hoang.kim.ngan',
     'did:ecc:employee:008', 'Hoàng Kim Ngân',          'Chuyên viên Phân tích (BA)',
     21000000, 'VND', 'L2', '2023-05-02', 'ACTIVE', NOW(6), NOW(6), 3),

    (22, 'a1000009-0000-0000-0000-000000000009', 'dang.thi.huong',
     'did:ecc:employee:022', 'Đặng Thị Hương',         'Phân tích Nghiệp vụ (BA)',
     22000000, 'VND', 'L2', '2024-08-15', 'ACTIVE', NOW(6), NOW(6), 3),

    -- ── Backend Engineering ──
    (4,  'f9831e0f-9b28-43d9-b3ab-94df70f2e33e', 'employee',
     'did:ecc:employee:004', 'Lê Thu An',              'Kỹ sư Phần mềm Backend',
     22000000, 'VND', 'L2', '2023-06-01', 'ACTIVE', NOW(6), NOW(6), 2),

    (5,  NULL,                                    'pham.hoang.nam',
     'did:ecc:employee:005', 'Phạm Hoàng Nam',          'Kỹ sư Backend',
     24000000, 'VND', 'L2', '2023-07-10', 'ACTIVE', NOW(6), NOW(6), 2),

    (14, 'a1000001-0000-0000-0000-000000000001', 'nguyen.van.an',
     'did:ecc:employee:014', 'Nguyễn Văn An',           'Kỹ sư Backend Senior',
     38000000, 'VND', 'L3', '2023-10-15', 'ACTIVE', NOW(6), NOW(6), 2),

    (21, 'a1000008-0000-0000-0000-000000000008', 'hoang.duc.nam',
     'did:ecc:employee:021', 'Hoàng Đức Nam',           'Kỹ sư Backend',
     25000000, 'VND', 'L2', '2024-08-01', 'ACTIVE', NOW(6), NOW(6), 2),

    (23, 'a1000010-0000-0000-0000-000000000010', 'bui.quang.vinh',
     'did:ecc:employee:023', 'Bùi Quang Vinh',          'Kỹ sư Phần mềm Junior',
     12000000, 'VND', 'L1', '2025-01-06', 'ACTIVE', NOW(6), NOW(6), 2),

    -- ── Frontend Engineering ──
    (6,  NULL,                                    'vo.thanh.dat',
     'did:ecc:employee:006', 'Võ Thành Đạt',            'Kỹ sư Frontend',
     23000000, 'VND', 'L2', '2023-08-21', 'ACTIVE', NOW(6), NOW(6), 2),

    (15, 'a1000002-0000-0000-0000-000000000002', 'pham.bich.ngoc',
     'did:ecc:employee:015', 'Phạm Thị Bích Ngọc',      'Trưởng nhóm Frontend',
     48000000, 'VND', 'L4', '2023-03-20', 'ACTIVE', NOW(6), NOW(6), 2),

    -- ── QA / Testing ──
    (7,  NULL,                                    'nguyen.my.duyen',
     'did:ecc:employee:007', 'Nguyễn Mỹ Duyên',         'Kỹ sư Kiểm thử (QA)',
     19000000, 'VND', 'L2', '2023-09-05', 'ACTIVE', NOW(6), NOW(6), 4),

    (16, 'a1000003-0000-0000-0000-000000000003', 'tran.duc.thanh',
     'did:ecc:employee:016', 'Trần Đức Thành',           'Trưởng nhóm QA',
     42000000, 'VND', 'L4', '2023-02-28', 'ACTIVE', NOW(6), NOW(6), 4),

    -- ── DevOps / Infrastructure ──
    (11, NULL,                                    'bui.manh.khoa',
     'did:ecc:employee:011', 'Bùi Mạnh Khoa',           'Kỹ sư DevOps',
     35000000, 'VND', 'L3', '2023-11-14', 'ACTIVE', NOW(6), NOW(6), 5),

    (17, 'a1000004-0000-0000-0000-000000000004', 'le.hoang.minh',
     'did:ecc:employee:017', 'Lê Hoàng Minh',            'Kỹ sư Hạ tầng Cloud',
     33000000, 'VND', 'L3', '2024-05-05', 'ACTIVE', NOW(6), NOW(6), 5),

    -- ── Tài chính ──
    (20, 'a1000007-0000-0000-0000-000000000007', 'truong.thi.lan',
     'did:ecc:employee:020', 'Trương Thị Lan',           'Kế toán viên',
     20000000, 'VND', 'L2', '2024-07-15', 'ACTIVE', NOW(6), NOW(6), 6),

    -- ── Kinh doanh ──
    (19, 'a1000006-0000-0000-0000-000000000006', 'nguyen.thanh.long',
     'did:ecc:employee:019', 'Nguyễn Thanh Long',        'Trưởng phòng Kinh doanh',
     50000000, 'VND', 'L4', '2024-07-01', 'ACTIVE', NOW(6), NOW(6), 7),

    -- ── Đà Nẵng — Vận hành & R&D & Hỗ trợ ──
    (12, NULL,                                    'le.minh.chau',
     'did:ecc:employee:012', 'Lê Minh Châu',             'Nhân viên Vận hành',
     14000000, 'VND', 'L1', '2024-03-18', 'ACTIVE', NOW(6), NOW(6), 8),

    (25, 'a1000012-0000-0000-0000-000000000012', 'ly.van.hoa',
     'did:ecc:employee:025', 'Lý Văn Hoa',               'Kỹ sư Nghiên cứu & Phát triển',
     36000000, 'VND', 'L3', '2024-10-01', 'ACTIVE', NOW(6), NOW(6), 9),

    (24, 'a1000011-0000-0000-0000-000000000011', 'do.thi.thuy',
     'did:ecc:employee:024', 'Đỗ Thị Thuỳ',              'Nhân viên CSKH',
     13000000, 'VND', 'L1', '2024-09-15', 'ACTIVE', NOW(6), NOW(6), 10)
ON DUPLICATE KEY UPDATE
    auth_user_id  = VALUES(auth_user_id),
    username      = VALUES(username),
    did           = VALUES(did),
    name          = VALUES(name),
    position      = VALUES(position),
    base_salary   = VALUES(base_salary),
    currency      = VALUES(currency),
    job_level     = VALUES(job_level),
    hire_date     = VALUES(hire_date),
    status        = VALUES(status),
    updated_at    = NOW(6),
    department_id = VALUES(department_id);

-- ── 4. Deduction Types ───────────────────────────────────────
-- Các loại khấu trừ theo quy định Việt Nam 2024
INSERT INTO deduction_type (id, name, description, category, is_percentage, default_rate, employer_contribution_rate, is_mandatory, is_active)
VALUES
    (1, 'Bảo hiểm xã hội (NLĐ)',     'BHXH người lao động đóng hàng tháng',        'INSURANCE',   true, 8.00,  0.00,  true,  true),
    (2, 'Bảo hiểm y tế (NLĐ)',       'BHYT người lao động đóng hàng tháng',        'INSURANCE',   true, 1.50,  0.00,  true,  true),
    (3, 'Bảo hiểm thất nghiệp (NLĐ)','BHTN người lao động đóng hàng tháng',        'INSURANCE',   true, 1.00,  0.00,  true,  true),
    (4, 'BHXH Người sử dụng lao động','BHXH doanh nghiệp đóng cho nhân viên',      'INSURANCE',   true, 0.00, 17.50,  true,  true),
    (5, 'BHYT Người sử dụng lao động','BHYT doanh nghiệp đóng cho nhân viên',      'INSURANCE',   true, 0.00,  3.00,  true,  true),
    (6, 'BHTN Người sử dụng lao động','BHTN doanh nghiệp đóng cho nhân viên',      'INSURANCE',   true, 0.00,  1.00,  true,  true),
    (7, 'Thuế thu nhập cá nhân',      'Thuế TNCN luỹ tiến theo biểu thuế VN 2024', 'TAX',         true, 0.00,  0.00,  true,  true),
    (8, 'Phí công đoàn',              'Đóng góp quỹ công đoàn tự nguyện',          'VOLUNTARY',   true, 1.00,  0.00,  false, true)
ON DUPLICATE KEY UPDATE
    name = VALUES(name), description = VALUES(description),
    category = VALUES(category), is_percentage = VALUES(is_percentage),
    default_rate = VALUES(default_rate),
    employer_contribution_rate = VALUES(employer_contribution_rate),
    is_mandatory = VALUES(is_mandatory), is_active = VALUES(is_active);

-- ── 5. Deduction Instances ───────────────────────────────────
-- BHXH + BHYT + BHTN bắt buộc cho nhân viên chính thức (IDs 1-17)
INSERT INTO deduction_instance (id, employee_id, deduction_type_id, rate, is_active, start_date, end_date)
VALUES
    -- emp 1 (CTO)
    (1,  1,  1, 8.00, true, '2022-01-10', NULL),
    (2,  1,  2, 1.50, true, '2022-01-10', NULL),
    (3,  1,  3, 1.00, true, '2022-01-10', NULL),
    -- emp 2 (HR Manager)
    (4,  2,  1, 8.00, true, '2022-04-01', NULL),
    (5,  2,  2, 1.50, true, '2022-04-01', NULL),
    (6,  2,  3, 1.00, true, '2022-04-01', NULL),
    -- emp 3 (Eng Manager)
    (7,  3,  1, 8.00, true, '2022-05-15', NULL),
    (8,  3,  2, 1.50, true, '2022-05-15', NULL),
    (9,  3,  3, 1.00, true, '2022-05-15', NULL),
    -- emp 4 (Le Thu An)
    (10, 4,  1, 8.00, true, '2023-06-01', NULL),
    (11, 4,  2, 1.50, true, '2023-06-01', NULL),
    (12, 4,  3, 1.00, true, '2023-06-01', NULL),
    -- emp 5 (Pham Hoang Nam)
    (13, 5,  1, 8.00, true, '2023-07-10', NULL),
    (14, 5,  2, 1.50, true, '2023-07-10', NULL),
    (15, 5,  3, 1.00, true, '2023-07-10', NULL),
    -- emp 6 (Vo Thanh Dat)
    (16, 6,  1, 8.00, true, '2023-08-21', NULL),
    (17, 6,  2, 1.50, true, '2023-08-21', NULL),
    (18, 6,  3, 1.00, true, '2023-08-21', NULL),
    -- emp 7 (Nguyen My Duyen)
    (19, 7,  1, 8.00, true, '2023-09-05', NULL),
    (20, 7,  2, 1.50, true, '2023-09-05', NULL),
    (21, 7,  3, 1.00, true, '2023-09-05', NULL),
    -- emp 8 (Hoang Kim Ngan)
    (22, 8,  1, 8.00, true, '2023-05-02', NULL),
    (23, 8,  2, 1.50, true, '2023-05-02', NULL),
    (24, 8,  3, 1.00, true, '2023-05-02', NULL),
    -- emp 9 (Dang Quoc Bao)
    (25, 9,  1, 8.00, true, '2023-03-11', NULL),
    (26, 9,  2, 1.50, true, '2023-03-11', NULL),
    (27, 9,  3, 1.00, true, '2023-03-11', NULL),
    -- emp 10 (Tran Hai Yen)
    (28, 10, 1, 8.00, true, '2024-01-08', NULL),
    (29, 10, 2, 1.50, true, '2024-01-08', NULL),
    (30, 10, 3, 1.00, true, '2024-01-08', NULL),
    -- emp 11 (Bui Manh Khoa)
    (31, 11, 1, 8.00, true, '2023-11-14', NULL),
    (32, 11, 2, 1.50, true, '2023-11-14', NULL),
    (33, 11, 3, 1.00, true, '2023-11-14', NULL),
    -- emp 13 (Do Bao Tram)
    (34, 13, 1, 8.00, true, '2023-05-15', NULL),
    (35, 13, 2, 1.50, true, '2023-05-15', NULL),
    (36, 13, 3, 1.00, true, '2023-05-15', NULL),
    -- emp 14 (Nguyen Van An)
    (37, 14, 1, 8.00, true, '2023-10-15', NULL),
    (38, 14, 2, 1.50, true, '2023-10-15', NULL),
    (39, 14, 3, 1.00, true, '2023-10-15', NULL),
    -- emp 15 (Pham Bich Ngoc)
    (40, 15, 1, 8.00, true, '2023-03-20', NULL),
    (41, 15, 2, 1.50, true, '2023-03-20', NULL),
    (42, 15, 3, 1.00, true, '2023-03-20', NULL),
    -- emp 16 (Tran Duc Thanh)
    (43, 16, 1, 8.00, true, '2023-02-28', NULL),
    (44, 16, 2, 1.50, true, '2023-02-28', NULL),
    (45, 16, 3, 1.00, true, '2023-02-28', NULL)
ON DUPLICATE KEY UPDATE
    rate = VALUES(rate), is_active = VALUES(is_active),
    start_date = VALUES(start_date), end_date = VALUES(end_date);

-- ── 6. Tax Config (Biểu thuế TNCN Việt Nam 2024) ───────────
INSERT INTO tax_config (id, year, tax_year, min_bracket, max_bracket, tax_rate, country, description, is_active)
VALUES
    (1, 2024, 2024,           0.00,   5000000.00,  5.00, 'VN', 'Bậc 1 — Thu nhập đến 5 triệu: thuế 5%',              true),
    (2, 2024, 2024,     5000000.00,  10000000.00, 10.00, 'VN', 'Bậc 2 — Phần TN từ 5 đến 10 triệu: thuế 10%',        true),
    (3, 2024, 2024,    10000000.00,  18000000.00, 15.00, 'VN', 'Bậc 3 — Phần TN từ 10 đến 18 triệu: thuế 15%',       true),
    (4, 2024, 2024,    18000000.00,  32000000.00, 20.00, 'VN', 'Bậc 4 — Phần TN từ 18 đến 32 triệu: thuế 20%',       true),
    (5, 2024, 2024,    32000000.00,  52000000.00, 25.00, 'VN', 'Bậc 5 — Phần TN từ 32 đến 52 triệu: thuế 25%',       true),
    (6, 2024, 2024,    52000000.00,  80000000.00, 30.00, 'VN', 'Bậc 6 — Phần TN từ 52 đến 80 triệu: thuế 30%',       true),
    (7, 2024, 2024,    80000000.00, 999999999.00, 35.00, 'VN', 'Bậc 7 — Phần TN trên 80 triệu: thuế 35%',            true)
ON DUPLICATE KEY UPDATE
    min_bracket = VALUES(min_bracket), max_bracket = VALUES(max_bracket),
    tax_rate = VALUES(tax_rate), description = VALUES(description), is_active = VALUES(is_active);

-- ── 7. Payroll Runs ──────────────────────────────────────────
-- Chu kỳ lương đã xử lý: T3, T4/2026 — đang chờ: T5, T6/2026
INSERT INTO payroll_run (id, period_start_date, period_end_date, requested_by, source_system, status, created_at)
VALUES
    (3, '2026-03-01', '2026-03-31', 'payroll.officer', 'full-seed', 'PROCESSED', '2026-04-03 09:00:00'),
    (4, '2026-04-01', '2026-04-30', 'payroll.officer', 'full-seed', 'PROCESSED', '2026-05-05 09:00:00'),
    (1, '2026-05-01', '2026-05-31', 'hr.manager',      'full-seed', 'REQUESTED', '2026-06-02 09:00:00'),
    (2, '2026-06-01', '2026-06-30', 'payroll.officer', 'full-seed', 'REQUESTED', '2026-06-24 08:00:00')
ON DUPLICATE KEY UPDATE
    status = VALUES(status), requested_by = VALUES(requested_by);

-- ── 8. Payroll Results ───────────────────────────────────────
-- Công thức tính (demo — không áp BHXH ceiling):
--   insurance_deduction = gross × 10.5%
--   tax_deduction       = thuế TNCN luỹ tiến (trừ giảm trừ bản thân 11tr/tháng)
--   net_pay             = gross − insurance − tax
--
-- Tháng 3/2026 — PROCESSED (IDs 5-17)
-- Tháng 4/2026 — PROCESSED (IDs 18-30)
-- Tháng 5/2026 — APPROVED  (IDs 31-42 + cập nhật 1)
-- Tháng 6/2026 — DRAFT     (IDs 43-52 + cập nhật 2,3,4)

INSERT INTO payroll_result (
    id, employee_id, period_start_date, period_end_date,
    gross_pay, tax_deduction, insurance_deduction, other_deduction,
    total_deduction, net_pay, status,
    approved_by, approved_at, processed_by, processed_at,
    remarks, created_at, updated_at, version
) VALUES
-- ════ THÁNG 3/2026 — ĐÃ HOÀN THÀNH ════
(5,  1,  '2026-03-01','2026-03-31', 85000000,13673000, 8925000,0,22598000,62402000,'PROCESSED','payroll.officer','2026-04-06 10:00:00','payroll.officer','2026-04-07 10:00:00','Lương T3/2026','2026-04-01 09:00:00','2026-04-07 10:00:00',0),
(6,  2,  '2026-03-01','2026-03-31', 45000000, 4205000, 4725000,0, 8930000,36070000,'PROCESSED','payroll.officer','2026-04-06 10:00:00','payroll.officer','2026-04-07 10:00:00','Lương T3/2026','2026-04-01 09:00:00','2026-04-07 10:00:00',0),
(7,  3,  '2026-03-01','2026-03-31', 55000000, 6306000, 5775000,0,12081000,42919000,'PROCESSED','payroll.officer','2026-04-06 10:00:00','payroll.officer','2026-04-07 10:00:00','Lương T3/2026','2026-04-01 09:00:00','2026-04-07 10:00:00',0),
(8,  4,  '2026-03-01','2026-03-31', 22000000,  619000, 2310000,0, 2929000,19071000,'PROCESSED','payroll.officer','2026-04-06 10:00:00','payroll.officer','2026-04-07 10:00:00','Lương T3/2026','2026-04-01 09:00:00','2026-04-07 10:00:00',0),
(9,  5,  '2026-03-01','2026-03-31', 24000000,  822000, 2520000,0, 3342000,20658000,'PROCESSED','payroll.officer','2026-04-06 10:00:00','payroll.officer','2026-04-07 10:00:00','Lương T3/2026','2026-04-01 09:00:00','2026-04-07 10:00:00',0),
(10, 6,  '2026-03-01','2026-03-31', 23000000,  709000, 2415000,0, 3124000,19876000,'PROCESSED','payroll.officer','2026-04-06 10:00:00','payroll.officer','2026-04-07 10:00:00','Lương T3/2026','2026-04-01 09:00:00','2026-04-07 10:00:00',0),
(11, 7,  '2026-03-01','2026-03-31', 19000000,  351000, 1995000,0, 2346000,16654000,'PROCESSED','payroll.officer','2026-04-06 10:00:00','payroll.officer','2026-04-07 10:00:00','Lương T3/2026','2026-04-01 09:00:00','2026-04-07 10:00:00',0),
(12, 8,  '2026-03-01','2026-03-31', 21000000,  530000, 2205000,0, 2735000,18265000,'PROCESSED','payroll.officer','2026-04-06 10:00:00','payroll.officer','2026-04-07 10:00:00','Lương T3/2026','2026-04-01 09:00:00','2026-04-07 10:00:00',0),
(13, 9,  '2026-03-01','2026-03-31', 42000000, 3668000, 4410000,0, 8078000,33922000,'PROCESSED','payroll.officer','2026-04-06 10:00:00','payroll.officer','2026-04-07 10:00:00','Lương T3/2026','2026-04-01 09:00:00','2026-04-07 10:00:00',0),
(14, 10, '2026-03-01','2026-03-31', 15000000,  121000, 1575000,0, 1696000,13304000,'PROCESSED','payroll.officer','2026-04-06 10:00:00','payroll.officer','2026-04-07 10:00:00','Lương T3/2026','2026-04-01 09:00:00','2026-04-07 10:00:00',0),
(15, 11, '2026-03-01','2026-03-31', 35000000, 2415000, 3675000,0, 6090000,28910000,'PROCESSED','payroll.officer','2026-04-06 10:00:00','payroll.officer','2026-04-07 10:00:00','Lương T3/2026','2026-04-01 09:00:00','2026-04-07 10:00:00',0),
(16, 12, '2026-03-01','2026-03-31', 14000000,   77000, 1470000,0, 1547000,12453000,'PROCESSED','payroll.officer','2026-04-06 10:00:00','payroll.officer','2026-04-07 10:00:00','Lương T3/2026','2026-04-01 09:00:00','2026-04-07 10:00:00',0),
(17, 13, '2026-03-01','2026-03-31', 32000000, 1896000, 3360000,0, 5256000,26744000,'PROCESSED','payroll.officer','2026-04-06 10:00:00','payroll.officer','2026-04-07 10:00:00','Lương T3/2026','2026-04-01 09:00:00','2026-04-07 10:00:00',0),
-- ════ THÁNG 4/2026 — ĐÃ HOÀN THÀNH ════
(18, 1,  '2026-04-01','2026-04-30', 85000000,13673000, 8925000,0,22598000,62402000,'PROCESSED','payroll.officer','2026-05-07 10:00:00','payroll.officer','2026-05-08 10:00:00','Lương T4/2026','2026-05-02 09:00:00','2026-05-08 10:00:00',0),
(19, 2,  '2026-04-01','2026-04-30', 45000000, 4205000, 4725000,0, 8930000,36070000,'PROCESSED','payroll.officer','2026-05-07 10:00:00','payroll.officer','2026-05-08 10:00:00','Lương T4/2026','2026-05-02 09:00:00','2026-05-08 10:00:00',0),
(20, 3,  '2026-04-01','2026-04-30', 55000000, 6306000, 5775000,0,12081000,42919000,'PROCESSED','payroll.officer','2026-05-07 10:00:00','payroll.officer','2026-05-08 10:00:00','Lương T4/2026','2026-05-02 09:00:00','2026-05-08 10:00:00',0),
(21, 4,  '2026-04-01','2026-04-30', 22000000,  619000, 2310000,0, 2929000,19071000,'PROCESSED','payroll.officer','2026-05-07 10:00:00','payroll.officer','2026-05-08 10:00:00','Lương T4/2026','2026-05-02 09:00:00','2026-05-08 10:00:00',0),
(22, 5,  '2026-04-01','2026-04-30', 24000000,  822000, 2520000,0, 3342000,20658000,'PROCESSED','payroll.officer','2026-05-07 10:00:00','payroll.officer','2026-05-08 10:00:00','Lương T4/2026','2026-05-02 09:00:00','2026-05-08 10:00:00',0),
(23, 6,  '2026-04-01','2026-04-30', 23000000,  709000, 2415000,0, 3124000,19876000,'PROCESSED','payroll.officer','2026-05-07 10:00:00','payroll.officer','2026-05-08 10:00:00','Lương T4/2026','2026-05-02 09:00:00','2026-05-08 10:00:00',0),
(24, 7,  '2026-04-01','2026-04-30', 19000000,  351000, 1995000,0, 2346000,16654000,'PROCESSED','payroll.officer','2026-05-07 10:00:00','payroll.officer','2026-05-08 10:00:00','Lương T4/2026','2026-05-02 09:00:00','2026-05-08 10:00:00',0),
(25, 8,  '2026-04-01','2026-04-30', 21000000,  530000, 2205000,0, 2735000,18265000,'PROCESSED','payroll.officer','2026-05-07 10:00:00','payroll.officer','2026-05-08 10:00:00','Lương T4/2026','2026-05-02 09:00:00','2026-05-08 10:00:00',0),
(26, 9,  '2026-04-01','2026-04-30', 42000000, 3668000, 4410000,0, 8078000,33922000,'PROCESSED','payroll.officer','2026-05-07 10:00:00','payroll.officer','2026-05-08 10:00:00','Lương T4/2026','2026-05-02 09:00:00','2026-05-08 10:00:00',0),
(27, 10, '2026-04-01','2026-04-30', 15000000,  121000, 1575000,0, 1696000,13304000,'PROCESSED','payroll.officer','2026-05-07 10:00:00','payroll.officer','2026-05-08 10:00:00','Lương T4/2026','2026-05-02 09:00:00','2026-05-08 10:00:00',0),
(28, 11, '2026-04-01','2026-04-30', 35000000, 2415000, 3675000,0, 6090000,28910000,'PROCESSED','payroll.officer','2026-05-07 10:00:00','payroll.officer','2026-05-08 10:00:00','Lương T4/2026','2026-05-02 09:00:00','2026-05-08 10:00:00',0),
(29, 12, '2026-04-01','2026-04-30', 14000000,   77000, 1470000,0, 1547000,12453000,'PROCESSED','payroll.officer','2026-05-07 10:00:00','payroll.officer','2026-05-08 10:00:00','Lương T4/2026','2026-05-02 09:00:00','2026-05-08 10:00:00',0),
(30, 13, '2026-04-01','2026-04-30', 32000000, 1896000, 3360000,0, 5256000,26744000,'PROCESSED','payroll.officer','2026-05-07 10:00:00','payroll.officer','2026-05-08 10:00:00','Lương T4/2026','2026-05-02 09:00:00','2026-05-08 10:00:00',0),
-- ════ THÁNG 5/2026 — ĐÃ DUYỆT (một số đã xử lý) ════
-- Cập nhật IDs 1 (emp 4, May, PROCESSED) từ minimal seed
(1,  4,  '2026-05-01','2026-05-31', 22000000,  619000, 2310000,0, 2929000,19071000,'PROCESSED','payroll.officer','2026-06-06 10:00:00','payroll.officer','2026-06-07 10:00:00','Lương T5/2026','2026-06-02 09:00:00','2026-06-07 10:00:00',0),
(31, 1,  '2026-05-01','2026-05-31', 85000000,13673000, 8925000,0,22598000,62402000,'APPROVED', 'payroll.officer','2026-06-06 10:00:00',NULL,NULL,'Lương T5/2026 chờ thanh toán','2026-06-02 09:00:00','2026-06-06 10:00:00',0),
(32, 2,  '2026-05-01','2026-05-31', 45000000, 4205000, 4725000,0, 8930000,36070000,'APPROVED', 'payroll.officer','2026-06-06 10:00:00',NULL,NULL,'Lương T5/2026 chờ thanh toán','2026-06-02 09:00:00','2026-06-06 10:00:00',0),
(33, 3,  '2026-05-01','2026-05-31', 55000000, 6306000, 5775000,0,12081000,42919000,'APPROVED', 'payroll.officer','2026-06-06 10:00:00',NULL,NULL,'Lương T5/2026 chờ thanh toán','2026-06-02 09:00:00','2026-06-06 10:00:00',0),
(34, 5,  '2026-05-01','2026-05-31', 24000000,  822000, 2520000,0, 3342000,20658000,'APPROVED', 'payroll.officer','2026-06-06 10:00:00',NULL,NULL,'Lương T5/2026 chờ thanh toán','2026-06-02 09:00:00','2026-06-06 10:00:00',0),
(35, 6,  '2026-05-01','2026-05-31', 23000000,  709000, 2415000,0, 3124000,19876000,'APPROVED', 'payroll.officer','2026-06-06 10:00:00',NULL,NULL,'Lương T5/2026 chờ thanh toán','2026-06-02 09:00:00','2026-06-06 10:00:00',0),
(36, 7,  '2026-05-01','2026-05-31', 19000000,  351000, 1995000,0, 2346000,16654000,'APPROVED', 'payroll.officer','2026-06-06 10:00:00',NULL,NULL,'Lương T5/2026 chờ thanh toán','2026-06-02 09:00:00','2026-06-06 10:00:00',0),
(37, 8,  '2026-05-01','2026-05-31', 21000000,  530000, 2205000,0, 2735000,18265000,'APPROVED', 'payroll.officer','2026-06-06 10:00:00',NULL,NULL,'Lương T5/2026 chờ thanh toán','2026-06-02 09:00:00','2026-06-06 10:00:00',0),
(38, 9,  '2026-05-01','2026-05-31', 42000000, 3668000, 4410000,0, 8078000,33922000,'APPROVED', 'payroll.officer','2026-06-06 10:00:00',NULL,NULL,'Lương T5/2026 chờ thanh toán','2026-06-02 09:00:00','2026-06-06 10:00:00',0),
(39, 10, '2026-05-01','2026-05-31', 15000000,  121000, 1575000,0, 1696000,13304000,'APPROVED', 'payroll.officer','2026-06-06 10:00:00',NULL,NULL,'Lương T5/2026 chờ thanh toán','2026-06-02 09:00:00','2026-06-06 10:00:00',0),
(40, 11, '2026-05-01','2026-05-31', 35000000, 2415000, 3675000,0, 6090000,28910000,'APPROVED', 'payroll.officer','2026-06-06 10:00:00',NULL,NULL,'Lương T5/2026 chờ thanh toán','2026-06-02 09:00:00','2026-06-06 10:00:00',0),
(41, 12, '2026-05-01','2026-05-31', 14000000,   77000, 1470000,0, 1547000,12453000,'APPROVED', 'payroll.officer','2026-06-06 10:00:00',NULL,NULL,'Lương T5/2026 chờ thanh toán','2026-06-02 09:00:00','2026-06-06 10:00:00',0),
-- ════ THÁNG 6/2026 — DRAFT (đang tính) ════
-- Cập nhật IDs 2,3,4 từ minimal seed
(2,  5,  '2026-06-01','2026-06-30', 24000000,  822000, 2520000,0, 3342000,20658000,'DRAFT',NULL,NULL,NULL,NULL,'Lương T6/2026 — đang xử lý','2026-06-20 09:00:00','2026-06-20 09:00:00',0),
(3,  6,  '2026-06-01','2026-06-30', 23000000,  709000, 2415000,0, 3124000,19876000,'DRAFT',NULL,NULL,NULL,NULL,'Lương T6/2026 — đang xử lý','2026-06-20 09:00:00','2026-06-20 09:00:00',0),
(4,  13, '2026-06-01','2026-06-30', 32000000, 1896000, 3360000,0, 5256000,26744000,'DRAFT',NULL,NULL,NULL,NULL,'Lương T6/2026 — đang xử lý','2026-06-20 09:00:00','2026-06-20 09:00:00',0),
(42, 1,  '2026-06-01','2026-06-30', 85000000,13673000, 8925000,0,22598000,62402000,'DRAFT',NULL,NULL,NULL,NULL,'Lương T6/2026 — đang xử lý','2026-06-20 09:00:00','2026-06-20 09:00:00',0),
(43, 2,  '2026-06-01','2026-06-30', 45000000, 4205000, 4725000,0, 8930000,36070000,'DRAFT',NULL,NULL,NULL,NULL,'Lương T6/2026 — đang xử lý','2026-06-20 09:00:00','2026-06-20 09:00:00',0),
(44, 3,  '2026-06-01','2026-06-30', 55000000, 6306000, 5775000,0,12081000,42919000,'DRAFT',NULL,NULL,NULL,NULL,'Lương T6/2026 — đang xử lý','2026-06-20 09:00:00','2026-06-20 09:00:00',0),
(45, 4,  '2026-06-01','2026-06-30', 22000000,  619000, 2310000,0, 2929000,19071000,'DRAFT',NULL,NULL,NULL,NULL,'Lương T6/2026 — đang xử lý','2026-06-20 09:00:00','2026-06-20 09:00:00',0),
(46, 7,  '2026-06-01','2026-06-30', 19000000,  351000, 1995000,0, 2346000,16654000,'DRAFT',NULL,NULL,NULL,NULL,'Lương T6/2026 — đang xử lý','2026-06-20 09:00:00','2026-06-20 09:00:00',0),
(47, 9,  '2026-06-01','2026-06-30', 42000000, 3668000, 4410000,0, 8078000,33922000,'DRAFT',NULL,NULL,NULL,NULL,'Lương T6/2026 — đang xử lý','2026-06-20 09:00:00','2026-06-20 09:00:00',0),
(48, 11, '2026-06-01','2026-06-30', 35000000, 2415000, 3675000,0, 6090000,28910000,'DRAFT',NULL,NULL,NULL,NULL,'Lương T6/2026 — đang xử lý','2026-06-20 09:00:00','2026-06-20 09:00:00',0)
ON DUPLICATE KEY UPDATE
    gross_pay            = VALUES(gross_pay),
    tax_deduction        = VALUES(tax_deduction),
    insurance_deduction  = VALUES(insurance_deduction),
    other_deduction      = VALUES(other_deduction),
    total_deduction      = VALUES(total_deduction),
    net_pay              = VALUES(net_pay),
    status               = VALUES(status),
    approved_by          = VALUES(approved_by),
    approved_at          = VALUES(approved_at),
    processed_by         = VALUES(processed_by),
    processed_at         = VALUES(processed_at),
    remarks              = VALUES(remarks),
    updated_at           = NOW(6);

-- ── 9. Payroll History ───────────────────────────────────────
-- Vết kiểm tra: T3 & T4 đã hoàn chỉnh (3 events/kỳ × 13 NV)
-- T5: đã tạo + duyệt; T6: mới tạo
INSERT INTO payroll_history (id, payroll_result_id, employee_id, event_type, action_by, change_details, previous_gross, previous_net, created_at)
VALUES
-- T3/2026 — emps 1-6 (demo 2 event: CREATED + PROCESSED)
(1,  5,  1,  'CREATED',   'full-seed',      'Tạo bảng lương T3/2026 cho Nguyễn Hữu Hùng',           85000000,62402000,'2026-04-01 09:00:00'),
(2,  5,  1,  'PROCESSED', 'payroll.officer','Đã thanh toán lương T3/2026',                           85000000,62402000,'2026-04-07 10:00:00'),
(3,  6,  2,  'CREATED',   'full-seed',      'Tạo bảng lương T3/2026 cho Nguyễn Hà Linh',            45000000,36070000,'2026-04-01 09:00:00'),
(4,  6,  2,  'PROCESSED', 'payroll.officer','Đã thanh toán lương T3/2026',                           45000000,36070000,'2026-04-07 10:00:00'),
(5,  7,  3,  'CREATED',   'full-seed',      'Tạo bảng lương T3/2026 cho Trần Minh Quân',            55000000,42919000,'2026-04-01 09:00:00'),
(6,  7,  3,  'PROCESSED', 'payroll.officer','Đã thanh toán lương T3/2026',                           55000000,42919000,'2026-04-07 10:00:00'),
(7,  8,  4,  'CREATED',   'full-seed',      'Tạo bảng lương T3/2026 cho Lê Thu An',                 22000000,19071000,'2026-04-01 09:00:00'),
(8,  8,  4,  'PROCESSED', 'payroll.officer','Đã thanh toán lương T3/2026',                           22000000,19071000,'2026-04-07 10:00:00'),
(9,  9,  5,  'CREATED',   'full-seed',      'Tạo bảng lương T3/2026 cho Phạm Hoàng Nam',            24000000,20658000,'2026-04-01 09:00:00'),
(10, 9,  5,  'PROCESSED', 'payroll.officer','Đã thanh toán lương T3/2026',                           24000000,20658000,'2026-04-07 10:00:00'),
(11, 10, 6,  'CREATED',   'full-seed',      'Tạo bảng lương T3/2026 cho Võ Thành Đạt',              23000000,19876000,'2026-04-01 09:00:00'),
(12, 10, 6,  'PROCESSED', 'payroll.officer','Đã thanh toán lương T3/2026',                           23000000,19876000,'2026-04-07 10:00:00'),
(13, 15, 11, 'CREATED',   'full-seed',      'Tạo bảng lương T3/2026 cho Bùi Mạnh Khoa',             35000000,28910000,'2026-04-01 09:00:00'),
(14, 15, 11, 'PROCESSED', 'payroll.officer','Đã thanh toán lương T3/2026',                           35000000,28910000,'2026-04-07 10:00:00'),
(15, 17, 13, 'CREATED',   'full-seed',      'Tạo bảng lương T3/2026 cho Đỗ Bảo Trâm',              32000000,26744000,'2026-04-01 09:00:00'),
(16, 17, 13, 'PROCESSED', 'payroll.officer','Đã thanh toán lương T3/2026',                           32000000,26744000,'2026-04-07 10:00:00'),
-- T4/2026 — tương tự
(17, 18, 1,  'CREATED',   'full-seed',      'Tạo bảng lương T4/2026 cho Nguyễn Hữu Hùng',           85000000,62402000,'2026-05-02 09:00:00'),
(18, 18, 1,  'APPROVED',  'hr.manager',     'Giám đốc nhân sự phê duyệt bảng lương T4/2026',        85000000,62402000,'2026-05-06 14:00:00'),
(19, 18, 1,  'PROCESSED', 'payroll.officer','Đã thanh toán lương T4/2026',                           85000000,62402000,'2026-05-08 10:00:00'),
(20, 21, 4,  'CREATED',   'full-seed',      'Tạo bảng lương T4/2026 cho Lê Thu An',                 22000000,19071000,'2026-05-02 09:00:00'),
(21, 21, 4,  'APPROVED',  'hr.manager',     'Phê duyệt bảng lương T4/2026',                         22000000,19071000,'2026-05-06 14:00:00'),
(22, 21, 4,  'PROCESSED', 'payroll.officer','Đã thanh toán lương T4/2026',                           22000000,19071000,'2026-05-08 10:00:00'),
(23, 26, 9,  'CREATED',   'full-seed',      'Tạo bảng lương T4/2026 cho Đặng Quốc Bảo',            42000000,33922000,'2026-05-02 09:00:00'),
(24, 26, 9,  'APPROVED',  'hr.manager',     'Phê duyệt bảng lương T4/2026',                         42000000,33922000,'2026-05-06 14:00:00'),
(25, 26, 9,  'PROCESSED', 'payroll.officer','Đã thanh toán lương T4/2026',                           42000000,33922000,'2026-05-08 10:00:00'),
-- T5/2026 — đã duyệt, chờ thanh toán
(26, 1,  4,  'CREATED',   'full-seed',      'Tạo bảng lương T5/2026 cho Lê Thu An',                 22000000,19071000,'2026-06-02 09:00:00'),
(27, 1,  4,  'APPROVED',  'hr.manager',     'Phê duyệt bảng lương T5/2026',                         22000000,19071000,'2026-06-06 10:00:00'),
(28, 1,  4,  'PROCESSED', 'payroll.officer','Đã thanh toán lương T5/2026',                           22000000,19071000,'2026-06-07 10:00:00'),
(29, 31, 1,  'CREATED',   'full-seed',      'Tạo bảng lương T5/2026 cho Nguyễn Hữu Hùng',           85000000,62402000,'2026-06-02 09:00:00'),
(30, 31, 1,  'APPROVED',  'payroll.officer','Phê duyệt bảng lương T5/2026',                         85000000,62402000,'2026-06-06 10:00:00'),
(31, 33, 3,  'CREATED',   'full-seed',      'Tạo bảng lương T5/2026 cho Trần Minh Quân',            55000000,42919000,'2026-06-02 09:00:00'),
(32, 33, 3,  'APPROVED',  'payroll.officer','Phê duyệt bảng lương T5/2026',                         55000000,42919000,'2026-06-06 10:00:00'),
-- T6/2026 — mới tạo, chưa duyệt
(33, 42, 1,  'CREATED',   'full-seed',      'Khởi tạo bảng lương T6/2026 cho Nguyễn Hữu Hùng',      85000000,62402000,'2026-06-20 09:00:00'),
(34, 43, 2,  'CREATED',   'full-seed',      'Khởi tạo bảng lương T6/2026 cho Nguyễn Hà Linh',       45000000,36070000,'2026-06-20 09:00:00'),
(35, 44, 3,  'CREATED',   'full-seed',      'Khởi tạo bảng lương T6/2026 cho Trần Minh Quân',       55000000,42919000,'2026-06-20 09:00:00'),
(36, 45, 4,  'CREATED',   'full-seed',      'Khởi tạo bảng lương T6/2026 cho Lê Thu An',            22000000,19071000,'2026-06-20 09:00:00'),
(37, 2,  5,  'CREATED',   'full-seed',      'Khởi tạo bảng lương T6/2026 cho Phạm Hoàng Nam',       24000000,20658000,'2026-06-20 09:00:00'),
(38, 3,  6,  'CREATED',   'full-seed',      'Khởi tạo bảng lương T6/2026 cho Võ Thành Đạt',         23000000,19876000,'2026-06-20 09:00:00'),
(39, 4,  13, 'CREATED',   'full-seed',      'Khởi tạo bảng lương T6/2026 cho Đỗ Bảo Trâm',         32000000,26744000,'2026-06-20 09:00:00')
ON DUPLICATE KEY UPDATE
    event_type     = VALUES(event_type),
    action_by      = VALUES(action_by),
    change_details = VALUES(change_details),
    previous_gross = VALUES(previous_gross),
    previous_net   = VALUES(previous_net);
