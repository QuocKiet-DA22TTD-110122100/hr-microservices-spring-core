CREATE TABLE departments (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(255),
  organization_unit_id BIGINT
);

CREATE TABLE employee (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  auth_user_id VARCHAR(36),
  username VARCHAR(100),
  did VARCHAR(255),
  name VARCHAR(255),
  position VARCHAR(255),
  baseSalary DECIMAL(12,2),
  currency VARCHAR(10),
  jobLevel VARCHAR(50),
  hireDate DATE,
  status VARCHAR(20),
  createdAt TIMESTAMP,
  department_id BIGINT
);

CREATE TABLE tax_config (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  "year" INT NOT NULL,
  min_bracket DECIMAL(12,2) NOT NULL,
  max_bracket DECIMAL(12,2),
  tax_rate DECIMAL(5,2) NOT NULL,
  country VARCHAR(3) NOT NULL,
  description VARCHAR(255),
  is_active BOOLEAN
);

CREATE TABLE deduction_type (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description VARCHAR(255),
  category VARCHAR(50) NOT NULL,
  is_percentage BOOLEAN,
  default_rate DECIMAL(5,2),
  employer_contribution_rate DECIMAL(5,2),
  is_mandatory BOOLEAN,
  is_active BOOLEAN
);

CREATE TABLE deduction_instance (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  employee_id BIGINT NOT NULL,
  deduction_type_id BIGINT NOT NULL,
  rate DECIMAL(5,2) NOT NULL,
  is_active BOOLEAN,
  start_date DATE,
  end_date DATE
);

CREATE TABLE payroll_result (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  employee_id BIGINT NOT NULL,
  period_start_date DATE NOT NULL,
  period_end_date DATE NOT NULL,
  gross_pay DECIMAL(12,2) NOT NULL,
  tax_deduction DECIMAL(12,2),
  insurance_deduction DECIMAL(12,2),
  other_deduction DECIMAL(12,2),
  total_deduction DECIMAL(12,2) NOT NULL,
  net_pay DECIMAL(12,2) NOT NULL,
  status VARCHAR(20),
  approved_by VARCHAR(100),
  approved_at TIMESTAMP,
  processed_by VARCHAR(100),
  processed_at TIMESTAMP,
  remarks VARCHAR(500),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE payroll_history (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  payroll_result_id BIGINT NOT NULL,
  employee_id BIGINT NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  action_by VARCHAR(100),
  change_details VARCHAR(1000),
  previous_gross DECIMAL(12,2),
  previous_net DECIMAL(12,2),
  created_at TIMESTAMP
);
