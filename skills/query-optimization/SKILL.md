# Query Optimization Skill

## Overview

Detect and fix slow queries in the HR microservices codebase: N+1 queries, missing indexes, unbounded result sets, and caching strategies.

## When to Use This Skill

- A query or API endpoint is slow (>200ms for simple reads)
- Repository returns a `List<>` with no pagination
- Health checks report high DB CPU or slow query log alerts
- Code review of new `@Query` or `findBy*` methods

---

## 1. Detect N+1 Queries

N+1 happens when loading a collection triggers one extra query per element.

```java
// N+1: findAll() loads N employees, then e.getDepartment() fires N more SELECTs
List<Employee> employees = employeeRepository.findAll();
employees.forEach(e -> System.out.println(e.getDepartment().getName()));
```

**Enable SQL logging temporarily to detect:**
```yaml
logging:
  level:
    '[org.hibernate.SQL]': DEBUG
    '[org.hibernate.orm.jdbc.bind]': TRACE
```

**Fix — JOIN FETCH:**
```java
@Query("SELECT e FROM Employee e JOIN FETCH e.department WHERE e.status = :status")
List<Employee> findActiveWithDepartment(@Param("status") EmployeeStatus status);
```

**Fix — @EntityGraph (no JPQL needed):**
```java
@EntityGraph(attributePaths = {"department", "manager"})
List<Employee> findByStatus(EmployeeStatus status);
```

---

## 2. Missing Indexes

Every foreign key and commonly filtered column needs an index.

```java
@Entity
@Table(name = "employees",
       indexes = {
         @Index(name = "idx_emp_dept_status",  columnList = "department_id, status"),
         @Index(name = "idx_emp_hire_date",    columnList = "hire_date"),
         @Index(name = "idx_emp_email",        columnList = "email", unique = true),
         @Index(name = "idx_emp_manager",      columnList = "manager_id")
       })
public class Employee { ... }
```

**Index strategy rules:**

| Column type | Index? |
|---|---|
| Foreign key (`department_id`) | Always |
| Unique business key (`email`) | Always, unique |
| Frequently filtered (`status`, `hire_date`) | Yes |
| High-cardinality sort (`last_name`) | Yes |
| Low-cardinality boolean (`is_active`) | No (full scan often cheaper) |

---

## 3. Pagination — Never Return Unbounded Lists

```java
// WRONG — could return millions of rows
List<Employee> findByStatus(EmployeeStatus status);

// CORRECT — always paginate
Page<Employee> findByStatus(EmployeeStatus status, Pageable pageable);

// Controller
@GetMapping
public Page<EmployeeDTO> list(
    @RequestParam(defaultValue = "0")  int page,
    @RequestParam(defaultValue = "20") int size) {
  return employeeService.findAll(PageRequest.of(page, size, Sort.by("lastName")));
}
```

---

## 4. Caching with Redis

Cache frequently read, rarely updated data.

```java
@Service
public class EmployeeService {

  // Cache on first read
  @Cacheable(value = "employees", key = "#id")
  @Transactional(readOnly = true)
  public EmployeeDTO findById(Long id) {
    return employeeRepository.findById(id)
      .map(EmployeeDTO::from)
      .orElseThrow(() -> new EmployeeNotFoundException(id));
  }

  // Evict on write
  @CacheEvict(value = "employees", key = "#id")
  @Transactional
  public void updateEmployee(Long id, UpdateRequest req) { ... }

  // Evict entire cache on bulk operations
  @CacheEvict(value = "employees", allEntries = true)
  @Transactional
  public void importEmployees(List<ImportRow> rows) { ... }
}
```

**Cache TTL is configured in application config — do not hard-code.**

---

## 5. Batch Insert / Update

```java
// WRONG: N individual INSERTs
employees.forEach(e -> employeeRepository.save(e));

// CORRECT: single batch insert
employeeRepository.saveAll(employees);

// For bulk updates, use JPQL to avoid loading entities into memory
@Modifying
@Transactional
@Query("UPDATE Employee e SET e.status = :status WHERE e.departmentId = :deptId")
int bulkUpdateStatus(@Param("deptId") Long deptId, @Param("status") EmployeeStatus status);
```

Enable JDBC batching:
```yaml
spring:
  jpa:
    properties:
      hibernate:
        jdbc:
          batch_size: 50
        order_inserts: true
        order_updates: true
```

---

## 6. Projection — Only Select What You Need

```java
// Interface-based projection — only fetches id + fullName columns
public interface EmployeeSummary {
  Long getId();
  String getFirstName();
  String getLastName();
}

List<EmployeeSummary> findByDepartmentId(Long departmentId);
```

---

## Performance Targets

| Operation | Target | Action if exceeded |
|---|---|---|
| Simple read by ID | <20ms | Check cache + index |
| Filtered list (paginated) | <100ms | Add composite index |
| Complex join (department report) | <500ms | Join fetch + cache |
| Bulk import (1000 rows) | <2s | Batch insert, size 50 |

## References

- `com.hrservice.hr.repository.EmployeeRepository`
- `com.hrservice.project.repository.ProjectRepository`
- Hibernate 6.x docs — batch operations
- Spring Data JPA — projections, `@EntityGraph`
