# Employee Lifecycle Skill

## Overview

Comprehensive guide to employee workflows from hire to separation: onboarding, promotions, transfers, leave management, and offboarding.

## Onboarding Workflow

```java
@Service
public class EmployeeService {

  @Transactional
  public Employee onboardNewEmployee(OnboardingRequest req) {
    // 1. Create employee record
    Employee emp = Employee.builder()
      .firstName(req.firstName())
      .lastName(req.lastName())
      .email(generateCorporateEmail(req.firstName(), req.lastName()))
      .status(EmployeeStatus.ONBOARDING)
      .hireDate(LocalDate.now())
      .department(req.departmentId())
      .jobTitle(req.jobTitle())
      .manager(req.managerId())
      .build();

    emp = employeeRepository.save(emp);

    // 2. Set up benefits eligibility
    benefitsService.setupBenefitsEligibility(emp);

    // 3. Provision accounts (email, VPN, tools)
    accessService.provisionAccounts(emp);

    // 4. Assign equipment
    equipmentService.assignEquipment(emp);

    // 5. Send welcome email + schedule orientation
    emailService.sendWelcomeEmail(emp);
    onboardingService.scheduleOrientation(emp);

    // 6. Audit
    auditLog.record(AuditEvent.of("EMPLOYEE_ONBOARDED", emp.id()));

    return emp;
  }
}
```

**Critical checks before saving:**
- Email must be unique in the system
- Manager must exist and belong to the same company
- Department must be active
- Salary must be within band for the assigned job level
- Background check clearance must be recorded

## Promotion Workflow

```java
@Transactional
public void promoteEmployee(Long employeeId, PromotionRequest req) {
  Employee emp = employeeRepository.findById(employeeId)
    .orElseThrow(EmployeeNotFoundException::new);

  // Guard: minimum tenure
  if (emp.yearsAtCurrentLevel() < MINIMUM_TENURE_FOR_PROMOTION) {
    throw new PrematurePromotionException();
  }

  BigDecimal oldSalary = emp.getBaseSalary();

  emp.setJobTitle(req.newJobTitle());
  emp.setJobLevel(req.newJobLevel());
  emp.setBaseSalary(calculateNewSalary(oldSalary, req.newJobLevel()));

  if (req.newManagerId() != null) {
    emp.setManager(req.newManagerId());
  }

  if (req.newJobLevel().requiresExecutiveBenefits()) {
    benefitsService.upgradeExecutiveBenefits(emp);
  }

  promotionRepository.save(PromotionRecord.builder()
    .employee(emp.id())
    .fromLevel(req.oldJobLevel())
    .toLevel(req.newJobLevel())
    .fromSalary(oldSalary)
    .toSalary(emp.getBaseSalary())
    .effectiveDate(LocalDate.now())
    .approvedBy(currentUser())
    .build());

  auditLog.record(AuditEvent.of("EMPLOYEE_PROMOTED", emp.id())
    .detail("jobLevel", req.oldJobLevel() + " → " + req.newJobLevel())
    .detail("salary", oldSalary + " → " + emp.getBaseSalary()));
}
```

**Compliance notes:**
- Promotions must be approved by HR + direct manager
- Salary change triggers payroll tax recalculation in next pay run
- Executive level changes affect stock vesting schedules
- Business justification must be documented

## Transfer Workflow

```java
@Transactional
public void transferEmployee(Long employeeId, TransferRequest req) {
  Employee emp = employeeRepository.findById(employeeId)
    .orElseThrow(EmployeeNotFoundException::new);

  if (emp.yearsInCurrentRole() < MINIMUM_TENURE_FOR_TRANSFER) {
    throw new TooSoonForTransferException();
  }

  String fromDept = emp.getDepartment();

  emailService.notifyManagerOfTransfer(emp, fromDept, req.departmentId());

  emp.setDepartment(req.departmentId());
  emp.setManager(req.newManagerId());
  emp.setLastTransferDate(LocalDate.now());

  if (req.newJobTitle() != null) {
    emp.setJobTitle(req.newJobTitle());
  }

  // Update access permissions for new department
  accessService.updateDepartmentAccess(emp, req.departmentId());

  transferRepository.save(TransferRecord.of(emp.id(), fromDept, req.departmentId()));
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

    LeaveBalance balance = leaveBalanceRepository.findByEmployee(emp);
    BigDecimal daysRequested = calculateBusinessDays(req.startDate(), req.endDate());

    if (balance.availableDays().compareTo(daysRequested) < 0) {
      throw new InsufficientLeaveException(balance.availableDays(), daysRequested);
    }

    req.setStatus(LeaveStatus.PENDING_APPROVAL);
    req = leaveRepository.save(req);

    emailService.notifyManagerOfLeaveRequest(emp, req);
    return req;
  }

  @Transactional
  public void approveLeave(Long leaveId) {
    LeaveRequest leave = leaveRepository.findById(leaveId)
      .orElseThrow(LeaveNotFoundException::new);

    LeaveBalance balance = leaveBalanceRepository.findByEmployee(leave.employee());
    balance.deductDays(calculateBusinessDays(leave.startDate(), leave.endDate()));

    leave.setStatus(LeaveStatus.APPROVED);
    leave.setApprovedBy(currentUser());
    leave.setApprovedDate(LocalDate.now());

    availabilityService.markUnavailable(leave.employee(), leave.startDate(), leave.endDate());
    emailService.sendLeaveApprovalConfirmation(leave);
  }
}
```

**Leave types:**

| Type | Description | Rollover |
|---|---|---|
| PTO | Accrues by tenure | Yes (up to cap) |
| Sick Leave | Medical/personal health | No |
| Unpaid Leave | Beyond balance | Requires approval |
| Parental Leave | Statutory protected | N/A |
| Sabbatical | Extended for long-tenured | N/A |

## Offboarding Workflow

```java
@Service
public class OffboardingService {

  @Transactional
  public void offboardEmployee(Long employeeId, OffboardingRequest req) {
    Employee emp = employeeRepository.findById(employeeId)
      .orElseThrow(EmployeeNotFoundException::new);

    // 1. Final paycheck + unused PTO payout
    PayrollResult finalPaycheck = calculateFinalPaycheck(emp, req.lastWorkDay());
    BigDecimal ptoPayout = calculatePTOPayout(emp);

    // 2. Revoke all system access
    accessService.revokeAllAccess(emp);
    equipmentService.scheduleEquipmentReturn(emp);

    // 3. Benefits termination + COBRA offer
    benefitsService.terminateBenefits(emp, req.lastWorkDay());
    benefitsService.offerCOBRA(emp);

    // 4. Tax forms
    taxService.prepareW2(emp);

    // 5. Exit interview
    emailService.scheduleExitInterview(emp);

    // 6. GDPR-compliant personal data handling
    if (req.deletePersonalData()) {
      employeeService.archivePersonalData(emp);
    }

    // 7. Mark inactive
    emp.setStatus(EmployeeStatus.TERMINATED);
    emp.setTerminationDate(req.lastWorkDay());
    emp.setTerminationReason(req.reason());

    auditLog.record(AuditEvent.of("EMPLOYEE_OFFBOARDED", emp.id())
      .detail("lastDay", req.lastWorkDay().toString())
      .detail("finalPaycheck", finalPaycheck.net().toString())
      .detail("ptoPayout", ptoPayout.toString()));

    employeeRepository.save(emp);
  }
}
```

**Offboarding checklist:**
- Calculate final paycheck + unused PTO
- Revoke system access (email, VPN, tools, badges)
- Collect company equipment
- Archive personal data (GDPR compliant)
- Process benefits termination + COBRA
- Prepare W2/tax forms
- Remove from distribution lists
- Document in HR system

## Data Consistency Rules

| Rule | Implementation |
|---|---|
| Referential Integrity | Manager, department, job level must exist before save |
| Salary Bounds | Compensation must be within band for job level |
| Audit Trail | Every change logged with timestamp + actor |
| GDPR Compliance | Right-to-forget after 2 years post-termination |
| Notifications | Manager, HR, and employee notified of key events |

## References

- `com.hrservice.hr.model.Employee`
- `com.hrservice.hr.model.Department`
- `com.hrservice.hr.model.LeaveRequest`
- `com.hrservice.hr.model.PromotionRecord`
- `com.hrservice.hr.service.OffboardingService`
