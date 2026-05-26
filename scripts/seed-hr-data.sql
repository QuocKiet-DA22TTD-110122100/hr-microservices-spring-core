-- ============================================================
-- HR Service Seed Data Script (MySQL)
-- ============================================================
-- This file seeds demo data for:
-- 1. Organization Units (4-level hierarchy)
-- 2. Departments
-- 3. Employees
-- ============================================================

USE hr_db;

-- ============================================================
-- 1. ORGANIZATION UNITS (4-level hierarchy)
-- ============================================================

-- Level 1: CORPORATION
INSERT INTO organization_units (code, name, level, parent_id) 
VALUES ('CORP-001', 'Demo Corporation', 'CORPORATION', NULL);
SET @corp_id = LAST_INSERT_ID();

-- Level 2: TOTAL_COMPANY
INSERT INTO organization_units (code, name, level, parent_id) 
VALUES ('TC-001', 'Total Company 1', 'TOTAL_COMPANY', @corp_id);
SET @total_company_id = LAST_INSERT_ID();

-- Level 3: MEMBER_COMPANY
INSERT INTO organization_units (code, name, level, parent_id) 
VALUES ('MC-001', 'Member Company 1', 'MEMBER_COMPANY', @total_company_id);
SET @member_company_id = LAST_INSERT_ID();

-- Level 3: Thêm 1 MEMBER_COMPANY khác
INSERT INTO organization_units (code, name, level, parent_id) 
VALUES ('MC-002', 'Member Company 2', 'MEMBER_COMPANY', @total_company_id);
SET @member_company_id_2 = LAST_INSERT_ID();

-- ============================================================
-- 2. DEPARTMENTS
-- ============================================================

-- Department 1: IT (under Member Company 1)
INSERT INTO departments (code, name, organization_unit_id) 
VALUES ('IT-001', 'Information Technology', @member_company_id);
SET @it_dept_id = LAST_INSERT_ID();

-- Department 2: HR (under Member Company 1)
INSERT INTO departments (code, name, organization_unit_id) 
VALUES ('HR-001', 'Human Resources', @member_company_id);
SET @hr_dept_id = LAST_INSERT_ID();

-- Department 3: Finance (under Member Company 2)
INSERT INTO departments (code, name, organization_unit_id) 
VALUES ('FIN-001', 'Finance', @member_company_id_2);
SET @fin_dept_id = LAST_INSERT_ID();

-- Department 4: Sales (under Member Company 2)
INSERT INTO departments (code, name, organization_unit_id) 
VALUES ('SALES-001', 'Sales', @member_company_id_2);
SET @sales_dept_id = LAST_INSERT_ID();

-- ============================================================
-- 3. EMPLOYEES
-- ============================================================

-- Employee 1: IT Team Lead
INSERT INTO employee (auth_user_id, username, name, position, department_id) 
VALUES (NULL, 'john.doe', 'John Doe', 'IT Team Lead', @it_dept_id);

-- Employee 2: Junior Developer
INSERT INTO employee (auth_user_id, username, name, position, department_id) 
VALUES (NULL, 'jane.smith', 'Jane Smith', 'Junior Developer', @it_dept_id);

-- Employee 3: HR Manager
INSERT INTO employee (auth_user_id, username, name, position, department_id) 
VALUES (NULL, 'mike.johnson', 'Mike Johnson', 'HR Manager', @hr_dept_id);

-- Employee 4: Finance Officer
INSERT INTO employee (auth_user_id, username, name, position, department_id) 
VALUES (NULL, 'sarah.williams', 'Sarah Williams', 'Finance Officer', @fin_dept_id);

-- Employee 5: Sales Executive
INSERT INTO employee (auth_user_id, username, name, position, department_id) 
VALUES (NULL, 'robert.brown', 'Robert Brown', 'Sales Executive', @sales_dept_id);

-- ============================================================
-- VERIFY DATA
-- ============================================================
SELECT '=== Organization Units ===' AS section;
SELECT id, code, name, level, parent_id FROM organization_units ORDER BY id;

SELECT '=== Departments ===' AS section;
SELECT id, code, name, organization_unit_id FROM departments ORDER BY id;

SELECT '=== Employees ===' AS section;
SELECT id, username, name, position, department_id FROM employee ORDER BY id;

SELECT CONCAT('Total Organizations: ', COUNT(*)) FROM organization_units;
SELECT CONCAT('Total Departments: ', COUNT(*)) FROM departments;
SELECT CONCAT('Total Employees: ', COUNT(*)) FROM employee;
