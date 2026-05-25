# 🏗 HR Microservices Architecture

> Read after `vision.md`. Technical reference for all architects and developers.

---

## System Overview

```
┌──────────────────────────────────────────────────────────────────┐
│ Client Applications (Web, Mobile, Admin Portal)                  │
└─────────────────────────────┬──────────────────────────────────┘
                              │ HTTPS (TLS 1.3)
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ Spring Cloud API Gateway (localhost:8080)                        │
│ ├─ Request routing to backend services                           │
│ ├─ JWT authentication + validation                              │
│ ├─ Rate limiting (1000 req/min per user)                        │
│ └─ Request/response logging for audit                           │
└────────┬───────────────────────────────────────────────┬────────┘
         │                                               │
         ▼                                               ▼
┌──────────────────────────────┐        ┌───────────────────────────┐
│ Public Endpoints             │        │ Protected Endpoints        │
│ ├─ /api/xac-thuc/dang-nhap  │        │ ├─ /api/nhan-vien/*       │
│ ├─ /api/xac-thuc/refresh    │        │ ├─ /api/chi-tra/*         │
│ └─ /.well-known/jwks.json   │        │ ├─ /api/phuc-loi/*        │
└──────────────────────────────┘        │ └─ /api/khau-tru/*        │
                                        └───────────────────────────┘
         │                                               │
         └───────────────────────┬─────────────────────┘
                                 │
                 ┌───────────────┼───────────────┐
                 │               │               │
                 ▼               ▼               ▼
    ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
    │ Auth Service     │ │ HR Service       │ │ Task Service     │
    │ (8086)          │ │ (8082)           │ │ (8083)           │
    │ ├─ OAuth2       │ │ ├─ Employees     │ │ ├─ Tasks CRUD    │
    │ ├─ OIDC + 2FA   │ │ ├─ Payroll       │ │ ├─ Assignments   │
    │ ├─ JWT tokens   │ │ ├─ Deductions    │ │ └─ Status filter │
    │ └─ KMS JWKS     │ │ ├─ Benefits      │ │                  │
    └──────────────────┘ │ └─ Org units     │ └──────────────────┘
         │ PG DB         │ MySQL DB         │
         │               └──────────────────┘     │
         │                                        │
         │ ┌────────────────────────────────────┬┘
         │ │                                    │
         │ ▼                                    ▼
         │ ┌──────────────────┐      ┌──────────────────┐
         │ │ Project Service  │      │ KMS Service      │
         │ │ (8084)          │      │ (9000)           │
         │ ├─ Projects CRUD  │      │ ├─ Key generation│
         │ ├─ Allocations    │      │ ├─ JWT signing   │
         │ └─ Status filter  │      │ └─ JWKS endpoint │
         │ MySQL DB         │      │ (Stateless)      │
         └──────────────────┘      └──────────────────┘
                 │
                 └──────────────────────────┐
                                            │
                              ┌─────────────┴──────────────┐
                              │                            │
                              ▼                            ▼
                    ┌───────────────────┐      ┌────────────────────┐
                    │ Service Discovery │      │ Message Bus        │
                    │ (Eureka, 8761)   │      │ (RabbitMQ, 5672)   │
                    │                  │      │ ├─ employee.events │
                    │ Service registry │      │ ├─ payroll.events  │
                    │ Health checks    │      │ ├─ deduction.*     │
                    │ Load balancing   │      │ └─ DLQ (failures)  │
                    └───────────────────┘      └────────────────────┘
                              │                            │
                              └────────────┬───────────────┘
                                          │
                       ┌──────────────────┼──────────────────┐
                       │                  │                  │
                       ▼                  ▼                  ▼
            ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
            │ Caching Layer    │ │ Monitoring       │ │ Data Persistence │
            │ (Redis 6379)     │ │ (Prometheus,     │ │ (MySQL, PG)      │
            │ ├─ JWT blacklist │ │ Grafana, Jaeger) │ │ ├─ auth_db       │
            │ ├─ Query cache   │ │ ├─ Metrics       │ │ ├─ hr_db         │
            │ │ (15min TTL)    │ │ ├─ Dashboards    │ │ ├─ task_db       │
            │ └─ Session store │ │ └─ Tracing       │ │ └─ project_db    │
            └──────────────────┘ └──────────────────┘ └──────────────────┘
```

---

## Communication Patterns

### REST (Synchronous)
- **Usage**: Real-time responses, immediate validation
- **Authentication**: Bearer JWT (verified at API Gateway)
- **Format**: JSON, ISO8601 dates, BigDecimal for currency (2 decimals)
- **Timeout**: 5s maximum per inter-service call
- **Rate Limiting**: 
  - Login/2FA endpoints: 5 requests/min per IP
  - Payroll endpoints: 100 requests/min per user
  - Default: 1000 requests/min per user

### RabbitMQ (Asynchronous)
- **Usage**: Business events, employee lifecycle, payroll events
- **Exchange Pattern**:
  - **Direct**: `employee.hired`, `employee.offboarded` (1:1 routing)
  - **Topic**: `payroll.status.*`, `deduction.assigned.*` (pattern matching)
- **Topics Named**: `{service}.{entity}.{action}` (e.g., `hr_service.employee.hired`)
- **Dead Letter Queue**: Enabled on all exchanges (max retries: 3)
- **Message Format**: JSON with eventId (UUID), timestamp, payload
- **Event Replay**: Idempotent consumers (safe to reprocess same event)

---

## Role-Based Access Control (RBAC)

### Enforcement Points
| Layer | Implementation |
|-------|-----------------|
| **API Gateway** | `X-Auth-Role` header validation (from JWT claims) |
| **Service Level** | `@RequiresPermission` annotation + SecurityValidator |
| **Database** | Employee data isolation (SQL WHERE clauses at service layer) |

### Role Definitions
```
ADMIN
  ├─ Can manage all employees
  ├─ Can approve and process payroll
  ├─ Can configure tax brackets and deductions
  └─ Can view audit logs for all operations

HR_MANAGER
  ├─ Can hire/transfer/offboard employees (own department)
  ├─ Can view employees in department
  ├─ Can view payroll (department only)
  └─ Can view audit logs (department only)

PAYROLL_OFFICER
  ├─ Can view all employees (for payroll purposes)
  ├─ Can calculate payroll
  ├─ Can approve payroll (DRAFT → APPROVED)
  ├─ Can process payroll (APPROVED → PROCESSED)
  ├─ Can export tax reconciliation reports
  └─ Can view audit logs (payroll only)

EMPLOYEE
  ├─ Can view own payroll stubs
  ├─ Can view own benefits enrollment
  ├─ Can update own password
  └─ Cannot access any HR management functions
```

### Separation of Duties (Payroll Workflow)
```
Step 1: HR_MANAGER prepares payroll
  └─ Input employee data, salary changes, deductions
  
Step 2: PAYROLL_OFFICER approves (peer review)
  └─ Reviews calculations, validates tax accuracy
  └─ Status: DRAFT → APPROVED
  └─ No further edits allowed after approval
  
Step 3: PAYROLL_OFFICER processes (final commit)
  └─ Irreversible state change
  └─ Status: APPROVED → PROCESSED
  └─ RabbitMQ event: payroll.processed
  └─ Triggers downstream: accounting, tax reporting
```

---

## Data Flow Examples

### Example 1: Employee Hire Workflow
```
1. HR_MANAGER: POST /api/nhan-vien
   {
     "authUserId": "uuid-123",
     "name": "Nguyen Van A",
     "position": "Engineer",
     "baseSalary": 3000000,
     "departmentId": "dept-001",
     "hireDate": "2026-06-01"
   }

2. HR Service:
   ├─ Create Employee entity
   ├─ Link to auth user (authUserId)
   ├─ Publish RabbitMQ event: employee.hired
   └─ Return HTTP 201

3. RabbitMQ Consumers:
   ├─ Payroll Consumer
   │  └─ Create initial PayrollResult (status: DRAFT)
   │  └─ Set default deductions (tax bracket, insurance)
   │
   ├─ Benefits Consumer
   │  └─ Calculate benefits eligibility
   │  └─ Create benefit plans enrollment
   │
   └─ Audit Consumer
      └─ Log: "Employee hired by HR_MANAGER on 2026-06-01"

4. API Response:
   HTTP 201
   {
     "id": "emp-001",
     "name": "Nguyen Van A",
     "status": "ACTIVE",
     "baseSalary": 3000000,
     "createdAt": "2026-05-25T10:30:00Z"
   }
```

### Example 2: Payroll Calculation → Approval → Processing
```
Phase 1: Calculate (Automatic daily at 9 AM)
  ├─ Fetch all ACTIVE employees
  ├─ For each: calculate gross pay (salary / 12)
  ├─ Apply tax brackets (progressive, year/country specific)
  ├─ Apply deductions (insurance, voluntary, tax-exempt)
  ├─ Calculate net pay = gross - all deductions
  └─ Create PayrollResult (status: DRAFT)

Phase 2: Approve (Manual by PAYROLL_OFFICER)
  ├─ GET /api/chi-tra?status=DRAFT → list all draft payroll
  ├─ Review: gross, tax, deductions, net pay
  ├─ PUT /api/chi-tra/{id}/approve
  ├─ Status: DRAFT → APPROVED
  ├─ Log: "Approved by payroll_officer@company.com at 2026-05-25 11:00"
  └─ Cannot edit after approval

Phase 3: Process (Final by PAYROLL_OFFICER)
  ├─ PUT /api/chi-tra/{id}/process
  ├─ Status: APPROVED → PROCESSED
  ├─ RabbitMQ event: payroll.processed
  │  └─ Payload: { payrollId, employeeId, gross, net, processedAt }
  ├─ Immutable: Cannot undo or edit
  └─ Audit log: "Processed by payroll_officer@company.com"

Phase 4: Downstream (Async consumers)
  ├─ Accounting Service: Create GL entries (salary expense, tax payable)
  ├─ Tax Service: Aggregate for monthly/quarterly tax filing
  └─ Finance: Generate payment instructions to bank
```

### Example 3: Tax Bracket + Deduction Configuration
```
Admin configures tax for year 2026:
  ├─ POST /api/khau-tru/khung-thue
  │  {
  │    "year": 2026,
  │    "country": "VN",
  │    "brackets": [
  │      { "minBracket": 0, "maxBracket": 5000000, "taxRate": 10 },
  │      { "minBracket": 5000000, "maxBracket": 10000000, "taxRate": 15 },
  │      { "minBracket": 10000000, "maxBracket": null, "taxRate": 20 }
  │    ]
  │  }
  │
  ├─ Admin also configures deduction types:
  │  POST /api/khau-tru/loai-khau-tru
  │  {
  │    "name": "Social Insurance",
  │    "category": "INSURANCE",
  │    "isPercentage": true,
  │    "defaultRate": 8.0,
  │    "isMandatory": true
  │  }
  │
  └─ HR_MANAGER assigns to employee:
     POST /api/khau-tru/{employeeId}/phan-cong
     {
       "deductionTypeId": "deduc-001",
       "rate": 8.0,
       "startDate": "2026-06-01",
       "endDate": null
     }
     → RabbitMQ event: deduction.assigned
```

---

## Database Architecture

### Multi-Database Strategy
| Database | Type | Service(s) | Purpose |
|----------|------|-----------|---------|
| **PostgreSQL 16** | Relational | auth-service | User credentials, 2FA secrets |
| **MySQL 8.0** | Relational | hr-service | Employees, payroll, deductions, benefits |
| **MySQL 8.0** | Relational | task-service | Task entities, status tracking |
| **MySQL 8.0** | Relational | project-service | Project entities, allocations |

### Key Schemas
```
-- auth_db (PostgreSQL)
TABLE users (id UUID, username VARCHAR, passwordHash VARCHAR, role VARCHAR)

-- hr_db (MySQL)
TABLE employees (id BIGINT, authUserId UUID, name VARCHAR, baseSalary DECIMAL, departmentId BIGINT)
TABLE payroll_results (id BIGINT, employeeId BIGINT, gross DECIMAL, tax DECIMAL, net DECIMAL, status VARCHAR)
TABLE payroll_history (id BIGINT, payrollId BIGINT, action VARCHAR, actionBy VARCHAR, createdAt TIMESTAMP)
TABLE tax_configs (id BIGINT, year INT, country VARCHAR, minBracket DECIMAL, maxBracket DECIMAL, taxRate DECIMAL)
TABLE deduction_types (id BIGINT, name VARCHAR, category VARCHAR, isPercentage BOOLEAN, defaultRate DECIMAL)
TABLE deduction_instances (id BIGINT, employeeId BIGINT, deductionTypeId BIGINT, rate DECIMAL, startDate DATE, endDate DATE)
```

### Constraints & Indexes
- **PK/FK**: Referential integrity on all relationships
- **Unique**: employee.authUserId (one auth user = one employee), tax_config year+country+bracket
- **Indexes**: employeeId (for payroll queries), payrollId+status, createdAt (for audit trails)
- **Triggers**: Maintain payroll_history on every payroll mutation (immutable ledger)

---

## Caching Strategy

### Cache Layers
| Layer | Tool | TTL | Usage |
|-------|------|-----|-------|
| **L1 (In-Memory)** | Caffeine | 5 min | Hot employee data, tax brackets |
| **L2 (Distributed)** | Redis | 15 min | Query results, JWT blacklist |

### Cache Keys
```
employees:all                    → List of all active employees (15 min)
employee:{id}                    → Single employee details (15 min)
employee:{id}:payroll:current    → Latest payroll record (10 min)
payroll:draft:all                → All draft payroll records (5 min)
tax_brackets:2026:VN             → Tax config for year/country (1 day, never invalidated)
benefits:eligibility:{empId}     → Benefits eligibility (15 min, evicted on hire/transfer)
```

### Cache Invalidation
- **On Mutation**: `@CacheEvict` on POST/PUT/DELETE operations
- **Event-Driven**: RabbitMQ consumer evicts cache on employee.hired, deduction.assigned, etc.
- **Time-Based**: TTL expiration (15 min default)
- **Manual**: Admin can force refresh via `DELETE /api/cache/clear`

---

## Security & Compliance

### Authentication Flow
```
1. User: POST /api/xac-thuc/dang-nhap
   { "username": "payroll@company", "password": "..." }

2. Auth Service:
   ├─ Hash password with BCrypt(password, salt)
   ├─ Compare to DB passwordHash
   ├─ If 2FA enabled: return HTTP 202 + { mfaRequired: true }
   ├─ Else: generate JWT token

3. User (if 2FA): POST /api/xac-thuc/2fa/xac-nhan
   { "mfaCode": "123456" }
   → Auth Service verifies TOTP code (time-based, 30s window)

4. Response:
   HTTP 200
   {
     "accessToken": "eyJ0eXA...",  // JWT RS256, exp: 15min
     "refreshToken": "uuid-v4",      // stored in Redis, exp: 7 days
     "user": { "id": "...", "role": "PAYROLL_OFFICER" }
   }

5. Subsequent calls: Header "Authorization: Bearer eyJ0eXA..."
   └─ API Gateway: Validate JWT signature via KMS JWKS endpoint
```

### Audit Logging
- **What**: All payroll mutations (approve, process, corrections), employee lifecycle changes
- **Where**: Immutable ledger (append-only table payroll_history)
- **When**: Synchronously recorded (same transaction as state change)
- **Who**: User ID + email from JWT claims
- **How**: Exposed via GET /api/chi-tra/{id}/audit-log (queryable, exportable)

### Data Protection
- **Password**: BCrypt with 12 rounds minimum
- **Encryption at Rest**: Tax data encrypted with AES-256 (keys from KMS)
- **Encryption in Transit**: TLS 1.3 on all endpoints
- **Token Revocation**: Redis blacklist checked on every authenticated request
- **Secrets**: KMS service (stateless) never persists signing keys; rotated weekly

---

## Observability

### Metrics (Prometheus)
```
http_requests_total{endpoint="/api/chi-tra", status="200"}
http_request_duration_seconds{endpoint="/api/chi-tra", quantile="0.95"}
jvm_memory_usage_bytes{type="heap"}
business_payroll_calculations_total{status="success"}
business_payroll_tax_deductions_total{status="applied"}
```

### Dashboards (Grafana)
- Payroll Processing: Throughput (calculations/hour), latency (p50, p95, p99)
- Service Health: Error rates, response times, Eureka registration status
- Employee Lifecycle: Hires, transfers, offboards (daily/weekly trends)
- Tax Compliance: Bracket accuracy, deduction coverage, audit trail completeness

### Tracing (Jaeger)
- End-to-end request trace: Client → API Gateway → HR Service → DB
- RabbitMQ event spans: Payroll event published → consumed by 3 downstream services
- Database query spans: Slow queries (>100ms) flagged in traces

---

## Deployment & Infrastructure

### Docker Compose Layers
```
compose.infra.yml         → PostgreSQL, MySQL, Redis, RabbitMQ
compose.iam.yml           → Auth Service, KMS Service
compose.hr.yml            → HR Service, Eureka Server
compose.business.yml      → Task Service, Project Service
compose.edge.yml          → API Gateway, Observability (Prometheus, Grafana, Jaeger)

Startup order (handled by depends_on + health checks):
1. Infra (databases, queues) [30s for readiness]
2. IAM (auth, kms) [depends on infra]
3. HR (main services) [depends on iam + infra]
4. Business (task, project) [depends on hr]
5. Edge (gateway, monitoring) [depends on all]
```

### Health Checks
```
/actuator/health                  → liveness probe (every 10s, timeout 5s)
/actuator/health/readiness        → readiness probe (endpoint available to serve requests)
/actuator/health/db               → database connectivity
/actuator/metrics                 → Prometheus metrics scrape

Eureka deregisters service after 3 failed health checks (30s).
```

---

## Performance Targets

| Operation | Target | Actual (M05 baseline) |
|-----------|--------|----------------------|
| Payroll calculation (1 employee) | < 100ms | ~50ms (BigDecimal ops) |
| Tax bracket lookup | < 10ms | ~5ms (cached) |
| Employee list fetch (1K employees) | < 500ms | ~300ms (cached + paginated) |
| API response time (p95) | < 200ms | ~150ms (gateway + service) |
| Cache hit ratio | 80-90% | ~85% (measured) |

---

## Glossary

| Term | Definition |
|------|-----------|
| **RBAC** | Role-Based Access Control (ADMIN, HR_MANAGER, PAYROLL_OFFICER, EMPLOYEE) |
| **JWT** | JSON Web Token (stateless, signed with RSA key from KMS) |
| **2FA** | Two-Factor Authentication (TOTP via Google Authenticator) |
| **DLQ** | Dead Letter Queue (RabbitMQ fallback for failed consumers) |
| **Eureka** | Service Discovery (Netflix service registry for load balancing) |
| **BigDecimal** | Java numeric type for exact decimal arithmetic (tax calculations) |
| **Idempotent** | Operation can be executed multiple times safely (RabbitMQ events) |
| **Audit Trail** | Immutable ledger of all payroll state changes (who, what, when, why) |
