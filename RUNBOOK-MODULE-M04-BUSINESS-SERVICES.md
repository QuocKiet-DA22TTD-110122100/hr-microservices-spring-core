Module M04 — Scaffold Task & Project Microservices (Business)

Overview
This module provides scaffolding for two business-domain microservices:
- Task Service: Manage tasks, assignments, and task lifecycle
- Project Service: Manage projects, staffing, and project lifecycle

Architecture
- Both services follow the same pattern as core services (auth, hr, kms)
- Use Spring Boot 3.5.12 with Spring Cloud 2025.0.1
- Register with Eureka for service discovery
- Connect to MySQL databases (task_db, project_db)
- Expose Prometheus metrics and Spring Actuator health endpoints

Files Added
- `task-service/` directory with complete Spring Boot module
  - pom.xml: Maven configuration
  - src/main/java/.../entity/Task.java: Task entity with lifecycle states
  - src/main/java/.../repository/TaskRepository.java: JPA repository
  - src/main/java/.../controller/TaskController.java: REST API endpoints
  - src/main/java/.../TaskServiceApplication.java: Spring Boot entry point
  - src/main/resources/application.yml: Configuration

- `project-service/` directory with complete Spring Boot module
  - pom.xml: Maven configuration
  - src/main/java/.../entity/Project.java: Project entity with lifecycle states
  - src/main/java/.../repository/ProjectRepository.java: JPA repository
  - src/main/java/.../controller/ProjectController.java: REST API endpoints
  - src/main/java/.../ProjectServiceApplication.java: Spring Boot entry point
  - src/main/resources/application.yml: Configuration

Task Service API

GET    /api/tasks              - List all tasks
GET    /api/tasks/{id}         - Get task by ID
POST   /api/tasks              - Create new task
PUT    /api/tasks/{id}         - Update task
DELETE /api/tasks/{id}         - Delete task
GET    /api/tasks/project/{id} - Get tasks for project
GET    /api/tasks/assignee/{id} - Get tasks assigned to user
GET    /api/tasks/status/{status} - Get tasks by status
GET    /api/tasks/health       - Health check

Task Status Enum
- OPEN: Task created, waiting to be started
- IN_PROGRESS: Task is being worked on
- COMPLETED: Task finished
- CANCELLED: Task cancelled

Project Service API

GET    /api/projects              - List all projects
GET    /api/projects/{id}         - Get project by ID
POST   /api/projects              - Create new project
PUT    /api/projects/{id}         - Update project
DELETE /api/projects/{id}         - Delete project
GET    /api/projects/status/{status} - Get projects by status
GET    /api/projects/lead/{leadId}  - Get projects led by user
GET    /api/projects/health       - Health check

Project Status Enum
- ACTIVE: Project is active
- PAUSED: Project is paused
- COMPLETED: Project finished
- ARCHIVED: Project archived

Configuration

Task Service runs on port: 8083
Database: task_db (MySQL)
Eureka registration: http://localhost:8761/eureka

Project Service runs on port: 8084
Database: project_db (MySQL)
Eureka registration: http://localhost:8761/eureka

Database Setup (local MySQL)

CREATE DATABASE task_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE project_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

Tables are auto-created by Hibernate on first startup (ddl-auto: update)

Build and Test

Compile project:
```bash
./mvnw clean compile -DskipTests -q
```

Build JAR:
```bash
./mvnw clean package -DskipTests -pl task-service,project-service
```

Run task-service locally:
```bash
./mvnw spring-boot:run -pl task-service
```

Run project-service locally:
```bash
./mvnw spring-boot:run -pl project-service
```

Integration

Both services are:
- Registered in root pom.xml as modules (multi-module build)
- Configured to connect to Eureka at localhost:8761
- Ready to be accessed through API Gateway with JWT authentication
- Exposing Prometheus metrics at /actuator/prometheus
- Health checks at /api/{task|project}s/health

Docker Deployment

Add to compose files:
- compose.business.yml: task-service and project-service definitions
- Update gateway routes to include /api/tasks and /api/projects

Next Steps

1. Add service-to-service authentication (X-Internal-Secret for task→project calls)
2. Add task-project relationship (task.projectId → project entity)
3. Implement business logic (task assignment, project staffing)
4. Add cache layer (Redis for project list, task assignments)
5. Add event publishing (task created/completed → observability)
6. Write integration tests (task creation → project updates)
7. Add CI/CD deployment pipeline (GitHub Actions / Azure Pipelines)

