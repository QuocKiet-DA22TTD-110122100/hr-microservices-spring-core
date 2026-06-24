# Transaction Tuning Skill

## Overview

Transaction isolation levels, propagation, lock contention, and deadlock prevention patterns for the HR microservices codebase (MySQL + PostgreSQL).

## When to Use This Skill

- A financial operation (payroll, salary update) needs protection against phantom reads
- Concurrent updates cause duplicate or lost data
- Deadlocks appear in logs (`com.mysql.cj.jdbc.exceptions.CommunicationsException`)
- Long-running transactions blocking other operations

---

## 1. Isolation Levels — When to Use Each

| Level | Use Case | Risk |
|---|---|---|
| `READ_UNCOMMITTED` | Never in HR — dirty reads are unsafe | Reads uncommitted data |
| `READ_COMMITTED` (default) | Standard reads, most service methods | Non-repeatable reads |
| `REPEATABLE_READ` (MySQL default) | Payroll within a pay period | Phantom reads possible |
| `SERIALIZABLE` | Payroll finalization, final paycheck | Highest lock contention |

```java
@Service
public class PayrollService {

  // Most operations: READ_COMMITTED (explicit for clarity)
  @Transactional(isolation = Isolation.READ_COMMITTED, readOnly = true)
  public PayrollResult getPayrollSummary(Long employeeId, YearMonth period) { ... }

  // Concurrent payroll run: REPEATABLE_READ prevents mid-calculation changes
  @Transactional(isolation = Isolation.REPEATABLE_READ)
  public void calculatePayrollBatch(Long payrollRunId) { ... }

  // Close the books: SERIALIZABLE prevents any concurrent modification
  @Transactional(isolation = Isolation.SERIALIZABLE)
  public void finalizePayrollRun(Long payrollRunId) { ... }
}
```

---

## 2. Propagation — Which Method Gets Its Own Transaction

| Propagation | Behavior | Use Case |
|---|---|---|
| `REQUIRED` (default) | Join existing or create new | Standard service methods |
| `REQUIRES_NEW` | Always create new, suspend outer | Audit logging (must persist even if outer rolls back) |
| `NOT_SUPPORTED` | Suspend outer, run non-transactionally | Sending email/notifications |
| `NEVER` | Throw if called inside transaction | Sanity guard for read-only helpers |
| `SUPPORTS` | Join if exists, otherwise non-TX | Reporting queries |

```java
@Service
public class AuditService {

  // Audit must persist even if the calling transaction rolls back
  @Transactional(propagation = Propagation.REQUIRES_NEW)
  public void record(AuditEvent event) {
    auditLogRepository.save(event);
  }
}

@Service
public class NotificationService {

  // Email must not run inside a DB transaction (holds lock while waiting for SMTP)
  @Transactional(propagation = Propagation.NOT_SUPPORTED)
  public void sendPayrollNotification(Employee emp, PayrollResult result) {
    emailService.send(emp.getEmail(), buildPayslipEmail(result));
  }
}
```

---

## 3. Optimistic Locking — Prevent Lost Updates

Use `@Version` to detect concurrent modifications without a database lock.

```java
@Entity
public class Employee extends AuditableEntity {

  @Version
  private Long version; // Hibernate increments on every UPDATE

}

// If two users save concurrently, the second gets OptimisticLockException
@Transactional
public void updateEmployee(Long id, UpdateRequest req, Long expectedVersion) {
  Employee emp = employeeRepository.findById(id)
    .orElseThrow(EmployeeNotFoundException::new);

  if (!emp.getVersion().equals(expectedVersion)) {
    throw new StaleEntityException("Employee was modified concurrently");
  }

  emp.setJobTitle(req.jobTitle());
  // ... other updates
}
```

**Catch at controller level:**
```java
@ExceptionHandler(OptimisticLockingFailureException.class)
@ResponseStatus(HttpStatus.CONFLICT)
public ErrorResponse handleConcurrentEdit(OptimisticLockingFailureException ex) {
  return new ErrorResponse("CONCURRENT_EDIT", "Data was modified by another user. Please reload and retry.");
}
```

---

## 4. Deadlock Prevention

Deadlocks occur when two transactions lock resources in opposite order.

**Rule: always lock in the same order** (e.g., always lock by `employee_id` ascending).

```java
// WRONG: Thread A locks emp 1 then 2; Thread B locks emp 2 then 1 → deadlock
void transfer(Long fromId, Long toId) {
  Employee from = repo.findAndLock(fromId);
  Employee to   = repo.findAndLock(toId);   // may deadlock
}

// CORRECT: sort IDs to ensure consistent lock order
void transfer(Long fromId, Long toId) {
  Long first  = Math.min(fromId, toId);
  Long second = Math.max(fromId, toId);
  Employee a = repo.findAndLock(first);
  Employee b = repo.findAndLock(second);
}
```

**Pessimistic lock query:**
```java
@Lock(LockModeType.PESSIMISTIC_WRITE)
@Query("SELECT e FROM Employee e WHERE e.id = :id")
Optional<Employee> findAndLock(@Param("id") Long id);
```

---

## 5. Long Transaction Anti-Patterns

```java
// WRONG: transaction holds DB connection for 2+ seconds during email sending
@Transactional
public void processLeaveApproval(Long leaveId) {
  LeaveRequest leave = leaveRepository.findById(leaveId).orElseThrow(...);
  leave.setStatus(LeaveStatus.APPROVED);
  leaveRepository.save(leave);             // transaction stays open...
  emailService.send(leave.employee());     // ...while SMTP call happens
}

// CORRECT: close transaction first, then notify
@Transactional
public void approveLeave(Long leaveId) {
  LeaveRequest leave = leaveRepository.findById(leaveId).orElseThrow(...);
  leave.setStatus(LeaveStatus.APPROVED);
  leaveRepository.save(leave);
  // Transaction commits here when method returns
}

public void processLeaveApproval(Long leaveId) {
  approveLeave(leaveId);                   // TX committed
  notificationService.notifyApproved(leaveId); // no DB lock held
}
```

---

## 6. Connection Pool — Avoid Exhaustion

```yaml
spring:
  datasource:
    hikari:
      maximum-pool-size: 10       # Don't exceed DB max_connections / num_instances
      minimum-idle: 3
      connection-timeout: 5000    # Fail fast if pool exhausted (5s)
      idle-timeout: 300000        # Return idle connections after 5min
      max-lifetime: 1800000       # Recycle connections after 30min
```

**Warning signs of pool exhaustion:**
- `HikariPool-1 - Connection is not available, request timed out after 5000ms`
- API response times spike periodically

---

## Debugging Transactions

Enable transaction logging temporarily:
```yaml
logging:
  level:
    '[org.springframework.transaction]': DEBUG
    '[org.springframework.orm.jpa]': DEBUG
```

## References

- `com.hrservice.hr.service.PayrollService`
- `com.hrservice.hr.service.AuditService`
- Spring Transaction docs — Isolation, Propagation
- MySQL 8.0 InnoDB Locking docs
