# Spring Boot Patterns Skill

## Overview

Best practices for Spring Boot 3.x / Java 21 in this HR microservices codebase: dependency injection, security, transactions, exception handling, and API design.

## When to Use This Skill

- Code review of any Spring service, controller, or repository
- Designing new endpoints or services
- Debugging transaction/lazy-loading issues
- Verifying security annotations

---

## 1. Dependency Injection

**Always use constructor injection — never `@Autowired` on fields.**

```java
// WRONG
@Service
public class EmployeeService {
  @Autowired
  private EmployeeRepository employeeRepository; // field injection
}

// CORRECT
@Service
@RequiredArgsConstructor
public class EmployeeService {
  private final EmployeeRepository employeeRepository; // constructor injection via Lombok
}
```

Why: field injection hides dependencies, breaks testability, and prevents `final`.

---

## 2. Security — RBAC Annotations

Every endpoint touching sensitive data must have `@PreAuthorize`.

```java
@RestController
@RequestMapping("/api/nhan-vien")
@RequiredArgsConstructor
public class EmployeeController {

  // Public read — HR staff can view
  @GetMapping("/{id}")
  @PreAuthorize("hasAnyRole('HR_STAFF', 'HR_ADMIN', 'MANAGER')")
  public ResponseEntity<EmployeeDTO> getEmployee(@PathVariable Long id) { ... }

  // Write — HR admin only
  @PutMapping("/{id}/salary")
  @PreAuthorize("hasRole('HR_ADMIN')")
  public ResponseEntity<Void> updateSalary(@PathVariable Long id,
                                            @RequestBody SalaryUpdateRequest req) { ... }

  // Delete — never expose in HR; use offboard flow instead
}
```

**Never annotate the controller class only** — annotate each method with the correct role.

---

## 3. Transactions — @Transactional Placement

`@Transactional` belongs on the **service layer**, never on controllers or repositories.

```java
@Service
public class PayrollService {

  // Read-only query: faster, no write lock
  @Transactional(readOnly = true)
  public PayrollResult getPayrollForPeriod(Long employeeId, PayPeriod period) { ... }

  // Write: default propagation REQUIRED, isolation READ_COMMITTED
  @Transactional
  public void processPayroll(Long employeeId, PayPeriod period) { ... }

  // Critical financial operation: SERIALIZABLE to prevent phantom reads
  @Transactional(isolation = Isolation.SERIALIZABLE)
  public void finalizePayrollRun(Long payrollRunId) { ... }
}
```

**Common mistake:** `@Transactional` on a `private` method does nothing — Spring AOP only intercepts `public` methods.

---

## 4. Exception Handling

Use a `@RestControllerAdvice` for consistent error responses across all services.

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

  @ExceptionHandler(EmployeeNotFoundException.class)
  @ResponseStatus(HttpStatus.NOT_FOUND)
  public ErrorResponse handleNotFound(EmployeeNotFoundException ex) {
    return new ErrorResponse("EMPLOYEE_NOT_FOUND", ex.getMessage());
  }

  @ExceptionHandler(InsufficientLeaveException.class)
  @ResponseStatus(HttpStatus.UNPROCESSABLE_ENTITY)
  public ErrorResponse handleBusinessRule(InsufficientLeaveException ex) {
    return new ErrorResponse("INSUFFICIENT_LEAVE", ex.getMessage());
  }

  @ExceptionHandler(AccessDeniedException.class)
  @ResponseStatus(HttpStatus.FORBIDDEN)
  public ErrorResponse handleForbidden(AccessDeniedException ex) {
    return new ErrorResponse("ACCESS_DENIED", "You do not have permission for this action");
  }
}
```

**HTTP status mapping:**

| Scenario | Status |
|---|---|
| Entity not found | 404 |
| Validation failure | 400 |
| Business rule violation | 422 |
| Unauthorized | 401 |
| Forbidden (wrong role) | 403 |
| Server error | 500 |

---

## 5. Entity / DTO Separation

Never expose JPA entities directly in REST responses.

```java
// WRONG — exposes lazy-loaded relations and internal IDs
@GetMapping("/{id}")
public Employee getEmployee(@PathVariable Long id) {
  return employeeRepository.findById(id).orElseThrow(...);
}

// CORRECT — DTO decouples API from schema
@GetMapping("/{id}")
public ResponseEntity<EmployeeDTO> getEmployee(@PathVariable Long id) {
  Employee emp = employeeRepository.findById(id)
    .orElseThrow(() -> new EmployeeNotFoundException(id));
  return ResponseEntity.ok(EmployeeDTO.from(emp));
}
```

---

## 6. Lazy Loading & N+1 Prevention

```java
// WRONG: triggers N queries for N employees
List<Employee> employees = employeeRepository.findAll();
employees.forEach(e -> e.getDepartment().getName()); // N+1!

// CORRECT: single JOIN query
@Query("SELECT e FROM Employee e JOIN FETCH e.department WHERE e.status = :status")
List<Employee> findActiveWithDepartment(@Param("status") EmployeeStatus status);

// OR use @EntityGraph
@EntityGraph(attributePaths = {"department", "manager"})
List<Employee> findByStatus(EmployeeStatus status);
```

---

## 7. Validation

Validate at the controller boundary using Bean Validation.

```java
public record OnboardingRequest(
  @NotBlank String firstName,
  @NotBlank String lastName,
  @Email   String email,
  @NotNull Long   departmentId,
  @Positive BigDecimal baseSalary
) {}

@PostMapping
public ResponseEntity<EmployeeDTO> onboard(
    @Valid @RequestBody OnboardingRequest req) { ... }
```

---

## 8. Virtual Threads (Java 21)

This project enables virtual threads via:
```yaml
spring:
  threads:
    virtual:
      enabled: true
```

**Implication:** avoid `synchronized` blocks in service code — use `ReentrantLock` or redesign to be stateless.

---

## Checklist

| Check | Rule |
|---|---|
| DI | Constructor injection + `final` fields |
| Security | `@PreAuthorize` on every sensitive method |
| Transactions | `@Transactional` on service, not controller |
| Read-only | `@Transactional(readOnly = true)` for queries |
| Errors | `@RestControllerAdvice` with domain exceptions |
| API | DTO in/out, never raw entities |
| JPA | `JOIN FETCH` or `@EntityGraph` to prevent N+1 |
| Validation | `@Valid` on `@RequestBody` params |

## References

- `com.hrservice.gateway.ApiGatewayApplication`
- `com.hrservice.auth.AuthServiceApplication`
- Spring Boot 3.5 docs
- Java 21 virtual threads: JEP 444
