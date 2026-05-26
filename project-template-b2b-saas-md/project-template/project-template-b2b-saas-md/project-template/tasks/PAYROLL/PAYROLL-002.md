# 📌 PAYROLL-002 — Implement Payroll Approval Workflow

**Module** : hr-service  
**Assigned to** : Backend Agent  
**Priority** : 🔴 Critical  
**Status** : [ ] To do  
**Depends on** : PAYROLL-001

---

## Context

Payroll is only finalized after **peer review** (PAYROLL_OFFICER approval). This task implements the approval workflow: DRAFT → APPROVED → PROCESSED. Once approved, payroll becomes immutable (audit requirement BR-P6).

**Context Packs to load**:
- `docs/business-rules.md` (BR-P5, BR-P6: Workflow & Corrections)
- `docs/architecture.md` (Workflow 2: Payroll Cycle, Phase 2-3)

---

## Specification

### Endpoint 1 — Approve Payroll
```
PUT /api/chi-tra/{payrollId}/phe-duyet

Request:
- payrollId: BIGINT (path param)
- Authorization: Bearer {JWT}
- X-Auth-Role: PAYROLL_OFFICER or ADMIN
- Body: {} (empty, approval context in audit trail)

Response 200:
{
  "payrollId": 12345,
  "status": "APPROVED",
  "approvedBy": "payroll_officer@company.com",
  "approvedAt": "2026-05-25T11:00:00Z",
  "message": "Payroll approved. Cannot be edited. Ready for processing."
}

Errors:
404 — Payroll not found
409 — Payroll not in DRAFT status (already approved/processed)
403 — Insufficient permission (not PAYROLL_OFFICER/ADMIN)
```

### Endpoint 2 — Reject Payroll (Back to DRAFT)
```
PUT /api/chi-tra/{payrollId}/tu-choi

Request:
- payrollId: BIGINT
- reason: STRING (mandatory, max 500 chars, e.g., "Incorrect salary for engineer team")
- Authorization: Bearer {JWT}

Response 200:
{
  "payrollId": 12345,
  "status": "DRAFT",
  "rejectedBy": "payroll_officer@company.com",
  "rejectedAt": "2026-05-25T11:00:00Z",
  "reason": "Incorrect salary for engineer team",
  "message": "Payroll returned to DRAFT status. Recalculate if needed."
}

Errors:
404 — Payroll not found
409 — Payroll not in APPROVED status
403 — Insufficient permission
```

### Endpoint 3 — Process Payroll (APPROVED → PROCESSED)
```
PUT /api/chi-tra/{payrollId}/xu-ly

Request:
- payrollId: BIGINT
- Authorization: Bearer {JWT}
- X-Auth-Role: PAYROLL_OFFICER or ADMIN

Response 200:
{
  "payrollId": 12345,
  "status": "PROCESSED",
  "processedBy": "payroll_officer@company.com",
  "processedAt": "2026-05-25T15:00:00Z",
  "message": "Payroll finalized. Immutable. Event published to downstream systems."
}

Errors:
404 — Payroll not found
409 — Payroll not in APPROVED status (must approve before processing)
403 — Insufficient permission
```

---

## Business Rules Applicable

- **BR-P5**: Immutable state machine (DRAFT → APPROVED → PROCESSED)
- **BR-P6**: Corrections require new payroll records (cannot edit PROCESSED)
- **BR-SEC2**: Separation of duties (PAYROLL_OFFICER both approves + processes is OK for now)

---

## Implementation Checklist

### 📖 Analysis
- [ ] Review PayrollResult status enum (DRAFT, APPROVED, PROCESSED, REJECTED)
- [ ] Review payroll_history table (append-only audit trail)
- [ ] Understand immutability requirement (once APPROVED, no edits)

### ⚙️ Backend — Services
- [ ] Implement `PayrollService.approvePayroll(payrollId, approverEmail)`:
  - Fetch payroll, verify status == DRAFT
  - Validate all BR-P4 checks pass (tax < 40%, net > 0, etc.)
  - Update status to APPROVED, set approvedBy + approvedAt
  - Create audit log entry (action: APPROVED)
  - Return updated payroll
  - Throw exception if not DRAFT (409 Conflict)

- [ ] Implement `PayrollService.rejectPayroll(payrollId, reason, rejectorEmail)`:
  - Fetch payroll, verify status == APPROVED
  - Update status back to DRAFT
  - Store rejection reason in payroll_history
  - Create audit log entry (action: REJECTED, reason included)
  - Return updated payroll

- [ ] Implement `PayrollService.processPayroll(payrollId, processorEmail)`:
  - Fetch payroll, verify status == APPROVED
  - Update status to PROCESSED (final state)
  - Set processedBy + processedAt
  - Publish RabbitMQ event: `payroll.processed`
  - Create immutable audit log entry (action: PROCESSED)
  - Return processed payroll
  - **Mark immutable**: Future attempts to edit throw exception

### ⚙️ Backend — Controller
- [ ] Implement `PayrollController.approvePayroll(payrollId)`:
  - Validate authorization (PAYROLL_OFFICER or ADMIN)
  - Extract email from JWT claims
  - Call service, catch exceptions (409 → Conflict, 404 → Not Found)
  - Return 200

- [ ] Implement `PayrollController.rejectPayroll(payrollId, reason)`:
  - Validate reason field (not empty, max 500 chars)
  - Call service
  - Return 200

- [ ] Implement `PayrollController.processPayroll(payrollId)`:
  - Validate authorization
  - Call service (publishes RabbitMQ event)
  - Return 200

### 🗄️ Database
- [ ] Verify `payroll_results` table has:
  - status column (DRAFT, APPROVED, PROCESSED enum)
  - approvedBy, approvedAt, processedBy, processedAt columns (nullable, set on state change)
- [ ] Verify `payroll_history` table captures all transitions:
  - INSERT new row on every state change (append-only)
  - Columns: payrollId, action (CREATED, APPROVED, REJECTED, PROCESSED), actionBy, actionAt, details (reason if rejected)

### ❌ Validation
- [ ] Validate payroll exists (404 if not)
- [ ] Validate status transition allowed (409 if invalid state)
- [ ] Validate permission (403 if not PAYROLL_OFFICER/ADMIN)
- [ ] Validate rejection reason provided (if rejecting)
- [ ] Validate immutability: After PROCESSED, any edit attempt → 409 Conflict

### 📨 RabbitMQ Events
- [ ] Publish `payroll.approved` on approval:
  ```json
  {
    "eventId": "uuid",
    "eventType": "payroll.approved",
    "payrollId": 12345,
    "approvedBy": "payroll_officer@company.com",
    "approvedAt": "2026-05-25T11:00:00Z"
  }
  ```

- [ ] Publish `payroll.processed` on processing (main event):
  ```json
  {
    "eventId": "uuid",
    "eventType": "payroll.processed",
    "payrollId": 12345,
    "employeeId": 1,
    "grossPay": 3000000.00,
    "netPay": 2415000.00,
    "processedBy": "payroll_officer@company.com",
    "processedAt": "2026-05-25T15:00:00Z"
  }
  ```

### 📋 Audit Logging
- [ ] Log approval: payroll_history (action: APPROVED, actionBy, actionAt)
- [ ] Log rejection: payroll_history (action: REJECTED, reason included)
- [ ] Log processing: payroll_history (action: PROCESSED, final state, immutable marker)
- [ ] All entries immutable (INSERT only, no UPDATE/DELETE)

### 🧪 Tests
- [ ] **Unit Test**: `PayrollWorkflowTest`
  - Test DRAFT → APPROVED (verify status changes)
  - Test APPROVED → REJECTED (verify back to DRAFT)
  - Test APPROVED → PROCESSED (verify immutable)
  - Test invalid transitions (DRAFT → PROCESSED should fail, must approve first)
  - Test permission checks (HR_MANAGER cannot approve)
  - Test idempotency (approving twice = error, not double approval)

- [ ] **Integration Test**: `PayrollWorkflowControllerTest`
  - Test PUT /api/chi-tra/{id}/phe-duyet → status changes to APPROVED
  - Test PUT /api/chi-tra/{id}/tu-choi → status back to DRAFT with reason
  - Test PUT /api/chi-tra/{id}/xu-ly → status PROCESSED, event published
  - Test immutability: After processing, any edit → 409

- [ ] **Audit Test**: `PayrollAuditTrailTest`
  - Verify payroll_history records all transitions
  - Verify audit trail is immutable (no UPDATE/DELETE)
  - Verify reason stored on rejection

### ✅ Acceptance Criteria
- [ ] Approval workflow responses in < 200ms
- [ ] Status transitions correctly (DRAFT → APPROVED → PROCESSED)
- [ ] Immutability enforced (cannot edit PROCESSED payroll)
- [ ] RabbitMQ events published (verified in tests)
- [ ] Audit trail complete (all transitions logged)
- [ ] Permission checks enforced (non-PAYROLL_OFFICER cannot approve)
- [ ] All tests pass

---

## Success Metrics
- Approval response time: < 200ms
- Audit trail completeness: 100% of state changes logged
- Immutability: 0 edits to PROCESSED payroll (enforced in code)
- Event publishing: 100% of processed payroll → event published
