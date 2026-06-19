# Phase 1: Docker Deployment & Service Integration Guide

## Overview
This guide walks through deploying all 8 microservices (6 core + 2 new business services) using Docker Compose.

## Prerequisites
- Docker Desktop 4.66+ (version 29.3.0+)
- PowerShell 5.1 or later
- MySQL 8.0 (via Docker Compose)
- All services compiled: `./mvnw clean compile -DskipTests -q`

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│ API Gateway (8080)                                   │
│ ├─ Route: /api/tasks/* → Task Service (8083)        │
│ ├─ Route: /api/projects/* → Project Service (8084)  │
│ └─ Route: /api/hr/* → HR Service (8082)             │
└─────────────────────────────────────────────────────┘
         ↑
┌─────────────────────────────────────────────────────┐
│ Service Discovery (Eureka 8761)                      │
│ ├─ api-gateway (8080)                               │
│ ├─ auth-service (8081)                              │
│ ├─ hr-service (8082)                                │
│ ├─ task-service (8083) ← NEW                        │
│ └─ project-service (8084) ← NEW                     │
└─────────────────────────────────────────────────────┘

Database Layer:
├─ task_db (MySQL 3306)
├─ project_db (MySQL 3306)
├─ hr_db (MySQL 3306)
└─ kms_db (PostgreSQL 5432)

Cache/Auth Layer:
├─ Redis (6379)
├─ Auth Service (8081)
└─ KMS Service (9000)
```

## Compose Files Configuration

### compose.infra.yml
Foundation services:
- PostgreSQL (5432): KMS database
- MySQL (3306): Task, Project, HR databases
- Redis (6379): Token cache, blacklist
- Prometheus (9090): Metrics
- Grafana (3000): Dashboards
- Eureka-peer1 (8761): Service discovery
- HAProxy (8888/8889): Load balancer (optional)

### compose.iam.yml
Identity & Access Management:
- Auth Service (8081): JWT token issuance
- KMS Service (9000): Key management, JWKS endpoint

### compose.hr.yml
Business Domain - HR:
- HR Service (8082): Employee, organization, department management

### compose.business.yml (NEW)
Business Domain - Tasks & Projects:
- Task Service (8083): Task CRUD, status management
- Project Service (8084): Project CRUD, lead assignment

### compose.edge.yml
Edge/Gateway:
- API Gateway (8080): Request routing, JWT validation, rate limiting

## MySQL Database Setup

The services use Hibernate's `ddl-auto: update` for schema auto-creation. Databases must exist:

```sql
CREATE DATABASE task_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE project_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE hr_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

These are created automatically by the MySQL container in compose.infra.yml.

## Quick Start

### Step 1: Build Docker Images

```powershell
# Build all service images
./mvnw clean package -DskipTests

# Dockerfile locations:
#   - api-gateway/Dockerfile
#   - auth-service/Dockerfile
#   - kms/Dockerfile
#   - hr-service/Dockerfile
#   - task-service/Dockerfile (create)
#   - project-service/Dockerfile (create)
#   - eureka-server/dockerfile
#   - frontend/Dockerfile
```

**Note**: Create Dockerfiles for task-service and project-service if they don't exist yet.

### Step 2: Start Full Stack

```powershell
# Start infrastructure, IAM, HR, business services, and gateway
.\run-full-stack.ps1

# Start with rebuild
.\run-full-stack.ps1 -Build

# Stop everything
.\run-full-stack.ps1 -Down

# View logs
docker compose -f compose.infra.yml -f compose.iam.yml -f compose.hr.yml -f compose.business.yml -f compose.edge.yml logs -f
```

### Step 3: Wait for Services to Be Healthy

```powershell
# Monitor health of all 7 endpoints
.\wait-for-health.ps1

# Custom timeout (default 300 seconds)
.\wait-for-health.ps1 -Timeout 600

# Output:
# Checking endpoints (remaining seconds: 290)
# OK: http://localhost:8761/
# OK: http://localhost:8080/
# OK: http://localhost:8081/actuator/health
# OK: http://localhost:9000/.well-known/jwks.json
# OK: http://localhost:8082/actuator/health
# OK: http://localhost:8083/api/tasks/health
# OK: http://localhost:8084/api/projects/health
# All endpoints healthy.
```

### Step 4: Run End-to-End Tests

```powershell
# Execute 3-phase test: health checks → auth flow → protected API calls
.\smoke-test-e2e.ps1

# Output:
# Phase 1: Health Checks
#   ✓ All services operational
# Phase 2: Register & Login
#   ✓ User registered: testuser123@example.com
#   ✓ Login successful: JWT token received
# Phase 3: Protected API Access
#   ✓ Gateway accepted JWT token
#   ✓ Auth headers injected
#   ✓ HR service responded
# SUCCESS: All tests passed
```

## Testing Individual Services

### Task Service (Port 8083)

```bash
# Create task
curl -X POST http://localhost:8083/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Implement authentication",
    "description": "Add JWT validation to task service",
    "status": "OPEN",
    "assigneeId": 1,
    "projectId": 1
  }'

# List all tasks
curl http://localhost:8083/api/tasks

# Get task by ID
curl http://localhost:8083/api/tasks/1

# Filter by project
curl http://localhost:8083/api/tasks/project/1

# Filter by status
curl http://localhost:8083/api/tasks/status/IN_PROGRESS

# Health check
curl http://localhost:8083/api/tasks/health
```

### Project Service (Port 8084)

```bash
# Create project
curl -X POST http://localhost:8084/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "HR System Modernization",
    "description": "Upgrade legacy HR to microservices",
    "status": "ACTIVE",
    "leadId": 1
  }'

# List all projects
curl http://localhost:8084/api/projects

# Get project by ID
curl http://localhost:8084/api/projects/1

# Filter by status
curl http://localhost:8084/api/projects/status/ACTIVE

# Health check
curl http://localhost:8084/api/projects/health
```

### Through API Gateway (With JWT)

```bash
# 1. Register user
curl -X POST http://localhost:8080/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'

# 2. Login to get JWT
RESPONSE=$(curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }')

TOKEN=$(echo $RESPONSE | jq -r '.token')

# 3. Call task service through gateway
curl http://localhost:8080/api/tasks \
  -H "Authorization: Bearer $TOKEN"

# 4. Create task through gateway
curl -X POST http://localhost:8080/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Implement caching",
    "description": "Add Redis caching to task service",
    "status": "OPEN",
    "assigneeId": 1,
    "projectId": 1
  }'
```

## Troubleshooting

### Services Won't Start

```powershell
# Check Docker daemon
docker ps

# View logs
docker compose -f compose.infra.yml -f compose.business.yml logs task-service
docker compose -f compose.infra.yml -f compose.business.yml logs project-service

# Check port conflicts
netstat -ano | findstr :8083
netstat -ano | findstr :8084
```

### Health Checks Timing Out

```powershell
# Increase timeout
.\wait-for-health.ps1 -Timeout 600 -Interval 3

# Check service logs
docker logs task-service
docker logs project-service

# Check MySQL availability
docker compose -f compose.infra.yml logs mysql
```

### Database Connection Errors

```sql
-- Connect to MySQL container
docker exec -it mysql mysql -uroot -ppassword

-- Check databases exist
SHOW DATABASES;

-- Verify tables created
USE task_db;
SHOW TABLES;

USE project_db;
SHOW TABLES;
```

## Service Dependencies

```
Task Service (8083) depends on:
├─ MySQL (database)
├─ Eureka (registration)
└─ Auth Service (token validation via gateway)

Project Service (8084) depends on:
├─ MySQL (database)
├─ Eureka (registration)
└─ Auth Service (token validation via gateway)

API Gateway (8080) depends on:
├─ Auth Service (JWT validation)
├─ KMS Service (JWKS endpoint)
├─ Eureka (service discovery)
├─ Task Service (routing)
├─ Project Service (routing)
├─ HR Service (routing)
└─ Redis (token blacklist cache)
```

## Monitoring & Observability

### Prometheus Metrics (9090)
- Navigate to http://localhost:9090
- Query: `requests_total{job="task-service"}`
- Query: `http_request_duration_seconds{service="project-service"}`

### Grafana Dashboards (3000)
- Default login: admin/admin
- Import dashboards for task/project services
- Monitor task creation rate, project completion rate

### Logs
```powershell
# Real-time logs
docker compose -f compose.infra.yml -f compose.business.yml -f compose.edge.yml logs -f

# Logs for specific service
docker compose -f compose.business.yml logs -f task-service
docker compose -f compose.business.yml logs -f project-service

# Last 50 lines
docker compose logs --tail=50 task-service
```

### Service Discovery (Eureka)
- Navigate to http://localhost:8761
- Verify all 7 services registered:
  - eureka-peer1
  - api-gateway
  - auth-service
  - kms
  - hr-service
  - task-service (NEW)
  - project-service (NEW)

## Next Steps

1. **Load Testing**
   - Use Postman collections to stress-test task/project endpoints
   - Monitor CPU, memory, connection pool usage

2. **Service-to-Service Communication**
   - Add task-project foreign key validation
   - Implement task→project lookups for consistency

3. **Event Publishing**
   - Publish task creation events to message queue
   - Subscribe to project status changes

4. **Advanced Caching**
   - Cache project list by status
   - Cache task counts per project

5. **Security Hardening**
   - Add rate limiting per user
   - Implement task assignment authorization

6. **Database Optimization**
   - Add indexes on frequently queried columns
   - Implement pagination for large result sets

## Reference Commands

```bash
# Build entire project
./mvnw clean package -DskipTests

# Build task-service only
./mvnw clean package -DskipTests -pl task-service

# Start Eureka
docker compose -f compose.infra.yml up -d eureka-peer1

# Full stack startup
./run-full-stack.ps1

# Wait for health
./wait-for-health.ps1

# Run tests
./smoke-test-e2e.ps1

# Cleanup
./run-full-stack.ps1 -Down
docker compose -f compose.infra.yml -f compose.business.yml down
```

---

*Deployment Guide for Phase 1: Docker Integration & Service Orchestration*
*All Services Ready for Containerized Deployment*
