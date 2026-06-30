# TIEN TRINH DU AN

Tai lieu nay dung de theo doi va dieu phoi tien trinh phat trien du an
`hr-microservices-spring-core`. Muc tieu la co mot quy trinh ngan gon,
de cap nhat hang ngay, va bam theo kien truc microservices hien co.

## 1) Muc tieu du an

- Xay dung he thong HR workspace noi bo gom auth, phan quyen, nhan su,
  phong ban, project, task va cac workflow lien quan.
- Dam bao client di qua `api-gateway`, khong goi truc tiep service noi bo.
- Tach service ro rang: `eureka-server`, `api-gateway`, `auth-service`,
  `kms`, `hr-service`, `project-service`, `task-service`, `frontend`.
- Co kha nang chay local bang Docker Compose va kiem thu smoke qua gateway.

## 2) Tai lieu lien quan

- Backlog tong: `docs/JIRA-BACKLOG.md`
- Hang doi P0: `P0-EXECUTION-QUEUE.md`
- Mau theo doi trien khai: `docs/FORMAT-TRIEN-KHAI-DU-AN.md`
- Checklist deploy: `docs/DEPLOYMENT-CHECKLIST.md`
- Huong dan tich hop: `docs/INTEGRATION-GUIDE.md`
- Mo ta san pham: `PRODUCT.md`

## 3) Phase trien khai

### Phase 1 - Foundation

Muc tieu: on dinh nen tang repository, discovery, gateway va compose.

Task uu tien:

- P0-01: Chuan hoa repository structure.
- P0-02: Boot Eureka server.
- P0-03: Boot API Gateway.
- P0-04: Split compose by layer.

Dieu kien xong:

- Moi service nam dung thu muc rieng.
- Eureka dashboard mo duoc.
- Gateway route duoc request public/protected.
- Co the chay theo lop infra -> iam -> hr -> edge.

### Phase 2 - IAM, JWT va KMS

Muc tieu: hoan thien dang ky, dang nhap, token, verify token va key signing.

Task uu tien:

- P0-05 -> P0-10: user entity, password hashing, register, login, JWT,
  validate token.
- P0-11 -> P0-13: KMS, JWKS public endpoint, sign endpoint.
- P0-19 -> P0-23: gateway filter, route metadata, rate limit, header
  sanitization, token blacklist.

Dieu kien xong:

- Login tra token hop le.
- Gateway chan request khong co token o route protected.
- JWKS verify duoc token.
- Internal header/secret khong bi spoof tu client.

### Phase 3 - HR Core

Muc tieu: hoan thien domain nhan su va phong ban.

Task uu tien:

- P0-14: Design employee entity.
- P0-15: Design department entity.
- P0-16: CRUD employee.
- P0-17: CRUD department.
- P0-18: Internal sync endpoint auth -> hr.

Dieu kien xong:

- Employee/department CRUD chay on dinh.
- Sync user tu auth sang HR tao/update mapping dung.
- Endpoint noi bo co guard bang internal secret hoac co che tuong duong.

### Phase 4 - Frontend va Business Flow

Muc tieu: tao trai nghiem lam viec HR tap trung, ro role va quyen.

Task uu tien:

- Dang nhap/dang ky qua gateway.
- Dieu huong theo role va permission.
- Man hinh nhan vien, phong ban, project, task.
- Loading, empty, error state cho cac workflow chinh.

Dieu kien xong:

- Frontend chi goi API qua gateway.
- Role/permission context hien thi ro nhung khong gay nhieu.
- Loi API duoc hien thi de nguoi dung hieu va thao tac tiep.

### Phase 5 - Observability, Test va Release Readiness

Muc tieu: dua he thong ve trang thai co the demo/deploy an toan.

Task uu tien:

- Healthcheck cho tung service.
- Log va metrics co the xem duoc.
- Smoke test qua gateway.
- Checklist deploy va rollback.

Dieu kien xong:

- Build backend va frontend pass.
- Docker Compose chay duoc theo thu tu.
- Smoke test login, verify token, HR CRUD va route protection pass.
- Khong co secret bi commit vao repo.

## 4) Quy trinh lam viec moi task

Moi task nen di theo 7 buoc:

1. Xac dinh ticket trong `P0-EXECUTION-QUEUE.md` hoac `docs/JIRA-BACKLOG.md`.
2. Kiem tra dependency cua ticket da xong chua.
3. Doc code/service lien quan truoc khi sua.
4. Sua trong pham vi nho nhat co the.
5. Chay test/build lien quan.
6. Cap nhat tai lieu neu hanh vi, endpoint, bien moi truong hoac lenh chay doi.
7. Tao commit/PR rieng cho ticket do.

Definition of Done:

- Code build duoc.
- Test lien quan pass hoac co ghi chu ro neu chua chay duoc.
- Endpoint moi co validate/error response can thiet.
- Service khong pha hop dong API cua service khac.
- Tai lieu runbook/checklist duoc cap nhat neu can.

## 5) Quy trinh chay local

### Chay rieng Eureka cluster

```powershell
docker-compose -f eureka-compose.yml up -d --build
docker-compose -f eureka-compose.yml ps
```

### Chay full stack

```powershell
docker-compose -f microservices-compose.yml up -d --build
```

### Chay theo lop

Thu tu khuyen nghi:

1. Infra: Eureka, Redis, Prometheus, Grafana, HAProxy.
2. IAM: KMS, Auth, Postgres.
3. HR: HR service, MySQL.
4. Edge: API Gateway, Frontend.

Kiem tra sau khi chay:

- `GET /actuator/health` cua tung service tra OK.
- Eureka nhan du service can thiet.
- Gateway route duoc `/api/iam/*` va cac route business.
- Frontend khong goi truc tiep service noi bo.

## 6) Checklist chat luong truoc khi merge

Backend:

- [ ] Build Maven pass cho service bi anh huong.
- [ ] Unit/integration test lien quan pass.
- [ ] Validation request va error response ro rang.
- [ ] Security rule khong mo nham endpoint protected/internal.

Frontend:

- [ ] Build frontend pass.
- [ ] Man hinh responsive o desktop va mobile co ban.
- [ ] Loading, empty, error state khong bi bo trong.
- [ ] Khong hardcode URL service noi bo.

Docker/Deploy:

- [ ] Compose file dung thu tu dependency.
- [ ] Bien moi truong moi co trong `.env.example` neu can.
- [ ] Healthcheck khong false-fail qua som.
- [ ] Log loi du de debug khi service fail start.

Security:

- [ ] Khong commit secret that.
- [ ] JWT/JWKS flow verify duoc.
- [ ] Internal endpoint co guard.
- [ ] Header noi bo duoc gateway sanitize.

## 7) Mau cap nhat tien do hang ngay

```md
### YYYY-MM-DD

- Da xong:
  - 
- Dang lam:
  - 
- Blocker:
  - 
- Ke tiep:
  - 
```

## 8) Trang thai hien tai

Ngay cap nhat: 2026-06-30

| Hang muc | Trang thai | Ghi chu |
|---|---|---|
| Repository structure | In progress | Da co cac service chinh va docs/backlog. |
| Eureka | In progress | Co `eureka-server` va `eureka-compose.yml`. |
| API Gateway | In progress | Co `api-gateway`, can xac nhan route/security. |
| Auth/KMS | In progress | Co `auth-service` va `kms`, can smoke test JWT/JWKS. |
| HR Service | In progress | Co `hr-service`, can xac nhan CRUD/sync. |
| Project/Task | In progress | Co `project-service` va `task-service`. |
| Frontend | In progress | Co `frontend`, can xac nhan goi API qua gateway. |
| Deployment | In progress | Co nhieu compose file va checklist. |

## 9) Ke hoach 7 ngay de day nhanh tien do

### Ngay 1

- Xac nhan cac compose file hien tai chay duoc theo thu tu.
- Chot danh sach endpoint public/protected/internal.

### Ngay 2

- Kiem tra va sua luong auth: register, login, verify token.
- Xac nhan JWKS va key signing tu KMS.

### Ngay 3

- Kiem tra gateway filter, route metadata, rate limit va header sanitization.
- Viet smoke test cho route public/protected.

### Ngay 4

- Kiem tra HR CRUD va sync auth -> HR.
- Chuan hoa validation va error response.

### Ngay 5

- Kiem tra frontend login, role navigation, employee/department screens.
- Dam bao frontend chi goi qua gateway.

### Ngay 6

- Chay full-stack smoke test.
- Cap nhat deployment checklist va cac bien moi truong.

### Ngay 7

- Fix bug con lai theo muc do uu tien.
- Chuan bi ban demo/release note ngan gon.
