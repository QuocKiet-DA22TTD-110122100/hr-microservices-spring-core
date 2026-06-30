# Compliance & Audit Skill

Guide to regulatory compliance for HR systems: GDPR, CCPA, HIPAA, labor laws, and audit trail design.

## GDPR Compliance

**Right to Be Forgotten:**
```java
@Transactional
public void deleteEmployeePersonalData(Long employeeId) {
  Employee emp = employeeRepository.findById(employeeId)
    .orElseThrow(EmployeeNotFoundException::new);
  
  // Only allow AFTER employee is terminated for 2+ years
  if (emp.getTerminationDate().isAfter(LocalDate.now().minusYears(2))) {
    throw new DataRetentionRequiredException();
  }
  
  // 1. Anonymize personal identifiers
  emp.setFirstName("REDACTED");
  emp.setLastName("REDACTED");
  emp.setEmail("redacted@example.com");
  emp.setPhoneNumber(null);
  emp.setAddress(null);
  emp.setSSN(null); // Clear SSN
  
  // 2. Delete from non-audit tables
  payrollHistoryRepository.deleteByEmployee(emp);
  leaveRecordsRepository.deleteByEmployee(emp);
  
  // 3. Keep audit trail (anonymized)
  auditLog.record(new AuditEvent()
    .action("PERSONAL_DATA_DELETED")
    .employee(emp.id())
    .reason("GDPR Right to Be Forgotten")
    .actor("system")
  );
  
  employeeRepository.save(emp);
}
```

**Data Portability:**
```java
public byte[] exportEmployeeDataAsJSON(Long employeeId) {
  Employee emp = employeeRepository.findById(employeeId)
    .orElseThrow(EmployeeNotFoundException::new);
  
  // Collect all personal data
  Map<String, Object> data = Map.of(
    "employee", emp,
    "payroll", payrollHistoryRepository.findByEmployee(emp),
    "leave", leaveRecordsRepository.findByEmployee(emp),
    "benefits", benefitsRepository.findByEmployee(emp),
    "audit", auditLogRepository.findByEmployee(emp)
  );
  
  return objectMapper.writeValueAsBytes(data);
}
```

## CCPA (California Consumer Privacy Act)

**Consumer Privacy Rights:**
- Right to know: What data is collected
- Right to delete: Removal of personal info
- Right to opt-out: Don't sell my data
- Right to non-discrimination: No penalty for exercising rights

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
    // Similar to GDPR but stricter — must delete even while employed
    Employee emp = employeeRepository.findById(employeeId)
      .orElseThrow(EmployeeNotFoundException::new);
    
    // Must retain: Tax records (7 years), audit logs (7 years)
    // Can delete: Explicit personal data not required by law
    
    auditLog.record(new AuditEvent()
      .action("CCPA_DELETE_REQUEST")
      .employee(emp.id())
      .timestamp(now())
    );
  }
}
```

## HIPAA (Health Insurance Portability & Accountability Act)

Protects employee health information:

```java
@Service
public class HIPAACompliantBenefitsService {
  
  @PreAuthorize("hasRole('HR_BENEFITS_ADMIN')")
  public HealthBenefitDetails getHealthBenefits(Long employeeId) {
    // Only HR benefits team can access
    return benefitsRepository.findByEmployeeAndType(
      employeeId,
      BenefitType.HEALTH
    );
  }
  
  @Transactional
  public void accessHealthData(Long employeeId, String actor) {
    auditLog.record(new AuditEvent()
      .action("HIPAA_DATA_ACCESS")
      .employee(employeeId)
      .actor(actor)
      .timestamp(now())
      .reason("Required for benefits administration")
    );
  }
}
```

**HIPAA Requirements:**
- Encrypt health data at rest + in transit (AES-256)
- Limit access to authorized personnel only
- Audit all access to health information
- Breach notification within 60 days
- Data retention 6+ years (varies by state)

## Labor Law Compliance

**Minimum Wage & Overtime (FLSA):**
```java
public void validatePayroll(PayrollCalculation calc) {
  BigDecimal minimumWage = FEDERAL_MINIMUM_WAGE; // Check per-state too
  BigDecimal hourlyRate = calc.baseSalary().divide(new BigDecimal("2080"));
  
  if (hourlyRate.compareTo(minimumWage) < 0) {
    throw new MinimumWageViolationException(hourlyRate, minimumWage);
  }
  
  // Verify overtime calculated at 1.5x minimum (not straight-time)
  if (calc.overtimeHours > 0) {
    BigDecimal overtimeRate = hourlyRate.multiply(new BigDecimal("1.5"));
    if (calc.overtimeRate.compareTo(overtimeRate) < 0) {
      throw new OvertimeCalculationViolationException();
    }
  }
}
```

**Non-Discrimination:**
```java
public void auditPayrollEquity() {
  // Find pay disparities by gender, race, age
  Map<String, BigDecimal> avgSalaryByGender = employeeRepository.stream()
    .collect(groupingBy(
      emp -> emp.getGender(),
      averagingBigDecimal(emp -> emp.getBaseSalary())
    ));
  
  // Flag if disparity > 15%
  BigDecimal maleAvg = avgSalaryByGender.get("M");
  BigDecimal femaleAvg = avgSalaryByGender.get("F");
  
  BigDecimal disparity = maleAvg.subtract(femaleAvg)
    .divide(femaleAvg)
    .multiply(new BigDecimal("100"));
  
  if (disparity.compareTo(new BigDecimal("15")) > 0) {
    auditLog.warn("Pay equity disparity detected: " + disparity + "%");
  }
}
```

## Audit Trail Design

```java
@Entity
@Table(name = "hr_audit_log")
public class AuditEvent {
  
  @Id
  @GeneratedValue
  private Long id;
  
  @Column(nullable = false)
  private LocalDateTime timestamp;
  
  @Column(nullable = false)
  private String action; // EMPLOYEE_CREATED, SALARY_CHANGED, etc.
  
  @Column(nullable = false)
  private Long employeeId;
  
  @Column(nullable = false)
  private String actor; // User ID or "system"
  
  private String reason; // Why this action
  
  @Column(columnDefinition = "JSON")
  private String beforeValue; // Previous state
  
  @Column(columnDefinition = "JSON")
  private String afterValue; // New state
  
  @Index(columnList = "employee_id, timestamp")
  private void auditTableIndex() {}
  
  @Index(columnList = "action, timestamp")
  private void actionTimestampIndex() {}
}
```

**Immutability:**
- Audit logs must be append-only (no updates/deletes)
- Store in separate table, never in main employee table
- Index by employee ID + timestamp for fast queries
- Replicate to secure archive quarterly

**Query Audit Trail:**
```java
public List<AuditEvent> getEmployeeChangeHistory(Long employeeId) {
  return auditLogRepository.findByEmployeeIdOrderByTimestampDesc(employeeId);
}

// Example output:
// 2026-05-23 10:30 | SALARY_CHANGED | emp#123 | admin@example.com | before: 50k → after: 55k
// 2026-05-15 14:22 | PROMOTED | emp#123 | admin@example.com | junior → senior
// 2026-05-01 09:00 | HIRED | emp#123 | hr@example.com | new employee
```

## Compliance Checklist

| Requirement | Implementation | Review Frequency |
|---|---|---|
| GDPR Right to Forget | `deleteEmployeePersonalData()` | Annual |
| CCPA Data Export | `exportEmployeeDataAsJSON()` | Quarterly |
| HIPAA Access Logs | Audit trail on benefits data | Monthly |
| FLSA Payroll Rules | Validation in PayrollCalculator | Every payroll |
| Non-Discrimination | `auditPayrollEquity()` | Annual |
| Audit Trail Immutability | Archive logs to read-only store | Quarterly |
| Data Retention Policies | Automated purge after legal hold | Annual |

## References
- [GDPR Portal](https://gdpr-info.eu/)
- [CCPA Text](https://leginfo.legislature.ca.gov/faces/billTextClient.xhtml?bill_id=201720180AB375)
- [HIPAA Rules](https://www.hhs.gov/hipaa/)
- [FLSA](https://www.dol.gov/agencies/whd/flsa)
- Audit Service: `com.example.hr.service.AuditService`
- Compliance Service: `com.example.hr.service.ComplianceService`
