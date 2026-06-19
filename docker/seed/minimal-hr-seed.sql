USE hr_service;

INSERT INTO organization_units (id, code, level, name, parent_id)
VALUES
    (1, 'ECC', 'CORPORATION', 'ECC Group', NULL),
    (2, 'ECC-VN', 'TOTAL_COMPANY', 'ECC Viet Nam', 1),
    (3, 'ECC-HCM', 'MEMBER_COMPANY', 'ECC Ho Chi Minh', 2),
    (4, 'ECC-DN', 'MEMBER_COMPANY', 'ECC Da Nang', 2)
ON DUPLICATE KEY UPDATE
    code = VALUES(code),
    level = VALUES(level),
    name = VALUES(name),
    parent_id = VALUES(parent_id);

INSERT INTO departments (id, code, name, organization_unit_id)
VALUES
    (1, 'HR', 'Human Resources', 3),
    (2, 'ENG', 'Engineering', 3),
    (3, 'PMO', 'Project Management Office', 3),
    (4, 'OPS', 'Operations', 4)
ON DUPLICATE KEY UPDATE
    code = VALUES(code),
    name = VALUES(name),
    organization_unit_id = VALUES(organization_unit_id);

INSERT INTO employee (
    id, auth_user_id, username, did, name, position, base_salary, currency,
    job_level, hire_date, status, created_at, updated_at, department_id
)
VALUES
    (1, '28759924-7b71-4220-bf8d-06d64ce7cae6', 'admin', 'did:ecc:employee:admin', 'Admin System', 'System Administrator', 4500.00, 'USD', 'L5', '2023-01-02', 'ACTIVE', NOW(6), NOW(6), 2),
    (2, '3c07be88-39df-4e33-8e20-71ba6ad4af5a', 'hr.manager', 'did:ecc:employee:hr-manager', 'Nguyen Ha Linh', 'HR Manager', 3200.00, 'USD', 'L4', '2023-02-01', 'ACTIVE', NOW(6), NOW(6), 1),
    (3, '49ca806e-2725-4af8-a049-2625ea5bc8ac', 'manager', 'did:ecc:employee:manager', 'Tran Minh Quan', 'Engineering Manager', 3800.00, 'USD', 'L4', '2023-03-15', 'ACTIVE', NOW(6), NOW(6), 2),
    (4, 'f9831e0f-9b28-43d9-b3ab-94df70f2e33e', 'employee', 'did:ecc:employee:employee', 'Le Thu An', 'Software Engineer', 2200.00, 'USD', 'L2', '2023-06-01', 'ACTIVE', NOW(6), NOW(6), 2),
    (5, NULL, 'pham.hoang.nam', 'did:ecc:employee:pham-hoang-nam', 'Pham Hoang Nam', 'Backend Engineer', 2400.00, 'USD', 'L2', '2023-07-10', 'ACTIVE', NOW(6), NOW(6), 2),
    (6, NULL, 'vo.thanh.dat', 'did:ecc:employee:vo-thanh-dat', 'Vo Thanh Dat', 'Frontend Engineer', 2300.00, 'USD', 'L2', '2023-08-21', 'ACTIVE', NOW(6), NOW(6), 2),
    (7, NULL, 'nguyen.my.duyen', 'did:ecc:employee:nguyen-my-duyen', 'Nguyen My Duyen', 'QA Engineer', 1900.00, 'USD', 'L2', '2023-09-05', 'ACTIVE', NOW(6), NOW(6), 2),
    (8, NULL, 'hoang.kim.ngan', 'did:ecc:employee:hoang-kim-ngan', 'Hoang Kim Ngan', 'Business Analyst', 2100.00, 'USD', 'L2', '2023-10-02', 'ACTIVE', NOW(6), NOW(6), 3),
    (9, NULL, 'dang.quoc.bao', 'did:ecc:employee:dang-quoc-bao', 'Dang Quoc Bao', 'Project Manager', 3000.00, 'USD', 'L3', '2023-11-11', 'ACTIVE', NOW(6), NOW(6), 3),
    (10, NULL, 'tran.hai.yen', 'did:ecc:employee:tran-hai-yen', 'Tran Hai Yen', 'HR Executive', 1700.00, 'USD', 'L1', '2024-01-08', 'ACTIVE', NOW(6), NOW(6), 1),
    (11, NULL, 'bui.manh.khoa', 'did:ecc:employee:bui-manh-khoa', 'Bui Manh Khoa', 'DevOps Engineer', 2600.00, 'USD', 'L3', '2024-02-14', 'ACTIVE', NOW(6), NOW(6), 4),
    (12, NULL, 'le.minh.chau', 'did:ecc:employee:le-minh-chau', 'Le Minh Chau', 'Support Specialist', 1600.00, 'USD', 'L1', '2024-03-18', 'ACTIVE', NOW(6), NOW(6), 4),
    (13, 'f6f8b8a7-7df7-42f4-a3e1-c34daed22755', 'payroll.officer', 'did:ecc:employee:payroll-officer', 'Do Bao Tram', 'Payroll Officer', 2800.00, 'USD', 'L3', '2023-05-15', 'ACTIVE', NOW(6), NOW(6), 1)
ON DUPLICATE KEY UPDATE
    auth_user_id = VALUES(auth_user_id),
    username = VALUES(username),
    did = VALUES(did),
    name = VALUES(name),
    position = VALUES(position),
    base_salary = VALUES(base_salary),
    currency = VALUES(currency),
    job_level = VALUES(job_level),
    hire_date = VALUES(hire_date),
    status = VALUES(status),
    updated_at = NOW(6),
    department_id = VALUES(department_id);

INSERT INTO payroll_run (id, period_start_date, period_end_date, requested_by, source_system, status, created_at)
VALUES
    (1, '2026-05-01', '2026-05-31', 'hr.manager', 'seed', 'REQUESTED', NOW(6)),
    (2, '2026-06-01', '2026-06-30', 'payroll.officer', 'seed', 'REQUESTED', NOW(6))
ON DUPLICATE KEY UPDATE
    period_start_date = VALUES(period_start_date),
    period_end_date = VALUES(period_end_date),
    requested_by = VALUES(requested_by),
    source_system = VALUES(source_system),
    status = VALUES(status);

INSERT INTO payroll_result (
    id, employee_id, period_start_date, period_end_date,
    gross_pay, tax_deduction, insurance_deduction, other_deduction,
    total_deduction, net_pay, status,
    approved_by, approved_at, processed_by, processed_at,
    remarks, created_at, updated_at, version
)
VALUES
    (1, 4, '2026-05-01', '2026-05-31', 2200.00, 220.00, 176.00, 20.00, 416.00, 1784.00, 'PROCESSED', 'payroll.officer', NOW(6), 'payroll.officer', NOW(6), 'Seed payroll processed for demo', NOW(6), NOW(6), 0),
    (2, 5, '2026-06-01', '2026-06-30', 2400.00, 240.00, 192.00, 0.00, 432.00, 1968.00, 'APPROVED', 'payroll.officer', NOW(6), NULL, NULL, 'Seed payroll approved and ready to process', NOW(6), NOW(6), 0),
    (3, 6, '2026-06-01', '2026-06-30', 2300.00, 230.00, 184.00, 15.00, 429.00, 1871.00, 'DRAFT', NULL, NULL, NULL, NULL, 'Seed payroll draft for approval demo', NOW(6), NOW(6), 0),
    (4, 13, '2026-06-01', '2026-06-30', 2800.00, 280.00, 224.00, 0.00, 504.00, 2296.00, 'DRAFT', NULL, NULL, NULL, NULL, 'Payroll officer demo record', NOW(6), NOW(6), 0)
ON DUPLICATE KEY UPDATE
    employee_id = VALUES(employee_id),
    period_start_date = VALUES(period_start_date),
    period_end_date = VALUES(period_end_date),
    gross_pay = VALUES(gross_pay),
    tax_deduction = VALUES(tax_deduction),
    insurance_deduction = VALUES(insurance_deduction),
    other_deduction = VALUES(other_deduction),
    total_deduction = VALUES(total_deduction),
    net_pay = VALUES(net_pay),
    status = VALUES(status),
    approved_by = VALUES(approved_by),
    approved_at = VALUES(approved_at),
    processed_by = VALUES(processed_by),
    processed_at = VALUES(processed_at),
    remarks = VALUES(remarks),
    updated_at = NOW(6);

INSERT INTO payroll_history (
    id, payroll_result_id, employee_id, event_type, action_by,
    change_details, previous_gross, previous_net, created_at
)
VALUES
    (1, 1, 4, 'CREATED', 'seed', 'Initial payroll result created for May 2026', 2200.00, 1784.00, NOW(6)),
    (2, 1, 4, 'APPROVED', 'payroll.officer', 'Payroll approved for May 2026', 2200.00, 1784.00, NOW(6)),
    (3, 1, 4, 'PROCESSED', 'payroll.officer', 'Payroll finalized and locked', 2200.00, 1784.00, NOW(6)),
    (4, 2, 5, 'APPROVED', 'payroll.officer', 'Payroll approved and waiting for processing', 2400.00, 1968.00, NOW(6)),
    (5, 3, 6, 'CREATED', 'seed', 'Draft payroll ready for approval demo', 2300.00, 1871.00, NOW(6))
ON DUPLICATE KEY UPDATE
    event_type = VALUES(event_type),
    action_by = VALUES(action_by),
    change_details = VALUES(change_details),
    previous_gross = VALUES(previous_gross),
    previous_net = VALUES(previous_net);
