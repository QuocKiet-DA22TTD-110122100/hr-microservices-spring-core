# Phat trien ung dung Web quan ly cong viec nhom theo kien truc Microservices

Repository nop do an tot nghiep:

`tn-da22ttd-110122100-huynhquockiet-ptWebqlcvntkt-microservices`

## Muc tieu do an

Xay dung he thong web ho tro quan ly cong viec nhom, nhan su, du an, task, phan quyen nguoi dung va theo doi tien do theo kien truc Microservices. He thong huong den kha nang trien khai bang Docker, tach module ro rang va de mo rong.

## Kien truc tong quan

- Frontend: React, Vite, TypeScript.
- Backend: Java, Spring Boot, Spring Cloud.
- API Gateway: Spring Cloud Gateway.
- Service Discovery: Eureka Server.
- Dich vu nghiep vu: Auth Service, HR Service, Project Service, Task Service.
- Du lieu: PostgreSQL, MySQL, Redis.
- Hang doi/thong diep: RabbitMQ.
- Trien khai: Docker, Docker Compose, HAProxy.
- Theo doi: Prometheus, Grafana.

## Cau truc nop do an

- `docs/`: tai lieu do an, bao cao, PDF, slide, poster, huong dan su dung va video demo.
- `src/`: chua toan bo ma nguon do an, gom frontend, cac microservice backend, Docker, script, database seed va tai lieu ky thuat noi bo.
- `SUBMISSION_STRUCTURE.md`: mo ta chi tiet cau truc repository dung de nop.

## Chay nhanh bang Docker

```bash
docker compose -f microservices-compose.yml up -d --build
```

Truy cap:

- Frontend: http://localhost:3000
- API Gateway: http://localhost:8080
- Eureka: http://localhost:8761

Dung he thong:

```bash
docker compose -f microservices-compose.yml down
```

## Chay ban toi gian de demo

```bash
docker compose -f compose.minimal.yml up -d --build
```

## Ghi chu nop tai lieu

File bao cao `.docx` da duoc dat tai:

- `docs/01-report/tn-da22ttd-110122100-huynhquockiet-bao-cao.docx`

Can bo sung truoc khi nop:

- `docs/01-report/tn-da22ttd-110122100-huynhquockiet-bao-cao.pdf`
- `docs/02-slides/tn-da22ttd-110122100-huynhquockiet-slide-bao-ve.pptx`
- `docs/03-poster/tn-da22ttd-110122100-huynhquockiet-poster-a1.pdf`
- `docs/05-demo-video/demo-chuong-trinh.mp4` neu co yeu cau.

---

# Ghi chu ky thuat cu

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
