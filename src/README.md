# Thu muc ma nguon do an

Thu muc `src/` chua ban ma nguon dung de nop do an theo yeu cau cua nha truong.

## Cau truc ma nguon

- `frontend/`: ung dung web React/Vite/TypeScript.
- `api-gateway/`: Spring Cloud Gateway, diem vao API.
- `auth-service/`: xac thuc, JWT, RBAC va tai khoan.
- `hr-service/`: quan ly nhan su.
- `project-service/`: quan ly du an.
- `task-service/`: quan ly cong viec.
- `eureka-server/`: service discovery.
- `kms/`: module ho tro bao mat/khoa neu kich hoat.
- `docker/`: seed database va file ho tro container.
- `haproxy/`: cau hinh load balancer.
- `observability/`: Prometheus, Grafana va theo doi he thong.
- `postman/`: collection/API test.
- `scripts/`: script ho tro seed, smoke test va van hanh.
- `tools/`: cong cu tao/tong hop tai lieu.
- `project-docs/`: tai lieu ky thuat noi bo cua du an.
- `database/`: chi muc vi tri schema va seed SQL.

## File cau hinh chay he thong

Trong thu muc nay co ban sao cac file quan trong:

- `pom.xml`, `mvnw`, `mvnw.cmd`
- `microservices-compose.yml`
- `compose.minimal.yml`
- `compose.backend.yml`
- `compose.frontend.yml`
- `Dockerfile.base`
- `run-full-stack.ps1`

## Ghi chu

Ban goc cac module van duoc giu o root repository de dam bao cac lenh Docker/Maven hien tai khong bi gay. Thu muc `src/` la ban dong goi dung cho yeu cau nop do an: "src chua ma nguon".
