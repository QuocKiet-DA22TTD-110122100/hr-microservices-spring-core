-- Keep seed deterministic so local environments always start from the same baseline.
DELETE FROM user_password_history;
DELETE FROM users;
DELETE FROM user_sync_outbox;
DELETE FROM user_sync_dlq;
DELETE FROM role_definitions;

INSERT INTO role_definitions (name, description, permissions, system_role)
VALUES
    ('ADMIN', 'System administrator with full access', 'ALL', true),
    ('HR_MANAGER', 'HR manager for employee, department, organization and read-only payroll data', 'READ_EMPLOYEE,WRITE_EMPLOYEE,DELETE_EMPLOYEE,READ_DEPARTMENT,WRITE_DEPARTMENT,DELETE_DEPARTMENT,READ_ORGANIZATION,WRITE_ORGANIZATION,READ_USER,READ_PROJECT,READ_TASK,READ_PAYROLL', true),
    ('PAYROLL_OFFICER', 'Payroll officer for salary calculation and payment workflow', 'READ_EMPLOYEE,READ_PAYROLL,WRITE_PAYROLL', true),
    ('DEPARTMENT_HEAD', 'Department head with scoped people and work visibility', 'READ_EMPLOYEE,READ_DEPARTMENT,READ_ORGANIZATION,READ_PROJECT,READ_TASK', true),
    ('MANAGER', 'Team manager for project allocation and task coordination', 'READ_EMPLOYEE,READ_DEPARTMENT,READ_PROJECT,WRITE_PROJECT,READ_TASK,WRITE_TASK', true),
    ('EMPLOYEE', 'Employee with basic self-service and work visibility', 'READ_EMPLOYEE,READ_DEPARTMENT,READ_ORGANIZATION,READ_PROJECT,READ_TASK', true),
    ('USER', 'Portal user without business module access', '', true);

INSERT INTO users (id, username, password_hash, role, password_updated_at)
VALUES
    (
        '28759924-7b71-4220-bf8d-06d64ce7cae6',
        'admin',
        '$argon2id$v=19$m=16384,t=2,p=1$tx1aVLo9IlrzWnRAAvNPoA$c657rxfjyeCKx34jfs5YjL9wHOdAvFNCB0I3zLhDZ/k',
        'ADMIN',
        CURRENT_TIMESTAMP
    ),
    (
        '3c07be88-39df-4e33-8e20-71ba6ad4af5a',
        'hr.manager',
        '$argon2id$v=19$m=16384,t=2,p=1$tx1aVLo9IlrzWnRAAvNPoA$c657rxfjyeCKx34jfs5YjL9wHOdAvFNCB0I3zLhDZ/k',
        'HR_MANAGER',
        CURRENT_TIMESTAMP
    ),
    (
        'f6f8b8a7-7df7-42f4-a3e1-c34daed22755',
        'payroll.officer',
        '$argon2id$v=19$m=16384,t=2,p=1$tx1aVLo9IlrzWnRAAvNPoA$c657rxfjyeCKx34jfs5YjL9wHOdAvFNCB0I3zLhDZ/k',
        'PAYROLL_OFFICER',
        CURRENT_TIMESTAMP
    ),
    (
        '49ca806e-2725-4af8-a049-2625ea5bc8ac',
        'manager',
        '$argon2id$v=19$m=16384,t=2,p=1$tx1aVLo9IlrzWnRAAvNPoA$c657rxfjyeCKx34jfs5YjL9wHOdAvFNCB0I3zLhDZ/k',
        'MANAGER',
        CURRENT_TIMESTAMP
    ),
    (
        'f9831e0f-9b28-43d9-b3ab-94df70f2e33e',
        'employee',
        '$argon2id$v=19$m=16384,t=2,p=1$tx1aVLo9IlrzWnRAAvNPoA$c657rxfjyeCKx34jfs5YjL9wHOdAvFNCB0I3zLhDZ/k',
        'EMPLOYEE',
        CURRENT_TIMESTAMP
    );

INSERT INTO user_password_history (id, user_id, password_hash, created_at)
VALUES
    (
        '5b6f808e-9cae-4f2d-8a9f-d0f3e25f68cf',
        '28759924-7b71-4220-bf8d-06d64ce7cae6',
        '$argon2id$v=19$m=16384,t=2,p=1$tx1aVLo9IlrzWnRAAvNPoA$c657rxfjyeCKx34jfs5YjL9wHOdAvFNCB0I3zLhDZ/k',
        CURRENT_TIMESTAMP
    ),
    (
        '9fffe7be-0d4d-4b79-8d93-7159306123cd',
        '3c07be88-39df-4e33-8e20-71ba6ad4af5a',
        '$argon2id$v=19$m=16384,t=2,p=1$tx1aVLo9IlrzWnRAAvNPoA$c657rxfjyeCKx34jfs5YjL9wHOdAvFNCB0I3zLhDZ/k',
        CURRENT_TIMESTAMP
    ),
    (
        'f0974040-ce86-4f2b-a91f-9fe905ce45b0',
        'f6f8b8a7-7df7-42f4-a3e1-c34daed22755',
        '$argon2id$v=19$m=16384,t=2,p=1$tx1aVLo9IlrzWnRAAvNPoA$c657rxfjyeCKx34jfs5YjL9wHOdAvFNCB0I3zLhDZ/k',
        CURRENT_TIMESTAMP
    ),
    (
        '9268f0ac-d193-4baa-aea1-84fe40b437f0',
        '49ca806e-2725-4af8-a049-2625ea5bc8ac',
        '$argon2id$v=19$m=16384,t=2,p=1$tx1aVLo9IlrzWnRAAvNPoA$c657rxfjyeCKx34jfs5YjL9wHOdAvFNCB0I3zLhDZ/k',
        CURRENT_TIMESTAMP
    ),
    (
        'c4b2747a-155e-4f37-a93b-fd473f75d514',
        'f9831e0f-9b28-43d9-b3ab-94df70f2e33e',
        '$argon2id$v=19$m=16384,t=2,p=1$tx1aVLo9IlrzWnRAAvNPoA$c657rxfjyeCKx34jfs5YjL9wHOdAvFNCB0I3zLhDZ/k',
        CURRENT_TIMESTAMP
    );
