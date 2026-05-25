# Task Execution DAG — HR Microservices M06-M10

## Dependency Graph

```
DEDUCTION-001 (Config Tax/Deductions)
    ↓
EMPLOYEE-001 (Hire Workflow)
    ↓
PAYROLL-001 (Calculate Payroll)
    ↓
PAYROLL-002 (Approval Workflow)
    ↓
COMPLIANCE-001 (Tax Report)
```

## Execution Order (Critical Path)

### Phase 1 — Foundation (M09, Parallel Capable)
| Task | Agent(s) | Duration | Priority |
|------|----------|----------|----------|
| **DEDUCTION-001** | database-expert, spring-reviewer | 4h | 🔴 P0 |
| **EMPLOYEE-001** | hr-domain-expert, database-expert | 3h | 🔴 P0 |

**Wait for:** Both completed (no dependencies)

### Phase 2 — Core Payroll (M09-M10)
| Task | Agent(s) | Duration | Priority |
|------|----------|----------|----------|
| **PAYROLL-001** | hr-domain-expert, spring-reviewer | 6h | 🔴 P0 |

**Depends on:** DEDUCTION-001, EMPLOYEE-001  
**Blocker:** Tax brackets configured, employee entities ready

### Phase 3 — Workflow (M10)
| Task | Agent(s) | Duration | Priority |
|------|----------|----------|----------|
| **PAYROLL-002** | hr-domain-expert, spring-reviewer | 4h | 🔴 P0 |

**Depends on:** PAYROLL-001  
**Blocker:** Payroll calculation endpoint working

### Phase 4 — Compliance (M12-M13)
| Task | Agent(s) | Duration | Priority |
|------|----------|----------|----------|
| **COMPLIANCE-001** | database-expert, spring-reviewer | 3h | 🟠 P1 |

**Depends on:** PAYROLL-002  
**Blocker:** Payroll processing complete + immutable audit trail

---

## Agent Assignments

### **hr-domain-expert**
**Role:** Business logic + HR domain knowledge  
**Skills:** payroll-patterns, employee-lifecycle, compliance-audit  
**Tasks:** PAYROLL-001, PAYROLL-002, EMPLOYEE-001, COMPLIANCE-001

**Responsibilities:**
- Implement service layer (PayrollService, EmployeeService)
- Ensure BR-P* rules applied (tax accuracy, deduction logic)
- Ensure BR-E* rules applied (employee workflow)
- RabbitMQ event design
- Business validation logic

### **spring-reviewer**
**Role:** Code quality + Spring Boot patterns  
**Skills:** springboot-patterns  
**Tasks:** PAYROLL-001, PAYROLL-002, EMPLOYEE-001, COMPLIANCE-001, DEDUCTION-001

**Responsibilities:**
- Review controllers (@RestController, endpoint design)
- Verify dependency injection (constructor > @Autowired)
- Check @Transactional placement
- Security annotations (@PreAuthorize, @Secured)
- DTO/Entity separation
- Exception handling

### **database-expert**
**Role:** Schema + query optimization  
**Skills:** query-optimization, schema-design  
**Tasks:** EMPLOYEE-001, DEDUCTION-001, PAYROLL-001, COMPLIANCE-001

**Responsibilities:**
- Design/verify database schemas
- Index strategy for payroll queries
- Audit log table design (immutable ledger)
- Query optimization (prevent N+1)
- Constraint definition (PK, FK, Unique)

---

## Pre-Execution Checklist

### Agent Setup
- [ ] All agents have CodeGraph access (codegraph_context, codegraph_explore, codegraph_impact)
- [ ] All agents loaded project-template docs (vision.md, architecture.md, business-rules.md)
- [ ] All agents aware of existing codebase (PayrollService, Employee entities, etc.)
- [ ] Agents understand separation of duties:
  - hr-domain-expert leads business logic
  - spring-reviewer leads code quality (blocker for merge)
  - database-expert leads schema (blocker for merge)

### Code Foundation
- [ ] HR Service Maven module ready (src/main/java/com/hrservice/hr/)
- [ ] PayrollService skeleton exists (reference: existing implementation)
- [ ] Employee entity exists (reference: existing implementation)
- [ ] TaxConfig, DeductionType entities exist
- [ ] PayrollResult, PayrollHistory entities exist

### Documentation
- [ ] project-template docs loaded (vision, architecture, business-rules)
- [ ] Task specs loaded (PAYROLL-001.md, etc.)
- [ ] Business rules accessible (BR-P*, BR-E*, BR-C* rules)

---

## Execution Steps (Per Task)

### Task Workflow
1. **Agent receives task spec** (e.g., PAYROLL-001.md)
2. **Load context** (project-template docs + existing codebase)
3. **Analyze** (Run codegraph_context on existing PayrollService)
4. **Design** (Sketch service methods, controller endpoints, DTOs)
5. **Implement** (Write code: service, controller, repository, tests)
6. **Review** (spring-reviewer checks patterns, database-expert checks schema)
7. **Test** (Unit + integration + DB tests)
8. **Merge** (PR to appmod/java-upgrade branch)

### Communication Protocol
- **hr-domain-expert** initiates task
- **spring-reviewer** comments on code quality (PR review)
- **database-expert** comments on schema (PR review)
- **hr-domain-expert** addresses feedback, finalizes

---

## Success Criteria (Per Task)

✅ **Code Quality**
- Spring patterns followed (constructor injection, @Transactional on service)
- No security issues (@PreAuthorize on sensitive endpoints)
- DTOs used for API contracts
- Exception handling (appropriate HTTP status codes)
- Test coverage > 85%

✅ **Business Logic**
- BR-P* rules applied (BigDecimal, progressive tax, deduction order)
- BR-E* rules applied (employee workflow, immutability)
- RabbitMQ events published (payroll.calculated, employee.hired)
- Audit log entries created (immutable)

✅ **Database**
- Schema matches spec (tables, columns, constraints)
- Indexes created (employeeId, status, dates for query optimization)
- Immutable audit tables (append-only)
- Foreign keys enforced

✅ **Testing**
- Unit tests > 90% coverage (PayrollService, EmployeeService)
- Integration tests (controller endpoints, DB queries)
- Business scenario tests (known payroll examples verified)

---

## Expected Timeline

| Phase | Tasks | Est. Time | Start Date | End Date |
|-------|-------|-----------|-----------|----------|
| **P1** | DEDUCTION-001, EMPLOYEE-001 | 7h | 2026-05-25 | 2026-05-26 |
| **P2** | PAYROLL-001 | 6h | 2026-05-26 | 2026-05-27 |
| **P3** | PAYROLL-002 | 4h | 2026-05-27 | 2026-05-27 |
| **P4** | COMPLIANCE-001 | 3h | 2026-05-28 | 2026-05-28 |
| **Buffer** | Fixes + reviews | 5h | 2026-05-28 | 2026-05-29 |
| **Total** | All 5 tasks | **25h** (3 business days) | | |

---

## Risk Mitigation

### If agents get stuck:
1. **Reference existing code**: PayrollService.java already has calculatePayroll() skeleton
2. **Use CodeGraph**: codegraph_context("PayrollService") to understand structure
3. **Trace impact**: codegraph_impact("PayrollService") before changes
4. **Escalate**: If business rule unclear, ask hr-domain-expert for clarification

### If schema conflicts:
1. Run database-expert review **before** implementation
2. Create ER diagram (database-expert prepares schema.md)
3. Review with hr-domain-expert + spring-reviewer

### If test coverage low:
1. spring-reviewer flags in PR
2. hr-domain-expert writes additional tests (business scenarios)
3. database-expert verifies integration test queries

---

## Communication Channels

**Task Assignments:** Post task spec + expected outputs  
**Code Review:** PR comments from spring-reviewer + database-expert  
**Escalations:** hr-domain-expert clarifies business rules  
**Blockers:** Flag in Slack/Discord (e.g., "Waiting on DEDUCTION-001 before starting PAYROLL-001")

---

## Definition of Done (Per Task)

- [ ] Code implemented (service, controller, repository, DTOs)
- [ ] Tests written (unit, integration, scenario-based)
- [ ] Spring patterns verified (no @Autowired, @Transactional on service only)
- [ ] Database schema reviewed (indexes, constraints, immutability)
- [ ] Business rules checked (BR-* rules applied, RabbitMQ events)
- [ ] PR submitted + reviews passed
- [ ] Merged to appmod/java-upgrade branch
- [ ] Build passes (mvn clean package)
- [ ] Smoke test passes (gradle test)

---

## Rollback Plan

If task implementation fails:
1. Revert PR (git revert commit)
2. Post-mortem (what went wrong?)
3. Update task spec if unclear
4. Reassign to same agent with clarifications
5. Retry

---

## Next Phase Planning

After all 5 tasks complete:
- Run full integration test suite
- Smoke test payroll flow (hire → calculate → approve → process)
- Load test (1000 employees, parallel payroll calculation)
- Security audit (RBAC, encryption, audit logging)
- Plan Phase 2 (remaining 7 tasks: EMPLOYEE-002/003, BENEFITS, etc.)
