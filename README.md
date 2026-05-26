# hr-microservices-spring-core

## Chay rieng cum Eureka de chia se cho nguoi khac

Muc tieu: tach nho phan Discovery de team khac co the clone va chay nhanh ma khong can khoi dong toan bo he thong.

### Thanh phan da duoc tach

- 3 peer Eureka Server: eureka-peer1 (8761), eureka-peer2 (8762), eureka-peer3 (8763)
- HAProxy cho diem vao duy nhat: 8760
- Dashboard HAProxy: 8404

File dung de chay rieng: [eureka-compose.yml](eureka-compose.yml)

### Lenh chay

1. Khoi dong cum Eureka:

```powershell
docker-compose -f eureka-compose.yml up -d --build
```

2. Kiem tra trang thai:

```powershell
docker-compose -f eureka-compose.yml ps
```

3. Xem log nhanh:

```powershell
docker-compose -f eureka-compose.yml logs -f eureka-peer1
```

4. Dung cum Eureka:

```powershell
docker-compose -f eureka-compose.yml down
```

### Endpoint cho nguoi dung tich hop

- Peer dashboard:
	- http://localhost:8761
	- http://localhost:8762
	- http://localhost:8763
- Load balancer endpoint: https://localhost:8760
- Eureka credentials: cau hinh qua bien moi truong trong file .env

### Chuoi defaultZone goi y cho service client

```text
http://${EUREKA_USERNAME}:${EUREKA_PASSWORD}@localhost:${EUREKA_PEER1_PORT}/eureka/,http://${EUREKA_USERNAME}:${EUREKA_PASSWORD}@localhost:${EUREKA_PEER2_PORT}/eureka/,http://${EUREKA_USERNAME}:${EUREKA_PASSWORD}@localhost:${EUREKA_PEER3_PORT}/eureka/
```

Neu chay client trong Docker network cung ten compose, co the dung hostname peer:

```text
http://${EUREKA_USERNAME}:${EUREKA_PASSWORD}@eureka-peer1:${EUREKA_PEER1_PORT}/eureka/,http://${EUREKA_USERNAME}:${EUREKA_PASSWORD}@eureka-peer2:${EUREKA_PEER2_PORT}/eureka/,http://${EUREKA_USERNAME}:${EUREKA_PASSWORD}@eureka-peer3:${EUREKA_PEER3_PORT}/eureka/
```

## Bao mat va pre-commit

Su dung file .env.example lam mau, sau do tao file .env rieng cho may local.

Bat hook de quet secret truoc khi commit:

```powershell
git config core.hooksPath .githooks
```

Kiem tra thu cong:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/scan-secrets.ps1
```

## Chay full stack (neu can)

```powershell
docker-compose -f microservices-compose.yml up -d --build
```

## Chay theo cum de giam anh huong cheo

Da co san bo file compose tach theo cum tai root:

- compose.infra.yml (eureka-peer1, haproxy, redis, prometheus, grafana)
- compose.iam.yml (auth-service, kms-service, auth-postgres)
- compose.hr.yml (hr-service, hr-mysql)
- compose.edge.yml (api-gateway, frontend)

Huong dan day du thao tac up/down/build theo tung cum:

- COMPOSE-SPLIT-RUNBOOK.md