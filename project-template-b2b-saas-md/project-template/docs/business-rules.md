# 📋 Business Rules — HR Microservices

> ⚠️ CRITICAL: These rules override all technical choices. Never circumvent them.

---

## Payroll Accuracy & Compliance

### BR-P1 — Tax Calculation Accuracy
All tax calculations must be precise to the penny (2 decimal places, no rounding errors).
- Use **BigDecimal** arithmetic throughout (never float/double)
- Progressive tax brackets must match current year and country regulations
- Audit log every calculation with: gross salary, applicable brackets, tax rate, deduction amount
- **No approximations**: 3000000 × 0.1 = 300000.00 exactly, not 299999.99

Implementation:
```java
// ✅ Correct
BigDecimal gross = new BigDecimal("3000000.00");
BigDecimal taxRate = new BigDecimal("0.10");
BigDecimal tax = gross.multiply(taxRate).setScale(2, RoundingMode.HALF_UP);

// ❌ Wrong
double tax = 3000000.0 * 0.1;  // May result in 299999.9999999999
```

### BR-P2 — Progressive Tax Brackets
Tax brackets are **progressive** (cumulative, not marginal only).
- Each bracket applies only to income within its range
- Example: Vietnam 2026
  - 0-5M VND @ 10% = 500,000
  - 5M-10M VND @ 15% = 750,000
  - 10M+ VND @ 20%
  - Employee with 12M salary: Tax = 500k + 750k + (2M × 20%) = 1,650,000

### BR-P3 — Deduction Types & Rules
Multiple deduction types, each with specific rules:
| Type | Category | % or Fixed | Mandatory? | Example |
|------|----------|-----------|-----------|---------|
| Tax withholding | MANDATORY | % | Yes | 10-20% (varies by bracket) |
| Social Insurance | MANDATORY | % | Yes | 8% (employee contribution) |
| Health Insurance | MANDATORY | % | Yes | 1.5% |
| Retirement (401K) | VOLUNTARY | % or Fixed | No | 0-6% (employee choice) |
| Union Dues | VOLUNTARY | Fixed | No | 50,000 VND/month |

- Mandatory deductions cannot be declined
- Voluntary deductions require employee explicit consent (audit trail)
- Deductions are **time-bound**: can start/end on specific dates (e.g., maternity leave deduction from 2026-06-01 to 2026-08-31)
- **No stacking errors**: Same deduction cannot be applied twice

### BR-P4 — Compliance Validation
Before payroll is marked APPROVED, system must validate:
- ✅ Gross salary > 0
- ✅ Tax deduction >= 0 and <= 40% of gross (warn if > 40%)
- ✅ Total deductions < gross (net pay must be > 0)
- ✅ Net pay cannot exceed gross (logical check)
- ✅ All deduction types are current year (not expired)

If any validation fails → payroll status stays DRAFT, error message to PAYROLL_OFFICER

### BR-P5 — Payroll Status Workflow (Immutable State Machine)
```
DRAFT ──[approve]──> APPROVED ──[process]──> PROCESSED
  ↓                                              ↓
  └─ Cannot be edited after approval        Immutable forever
  └─ Can be rejected → DRAFT again           No undo possible
```

- **DRAFT**: Initial state, can edit (recalculate if needed)
- **APPROVED**: Peer-reviewed, no edits allowed, can reject to DRAFT
- **PROCESSED**: Final state, immutable, triggers downstream events (accounting, tax, payment)
- History of all state changes recorded in `payroll_history` table (append-only)

### BR-P6 — Payroll Corrections
If payroll was PROCESSED and error found (e.g., wrong salary input):
1. Cannot edit original PROCESSED payroll
2. Must create **correction payroll** (new PayrollResult) with:
   - Reference to original payroll ID
   - Difference amounts (negative values for corrections)
   - Reason field (e.g., "Correction: Salary entered as 3000000 instead of 2500000")
3. Correction follows same DRAFT → APPROVED → PROCESSED workflow
4. Immutable audit trail: original + correction visible together

### BR-P7 — Payroll Export for Tax Filing
Annual tax reconciliation export must include:
- Employee name, ID, tax registration number
- Gross salary (yearly total)
- Tax withheld (yearly total)
- Deductions by type (social insurance, health insurance, etc.)
- Net pay (yearly total)
- Format: CSV or PDF (government-compliant format)
- Signature: Digital signature from PAYROLL_OFFICER (audit trail)

---

## Employee Lifecycle & Data Integrity

### BR-E1 — Employee Hire Workflow
When employee hired (HR_MANAGER: POST /api/nhan-vien):
1. Link to auth user (authUserId must exist in auth service)
2. Set status to ACTIVE
3. Set hireDate (cannot be future date)
4. Create initial payroll record (status: DRAFT, ready for approval)
5. Publish RabbitMQ event: `employee.hired` with employee details
6. Downstream consumers:
   - Payroll: Set up default deductions (tax brackets for hire date)
   - Benefits: Calculate eligibility (tenure, job level)
   - Audit: Log "Employee hired by HR_MANAGER@company on YYYY-MM-DD"

### BR-E2 — Employee Transfer (Department/Salary Change)
When employee transferred (HR_MANAGER: PUT /api/nhan-vien/{id}/transfer):
1. Update department (if changed)
2. Update salary (if changed) → creates new payroll record for next period
3. Transfer date must be >= today (can plan future transfers)
4. If transfer retroactive (past date): manager approval required + audit flag
5. Publish RabbitMQ event: `employee.transferred` with old/new department, old/new salary
6. Downstream:
   - Payroll: Recalculate based on new salary (proportional for current period if mid-month)
   - Org Structure: Update reporting line if department changed
   - Audit: Log transfer with who, when, old→new details

### BR-E3 — Employee Offboarding
When employee offboarded (HR_MANAGER: PUT /api/nhan-vien/{id}/offboard):
1. Set status to INACTIVE
2. Set offboardDate (cannot be future date)
3. Calculate **final payroll** (salary * days_worked / days_in_month for current period)
4. Mark all deductions as ENDED (effective offboardDate)
5. Revoke JWT tokens (add to Redis blacklist)
6. Disable API access (any requests with employee's auth token → 401 Unauthorized)
7. Publish RabbitMQ event: `employee.offboarded` with final payroll details
8. Downstream:
   - Finance: Trigger final payment + tax settlement
   - Audit: Log offboard date, final salary, benefits ended, access revoked

### BR-E4 — Employee Data Confidentiality
Employee salary and tax data are **strictly confidential**:
- **HR_MANAGER** sees only department salary data (not individual employees' salaries)
- **PAYROLL_OFFICER** sees all salary data (required for payroll processing)
- **EMPLOYEE** sees only own salary (payroll stub)
- **ADMIN** sees all data
- Cross-employee salary queries forbidden (no "List all employees with salary > X" for HR_MANAGER)
- Violations logged as security events

### BR-E5 — Data Retention After Offboarding
After employee offboarded:
- Employee record: Soft delete (marked INACTIVE, not removed)
- Payroll history: Retained for **7 years** (tax compliance)
- Personal data: Can be anonymized after **3 years** (GDPR-like protection)
- Access revoked: Immediately on offboardDate

---

## Tax & Compliance

### BR-C1 — Tax Bracket Versioning
Tax brackets change yearly, sometimes mid-year:
- Store all tax_configs with year + country + effective date
- Only ONE tax bracket set is ACTIVE for a given year/country at a time
- Before applying new tax brackets:
  1. Create new TaxConfig (year=2027, country=VN, brackets=[...])
  2. Set isActive=true
  3. Old config automatically becomes isActive=false
  4. No payroll calculations should fail due to missing brackets
- Audit: Log who changed tax brackets, effective date, old→new rates

### BR-C2 — Withholding Accuracy
Tax withholding must match government requirements:
- Progressive brackets correctly applied
- Deductions applied in correct order (mandatory first, voluntary second)
- Withholding reconciliation: Sum of all withholdings = expected tax for period
- Annual reconciliation: Total yearly withholding vs. actual tax liability
  - If overpaid: Refund to employee
  - If underpaid: Additional withholding in final payroll

### BR-C3 — Audit Log Retention
All payroll-related actions must be logged immutably:
- Payroll calculations (who calculated, when, gross amount)
- Approvals (who approved, when, timestamp)
- Processing (who processed, when, makes it irreversible)
- Corrections (original + correction linked, reasons documented)
- Tax bracket changes (effective date, old rates, new rates)
- Retention: **7 years** (matching tax authority requirements)

### BR-C4 — Regulatory Compliance
System must support multi-country payroll (future):
- Tax brackets by country (Vietnam, Thailand, Singapore, etc.)
- Different deduction rules by country (mandatory rates vary)
- Export formats compliant with local tax agencies
- Holiday/special day handling (varies by country)
- Currency handling (VND, THB, SGD with exchange rates)

---

## Access Control & Separation of Duties

### BR-SEC1 — RBAC Matrix
```
Action                          | ADMIN | HR_MANAGER | PAYROLL_OFFICER | EMPLOYEE
View all employees              | ✅    | ✅ (dept)  | ❌              | ❌
View employee salary            | ✅    | ✅ (dept)  | ✅              | ❌ (own only)
Hire/Transfer/Offboard          | ✅    | ✅         | ❌              | ❌
View draft payroll              | ✅    | ✅         | ✅              | ❌
APPROVE payroll (DRAFT→APPROVED) | ✅    | ❌         | ✅              | ❌
PROCESS payroll (APPROVED→...)  | ✅    | ❌         | ✅              | ❌
Configure tax brackets          | ✅    | ❌         | ❌              | ❌
View audit logs                 | ✅    | ✅ (dept)  | ✅ (payroll)    | ❌
Export tax report               | ✅    | ❌         | ✅              | ❌
```

### BR-SEC2 — Separation of Duties (Payroll)
No single person should control entire payroll process:
1. **Preparer** (HR_MANAGER): Input salary changes, creates DRAFT payroll
2. **Approver** (PAYROLL_OFFICER, different person): Reviews calculations, approves
3. **Processor** (PAYROLL_OFFICER, same or different): Final processing, payment trigger
- System should encourage (not enforce) different people for steps 1-2, and ideally 2-3
- Audit log explicitly shows: "Prepared by alice@company, Approved by bob@company, Processed by bob@company"

### BR-SEC3 — Password & Session Security
- **Password**: BCrypt with 12+ rounds, minimum 12 characters
- **Session Expiry**: 
  - Access token: 15 minutes (short-lived)
  - Refresh token: 7 days (regenerated on use)
  - Timeout on inactive: 30 minutes → automatic logout
- **2FA**: TOTP (Google Authenticator), required for ADMIN and PAYROLL_OFFICER
- **Token Revocation**: JWT revoked on:
  - Password change
  - Role change
  - Account deactivation
  - Manual logout

### BR-SEC4 — Data Encryption
- Tax data at rest: AES-256 (keys from KMS, never persisted locally)
- Transport: TLS 1.3 minimum
- Backup: Encrypted with separate key (KMS)
- Database: Per-database encryption (PostgreSQL, MySQL native encryption)

---

## Event-Driven & Asynchronous Processing

### BR-EV1 — RabbitMQ Event Reliability
Events must be processed **exactly once** (idempotent consumers):
- Each event has unique eventId (UUID)
- Consumers check if event already processed (using eventId as key)
- If duplicate: Return success (already done)
- Failed events: Retry 3 times, then move to Dead Letter Queue (DLQ)
- DLQ monitored: Alert if > 10 messages in DLQ

### BR-EV2 — Event Publishing Guarantees
When employee hired, payroll created, etc.:
- System must **guarantee** event reaches RabbitMQ
- If RabbitMQ down: Retry with exponential backoff (1s, 2s, 4s, max 30s)
- If permanently down: Create local event queue (fallback file), replay on recovery
- No silent failures: Logs and alerts if event not published

### BR-EV3 — Event Order Guarantee
Employee lifecycle events must be ordered:
- `employee.hired` must be published before `payroll.created`
- `employee.transferred` must be published before `payroll.salary_changed`
- Within same event stream (e.g., payroll events), ordering must be preserved
- RabbitMQ: Use single queue per event type (no parallel processing that breaks order)

---

## Performance & Scalability

### BR-PERF1 — Payroll Calculation SLA
- < 100ms per employee (with BigDecimal, tax bracket lookup)
- Batch calculation (1000 employees): < 120s (allows for parallel processing)
- API response time (p95): < 200ms
- Cache hit ratio target: 80-90% for recurring queries

### BR-PERF2 — Cache Invalidation
Caches must be invalidated when:
- Salary changed → Invalidate `employee:{id}:payroll:*`
- Tax bracket updated → Invalidate `tax_brackets:*`
- Deductions assigned → Invalidate `benefits:eligibility:{empId}`
- On RabbitMQ events: Async cache eviction (no blocking main request)

---

## Disaster Recovery & Backups

### BR-DR1 — Backup Requirements
- **Frequency**: Daily incremental, weekly full
- **Retention**: 1 year
- **Encryption**: Separate key from production (KMS)
- **Testing**: Monthly restore test (verify integrity)
- **RTO**: < 1 hour (Recovery Time Objective)
- **RPO**: < 15 minutes (Recovery Point Objective, max data loss)

### BR-DR2 — Audit Log Immutability
Audit logs must be:
- **WORM** (Write-Once-Read-Many): Cannot be edited or deleted
- **Backed up separately**: Different storage from main DB (prevent simultaneous loss)
- **Digitally signed**: Each entry signed (detect tampering)
- **Retention**: 7 years minimum

---

## Glossary

| Term | Definition |
|------|-----------|
| **BigDecimal** | Java numeric type for exact decimal arithmetic (no floating-point errors) |
| **Progressive Tax** | Tax brackets applied cumulatively (not just highest rate) |
| **Idempotent** | Operation can be executed multiple times safely (same result) |
| **WORM** | Write-Once-Read-Many storage (immutable ledger) |
| **DLQ** | Dead Letter Queue (destination for failed event consumers) |
| **Withholding** | Tax deducted from employee salary at source |
| **Reconciliation** | Matching payroll vs. actual tax liability |
| **Soft Delete** | Mark as INACTIVE (not removed from DB) |
| **Bearer Token** | JWT token sent in Authorization header |
