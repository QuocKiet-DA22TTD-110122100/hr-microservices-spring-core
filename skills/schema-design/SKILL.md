# Schema Design Skill

## Overview

Database schema conventions for the HR microservices: normalization, primary keys, foreign keys, naming, and zero-downtime migration strategies.

## When to Use This Skill

- Designing a new table or entity
- Adding columns to existing tables
- Planning a migration that must not lock production
- Reviewing Hibernate DDL auto-generated schema

---

## 1. Table Naming & Conventions

| Rule | Example |
|---|---|
| Snake_case table names | `employee_leave_balance` |
| Singular entity name | `employee`, not `employees` |
| Junction tables: both entity names | `employee_project` |
| Audit tables: `_audit` suffix | `salary_history` |
| All columns snake_case | `department_id`, `hire_date` |

---

## 2. Primary Keys

```java
// Use surrogate auto-increment — never use business keys (SSN, email) as PK
@Id
@GeneratedValue(strategy = GenerationType.IDENTITY)
private Long id;
```

**Why not UUID as PK for MySQL:** Random UUID inserts fragment the B-tree index, causing slower inserts. Use `IDENTITY` (auto-increment) for main tables; reserve UUID for distributed IDs (e.g. event correlation IDs).

---

## 3. Standard Audit Columns

Every business table must include:

```java
@MappedSuperclass
public abstract class AuditableEntity {

  @Column(name = "created_at", nullable = false, updatable = false)
  @CreationTimestamp
  private Instant createdAt;

  @Column(name = "updated_at", nullable = false)
  @UpdateTimestamp
  private Instant updatedAt;

  @Column(name = "created_by", length = 100)
  private String createdBy;

  @Column(name = "updated_by", length = 100)
  private String updatedBy;

  @Version
  private Long version; // Optimistic locking
}
```

---

## 4. Foreign Keys and Referential Integrity

```java
@Entity
public class Employee extends AuditableEntity {

  @ManyToOne(fetch = FetchType.LAZY)         // Always LAZY for *ToOne
  @JoinColumn(name = "department_id",
              foreignKey = @ForeignKey(name = "fk_emp_department"))
  private Department department;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "manager_id",
              foreignKey = @ForeignKey(name = "fk_emp_manager"))
  private Employee manager;

  @OneToMany(mappedBy = "employee",
             fetch = FetchType.LAZY,         // Always LAZY for collections
             cascade = CascadeType.ALL,
             orphanRemoval = true)
  private List<LeaveRequest> leaveRequests = new ArrayList<>();
}
```

**Rule:** `FetchType.LAZY` on all relations. Only override with `JOIN FETCH` or `@EntityGraph` at query time.

---

## 5. Column Constraints

```java
// Monetary values: DECIMAL(19,4) — enough precision, no floating-point error
@Column(precision = 19, scale = 4, nullable = false)
private BigDecimal baseSalary;

// Short codes / enums: VARCHAR(50) max — do not store as INT
@Enumerated(EnumType.STRING)
@Column(length = 50, nullable = false)
private EmployeeStatus status;

// Text fields: use @Column(length = N) always — avoid unbounded VARCHAR
@Column(length = 255, nullable = false)
private String firstName;

// Large text (notes, descriptions): TEXT is OK but don't select by default
@Basic(fetch = FetchType.LAZY)
@Column(columnDefinition = "TEXT")
private String notes;
```

---

## 6. Service-Specific Schemas

Each service owns its own schema/database — **no cross-service JOINs**.

| Service | Database | Notes |
|---|---|---|
| `hr-service` | `hr_db` (MySQL) | Employees, departments, payroll, leave |
| `project-service` | `project_db` (MySQL) | Projects, tasks, allocations |
| `task-service` | `task_db` (MySQL) | Tasks, workflows, assignments |
| `auth-service` | `auth_db` (PostgreSQL) | Users, roles, OAuth2 tokens |
| `kms` | in-memory / file | Key rotation only |

Cross-service data = publish an event (RabbitMQ) or call via HTTP — never a shared table.

---

## 7. Zero-Downtime Migration Rules

```sql
-- SAFE: adding a nullable column
ALTER TABLE employee ADD COLUMN middle_name VARCHAR(100) NULL;

-- SAFE: adding an index (MySQL: CREATE INDEX ... ALGORITHM=INPLACE LOCK=NONE)
CREATE INDEX idx_emp_last_name ON employee (last_name) ALGORITHM=INPLACE LOCK=NONE;

-- DANGEROUS: adding NOT NULL column without default (locks table on MySQL 5.x)
-- SAFE alternative: 3-step
-- Step 1: add nullable
ALTER TABLE employee ADD COLUMN cost_center VARCHAR(50) NULL;
-- Step 2: backfill
UPDATE employee SET cost_center = 'DEFAULT' WHERE cost_center IS NULL;
-- Step 3: add constraint
ALTER TABLE employee MODIFY cost_center VARCHAR(50) NOT NULL DEFAULT 'DEFAULT';
```

**Never** rename a column while the old code is live — add the new column, dual-write, then remove the old one.

---

## 8. Data Retention

| Data Type | Retention | Action After |
|---|---|---|
| Active employee records | Indefinite | — |
| Terminated employee PII | 2 years post-termination | GDPR anonymize |
| Payroll history | 7 years | Archive to cold storage |
| Audit logs | 7 years | Archive, read-only |
| Session/token data | 90 days | Auto-purge |

## References

- `com.hrservice.hr.model.Employee`
- `com.hrservice.hr.model.AuditableEntity`
- Hibernate 6 — `@MappedSuperclass`, `@EntityGraph`
- Flyway migrations: `hr-service/src/main/resources/db/migration/`
