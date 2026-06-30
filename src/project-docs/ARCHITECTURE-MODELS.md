# HR Microservices - Architecture, Use Case, CDM and ERD Models

Tai lieu nay tong hop cac mo hinh thiet ke chinh cua du an HR Microservices dua tren code hien tai trong cac service: `api-gateway`, `auth-service`, `hr-service`, `project-service`, `task-service`, `kms`, va `eureka-server`.

> Ghi chu: du an theo kien truc microservices, moi service nen so huu database rieng. Cac quan he giua `auth_user_id`, `employee_id`, `project_id`, `assignee_id`, `lead_id` la tham chieu logic qua API/event, khong phai foreign key vat ly giua database.

## 1. Kien Truc Tong The

### 1.1 System Context

```mermaid
flowchart LR
    Employee[Nhan vien]
    Manager[Quan ly / Truong phong]
    HrManager[HR Manager]
    PayrollOfficer[Payroll Officer]
    Admin[System Admin]

    Frontend[Frontend Web App]
    Gateway[API Gateway]
    Auth[Auth Service]
    HR[HR Service]
    Project[Project Service]
    Task[Task Service]
    KMS[KMS Service]
    Eureka[Eureka Server]
    Redis[(Redis)]
    MQ[(RabbitMQ)]
    Obs[Observability: Prometheus / Grafana / Jaeger]

    Employee --> Frontend
    Manager --> Frontend
    HrManager --> Frontend
    PayrollOfficer --> Frontend
    Admin --> Frontend

    Frontend --> Gateway
    Gateway --> Auth
    Gateway --> HR
    Gateway --> Project
    Gateway --> Task
    Gateway --> KMS
    Gateway --> Redis

    Auth --> KMS
    Auth --> HR
    Auth --> MQ
    HR --> MQ
    Project --> MQ
    Task --> MQ

    Gateway --> Eureka
    Auth --> Eureka
    HR --> Eureka
    Project --> Eureka
    Task --> Eureka
    KMS --> Eureka

    Gateway --> Obs
    Auth --> Obs
    HR --> Obs
    Project --> Obs
    Task --> Obs
```

### 1.2 Container / Service Model

```mermaid
flowchart TB
    subgraph Client
        Web[React Frontend]
    end

    subgraph Edge
        Gateway[API Gateway<br/>JWT validation, routing, rate limit, HMAC/internal headers]
        Redis[(Redis<br/>token blacklist / gateway cache)]
    end

    subgraph Discovery
        Eureka[Eureka Server<br/>service registry]
    end

    subgraph Security
        Auth[Auth Service<br/>login, register, RBAC, 2FA, OAuth2 password token]
        AuthDb[(Auth DB<br/>users, roles, password history, sync outbox)]
        KMS[KMS Service<br/>JWKS/signing keys]
        KmsCache[(KMS Cache)]
    end

    subgraph HRDomain
        HR[HR Service<br/>employees, org units, payroll, compliance]
        HrDb[(HR DB<br/>employees, departments, payroll)]
    end

    subgraph WorkDomain
        Project[Project Service<br/>projects, assignments]
        ProjectDb[(Project DB)]
        Task[Task Service<br/>tasks, task history, notifications]
        TaskDb[(Task DB)]
    end

    subgraph Messaging
        Rabbit[(RabbitMQ<br/>domain events)]
    end

    Web --> Gateway
    Gateway --> Redis
    Gateway --> KMS
    Gateway --> Auth
    Gateway --> HR
    Gateway --> Project
    Gateway --> Task

    Auth --> AuthDb
    Auth --> KMS
    KMS --> KmsCache
    HR --> HrDb
    Project --> ProjectDb
    Task --> TaskDb

    Auth --> Rabbit
    HR --> Rabbit
    Project --> Rabbit
    Task --> Rabbit

    Auth -. register/fetch .-> Eureka
    HR -. register/fetch .-> Eureka
    Project -. register/fetch .-> Eureka
    Task -. register/fetch .-> Eureka
    Gateway -. discover .-> Eureka
```

### 1.3 Service Responsibility Matrix

| Service | Trach nhiem chinh | Du lieu so huu | Tich hop |
|---|---|---|---|
| `api-gateway` | Dinh tuyen API, kiem tra JWT, cache blacklist token, bo sung internal secret, route legacy Vietnamese path | Khong so huu domain data | KMS JWKS, Redis, Eureka |
| `auth-service` | Dang ky, dang nhap, OAuth2 token, 2FA, doi mat khau, khoa/mo tai khoan, quan tri user/role, sync user sang HR | User, RoleDefinition, PasswordHistory, UserSyncOutbox/DLQ | KMS, HR sync endpoint, RabbitMQ |
| `hr-service` | Ho so nhan vien, phong ban, don vi to chuc, payroll, payroll workflow, compliance report | Employee, Department, OrganizationUnit, Payroll*, Deduction*, TaxConfig | Auth sync, RabbitMQ events |
| `project-service` | Quan ly du an, lead, phan cong nhan vien vao du an | Project, ProjectAssignment | RabbitMQ project events |
| `task-service` | Quan ly cong viec, trang thai task, assignee, lich su, notification | Task, TaskHistory | Project events, notification adapter |
| `kms` | Quan ly khoa ky va JWKS cho JWT | Signing keys/cache | Gateway/Auth |
| `eureka-server` | Service discovery va registry replication | ServiceInstance/Lease logical data | Gateway va services |

## 2. Use Case Model

### 2.1 Actors

| Actor | Mo ta | Role lien quan |
|---|---|---|
| Nhan vien | Xem du an/cong viec duoc giao, doi mat khau, dang nhap/dang xuat | `USER`, `EMPLOYEE` |
| Quan ly | Theo doi du an, xem va quan ly phan cong trong pham vi quan ly | `MANAGER`, `DEPARTMENT_HEAD` |
| HR Manager | Quan ly nhan vien, phong ban, don vi to chuc, xem payroll | `HR_MANAGER`, `HR_ADMIN` |
| Payroll Officer | Phe duyet, tu choi, xu ly bang luong | `PAYROLL_OFFICER` |
| Admin | Quan tri tai khoan, vai tro, du an, task, cau hinh he thong | `ADMIN` |
| He thong ngoai / Scheduler | Goi sync/retry/event va cac tac vu nen | Internal service |

### 2.2 Use Case Diagram

```mermaid
flowchart LR
    Employee((Nhan vien))
    Manager((Quan ly))
    HRM((HR Manager))
    Payroll((Payroll Officer))
    Admin((Admin))
    Scheduler((Scheduler / Internal))

    subgraph IAM[Auth / IAM]
        UCLogin[Dang nhap]
        UC2FA[Quan ly 2FA]
        UCChangePwd[Doi mat khau]
        UCLogout[Dang xuat / revoke token]
        UCUserAdmin[Quan tri tai khoan]
        UCRoleAdmin[Quan tri vai tro]
        UCSyncUser[Dong bo user sang HR]
    end

    subgraph HR[HR]
        UCEmployee[Quan ly nhan vien]
        UCDepartment[Quan ly phong ban]
        UCOrg[Quan ly don vi to chuc]
        UCPayrollCalc[Tinh bang luong]
        UCPayrollWorkflow[Phe duyet / tu choi / xu ly payroll]
        UCCompliance[Xem bao cao compliance payroll]
    end

    subgraph Project[Project]
        UCProject[Quan ly du an]
        UCAssign[Phan cong nhan vien vao du an]
        UCViewProject[Xem du an]
    end

    subgraph Task[Task]
        UCTask[Quan ly task]
        UCViewTask[Xem task theo project/assignee/status]
        UCTaskHistory[Ghi lich su thay doi task]
        UCNotify[Gui thong bao task]
    end

    Employee --> UCLogin
    Employee --> UC2FA
    Employee --> UCChangePwd
    Employee --> UCLogout
    Employee --> UCViewProject
    Employee --> UCViewTask

    Manager --> UCViewProject
    Manager --> UCAssign
    Manager --> UCViewTask

    HRM --> UCEmployee
    HRM --> UCDepartment
    HRM --> UCOrg
    HRM --> UCPayrollCalc
    HRM --> UCCompliance

    Payroll --> UCPayrollWorkflow
    Payroll --> UCCompliance

    Admin --> UCUserAdmin
    Admin --> UCRoleAdmin
    Admin --> UCEmployee
    Admin --> UCDepartment
    Admin --> UCOrg
    Admin --> UCProject
    Admin --> UCTask
    Admin --> UCPayrollWorkflow

    Scheduler --> UCSyncUser
    Scheduler --> UCNotify
    Scheduler --> UCTaskHistory
```

### 2.3 Use Case Summary

| Module | Use case | Trigger | Ket qua |
|---|---|---|---|
| Auth | Dang ky user | Admin/user submit username, password, role | Tao `users`, tao outbox sync sang HR |
| Auth | Dang nhap | Username/password/OTP | Tra JWT/OAuth2 token hoac yeu cau MFA |
| Auth | 2FA | Khoi tao/xac nhan/tat 2FA | Cap nhat secret va trang thai 2FA |
| Auth | Quan tri user/role | Admin | Them/sua/xoa user, khoa/mo tai khoan, role definitions |
| HR | Dong bo user | Auth retry/scheduler/internal call | Tao/cap nhat `Employee` theo `authUserId`, ghi `ProcessedSyncEvent` |
| HR | Quan ly nhan vien | HR/Admin | CRUD employee, gan department, publish employee hired event |
| HR | Payroll calculation | HR Admin | Tao `PayrollResult` draft theo ky luong |
| HR | Payroll workflow | Payroll Officer/Admin | DRAFT -> APPROVED -> PROCESSED hoac reject ve DRAFT |
| Project | Quan ly du an | Admin | CRUD `Project`, publish event khi tao/status change |
| Project | Phan cong du an | Admin/Manager | Tao/xoa `ProjectAssignment` theo employee |
| Task | Quan ly task | Admin | CRUD `Task`, publish task events |
| Task | Xem task | User/Admin | Loc task theo project, assignee, status |

## 3. Domain Model / CDM

### 3.1 Conceptual Domain Model

```mermaid
classDiagram
    class User {
        UUID id
        username
        role
        locked
        twoFactorEnabled
    }

    class RoleDefinition {
        name
        permissions
        systemRole
    }

    class Employee {
        Long id
        authUserId
        username
        did
        name
        position
        baseSalary
        jobLevel
        status
    }

    class OrganizationUnit {
        Long id
        name
        code
        level
    }

    class Department {
        Long id
        name
        code
    }

    class PayrollRun {
        Long id
        periodStartDate
        periodEndDate
        requestedBy
        status
    }

    class PayrollResult {
        Long id
        periodStartDate
        grossPay
        totalDeduction
        netPay
        status
    }

    class PayrollHistory {
        Long id
        eventType
        actionBy
        changeDetails
    }

    class DeductionType {
        Long id
        name
        category
        defaultRate
        isMandatory
    }

    class DeductionInstance {
        Long id
        rate
        startDate
        endDate
        isActive
    }

    class TaxConfig {
        Long id
        year
        minBracket
        maxBracket
        taxRate
        country
    }

    class Project {
        Long id
        name
        status
        leadId
    }

    class ProjectAssignment {
        Long id
        employeeId
        role
        active
        assignedAt
    }

    class Task {
        Long id
        title
        status
        priority
        assigneeId
        projectId
    }

    class TaskHistory {
        Long id
        taskId
        previousStatus
        newStatus
        changedBy
    }

    RoleDefinition "1" --> "0..*" User : defines role name
    User "1" ..> "0..1" Employee : authUserId logical link
    OrganizationUnit "0..1" --> "0..*" OrganizationUnit : parent
    OrganizationUnit "1" --> "0..*" Department : contains
    Department "1" --> "0..*" Employee : has

    Employee "1" --> "0..*" PayrollResult : receives
    PayrollResult "1" --> "0..*" PayrollHistory : audit
    Employee "1" --> "0..*" PayrollHistory : affected employee
    Employee "1" --> "0..*" DeductionInstance : has
    DeductionType "1" --> "0..*" DeductionInstance : configured as
    TaxConfig ..> PayrollResult : used to calculate
    PayrollRun ..> PayrollResult : calculation batch / period

    Employee "1" ..> "0..*" Project : leadId logical link
    Project "1" --> "0..*" ProjectAssignment : has assignments
    Employee "1" ..> "0..*" ProjectAssignment : employeeId logical link
    Project "1" ..> "0..*" Task : projectId logical link
    Employee "1" ..> "0..*" Task : assigneeId logical link
    Task "1" ..> "0..*" TaskHistory : taskId logical link
```

### 3.2 Bounded Contexts

| Bounded context | Aggregate / Entity chinh | Chu thich |
|---|---|---|
| Identity & Access | `User`, `RoleDefinition`, `UserPasswordHistory`, `UserSyncOutbox`, `UserSyncDlq` | Nguon su that ve tai khoan, role, MFA, password |
| HR Core | `Employee`, `Department`, `OrganizationUnit`, `ProcessedSyncEvent` | Nguon su that ve nhan vien va co cau to chuc |
| Payroll | `PayrollRun`, `PayrollResult`, `PayrollHistory`, `DeductionType`, `DeductionInstance`, `TaxConfig` | Tinh luong, phe duyet, xu ly, audit |
| Project Allocation | `Project`, `ProjectAssignment` | Quan ly du an va phan cong nhan su |
| Task Workflow | `Task`, `TaskHistory` | Quan ly cong viec, trang thai, assignee |
| Discovery / Edge | Service registry, gateway cache/security | Ha tang, khong phai domain nghiep vu chinh |

## 4. ERD

Trong bao cao tieng Viet, cac bang/cot SQL co the duoc trinh bay bang ten nghiep vu tieng Viet de de doc. Bang duoi day la bang doi chieu giua schema that trong code va ten tieng Viet dung trong mo hinh:

| Ten trong schema/code | Ten tieng Viet trong mo hinh |
|---|---|
| `users` | `NGUOI_DUNG` |
| `role_definitions` | `VAI_TRO` |
| `user_password_history` | `LICH_SU_MAT_KHAU` |
| `user_sync_outbox` | `HANG_DOI_DONG_BO_NGUOI_DUNG` |
| `user_sync_dlq` | `HANG_DOI_LOI_DONG_BO` |
| `organization_units` | `DON_VI_TO_CHUC` |
| `departments` | `PHONG_BAN` |
| `employee` / `employees` | `NHAN_VIEN` |
| `processed_sync_events` | `SU_KIEN_DONG_BO_DA_XU_LY` |
| `payroll_run` | `DOT_TINH_LUONG` |
| `payroll_result` | `KET_QUA_LUONG` |
| `payroll_history` | `LICH_SU_LUONG` |
| `deduction_type` | `LOAI_KHAU_TRU` |
| `deduction_instance` | `KHAU_TRU_NHAN_VIEN` |
| `tax_config` | `CAU_HINH_THUE` |
| `projects` | `DU_AN` |
| `project_assignments` | `PHAN_CONG_DU_AN` |
| `tasks` | `CONG_VIEC` |
| `task_history` | `LICH_SU_CONG_VIEC` |

Ghi chu: schema trong code van giu ten tieng Anh de dong bo voi entity JPA va migration/DDL hien co; ten tieng Viet chi dung cho tai lieu va so do trinh bay.

### 4.1 ERD Tong Hop Logic

```mermaid
erDiagram
    USERS {
        uuid id PK
        varchar username UK
        varchar password_hash
        varchar role
        boolean locked
        timestamp locked_at
        boolean two_factor_enabled
        varchar two_factor_secret
        timestamp two_factor_enabled_at
        timestamp password_updated_at
        timestamp created_at
        timestamp updated_at
    }

    ROLE_DEFINITIONS {
        varchar name PK
        varchar description
        text permissions
        boolean system_role
        timestamp created_at
        timestamp updated_at
    }

    USER_PASSWORD_HISTORY {
        uuid id PK
        uuid user_id
        varchar password_hash
        timestamp created_at
    }

    USER_SYNC_OUTBOX {
        uuid id PK
        uuid event_id UK
        uuid user_id
        varchar username
        varchar role
        varchar status
        int retry_count
        int max_retries
        timestamp next_retry_at
        timestamp synced_at
        text last_error
        timestamp created_at
        timestamp updated_at
    }

    USER_SYNC_DLQ {
        uuid id PK
        uuid event_id
        uuid user_id
        varchar username
        varchar role
        int retry_count
        text failure_reason
        text payload_json
        timestamp failed_at
    }

    ORGANIZATION_UNITS {
        bigint id PK
        varchar name
        varchar code UK
        varchar level
        bigint parent_id FK
    }

    DEPARTMENTS {
        bigint id PK
        varchar name
        varchar code UK
        bigint organization_unit_id FK
    }

    EMPLOYEE {
        bigint id PK
        varchar auth_user_id UK
        varchar username UK
        varchar did UK
        varchar name
        varchar position
        decimal base_salary
        varchar currency
        varchar job_level
        date hire_date
        varchar status
        bigint department_id FK
        timestamp created_at
        timestamp updated_at
    }

    PROCESSED_SYNC_EVENTS {
        bigint id PK
        varchar event_id UK
        bigint employee_id
        varchar auth_user_id
        varchar username
        varchar did
        timestamp created_at
    }

    PAYROLL_RUN {
        bigint id PK
        date period_start_date
        date period_end_date
        varchar requested_by
        varchar source_system
        varchar status
        timestamp created_at
    }

    PAYROLL_RESULT {
        bigint id PK
        bigint employee_id FK
        date period_start_date
        date period_end_date
        decimal gross_pay
        decimal tax_deduction
        decimal insurance_deduction
        decimal other_deduction
        decimal total_deduction
        decimal net_pay
        varchar status
        varchar approved_by
        timestamp approved_at
        varchar processed_by
        timestamp processed_at
        varchar remarks
        timestamp created_at
        timestamp updated_at
        bigint version
    }

    PAYROLL_HISTORY {
        bigint id PK
        bigint payroll_result_id FK
        bigint employee_id FK
        varchar event_type
        varchar action_by
        varchar change_details
        decimal previous_gross
        decimal previous_net
        timestamp created_at
    }

    DEDUCTION_TYPE {
        bigint id PK
        varchar name UK
        varchar description
        varchar category
        boolean is_percentage
        decimal default_rate
        decimal employer_contribution_rate
        boolean is_mandatory
        boolean is_active
    }

    DEDUCTION_INSTANCE {
        bigint id PK
        bigint employee_id FK
        bigint deduction_type_id FK
        decimal rate
        boolean is_active
        date start_date
        date end_date
    }

    TAX_CONFIG {
        bigint id PK
        int tax_year
        decimal min_bracket
        decimal max_bracket
        decimal tax_rate
        varchar country
        varchar description
        boolean is_active
    }

    PROJECTS {
        bigint id PK
        varchar name
        text description
        varchar status
        bigint lead_id
        timestamp created_at
        timestamp updated_at
    }

    PROJECT_ASSIGNMENTS {
        bigint id PK
        bigint project_id FK
        bigint employee_id
        varchar role
        boolean active
        timestamp assigned_at
    }

    TASKS {
        bigint id PK
        varchar title
        text description
        varchar status
        varchar priority
        bigint assignee_id
        bigint project_id
        timestamp created_at
        timestamp updated_at
    }

    TASK_HISTORY {
        bigint id PK
        bigint task_id
        bigint project_id
        varchar previous_status
        varchar new_status
        text reason
        timestamp changed_at
        bigint changed_by
    }

    ROLE_DEFINITIONS ||--o{ USERS : role_name_logical
    USERS ||--o{ USER_PASSWORD_HISTORY : user_id_logical
    USERS ||--o{ USER_SYNC_OUTBOX : user_id_logical
    USERS ||--o{ USER_SYNC_DLQ : user_id_logical
    USERS ||..o| EMPLOYEE : auth_user_id_logical

    ORGANIZATION_UNITS ||--o{ ORGANIZATION_UNITS : parent
    ORGANIZATION_UNITS ||--o{ DEPARTMENTS : owns
    DEPARTMENTS ||--o{ EMPLOYEE : has

    EMPLOYEE ||--o{ PROCESSED_SYNC_EVENTS : sync_result
    EMPLOYEE ||--o{ PAYROLL_RESULT : receives
    PAYROLL_RESULT ||--o{ PAYROLL_HISTORY : audited_by
    EMPLOYEE ||--o{ PAYROLL_HISTORY : affected
    EMPLOYEE ||--o{ DEDUCTION_INSTANCE : has
    DEDUCTION_TYPE ||--o{ DEDUCTION_INSTANCE : type

    EMPLOYEE ||..o{ PROJECTS : lead_id_logical
    PROJECTS ||--o{ PROJECT_ASSIGNMENTS : has
    EMPLOYEE ||..o{ PROJECT_ASSIGNMENTS : employee_id_logical
    PROJECTS ||..o{ TASKS : project_id_logical
    EMPLOYEE ||..o{ TASKS : assignee_id_logical
    TASKS ||..o{ TASK_HISTORY : task_id_logical
```

### 4.2 ERD Theo Tung Database

#### Auth DB

```mermaid
erDiagram
    ROLE_DEFINITIONS ||--o{ USERS : role
    USERS ||--o{ USER_PASSWORD_HISTORY : password_history
    USERS ||--o{ USER_SYNC_OUTBOX : sync_jobs
    USERS ||--o{ USER_SYNC_DLQ : failed_sync_jobs
```

#### HR DB

```mermaid
erDiagram
    ORGANIZATION_UNITS ||--o{ ORGANIZATION_UNITS : parent
    ORGANIZATION_UNITS ||--o{ DEPARTMENTS : contains
    DEPARTMENTS ||--o{ EMPLOYEE : has
    EMPLOYEE ||--o{ PAYROLL_RESULT : payroll
    PAYROLL_RESULT ||--o{ PAYROLL_HISTORY : history
    EMPLOYEE ||--o{ PAYROLL_HISTORY : employee
    EMPLOYEE ||--o{ DEDUCTION_INSTANCE : deductions
    DEDUCTION_TYPE ||--o{ DEDUCTION_INSTANCE : type
```

#### Project DB

```mermaid
erDiagram
    PROJECTS ||--o{ PROJECT_ASSIGNMENTS : assignments
```

#### Task DB

```mermaid
erDiagram
    TASKS ||..o{ TASK_HISTORY : history
```

## 5. Sequence Models

### 5.1 Dang Nhap Va Goi API Bao Ve

```mermaid
sequenceDiagram
    actor U as User
    participant FE as Frontend
    participant GW as API Gateway
    participant AUTH as Auth Service
    participant KMS as KMS Service
    participant SVC as Domain Service

    U->>FE: Nhap username/password/OTP
    FE->>GW: POST /api/xac-thuc/dang-nhap
    GW->>AUTH: StripPrefix -> /xac-thuc/dang-nhap
    AUTH->>KMS: Lay/kiem tra signing key
    AUTH-->>FE: JWT access token
    FE->>GW: Goi API kem Authorization Bearer
    GW->>KMS: Lay JWKS de validate token
    GW->>GW: Validate JWT, role, blacklist/cache
    GW->>SVC: Forward request + internal headers
    SVC-->>GW: Domain response
    GW-->>FE: Response
```

### 5.2 Dang Ky User Va Dong Bo Employee

```mermaid
sequenceDiagram
    actor A as Admin/User
    participant GW as API Gateway
    participant AUTH as Auth Service
    participant ADB as Auth DB
    participant HR as HR Service
    participant HDB as HR DB

    A->>GW: POST /api/xac-thuc/dang-ky
    GW->>AUTH: /xac-thuc/dang-ky
    AUTH->>ADB: Insert users
    AUTH->>ADB: Insert user_sync_outbox
    AUTH->>HR: POST /nhan-vien/internal/users/sync
    HR->>HDB: Check processed_sync_events
    HR->>HDB: Upsert employee by authUserId/username/did
    HR->>HDB: Insert processed_sync_events
    HR-->>AUTH: SYNCED / DUPLICATE_IGNORED
    AUTH-->>GW: RegisterResponse
```

### 5.3 Payroll Workflow

```mermaid
stateDiagram-v2
    [*] --> REQUESTED: PayrollRun created
    REQUESTED --> DRAFT: calculate payroll results
    DRAFT --> APPROVED: approvePayroll
    DRAFT --> DRAFT: reject/recalculate
    APPROVED --> PROCESSED: processPayroll
    PROCESSED --> [*]
```

```mermaid
sequenceDiagram
    actor HR as HR Admin
    actor PO as Payroll Officer
    participant GW as API Gateway
    participant HRS as HR Service
    participant DB as HR DB
    participant MQ as RabbitMQ

    HR->>GW: POST /api/payroll/runs
    GW->>HRS: create payroll run
    HRS->>DB: Save PayrollRun
    HRS->>MQ: Publish PayrollRunRequestedEvent

    HR->>GW: GET /api/payroll/{employeeId}/calculate
    GW->>HRS: calculate payroll
    HRS->>DB: Read Employee, Deduction, TaxConfig
    HRS->>DB: Save PayrollResult DRAFT

    PO->>GW: PUT /api/chi-tra/{payrollId}/phe-duyet
    GW->>HRS: approve payroll
    HRS->>DB: Update PayrollResult APPROVED
    HRS->>DB: Insert PayrollHistory

    PO->>GW: PUT /api/chi-tra/{payrollId}/xu-ly
    GW->>HRS: process payroll
    HRS->>DB: Update PayrollResult PROCESSED
    HRS->>MQ: Publish PayrollProcessedEvent
```

### 5.4 Project Va Task Flow

```mermaid
sequenceDiagram
    actor Admin as Admin/Manager
    participant GW as API Gateway
    participant Project as Project Service
    participant Task as Task Service
    participant PDB as Project DB
    participant TDB as Task DB
    participant MQ as RabbitMQ

    Admin->>GW: POST /api/projects
    GW->>Project: create project
    Project->>PDB: Save Project
    Project->>MQ: Publish ProjectCreatedEvent
    MQ-->>Task: ProjectEventListener

    Admin->>GW: POST /api/projects/{id}/assignments
    GW->>Project: add assignment
    Project->>PDB: Save ProjectAssignment

    Admin->>GW: POST /api/tasks
    GW->>Task: create task
    Task->>TDB: Save Task
    Task->>MQ: Publish TaskCreated/Assigned event
```

## 6. Security And RBAC Model

```mermaid
flowchart LR
    Request[HTTP Request] --> Gateway[API Gateway]
    Gateway --> Public{Public route?}
    Public -- Yes --> Service[Target Service]
    Public -- No --> JWT[Validate JWT via JWKS]
    JWT --> Blacklist[Check token blacklist/cache]
    Blacklist --> Headers[Inject X-Auth-* and X-Internal-Secret]
    Headers --> Service
    Service --> RoleGuard[Controller Role Guard / SecurityValidator]
    RoleGuard --> DomainAction[Execute domain action]
```

RBAC hien tai duoc ap dung o nhieu lop:

| Lop | Vi tri | Chuc nang |
|---|---|---|
| Gateway JWT | `api-gateway` | Xac thuc request bao ve, lay JWKS tu KMS |
| Internal secret | Gateway -> service | Dam bao request di qua gateway |
| Controller role annotation | `@RequiredRoles`, `@RequireRoles`, `@PreAuthorize` | Chan use case theo role |
| Domain validator | `SecurityValidator` trong HR | Kiem tra gateway access va role cho payroll/employee |

## 7. Ghi Chu Thiet Ke

1. `auth-service` la source of truth ve tai khoan va role; `hr-service` la source of truth ve nhan vien.
2. `Employee.authUserId` lien ket logic voi `User.id`, nhung khong nen tao FK cross-database.
3. `Project.leadId`, `ProjectAssignment.employeeId`, `Task.assigneeId` deu tham chieu logic den `Employee.id`.
4. `Task.projectId` tham chieu logic den `Project.id`.
5. Payroll can audit bang `PayrollHistory`; nen xem day la audit trail khong sua.
6. Cac event nhu `EmployeeHiredEvent`, `PayrollProcessedEvent`, `ProjectCreatedEvent`, `TaskCreatedEvent` giup giam coupling giua service.
7. `ProcessedSyncEvent` giup idempotency khi auth sync user sang HR.
