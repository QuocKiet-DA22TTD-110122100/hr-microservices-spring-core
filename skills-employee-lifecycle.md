# Employee Lifecycle Skill

Comprehensive guide to employee workflows from hire to separation, including onboarding, transfers, promotions, leave management, and offboarding.

## Onboarding Workflow

```java
// EmployeeService.java pattern
@Service
public class EmployeeService {
  
  @Transactional
  public Employee onboardNewEmployee(OnboardingRequest req) {
    // 1. Create employee record
    Employee emp = Employee.builder()
      .firstName(req.firstName)
      .lastName(req.lastName)
      .email(generateCorporateEmail(req.firstName, req.lastName))
      .status(EmployeeStatus.ONBOARDING)
      .hireDate(LocalDate.now())
      .department(req.departmentId)
      .jobTitle(req.jobTitle)
      .manager(req.managerId)
      .build();
    
    emp = employeeRepository.save(emp);
    
    // 2. Set up benefits eligibility
    benefitsService.setupBenefitsEligibility(emp);
    
    // 3. Create access accounts (email, VPN, tools)
    accessService.provisionAccounts(emp);
    
    // 4. Assign equipment (laptop, phone, badge)
    equipmentService.assignEquipment(emp);
    
    // 5. Send welcome email + schedule orientation
    emailService.sendWelcomeEmail(emp);
    onboardingService.scheduleOrientation(emp);
    
    // 6. Audit log
    auditLog.record(new AuditEvent()
      .action("EMPLOYEE_ONBOARDED")
      .employee(emp.id())
      .timestamp(now())
    );
    
    return emp;
  }
}
```

**Critical Checks:**
- Employee email must be unique
- Manager must exist and be in same company
- Department must be active
- Salary must be in valid range for job level
- Background check clearance must be recorded

## Promotion Workflow

```java
@Transactional
public void promoteEmployee(Long employeeId, PromotionRequest req) {
  Employee emp = employeeRepository.findById(employeeId)
    .orElseThrow(EmployeeNotFoundException::new);
  
  // 1. Validate promotion
  if (emp.yearsAtLevel() < MINIMUM_TENURE) {
    throw new PrematurePromotionException();
  }
  
  // 2. Update job title & level
  emp.setJobTitle(req.newJobTitle);
  emp.setJobLevel(req.newJobLevel);
  
  // 3. Adjust compensation
  BigDecimal newSalary = calculateNewSalary(
    emp.getCurrentSalary(),
    req.newJobLevel
  );
  emp.setBaseSalary(newSalary);
  
  // 4. Update manager if changed
  if (req.newManagerId != null) {
    emp.setManager(req.newManagerId);
  }
  
  // 5. Update benefits if needed (new health plan tier, etc.)
  if (req.newJobLevel.requiresExecutiveBenefits()) {
    benefitsService.upgradeExecutiveBenefits(emp);
  }
  
  // 6. Record for HR reporting
  promotionRepository.save(new PromotionRecord()
    .employee(emp.id())
    .fromLevel(req.oldJobLevel)
    .toLevel(req.newJobLevel)
    .fromSalary(req.oldSalary)
    .toSalary(newSalary)
    .effectiveDate(LocalDate.now())
    .approvedBy(currentUser())
  );
  
  // 7. Audit trail
  auditLog.record(new AuditEvent()
    .action("EMPLOYEE_PROMOTED")
    .employee(emp.id())
    .changes(Map.of(
      "jobLevel", req.oldJobLevel + " → " + req.newJobLevel,
      "salary", req.oldSalary + " → " + newSalary
    ))
  );
}
```

**Compliance Notes:**
- Promotions must be approved by HR + manager
- Salary changes trigger tax recalculation in next payroll
- Executive level changes affect stock vesting schedules
- Document business justification

## Transfer Workflow

```java
@Transactional
public void transferEmployee(Long employeeId, TransferRequest req) {
  Employee emp = employeeRepository.findById(employeeId)
    .orElseThrow(EmployeeNotFoundException::new);
  
  String oldDepartment = emp.getDepartment();
  String newDepartment = req.departmentId;
  
  // 1. Validate transfer
  if (emp.yearsInCurrentRole() < MINIMUM_TENURE_FOR_TRANSFER) {
    throw new TooSoonForTransferException();
  }
  
  // 2. Notify current manager
  emailService.notifyManagerOfTransfer(emp, oldDepartment, newDepartment);
  
  // 3. Update department & manager
  emp.setDepartment(newDepartment);
  emp.setManager(req.newManagerId);
  emp.setLastTransferDate(LocalDate.now());
  
  // 4. Update access permissions (if transitioning between restricted areas)
  accessService.updateDepartmentAccess(emp, newDepartment);
  
  // 5. Handle role-specific changes
  if (req.newJobTitle != null) {
    emp.setJobTitle(req.newJobTitle);
  }
  
  // 6. Record transfer history
  transferRepository.save(new TransferRecord()
    .employee(emp.id())
    .fromDepartment(oldDepartment)
    .toDepartment(newDepartment)
    .transferDate(LocalDate.now())
  );
  
  employeeRepository.save(emp);
}
```

## Leave Management

```java
@Service
public class LeaveService {
  
  @Transactional
  public LeaveRequest requestLeave(Long employeeId, LeaveRequest req) {
    Employee emp = employeeRepository.findById(employeeId)
      .orElseThrow(EmployeeNotFoundException::new);
    
    // 1. Calculate available balance
    LeaveBalance balance = leaveBalanceRepository.findByEmployee(emp);
    BigDecimal daysRequested = calculateBusinessDays(
      req.startDate,
      req.endDate
    );
    
    // 2. Validate sufficient balance
    if (balance.availableDays() < daysRequested) {
      throw new InsufficientLeaveException(
        balance.availableDays(),
        daysRequested
      );
    }
    
    // 3. Route to manager approval
    req.setStatus(LeaveStatus.PENDING_APPROVAL);
    req = leaveRepository.save(req);
    
    // 4. Notify manager
    emailService.notifyManagerOfLeaveRequest(emp, req);
    
    return req;
  }
  
  @Transactional
  public void approveLeave(Long leaveId) {
    LeaveRequest leave = leaveRepository.findById(leaveId)
      .orElseThrow(LeaveNotFoundException::new);
    
    // 1. Deduct from balance
    LeaveBalance balance = leaveBalanceRepository
      .findByEmployee(leave.employee());
    BigDecimal daysUsed = calculateBusinessDays(
      leave.startDate,
      leave.endDate
    );
    balance.deductDays(daysUsed);
    
    // 2. Update leave status
    leave.setStatus(LeaveStatus.APPROVED);
    leave.setApprovedBy(currentUser());
    leave.setApprovedDate(LocalDate.now());
    
    // 3. Update employee availability calendar
    availabilityService.markUnavailable(
      leave.employee(),
      leave.startDate,
      leave.endDate,
      "On Leave"
    );
    
    // 4. Notify employee
    emailService.sendLeaveApprovalConfirmation(leave);
  }
}
```

**Leave Types:**
- **PTO (Paid Time Off)**: Standard vacation days (accrues based on tenure)
- **Sick Leave**: Medical/personal health (may not roll over)
- **Unpaid Leave**: Beyond accrued balance (requires approval)
- **Parental Leave**: Statutory protected leave
- **Sabbatical**: Extended unpaid leave for long-tenured employees

## Offboarding Workflow

```java
@Service
@Transactional
public class OffboardingService {
  
  public void offboardEmployee(Long employeeId, OffboardingRequest req) {
    Employee emp = employeeRepository.findById(employeeId)
      .orElseThrow(EmployeeNotFoundException::new);
    
    LocalDate lastDay = req.lastWorkDay;
    
    // 1. Final paycheck calculation
    PayrollResult finalPaycheck = calculateFinalPaycheck(emp, lastDay);
    
    // 2. Process unused PTO payout (company policy)
    BigDecimal ptoPayout = calculatePTOPayout(emp);
    
    // 3. Revoke access
    accessService.revokeAllAccess(emp);
    equipmentService.scheduleEquipmentReturn(emp);
    
    // 4. Handle benefits
    benefitsService.terminateBenefits(emp, lastDay);
    benefitsService.offerCOBRA(emp); // Healthcare continuation
    
    // 5. Tax forms
    taxService.prepareW2(emp);
    
    // 6. Conduct exit interview (if enabled)
    emailService.scheduleExitInterview(emp);
    
    // 7. Archive employee data (GDPR-compliant)
    if (req.deletePersonalData) {
      employeeService.archivePersonalData(emp);
    }
    
    // 8. Mark employee as inactive
    emp.setStatus(EmployeeStatus.TERMINATED);
    emp.setTerminationDate(lastDay);
    emp.setTerminationReason(req.reason);
    
    // 9. Full audit trail
    auditLog.record(new AuditEvent()
      .action("EMPLOYEE_OFFBOARDED")
      .employee(emp.id())
      .details(Map.of(
        "lastDay", lastDay.toString(),
        "finalPaycheck", finalPaycheck.net.toString(),
        "ptoPayout", ptoPayout.toString(),
        "accessRevoked", "true"
      ))
    );
    
    employeeRepository.save(emp);
  }
}
```

**Offboarding Checklist:**
- ✓ Calculate final paycheck + unused PTO
- ✓ Revoke system access (email, VPN, tools)
- ✓ Collect company equipment
- ✓ Archive personal data (GDPR compliant)
- ✓ Process benefits termination
- ✓ Prepare W2/tax forms
- ✓ Remove from distribution lists
- ✓ Document in HR system

## Data Consistency Rules

All employee operations must maintain:
1. **Referential Integrity** — Manager, department, job level must exist
2. **Salary Bounds** — Compensation within band for job level
3. **Audit Trail** — Every change logged with timestamp + actor
4. **Compliance** — GDPR deletion, CCPA access rights, I-9 verification
5. **Notification** — Manager, HR, employee notified of key events

## References
- Department: `com.example.hr.model.Department`
- Employee: `com.example.hr.model.Employee`
- Leave: `com.example.hr.model.LeaveRequest`
- Promotion: `com.example.hr.model.PromotionRecord`
