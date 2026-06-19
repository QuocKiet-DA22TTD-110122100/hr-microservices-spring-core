# COMPOSE SPLIT RUNBOOK

Ngay cap nhat: 2026-05-14
Pham vi tach cum:
- compose.infra.yml: eureka-peer1, haproxy, redis, prometheus, grafana, jaeger
- compose.iam.yml: auth-service, kms-service, auth-postgres
- compose.hr.yml: hr-service, hr-mysql
- compose.edge.yml: api-gateway, frontend
- compose.business.yml: project-service, task-service, business-mysql

## 1) Khoi dong theo thu tu

Bat buoc chay dung thu tu. Moi buoc doi healthy truoc khi sang buoc tiep.

### Buoc 1 - Infra (tao network + redis + eureka)

```bash
docker compose -f compose.infra.yml up -d --build
# Doi eureka-peer1 healthy (~120s)
docker compose -f compose.infra.yml ps
```

### Buoc 2 - IAM (kms + auth)

```bash
docker compose -f compose.iam.yml up -d --build
# kms phu thuoc redis + eureka (restart on-failure tu xu ly)
# auth phu thuoc postgres + kms
docker compose -f compose.iam.yml ps
```

### Buoc 3 - HR

```bash
docker compose -f compose.hr.yml up -d --build
docker compose -f compose.hr.yml ps
```

### Buoc 4 - Edge (gateway + frontend)

```bash
docker compose -f compose.edge.yml up -d --build
docker compose -f compose.edge.yml ps
```

### Buoc 5 - Business (optional)

```bash
docker compose -f compose.business.yml up -d --build
docker compose -f compose.business.yml ps
```

## 2) Kiem tra nhanh toan bo

```bash
docker compose -f compose.infra.yml ps
docker compose -f compose.iam.yml ps
docker compose -f compose.hr.yml ps
docker compose -f compose.edge.yml ps
docker compose -f compose.business.yml ps
```

## 3) Build/rerun theo thay doi de giam anh huong cheo

- Neu sua auth/kms:

```bash
docker compose -f compose.iam.yml up -d --build auth-service kms-service
docker compose -f compose.edge.yml up -d --build api-gateway
```

- Neu sua hr-service:

```bash
docker compose -f compose.hr.yml up -d --build hr-service
```

- Neu sua frontend:

```bash
docker compose -f compose.edge.yml up -d --build frontend
```

## 4) Xem log theo cum

```bash
docker compose -f compose.infra.yml logs -f eureka-peer1 redis
docker compose -f compose.iam.yml logs -f kms-service auth-service
docker compose -f compose.hr.yml logs -f hr-service
docker compose -f compose.edge.yml logs -f api-gateway
```

## 5) Dung theo cum (nguoc thu tu)

```bash
docker compose -f compose.business.yml down
docker compose -f compose.edge.yml down
docker compose -f compose.hr.yml down
docker compose -f compose.iam.yml down
docker compose -f compose.infra.yml down
```

## 6) Luu y quan trong

- Chay dung thu tu INFRA -> IAM -> HR -> EDGE -> BUSINESS.
- compose.iam.yml, compose.hr.yml, compose.edge.yml, compose.business.yml dung network external microservices-network.
- Neu da down infra va can tao lai network:

```bash
docker network create microservices-network
```

- kms-service va auth-service dung `restart: on-failure` de tu dong retry khi infra chua san sang.
- start_period cua Spring Boot services la 120s, doi du thoi gian truoc khi check health.
- hr-mysql dung root user (HR_DB_USERNAME=root trong .env).
- task-service chay tren port 8087 (khong conflict voi kms-service port 8083).
