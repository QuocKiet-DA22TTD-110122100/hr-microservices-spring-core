# Employee Payroll Service - Implementation Guide

## Overview

The Payroll Service provides comprehensive salary calculation, tax processing, and compliance tracking for HR microservices. This service calculates gross pay, applies tax brackets and deductions, and maintains an immutable audit trail for all payroll transactions.

## Architecture

### Entities

#### Employee (Enhanced)
Additional fields for payroll:
- `baseSalary` — Annual salary (BigDecimal, 12.2 precision)
- `currency` — Salary currency (e.g., USD, VND)
- `jobLevel` — Position level (entry, mid, senior, executive)
- `hireDate` — Employment start date
- `lastRaiseDate` — Last salary adjustment date

#### PayrollResult
Core payroll calculation record:
- **periodStartDate, periodEndDate** — Payroll period boundaries
- **grossPay** — Monthly gross salary (base/12)
- **taxDeduction** — Income tax based on brackets
- **insuranceDeduction** — Health, benefits deductions
- **otherDeduction** — Retirement, FSA, voluntary deductions
- **totalDeduction** — Sum of all deductions
- **netPay** — grossPay - totalDeduction
- **status** — DRAFT, APPROVED, PROCESSED, FAILED
- **createdAt, updatedAt** — Audit timestamps

#### PayrollHistory (Audit Trail)
Immutable record of all payroll changes:
- **eventType** — CREATED, APPROVED, PROCESSED, REJECTED, MODIFIED
- **actionBy** — HR admin who performed action
- **changeDetails** — Description of changes
- **previousGross, previousNet** — Before/after comparison

#### TaxConfig
Tax bracket configuration by year/country:
- **year, country** — Tax regime identification (e.g., 2026, USD)
- **minBracket, maxBracket** — Income range (null maxBracket = top bracket)
- **taxRate** — Tax percentage for this bracket (e.g., 12.50)
- **isActive** — Enable/disable bracket

#### DeductionType
Available deduction categories:
- **name** — Health Insurance, 401k, FSA, etc
- **category** — TAX, INSURANCE, RETIREMENT, VOLUNTARY
- **isPercentage** — Percentage of gross vs fixed amount
- **defaultRate** — Default deduction rate
- **employerContributionRate** — Employer matching %
- **isMandatory** — Apply to all employees

#### DeductionInstance
Per-employee deduction assignment:
- **rate** — Employee's specific deduction rate
- **startDate, endDate** — Active period for this deduction
- **isActive** — Enable/disable for this employee

### Repositories

All repositories extend `JpaRepository` with custom finders:

```java
// PayrollResultRepository
findByEmployeeId(Long employeeId)
findLatestByEmployeeId(Long employeeId)
findByStatusOrderByCreatedAtDesc(String status)
findByPeriodStartDateBetween(LocalDate start, LocalDate end)

// TaxConfigRepository
findByYearAndCountryAndIsActiveTrue(Integer year, String country)

// DeductionTypeRepository
findByIsMandatoryTrueAndIsActiveTrueOrderByName()

// DeductionInstanceRepository
findByEmployeeIdAndIsActiveTrueAndStartDateLessThanEqualAndEndDateGreaterThanEqualOrderByDeductionTypeNameAsc(...)
```

### PayrollService (Business Logic)

**Core Methods:**

#### `calculatePayroll(employeeId, yearMonth) → PayrollResult`
Calculates complete payroll for a given employee and month:

1. **Gross Pay** = baseSalary / 12
2. **Tax Deduction** = Apply progressive tax brackets
3. **Other Deductions** = Sum insurance + retirement + voluntary
4. **Total Deduction** = tax + insurance + other
5. **Net Pay** = gross - total deduction

```java
PayrollResult result = payrollService.calculatePayroll(1L, YearMonth.of(2026, 5));
// Returns: PayrollResult with status DRAFT
```

#### `approvePayroll(payrollId, approvedBy) → PayrollResult`
Approves payroll for processing:
- Validates compliance before approval
- Updates status to APPROVED
- Records audit trail entry

```java
PayrollResult approved = payrollService.approvePayroll(1L, "HR_ADMIN");
```

#### `validatePayrollCompliance(payroll) → void`
Validates payroll data integrity:
- ✓ Net pay ≤ gross pay
- ✓ Net pay ≥ 50% of gross (warning if not)
- ✓ Tax deduction ≥ 0 (no negative taxes)
- ✓ Tax ≤ 40% of gross (warning if not)

#### Tax Bracket Calculation

The system uses **progressive tax brackets**:

```
2026 USD Tax Brackets:
├─ $0 - $50,000 → 10%
└─ $50,000+ → 15%

Example: $10,000 gross
  First $10,000 × 10% = $1,000 tax
  Net pay = $10,000 - $1,000 = $9,000

Example: $60,000 monthly (annual salary)
  First $50,000 × 10% = $5,000
  Remaining $10,000 × 15% = $1,500
  Total tax = $6,500
  Net pay = $60,000 - $6,500 = $53,500
```

#### Deduction Calculation

Deductions are calculated in two modes:

**Percentage-based (e.g., 5% of gross):**
```
Deduction = grossPay × rate% / 100
Example: $10,000 gross × 5% = $500
```

**Fixed amount:**
```
Deduction = fixed amount
Example: $100 per payroll
```

## REST API Endpoints

### Base URL
```
/api/payroll
```

### 1. Calculate Payroll
```
GET /api/payroll/{employeeId}/calculate?yearMonth=2026-05
```

**Authorization:** `@PreAuthorize("hasRole('HR_ADMIN')")`

**Parameters:**
- `employeeId` — Employee ID (path)
- `yearMonth` — Period in YYYY-MM format

**Response:**
```json
{
  "id": 1,
  "employee": { "id": 1, "name": "John Doe" },
  "periodStartDate": "2026-05-01",
  "periodEndDate": "2026-05-31",
  "grossPay": 10000.00,
  "taxDeduction": 1000.00,
  "insuranceDeduction": 500.00,
  "otherDeduction": 200.00,
  "totalDeduction": 1700.00,
  "netPay": 8300.00,
  "status": "DRAFT",
  "createdAt": "2026-05-23T10:30:00"
}
```

### 2. Get Current Payroll
```
GET /api/payroll/{employeeId}/current
```

Returns latest payroll record for employee.

### 3. Get Payroll History
```
GET /api/payroll/{employeeId}/history
```

Returns all processed payroll records with status=PROCESSED.

### 4. Approve Payroll
```
POST /api/payroll/{payrollId}/approve
Content-Type: application/json

{
  "approvedBy": "HR_ADMIN_NAME"
}
```

**Response:** Updated PayrollResult with status=APPROVED

## Database Schema

### SQL Migrations

```sql
-- Employee table (new columns)
ALTER TABLE employee ADD COLUMN base_salary DECIMAL(12,2);
ALTER TABLE employee ADD COLUMN currency VARCHAR(3) DEFAULT 'USD';
ALTER TABLE employee ADD COLUMN job_level VARCHAR(50);
ALTER TABLE employee ADD COLUMN hire_date DATE;
ALTER TABLE employee ADD COLUMN last_raise_date DATE;

-- PayrollResult table
CREATE TABLE payroll_result (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    employee_id BIGINT NOT NULL,
    period_start_date DATE NOT NULL,
    period_end_date DATE NOT NULL,
    gross_pay DECIMAL(12,2) NOT NULL,
    tax_deduction DECIMAL(12,2),
    insurance_deduction DECIMAL(12,2),
    other_deduction DECIMAL(12,2),
    total_deduction DECIMAL(12,2) NOT NULL,
    net_pay DECIMAL(12,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'DRAFT',
    remarks VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employee(id)
);

-- PayrollHistory table
CREATE TABLE payroll_history (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    payroll_result_id BIGINT NOT NULL,
    employee_id BIGINT NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    action_by VARCHAR(100),
    change_details VARCHAR(1000),
    previous_gross DECIMAL(12,2),
    previous_net DECIMAL(12,2),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (payroll_result_id) REFERENCES payroll_result(id),
    FOREIGN KEY (employee_id) REFERENCES employee(id)
);

-- TaxConfig table
CREATE TABLE tax_config (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    year INT NOT NULL,
    min_bracket DECIMAL(12,2) NOT NULL,
    max_bracket DECIMAL(12,2),
    tax_rate DECIMAL(5,2) NOT NULL,
    country VARCHAR(3) NOT NULL,
    description VARCHAR(255),
    is_active BOOLEAN DEFAULT 1,
    UNIQUE KEY (year, country, min_bracket)
);

-- DeductionType table
CREATE TABLE deduction_type (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255),
    category VARCHAR(50) NOT NULL,
    is_percentage BOOLEAN,
    default_rate DECIMAL(5,2),
    employer_contribution_rate DECIMAL(5,2),
    is_mandatory BOOLEAN,
    is_active BOOLEAN DEFAULT 1
);

-- DeductionInstance table
CREATE TABLE deduction_instance (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    employee_id BIGINT NOT NULL,
    deduction_type_id BIGINT NOT NULL,
    rate DECIMAL(5,2) NOT NULL,
    is_active BOOLEAN,
    start_date DATE,
    end_date DATE,
    FOREIGN KEY (employee_id) REFERENCES employee(id),
    FOREIGN KEY (deduction_type_id) REFERENCES deduction_type(id)
);
```

## Configuration Example

### Tax Brackets for 2026 (USA)
```sql
INSERT INTO tax_config (year, country, min_bracket, max_bracket, tax_rate, is_active) VALUES
(2026, 'USD', 0, 50000, 10.00, 1),
(2026, 'USD', 50000, 100000, 15.00, 1),
(2026, 'USD', 100000, NULL, 20.00, 1);
```

### Deduction Types
```sql
INSERT INTO deduction_type (name, category, is_percentage, default_rate, is_mandatory, is_active) VALUES
('Health Insurance', 'INSURANCE', 1, 5.00, 1, 1),
('401k Contribution', 'RETIREMENT', 1, 3.00, 0, 1),
('FSA', 'RETIREMENT', 0, 100.00, 0, 1);
```

### Employee Setup
```sql
INSERT INTO employee (auth_user_id, username, name, position, base_salary, currency, job_level, hire_date, department_id) 
VALUES ('auth-123', 'john.doe', 'John Doe', 'Senior Dev', 120000.00, 'USD', 'senior', '2020-01-15', 1);

INSERT INTO deduction_instance (employee_id, deduction_type_id, rate, is_active, start_date, end_date)
VALUES (1, 1, 5.00, 1, '2026-01-01', '2026-12-31');
```

## Testing

Run integration tests:
```bash
mvn test -Dtest=PayrollServiceTest
```

**Test Coverage:**
- ✓ Basic payroll calculation
- ✓ Employee without salary (error handling)
- ✓ Payroll approval workflow
- ✓ Compliance validation (net pay, tax limits)
- ✓ Deduction calculation (percentage-based)
- ✓ Latest payroll retrieval

## Compliance & Security

### Authorization
- All payroll endpoints require `@PreAuthorize("hasRole('HR_ADMIN')")`
- Payroll data access logged via `SecurityValidator.enforceGatewayAccess()`

### Audit Trail
- Every state change recorded in `PayrollHistory`
- Immutable records prevent data tampering
- Tracks: who changed it, when, what changed, previous values

### Data Validation
- BigDecimal for monetary values (no floating-point errors)
- Tax/deduction compliance checks prevent unrealistic values
- Period validation ensures date ranges are valid

## Performance Optimization

### Caching Strategy
```java
@Cacheable(value = "taxConfigs", key = "#year + '-' + #country")
public List<TaxConfig> getTaxConfigs(Integer year, String country) { ... }
```

### Query Optimization
- Lazy loading on employee relationships
- Indexed queries on `employeeId`, `periodStartDate`, `status`
- Batch processing for monthly payroll runs

## Future Enhancements

1. **Overtime Calculation** — Additional pay for hours > 160/month
2. **Bonus & Incentives** — Variable pay components
3. **Compliance Reports** — GDPR/HIPAA audit exports
4. **Multi-currency Support** — Exchange rate conversion
5. **Payroll Processing Queue** — Async batch processing
6. **Integration with Accounting** — Journal entry generation

## Troubleshooting

### Issue: "No active tax config"
**Solution:** Insert tax bracket records for current year/country
```sql
SELECT * FROM tax_config WHERE year = 2026 AND country = 'USD' AND is_active = 1;
```

### Issue: Net pay exceeds gross pay
**Solution:** Check deduction calculations; validate all deductions are ≤ gross

### Issue: Tax deduction is zero
**Solution:** Verify tax brackets exist and are active for employee's currency

## References

- PayrollService: `hr-service/src/main/java/com/hrservice/hr/config/PayrollService.java`
- Controller: `hr-service/src/main/java/com/hrservice/hr/controller/PayrollController.java`
- Entities: `hr-service/src/main/java/com/hrservice/hr/entity/Payroll*.java`
- Tests: `hr-service/src/test/java/com/hrservice/hr/PayrollServiceTest.java`
