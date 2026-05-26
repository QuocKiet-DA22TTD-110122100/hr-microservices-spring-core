# 📌 EMPLOYEE-001 — Implement Employee Hire Workflow

**Module** : hr-service  
**Assigned to** : Backend Agent  
**Priority** : 🔴 Critical  
**Status** : [ ] To do  
**Depends on** : AUTH-001

---

## Context

Employee hiring is the **first step of lifecycle**. When hired, system links auth user to employee, publishes event, and initializes payroll/benefits. This triggers downstream setup (payroll defaults, benefits eligibility).

---

## Specification

### Endpoint — Create (Hire) Employee
```
POST /api/nhan-vien

Request:
{
  "authUserId": "uuid-123",
  "name": "Nguyen Van A",
  "position": "Senior Engineer",
  "baseSalary": 3000000,
  "hireDate": "2026-06-01",
  "departmentId": 1,
  "currencyCode": "VND"
}

Response 201:
{
  "id": 1,
  "authUserId": "uuid-123",
  "name": "Nguyen Van A",
  "position": "Senior Engineer",
  "baseSalary": 3000000,
  "hireDate": "2026-06-01",
  "departmentId": 1,
  "status": "ACTIVE",
  "createdAt": "2026-05-25T10:30:00Z"
}

Errors:
400 — authUserId doesn't exist (invalid auth user)
400 — hireDate in future
409 — authUserId already linked to another employee
```

---

## Implementation Checklist

### ⚙️ Backend
- [ ] Create `Employee` entity with: authUserId, name, position, baseSalary, hireDate, departmentId, status (ACTIVE/INACTIVE), createdAt
- [ ] Implement `EmployeeController.createEmployee(request)`:
  - Validate auth user exists (call auth-service)
  - Validate authUserId not already linked
  - Save employee (status: ACTIVE)
  - Publish RabbitMQ event: `employee.hired`
  - Return 201

- [ ] Publish RabbitMQ event with all employee details (triggers payroll, benefits, audit consumers)

### 📨 RabbitMQ Events
- [ ] `employee.hired` event (exchange: `hr_service.employee`, routing key: `hired`)
  - Payload: id, authUserId, name, position, baseSalary, hireDate, departmentId

### 🧪 Tests
- [ ] Create employee → HTTP 201, event published
- [ ] Duplicate authUserId → HTTP 409
- [ ] Invalid auth user → HTTP 400

### ✅ Acceptance Criteria
- [ ] Employee created in DB
- [ ] RabbitMQ event published within 2s
- [ ] Downstream consumers can process hire event
- [ ] All tests pass
