# STATUS NOTE - HR Microservices Spring Core

Tao file note nay de tong hop trang thai hien tai cua repo theo tung phan.

## 1) Infrastructure Setup

### Da lam
- Da co cac file compose tach rieng theo tang: `compose.infra.yml`, `compose.iam.yml`, `compose.edge.yml`, `compose.hr.yml`.
- Da co Dockerfile cho cac service chinh: `api-gateway`, `auth-service`, `kms`, `hr-service`, `frontend`, `eureka-server`.
- Da co Docker network chuyen dung `microservices-network` trong cac file compose tach.

### Dang do
- Chua co mot file compose tong duy nhat de chay full system bang 1 lenh.
- Chua xac minh day du `depends_on` giua toan bo service khi dong goi co may.

### Chua lam
- Chua bo sung day du cac bien moi truong/.env mau cho toan bo stack.
- Chua co step runbook hoan chinh cho build va up toan bo he thong.

## 2) Service Discovery

### Da lam
- Eureka Server da ton tai va co cau hinh peer/cluster.
- Cac service co cau hinh ket noi den Eureka trong compose.

### Dang do
- Chua kiem tra thuc te vi tri deploy/chu ky khoi dong cua toan bo peer Eureka trong full stack.

### Chua lam
- Chua co tai lieu test/verify discovery end-to-end cho tat ca service.

## 3) API Gateway

### Da lam
- Da co Spring Cloud Gateway.
- Da co `JwtAuthFilter` de kiem tra token va forward request.
- Da bo sung cac header noi bo nhu `X-Auth-User`, `X-Auth-Role`, `X-Auth-Roles`.
- Da co logic chan token bi thu hoi va verify JWT.

### Dang do
- Can kiem tra them cac route metadata va muc do bao ve tung route.
- Can xac minh gateway phu hop voi tat ca luong frontend/backend hien co.

### Chua lam
- Chua thay bo test route day du cho toan bo endpoint trong repo.

## 4) Auth Service

### Da lam
- Da co register, login, change password.
- Da hash password bang Argon2.
- Da cap JWT qua KMS va co verify/revoke token.
- Da co outbox/DLQ cho sync user sang HR.
- Da co policy mat khau va lock account sau that bai dang nhap.

### Dang do
- Can kiem tra lai cach mapping claim JWT giua auth/gateway/service con.
- Can xac minh cac endpoint auth da duoc goi dung tu frontend/gateway.

### Chua lam
- Chua thay bo tach module RBAC ro rang theo user/role/permission nhu mo ta ban dau.
- Chua co test bao phu het cac case phan quyen.

## 5) HR Service

### Da lam
- Da co cac controller va repository cho HR domain.
- Da co `SecurityValidator` kiem tra `X-Internal-Secret`.
- Da co check role admin tu `X-Auth-Role` va `X-Auth-Roles`.
- Da co compose rieng voi MySQL.

### Dang do
- Can xac minh tat ca endpoint HR da duoc bao ve dung muc do can thiet.
- Can kiem tra sync giua auth va HR trong luong thuc te.

### Chua lam
- Chua co thong tin ve rate limit, cache hay observability cho HR service trong note hien tai.

## 6) KMS

### Da lam
- Da co KMS service rieng de sign JWT.
- Da co JWKS/public endpoint de verify token.
- Da co cache hai lop trong service KMS.

### Dang do
- Can kiem tra luong goi tu auth-service va gateway co on dinh khi run dong thoi hay khong.

### Chua lam
- Chua co tai lieu test/benchmark cho KMS khi full stack chay.

## 7) Business Services

### Da lam
- Da co HR domain service.

### Dang do
- Chua co Task Service rieng.
- Chua co Project Service rieng.

### Chua lam
- Chua xay dung module business theo dung mo ta Node.js Task/Project service.
- Chua co CRUD/assign/status flow cho task/project.

## 8) Observability

### Da lam
- Da co mot so thanh phan metrics/monitoring trong stack compose rieng.
- Da co Prometheus va Grafana trong `compose.infra.yml`.

### Dang do
- Can kiem tra dashboard/metric co du data tu cac service hay khong.

### Chua lam
- Chua co note/verify day du cho tracing, alerting, log correlation.

## 9) Frontend

### Da lam
- Da co frontend project va Dockerfile.
- Da co gateway/frontend compose rieng.

### Dang do
- Can kiem tra frontend dang consume API qua gateway dung route chua.

### Chua lam
- Chua co danh gia UI/flow end-to-end trong note nay.

## 10) Ket luan ngan

- Cac lop core da co: Discovery, Gateway, Auth, KMS, HR, Docker split compose.
- Cac lop con dang thieu: compose tong full-stack, Task Service, Project Service, test/verify end-to-end.
- Trang thai hien tai phu hop voi quy trinh "cot loi truoc, nghiep vu sau", nhung chua phai hoan chinh full microservices.
