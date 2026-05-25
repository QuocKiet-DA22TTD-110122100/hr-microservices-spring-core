# 🎯 HR Microservices Platform — Vision & Principles

## Platform Purpose

**What it does:**
Modern HR microservices platform for employee lifecycle management, payroll processing, benefits administration, and compliance reporting. Built for enterprises requiring accurate tax calculations, audit trails, and role-based access control.

**Who uses it:**
- **HR Managers**: Employee hiring, transfers, offboarding, organization management
- **Payroll Officers**: Payroll calculation, approval, reconciliation, audit trails
- **Finance Admins**: Salary data, tax reconciliation, compliance reports
- **Employees**: View payroll stubs, benefits enrollment, deduction management
- **Auditors**: Immutable payroll ledger, event trails, export for tax filing

---

## Core Principles

### 1. **Data Accuracy Over Speed**
Payroll is financial data. Tax calculations must be precise to the penny (2 decimal places). Better to be 100ms slower and correct than 10ms fast and wrong.
- Progressive tax bracket system with version control
- BigDecimal arithmetic throughout
- Immutable audit ledger for all payroll mutations

### 2. **Compliance First**
HR systems touch regulated data (taxes, benefits, employee records). Security and auditability are non-negotiable.
- RBAC: ADMIN, HR_MANAGER, PAYROLL_OFFICER, EMPLOYEE with separation of duties
- Encryption at rest for tax data
- Audit log retention: 7 years (tax compliance), 3 years (general audit)
- All payroll mutations recorded (who, what, when, why)

### 3. **Employee Data Privacy**
Salary, benefits, tax info are sensitive. Employees see only their own data. HR sees department data only.
- Row-level access control (RBAC enforced at API layer)
- Salary confidentiality enforced (no cross-employee queries)
- Secure deletion on offboarding (soft delete + anonymization path)

### 4. **Event-Driven Lifecycle**
Employee lifecycle events (hire, transfer, offboard) trigger downstream changes (payroll setup, benefits eligibility, access revocation).
- RabbitMQ for asynchronous event publishing
- Immutable event ledger for traceability
- Idempotent consumers (same event can be processed safely multiple times)

### 5. **Operational Transparency**
HR decisions affect employee pay. Every calculation, approval, correction must be traceable.
- Git-like audit trail: who approved payroll, when, what changed
- Export capability for tax filing and audit verification
- Real-time status: draft → approved → processed with clear ownership

---

## Technology Stack

### Core Services (Java 21 + Spring Boot 3.5.12)
| Service | Port | Purpose | DB |
|---------|------|---------|-----|
| **API Gateway** | 8080 | Request routing, JWT auth, rate limiting | — |
| **Auth Service** | 8086 | User authentication, OAuth2, 2FA (TOTP) | PostgreSQL |
| **HR Service** | 8082 | Employees, departments, payroll, deductions, benefits | MySQL |
| **Task Service** | 8083 | Task management (employee projects/assignments) | MySQL |
| **Project Service** | 8084 | Project allocation tracking | MySQL |
| **KMS Service** | 9000 | Key management, JWT signing, JWKS endpoint | — |
| **Eureka Server** | 8761 | Service discovery and health registry | — |

### Caching & Messaging
- **Redis** (port 6379): JWT blacklist, query cache (15min TTL), session storage
- **RabbitMQ** (port 5672): Event publishing (employee.hired, payroll.created, deduction.assigned)

### Observability
- **Prometheus** (port 9090): Metrics collection
- **Grafana** (port 3001): Dashboards (latency, error rates, request volume)
- **Jaeger** (port 16686): Distributed tracing

### Infrastructure
- **Docker Compose** (layered): infra (databases), iam (auth), hr (employee/payroll), business (task/project), edge (gateway/eureka)
- **Maven**: Multi-module build for all 7 services
- **Java 21**: Virtual threads for high concurrency

---

## User Roles & Permissions

### Role Matrix
| Permission | ADMIN | HR_MANAGER | PAYROLL_OFFICER | EMPLOYEE |
|------------|-------|-----------|-----------------|----------|
| View all employees | ✅ | ✅ (department only) | ❌ | ❌ (own only) |
| Hire/Transfer/Offboard | ✅ | ✅ | ❌ | ❌ |
| View payroll | ✅ | ✅ (department only) | ✅ (all) | ❌ (own only) |
| **Approve** payroll | ✅ | ❌ | ✅ | ❌ |
| **Process** payroll | ✅ | ❌ | ✅ | ❌ |
| Configure tax brackets | ✅ | ❌ | ❌ | ❌ |
| View audit logs | ✅ | ✅ (department) | ✅ (payroll only) | ❌ |
| Export tax report | ✅ | ❌ | ✅ | ❌ |

### Separation of Duties (Payroll Workflow)
1. **HR_MANAGER** prepares payroll (input employee data, salary changes)
2. **PAYROLL_OFFICER** reviews and approves (validates calculations, catches errors)
3. **PAYROLL_OFFICER** processes (final step, cannot be undone; creates audit trail)
4. System publishes **payroll.processed** event → downstream systems (accounting, tax)

---

## API Design Principles

### Endpoints (Vietnamese naming for HR domain specificity)
```
/api/nhan-vien/*          → Employee management (hire, transfer, offboard)
/api/chi-tra/*            → Payroll (calculation, approval, audit)
/api/phuc-loi/*           → Benefits (eligibility, enrollment)
/api/khau-tru/*           → Deductions (tax brackets, deduction types)
/api/xac-thuc/*           → Authentication (login, 2FA, token refresh)
```

### Request/Response Format
- **Authentication**: Bearer JWT (RS256 signed, RSA public key from `/kms/.well-known/jwks.json`)
- **Data Format**: JSON, ISO8601 dates, BigDecimal for currency (2 decimals)
- **Error Format**: 
  ```json
  {
    "error": "PAYROLL_CALCULATION_ERROR",
    "message": "Tax bracket not configured for 2026",
    "timestamp": "2026-05-25T10:30:00Z"
  }
  ```

### Rate Limiting
- Login endpoint: 5 requests per minute per IP (to prevent brute force)
- Payroll endpoints: 100 requests per minute per user (to prevent abuse)
- Default: 1000 requests per minute per user

---

## Business Workflows

### Workflow 1: Employee Hire
```
1. HR_MANAGER creates employee (POST /api/nhan-vien)
   → System links to auth user (via authUserId)
   → RabbitMQ event: employee.hired
2. Event consumer (downstream): 
   → Create payroll record for next period
   → Set up default deductions (tax, insurance)
   → Grant benefits eligibility
   → Grant Eureka service discovery visibility
```

### Workflow 2: Payroll Cycle (Monthly)
```
1. PAYROLL_OFFICER fetches draft payroll (GET /api/chi-tra?status=DRAFT)
2. Review calculations:
   - Gross pay (salary / 12)
   - Tax deduction (progressive brackets)
   - Insurance/benefits deductions
   - Net pay = gross - all deductions
3. Approve (PUT /api/chi-tra/{payrollId}/approve)
   → Status: DRAFT → APPROVED
   → Audit log: who, when, no changes possible
4. Process (PUT /api/chi-tra/{payrollId}/process)
   → Status: APPROVED → PROCESSED
   → RabbitMQ event: payroll.processed
   → Immutable: cannot be edited after processing
```

### Workflow 3: Employee Offboard
```
1. HR_MANAGER initiates offboard (PUT /api/nhan-vien/{id}/offboard)
2. System actions:
   → Calculate final payroll (up to offboard date)
   → Revoke JWT tokens (Redis blacklist)
   → Disable API access (ACTIVE → INACTIVE flag)
   → RabbitMQ event: employee.offboarded
3. Event consumers:
   → Audit log: offboard timestamp, final salary, benefits ended
   → Finance: trigger final payment + tax settlement
```

---

## Security & Compliance

### Authentication
- **OAuth2 + OIDC**: External identity providers (optional future expansion)
- **JWT**: Stateless token verification via KMS public key
- **2FA**: TOTP (Google Authenticator compatible) for ADMIN/PAYROLL_OFFICER roles
- **Token Expiry**: 15 min (access), 7 days (refresh)

### Data Protection
- **Password Hashing**: BCrypt (minimum 12 rounds)
- **Encryption at Rest**: Tax data encrypted (AES-256, keys from KMS)
- **Encryption in Transit**: TLS 1.3 minimum
- **API Gateway**: Rate limiting + HMAC signing for internal service calls

### Audit & Compliance
- **Audit Log**: Immutable ledger for all payroll mutations (approval, processing, corrections)
- **Tax Compliance**: Progressive tax brackets versioned by year/country; export in compliance format
- **Data Retention**: 
  - Payroll records: 7 years (tax authority requirement)
  - Audit logs: 3 years (general compliance)
  - Backup: 1 year (disaster recovery)

### Compliance Standards
- **ISO 27001**: Information security management (AC-1, AUD-1, ENC-1, RET-1 controls)
- **Tax Regulations**: Country-specific tax bracket accuracy, withholding, deduction rules
- **GDPR (future)**: Right to deletion (soft delete with anonymization), data portability

---

## Performance & Scalability

### Performance Targets
- **Payroll Calculation**: < 100ms per employee (BigDecimal arithmetic optimized)
- **API Response**: < 200ms (with Redis cache hit), < 1s (on cache miss)
- **Cache Hit Ratio**: 80-90% for frequently accessed data (employees, tax brackets)

### Horizontal Scaling
- Microservices: Stateless services scale independently (Spring Cloud Load Balancer)
- Database: Per-service MySQL/PostgreSQL, vertical scaling for now
- Cache: Redis cluster-ready architecture (future)
- Message Queue: RabbitMQ cluster-ready (future)

### Resilience
- Service Discovery: Eureka with automatic deregistration on failure
- Health Checks: Liveness probe on all services (every 10s, timeout 5s)
- Circuit Breaker: Future (Resilience4j) for inter-service communication
- Dead Letter Queue: RabbitMQ DLQ for failed event processing

---

## Services principaux
| Service | Port | Responsabilité |
|---------|------|----------------|
| `api-gateway` | 8080 | Routing, Auth, Rate limiting, Audit |
| `auth-service` | 8086 | OAuth2, OIDC, 2FA, tokens |
| `hr-service` | 8082 | Employees, payroll, deductions |
| `tenant-service` | 3003 | Organisations, plans, onboarding |
| `billing-service` | 3004 | Abonnements, paiements (Stripe) |
| `notification-service` | 3005 | Email, in-app, webhooks |

## Contraintes de conformité
- **ISO 27001** : A.9 (accès), A.10 (chiffrement), A.12 (opérations), A.13 (réseau), A.14 (dev)
- **SOC 2 Type II** : CC6 (accès logique), CC7 (monitoring), CC8 (changements)
- Logs d'audit **immuables** (WORM), rétention **1 an minimum**
- Chiffrement **AES-256** at-rest, **TLS 1.3** in-transit
- Secrets via **Vault** — rotation automatique 90 jours
