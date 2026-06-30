# Thu muc ma nguon do an

Repository nay la du an microservices nen ma nguon duoc chia theo tung module tai root repository de giu nguyen kha nang build va chay bang Docker Compose.

## Cac module ma nguon

- `frontend/`: ung dung React/Vite chay giao dien web.
- `api-gateway/`: Spring Cloud Gateway.
- `auth-service/`: dich vu xac thuc, JWT, RBAC.
- `hr-service/`: dich vu quan ly nhan su.
- `project-service/`: dich vu quan ly du an.
- `task-service/`: dich vu quan ly cong viec.
- `eureka-server/`: service discovery.
- `kms/`: dich vu ho tro khoa/bao mat neu duoc kich hoat.
- `docker/`: seed database va cau hinh phu tro.
- `haproxy/`: cau hinh load balancer.
- `observability/`: Prometheus, Grafana va theo doi he thong.
- `postman/`: collection/API test.

## Co so du lieu

Xem `src/database/README.md` de biet vi tri cac file schema va seed SQL.

## Ly do khong di chuyen module vao thu muc nay

Neu di chuyen tat ca module vao `src/`, cac file `pom.xml`, Dockerfile, Docker Compose va script chay hien tai se phai doi duong dan hang loat. Vi vay thu muc nay dong vai tro chi muc nop do an, con ma nguon van giu o vi tri module goc de clone ve la chay duoc ngay.
