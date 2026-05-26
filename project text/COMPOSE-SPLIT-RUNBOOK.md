# COMPOSE SPLIT RUNBOOK

Ngay cap nhat: 2026-04-08
Pham vi tach cum:
- compose.infra.yml: eureka-peer1, haproxy, redis, prometheus, grafana
- compose.iam.yml: auth-service, kms-service, auth-postgres
- compose.hr.yml: hr-service, hr-mysql
- compose.edge.yml: api-gateway, frontend

## 1) Khoi dong theo thu tu

1. Khoi dong cum infra (tao network chung microservices-network):

```powershell
docker compose -f compose.infra.yml up -d --build
```

2. Khoi dong IAM:

```powershell
docker compose -f compose.iam.yml up -d --build
```

3. Khoi dong HR:

```powershell
docker compose -f compose.hr.yml up -d --build
```

4. Khoi dong EDGE (gateway + frontend):

```powershell
docker compose -f compose.edge.yml up -d --build
```

## 2) Build/rerun theo thay doi de giam anh huong cheo

- Neu sua auth/kms:

```powershell
docker compose -f compose.iam.yml up -d --build auth-service kms-service
docker compose -f compose.edge.yml up -d --build api-gateway
```

- Neu sua hr-service:

```powershell
docker compose -f compose.hr.yml up -d --build hr-service
docker compose -f compose.edge.yml up -d --build api-gateway
```

- Neu sua frontend:

```powershell
docker compose -f compose.edge.yml up -d --build frontend
```

## 3) Kiem tra nhanh

```powershell
docker compose -f compose.infra.yml ps
docker compose -f compose.iam.yml ps
docker compose -f compose.hr.yml ps
docker compose -f compose.edge.yml ps
```

## 4) Xem log theo cum

```powershell
docker compose -f compose.infra.yml logs -f eureka-peer1 haproxy prometheus grafana
docker compose -f compose.iam.yml logs -f auth-service kms-service auth-postgres
docker compose -f compose.hr.yml logs -f hr-service hr-mysql
docker compose -f compose.edge.yml logs -f api-gateway frontend
```

## 5) Dung theo cum

```powershell
docker compose -f compose.edge.yml down
docker compose -f compose.hr.yml down
docker compose -f compose.iam.yml down
docker compose -f compose.infra.yml down
```

## 6) Luu y quan trong

- Chay dung thu tu INFRA -> IAM -> HR -> EDGE de han che loi dependency luc startup.
- compose.iam.yml, compose.hr.yml, compose.edge.yml dung network external microservices-network.
- Neu da down infra va can tao lai network truoc khi up cum khac:

```powershell
docker network create microservices-network
```
