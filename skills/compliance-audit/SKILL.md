# Compliance & Audit Skill

## Overview

Regulatory compliance for HR systems: GDPR, CCPA, HIPAA, labor laws (FLSA), and immutable audit trail design.

## When to Use This Skill

- Modifying any endpoint that touches PII (name, SSN, email, salary, health data)
- Reviewing data retention / deletion flows
- Adding new audit log entries
- Checking RBAC on sensitive endpoints

## GDPR Compliance

**Right to Be Forgotten:**

```java
@Transactional
public void deleteEmployeePersonalData(Long employeeId) {
  Employee emp = employeeRepository.findById(employeeId)
    .orElseThrow(EmployeeNotFoundException::new);

  // Only allowed 2+ years after termination
  if (emp.getTerminationDate() == null ||
      emp.getTerminationDate().isAfter(LocalDate.now().minusYears(2))) {
    throw new DataRetentionRequiredException();
  }

  // Anonymize identifiers — do NOT delete the row (breaks audit trail)
  emp.setFirstName("REDACTED");
  emp.setLastName("REDACTED");
  emp.setEmail("redacted-" + emp.getId() + "@redacted.invalid");
  emp.setPhoneNumber(null);
  emp.setAddress(null);
  emp.setSsn(null);

  // Delete rows from non-audit tables
  payrollHistoryRepository.deleteByEmployeeId(emp.getId());
  leaveRecordsRepository.deleteByEmployeeId(emp.getId());

  auditLog.record(AuditEvent.of("PERSONAL_DATA_DELETED", emp.getId())
    .reason("GDPR Right to Be Forgotten")
    .actor("system"));

  employeeRepository.save(emp);
}
```

**Data Portability (export):**

```java
public byte[] exportEmployeeDataAsJSON(Long employeeId) {
  Employee emp = employeeRepository.findById(employeeId)
    .orElseThrow(EmployeeNotFoundException::new);

  Map<String, Object> data = Map.of(
    "employee", emp,
    "payroll",  payrollHistoryRepository.findByEmployeeId(employeeId),
    "leave",    leaveRecordsRepository.findByEmployeeId(employeeId),
    "benefits", benefitsRepository.findByEmployeeId(employeeId),
    "audit",    auditLogRepository.findByEmployeeId(employeeId)
  );

  return objectMapper.writeValueAsBytes(data);
}
```

## CCPA (California Consumer Privacy Act)

**Consumer rights:** know, delete, opt-out, non-discrimination.

```java
@Service
public class CCPAComplianceService {

  public List<String> getCollectedDataCategories() {
    return List.of(
      "Personal Identifiers (name, email, phone, SSN)",
      "Employment History (hire date, positions, transfers)",
      "Compensation (salary, bonuses, deductions)",
      "Benefits (health insurance, 401k, FSA)",
      "Leave Records (PTO, sick time used)",
      "Performance Data (reviews, goals)",
      "System Logs (login times, access)"
    );
  }

  @Transactional
  public void processDeleteRequest(Long employeeId) {
    // Must retain: Tax records 7 years, audit logs 7 years
    // Can delete: explicit personal data not required by law
    auditLog.record(AuditEvent.of("CCPA_DELETE_REQUEST", employeeId));
  }
}
```

## HIPAA — Health Data Protection

```java
@Service
public class HIPAACompliantBenefitsService {

  @PreAuthorize("hasRole('HR_BENEFITS_ADMIN')")
  public HealthBenefitDetails getHealthBenefits(Long employeeId) {
    return benefitsRepository.findByEmployeeIdAndType(employeeId, BenefitType.HEALTH);
  }

  public void accessHealthData(Long employeeId) {
    // Every access to health data must be logged
    auditLog.record(AuditEvent.of("HIPAA_DATA_ACCESS", employeeId)
      .actor(currentUser())
      .reason("Benefits administration"));
  }
}
```

**HIPAA requirements:**
- Encrypt health data at rest (AES-256) + in transit (TLS 1.2+)
- Limit access to authorized roles only (`HR_BENEFITS_ADMIN`)
- Audit **every** access to health information
- Breach notification within 60 days
- Data retention: 6+ years

## FLSA — Labor Law Compliance

```java
public void validatePayroll(PayrollCalculation calc) {
  BigDecimal federalMinWage = taxConfigRepository.findCurrentMinimumWage();
  BigDecimal stateMinWage = taxConfigRepository.findMinimumWageByState(calc.employeeState());
  BigDecimal effectiveMinWage = federalMinWage.max(stateMinWage);

  BigDecimal hourlyRate = calc.baseSalary()
    .divide(new BigDecimal("2080"), 10, RoundingMode.HALF_UP);

  if (hourlyRate.compareTo(effectiveMinWage) < 0) {
    throw new MinimumWageViolationException(hourlyRate, effectiveMinWage);
  }

  // Overtime must be 1.5x, not straight-time
  if (calc.overtimeHours().compareTo(BigDecimal.ZERO) > 0) {
    BigDecimal expectedOtRate = hourlyRate.multiply(new BigDecimal("1.5"));
    if (calc.overtimeRate().compareTo(expectedOtRate) < 0) {
      throw new OvertimeCalculationViolationException();
    }
  }
}
```

## Audit Trail Design

```java
@Entity
@Table(name = "hr_audit_log",
       indexes = {
         @Index(name = "idx_audit_emp_ts",    columnList = "employee_id, created_at"),
         @Index(name = "idx_audit_action_ts", columnList = "action, created_at")
       })
public class AuditEvent {

  @Id @GeneratedValue
  private Long id;

  @Column(nullable = false)
  private Instant createdAt;

  @Column(nullable = false)
  private String action;         // EMPLOYEE_CREATED, SALARY_CHANGED, …

  @Column(nullable = false)
  private Long employeeId;

  @Column(nullable = false)
  private String actor;          // user ID or "system"

  private String reason;

  @Column(columnDefinition = "JSON")
  private String beforeValue;    // previous state as JSON

  @Column(columnDefinition = "JSON")
  private String afterValue;     // new state as JSON
}
```

**Immutability rules:**
- Audit log is **append-only** — no UPDATE, no DELETE
- Store in a separate table, never embed in employee row
- Replicate to read-only archive quarterly
- Index on `(employee_id, created_at)` and `(action, created_at)`

## Compliance Checklist

| Requirement | Implementation | Frequency |
|---|---|---|
| GDPR Right to Forget | `deleteEmployeePersonalData()` | On request, min 2y post-termination |
| CCPA Data Export | `exportEmployeeDataAsJSON()` | On request |
| HIPAA Access Logs | Audit trail on all health data reads | Every access |
| FLSA Min Wage + OT | Validation in `PayrollCalculator` | Every payroll run |
| Pay Equity Audit | `auditPayrollEquity()` | Annual |
| Audit Log Archive | Replicate to read-only store | Quarterly |
| Data Retention | Automated purge after legal hold | Annual review |

## References

- `com.hrservice.hr.service.AuditService`
- `com.hrservice.hr.service.ComplianceService`
- [GDPR Portal](https://gdpr-info.eu/)
- [HIPAA Rules](https://www.hhs.gov/hipaa/)
- [FLSA](https://www.dol.gov/agencies/whd/flsa)
