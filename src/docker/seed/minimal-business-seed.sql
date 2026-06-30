CREATE DATABASE IF NOT EXISTS project_db;
CREATE DATABASE IF NOT EXISTS task_db;

USE project_db;

INSERT INTO projects (id, name, description, status, lead_id, created_at, updated_at)
VALUES
    (1, 'HR Core Platform', 'Employee, department, and organization foundation.', 'ACTIVE', 3, NOW(6), NOW(6)),
    (2, 'Payroll Automation', 'Payroll workflow, deductions, and reporting.', 'ACTIVE', 9, NOW(6), NOW(6)),
    (3, 'Employee Portal', 'Self-service portal for employee profile and requests.', 'PAUSED', 3, NOW(6), NOW(6)),
    (4, 'Project Delivery Dashboard', 'Task, project, and allocation visibility.', 'ACTIVE', 9, NOW(6), NOW(6))
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    description = VALUES(description),
    status = VALUES(status),
    lead_id = VALUES(lead_id),
    updated_at = NOW(6);

INSERT INTO project_assignments (id, project_id, employee_id, role, active, assigned_at)
VALUES
    (1, 1, 3, 'MANAGER', b'1', NOW(6)),
    (2, 1, 4, 'DEVELOPER', b'1', NOW(6)),
    (3, 1, 5, 'DEVELOPER', b'1', NOW(6)),
    (4, 1, 7, 'QA', b'1', NOW(6)),
    (5, 2, 9, 'MANAGER', b'1', NOW(6)),
    (6, 2, 5, 'DEVELOPER', b'1', NOW(6)),
    (7, 2, 8, 'MEMBER', b'1', NOW(6)),
    (8, 3, 3, 'MANAGER', b'1', NOW(6)),
    (9, 3, 6, 'DEVELOPER', b'1', NOW(6)),
    (10, 3, 10, 'MEMBER', b'1', NOW(6)),
    (11, 4, 9, 'MANAGER', b'1', NOW(6)),
    (12, 4, 11, 'DEVELOPER', b'1', NOW(6))
ON DUPLICATE KEY UPDATE
    role = VALUES(role),
    active = VALUES(active),
    assigned_at = VALUES(assigned_at);

USE task_db;

SET @task_priority_column_exists := (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'tasks'
      AND column_name = 'priority'
);

SET @task_priority_sql := IF(
    @task_priority_column_exists = 0,
    'ALTER TABLE tasks ADD COLUMN priority ENUM(''HIGH'',''LOW'',''MEDIUM'',''URGENT'') NOT NULL DEFAULT ''MEDIUM'' AFTER status',
    'SELECT 1'
);

PREPARE task_priority_stmt FROM @task_priority_sql;
EXECUTE task_priority_stmt;
DEALLOCATE PREPARE task_priority_stmt;

INSERT INTO tasks (id, title, description, status, priority, assignee_id, project_id, created_at, updated_at)
VALUES
    (1, 'Define HR master data', 'Finalize core employee, department, and org data model.', 'COMPLETED', 'HIGH', 8, 1, NOW(6), NOW(6)),
    (2, 'Build employee profile API', 'Expose employee profile read and update endpoints.', 'IN_PROGRESS', 'HIGH', 4, 1, NOW(6), NOW(6)),
    (3, 'Implement department member view', 'Show department employees in list and detail pages.', 'OPEN', 'MEDIUM', 5, 1, NOW(6), NOW(6)),
    (4, 'QA organization tree', 'Verify organization unit tree and department mapping.', 'OPEN', 'MEDIUM', 7, 1, NOW(6), NOW(6)),
    (5, 'Design payroll run workflow', 'Document payroll run steps and approval points.', 'IN_PROGRESS', 'HIGH', 9, 2, NOW(6), NOW(6)),
    (6, 'Add deduction calculation tests', 'Cover tax and deduction edge cases.', 'OPEN', 'URGENT', 5, 2, NOW(6), NOW(6)),
    (7, 'Prepare payroll report mock', 'Create report structure for payroll summary.', 'OPEN', 'LOW', 8, 2, NOW(6), NOW(6)),
    (8, 'Sketch portal navigation', 'Define employee portal navigation and role access.', 'COMPLETED', 'MEDIUM', 6, 3, NOW(6), NOW(6)),
    (9, 'Build profile edit form', 'Implement employee profile edit workflow.', 'IN_PROGRESS', 'HIGH', 6, 3, NOW(6), NOW(6)),
    (10, 'HR content review', 'Review labels and user-facing Vietnamese copy.', 'OPEN', 'MEDIUM', 10, 3, NOW(6), NOW(6)),
    (11, 'Create project list API client', 'Connect frontend project list to gateway APIs.', 'OPEN', 'HIGH', 11, 4, NOW(6), NOW(6)),
    (12, 'Create task list API client', 'Connect frontend task list to gateway APIs.', 'OPEN', 'HIGH', 4, 4, NOW(6), NOW(6)),
    (13, 'Add dashboard filters', 'Filter dashboard items by status and assignee.', 'OPEN', 'MEDIUM', 8, 4, NOW(6), NOW(6)),
    (14, 'Smoke test minimal stack', 'Validate auth, HR, project, and task through gateway.', 'IN_PROGRESS', 'URGENT', 11, 4, NOW(6), NOW(6))
ON DUPLICATE KEY UPDATE
    title = VALUES(title),
    description = VALUES(description),
    status = VALUES(status),
    priority = VALUES(priority),
    assignee_id = VALUES(assignee_id),
    project_id = VALUES(project_id),
    updated_at = NOW(6);
