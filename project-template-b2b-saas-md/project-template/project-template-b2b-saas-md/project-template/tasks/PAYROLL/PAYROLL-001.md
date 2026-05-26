# 📌 PAYROLL-001 — Implement Payroll Calculation Engine

**Module** : hr-service  
**Assigned to** : Backend Agent  
**Priority** : 🔴 Critical  
**Status** : [ ] To do  
**Depends on** : AUTH-001, DEDUCTION-001, EMPLOYEE-001

---

## Context

Payroll calculation is the **heart of the HR system**. Every employee's monthly net pay depends on accurate tax calculations, deduction application, and compliance validation. This task implements the core calculation engine, ensuring accuracy to the penny (2 decimal places).

**Context Packs to load**:
- `docs/vision.md` (Workflow 2: Payroll Cycle)
- `docs/business-rules.md` (BR-P1 through BR-P4)
- `docs/architecture.md` (Example 2: Payroll Calculation)
- Existing code: `hr-service/src/main/java/com/hrservice/hr/config/PayrollService.java`

---

## Specification

### Endpoint 1 — Calculate Payroll for Employee
```
GET /api/chi-tra/{employeeId}/tinh-toan?periodStartDate=2026-06-01&periodEndDate=2026-06-30

Request:
- employeeId: BIGINT (path param)
- periodStartDate: DATE (query, format: YYYY-MM-DD)
- periodEndDate: DATE (query, format: YYYY-MM-DD)
- Authorization: Bearer {JWT}
- X-Auth-Role: PAYROLL_OFFICER or ADMIN

Response 200:
{
  "payrollId": 12345,
  "employeeId": 1,
  "employeeName": "Nguyen Van A",
  "period": {
    "startDate": "2026-06-01",
    "endDate": "2026-06-30"
  },
  "calculation": {
    "baseSalary": 3000000.00,
    "grossPay": 3000000.00,
    "deductions": [
      {
        "type": "INCOME_TAX",
        "name": "Income Tax (Tax Bracket)",
        "amount": 300000.00,
        "rate": 10.0,
        "category": "TAX"
      },
      {
        "type": "SOCIAL_INSURANCE",
        "name": "Social Insurance",
        "amount": 240000.00,
        "rate": 8.0,
        "category": "INSURANCE"
      },
      {
        "type": "HEALTH_INSURANCE",
        "name": "Health Insurance",
        "amount": 45000.00,
        "rate": 1.5,
        "category": "INSURANCE"
      }
    ],
    "totalDeductions": 585000.00,
    "netPay": 2415000.00
  },
  "status": "DRAFT",
  "createdAt": "2026-05-25T10:30:00Z",
  "validations": {
    "passed": true,
    "warnings": []
  }
}

Errors:
404 — Employee not found
400 — Invalid period dates (startDate > endDate, future dates)
403 — Insufficient permission (not PAYROLL_OFFICER/ADMIN)
500 — Tax bracket not configured for period
```

### Endpoint 2 — List Draft Payroll Records
```
GET /api/chi-tra?status=DRAFT&page=0&size=50

Response 200:
{
  "content": [
    { "payrollId": 12345, "employeeId": 1, "employeeName": "Nguyen Van A", "netPay": 2415000.00, "status": "DRAFT" },
    { "payrollId": 12346, "employeeId": 2, "employeeName": "Tran Thi B", "netPay": 2100000.00, "status": "DRAFT" }
  ],
  "totalElements": 150,
  "totalPages": 3,
  "currentPage": 0
}
```

---

## Business Rules Applicable

- **BR-P1**: Tax calculations accurate to penny (BigDecimal, no float)
- **BR-P2**: Progressive tax brackets applied correctly (cumulative, not marginal only)
- **BR-P3**: Multiple deduction types applied in correct order (mandatory first)
- **BR-P4**: Compliance validation: tax < 40%, net > 0, all deductions within limits

---

## Implementation Checklist

### 📖 Analysis
- [ ] Read `PayrollService.java` existing implementation (calculatePayroll method)
- [ ] Review TaxConfig entity for bracket structure
- [ ] Review DeductionType + DeductionInstance entities
- [ ] Understand progressive tax bracket algorithm
- [ ] Verify BigDecimal scale/rounding (2 decimals, HALF_UP)

### ⚙️ Backend — Models & Services
- [ ] Create `PayrollCalculationRequest` DTO:
  ```java
  public class PayrollCalculationRequest {
    private Long employeeId;
    private LocalDate periodStartDate;
    private LocalDate periodEndDate;
  }
  ```
- [ ] Create `PayrollCalculationResponse` DTO with gross, deductions, net pay breakdown
- [ ] Implement `PayrollService.calculatePayroll(employeeId, startDate, endDate)`:
  - Fetch employee (verify exists, status ACTIVE or calculating for final payroll if offboarded)
  - Fetch applicable tax brackets (year from periodStartDate, country from employee org)
  - Fetch active deductions (startDate <= periodStartDate AND endDate IS NULL OR endDate >= periodEndDate)
  - Calculate gross pay = baseSalary (monthly = annual / 12)
  - Apply deductions in order:
    1. Mandatory tax: calculateTaxDeduction(gross, brackets)
    2. Mandatory insurance: calculateInsuranceDeductions(gross)
    3. Voluntary deductions: calculateVoluntaryDeductions(gross, existing)
  - Validate: BR-P4 checks (tax < 40%, net > 0)
  - Return PayrollResult (status: DRAFT)

### ⚙️ Backend — Controller
- [ ] Implement `PayrollController.calculatePayroll(employeeId, startDate, endDate)`:
  - Validate authentication (Bearer JWT)
  - Validate authorization: X-Auth-Role must be PAYROLL_OFFICER or ADMIN
  - Call service, catch exceptions
  - Return 200 + calculated payroll
- [ ] Implement `PayrollController.listDraftPayroll(page, size)`:
  - Query PayrollResultRepository for status=DRAFT
  - Return paginated results

### 🗄️ Database
- [ ] Verify `payroll_results` table exists with schema:
  - id (BIGINT PK), employeeId (FK), grossPay, deductions (JSON or separate table), netPay, status, periodStartDate, periodEndDate, createdAt, updatedAt
- [ ] Ensure `tax_configs` indexed by year+country for fast lookup
- [ ] Ensure `deduction_instances` indexed by employeeId for fast fetch

### ❌ Validation
- [ ] Validate periodStartDate <= periodEndDate
- [ ] Validate periodStartDate not in future (can be past for corrections)
- [ ] Validate employee exists and is ACTIVE (or allow offboarded for final payroll)
- [ ] Validate tax brackets exist for year (if missing, return 500)
- [ ] Validate deduction rates <= 100% (catch data errors)
- [ ] Validate net pay > 0 (cannot pay negative, even with all deductions)

### 📨 RabbitMQ Events
- [ ] Publish `payroll.calculated` event on successful calculation:
  ```json
  {
    "eventId": "uuid",
    "eventType": "payroll.calculated",
    "payrollId": 12345,
    "employeeId": 1,
    "grossPay": 3000000.00,
    "netPay": 2415000.00,
    "calculatedAt": "2026-05-25T10:30:00Z"
  }
  ```
- [ ] RabbitMQ consumer (downstream): Log to audit trail, update dashboards

### 📋 Audit Logging
- [ ] Log payroll calculation: who (PAYROLL_OFFICER), when, employee, amounts
- [ ] Store in `payroll_history` table: action=CREATED, actionBy=user email, details={gross, net, tax}
- [ ] Immutable: Cannot be edited after DRAFT status

### 🧪 Tests
- [ ] **Unit Test**: `PayrollServiceTest`
  - Test calculatePayroll with sample employee, tax bracket 10%, no deductions → net = gross × 0.9
  - Test progressive brackets (gross 12M VND, brackets 0-5M @ 10%, 5-10M @ 15%, 10+ @ 20%) → correct tax
  - Test multiple deductions (tax + insurance + voluntary) → correct net pay
  - Test BigDecimal precision: 3000000 × 0.1 = 300000.00 exactly
  - Test deduction date ranges (only apply if current period overlaps)
  - Edge cases: employee with no deductions, all-mandatory deductions, net pay = 0 (minimum wage scenario)

- [ ] **Integration Test**: `PayrollControllerTest`
  - Test GET /api/chi-tra/{employeeId}/tinh-toan with valid employee → HTTP 200 with payroll
  - Test with PAYROLL_OFFICER role → HTTP 200
  - Test with HR_MANAGER role → HTTP 403 (forbidden)
  - Test with missing tax brackets → HTTP 500
  - Test list /api/chi-tra?status=DRAFT → paginated response

- [ ] **Database Test**: `PayrollRepositoryTest`
  - Verify payroll_results saved correctly
  - Verify queries by employeeId, status, date range work

### ✅ Acceptance Criteria
- [ ] Payroll calculation endpoint responds in < 100ms (per BR-PERF1)
- [ ] Tax accuracy: Test with known payroll examples, verify to penny
- [ ] Deductions applied in correct order (mandatory before voluntary)
- [ ] All validations from BR-P4 pass before creating DRAFT payroll
- [ ] RabbitMQ event published within 2 seconds of calculation
- [ ] Audit log entry created immutably (cannot be edited)
- [ ] All tests pass (unit + integration + database)
- [ ] Code review approved (at least 1 backend engineer)

---

## Success Metrics
- Payroll calculation: < 100ms (single employee), < 120s (batch 1000 employees)
- Accuracy: Tax calculation matches expected value (test with 5+ payroll scenarios)
- Audit trail: 100% of calculations logged immutably
- Test coverage: > 90% for PayrollService class
