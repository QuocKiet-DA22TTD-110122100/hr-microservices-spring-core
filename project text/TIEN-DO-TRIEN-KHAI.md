# TIEN DO TRIEN KHAI - HR MICROservices

Muc tieu: theo doi tien do trien khai thuc te theo tung lop he thong.
Ghi chu: Tai lieu nay chi dung de tracking tien do, KHONG phai tai lieu ban giao.

## 1) Tong quan

- Nguoi phu trach: Full-stack (tu trien khai va theo doi)
- Trang thai tong the: Dang trien khai theo thu tu cot loi truoc, nghiep vu sau
- Ngay cap nhat gan nhat: 2026-05-04

## 2) Tien do theo lop

### Infrastructure (Docker/Network/Compose)

- Da xong:
  - Da tach compose theo lop: `compose.infra.yml`, `compose.iam.yml`, `compose.hr.yml`, `compose.edge.yml`.
  - Da co Dockerfile cho cac service chinh.
  - Da dung network chung `microservices-network`.
- Dang lam:
  - Chuan hoa startup order va healthcheck theo tung cum.
- Ke tiep:
  - Gop runbook chay full stack theo 1 checklist thuc thi nhat quan.

### Service Discovery (Eureka)

- Da xong:
  - Da co Eureka server va cau hinh service client ket noi.
- Dang lam:
  - On dinh hoa kịch ban startup/peer theo moi truong dev.
- Ke tiep:
  - Chot bo test verify dang ky service end-to-end.

### API Gateway

- Da xong:
  - Da co gateway route va JWT filter.
  - Da truyen header noi bo `X-Auth-User`, `X-Auth-Role`, `X-Auth-Roles`.
- Dang lam:
  - Rà soat muc do bao ve route theo metadata (public/protected/internal).
- Ke tiep:
  - Chot bo test route va auth flow qua gateway.

### Auth + KMS

- Da xong:
  - Da co register/login/change password.
  - Da cap va verify/revoke JWT.
  - Da co KMS + JWKS cho verify token.
- Dang lam:
  - Chuan hoa claim mapping giua auth -> gateway -> service con.
- Ke tiep:
  - Hoan thien checklist test bao mat va token lifecycle.

### HR Service

- Da xong:
  - Da co HR API va guard noi bo (`X-Internal-Secret`).
  - Da co check role admin qua header auth.
- Dang lam:
  - Rà soat bao ve endpoint theo role thuc te.
- Ke tiep:
  - Chot test sync Auth -> HR trong luong thuc thi.

### Business Services (Task/Project)

- Da xong:
  - Chua co service rieng.
- Dang lam:
  - Chua bat dau.
- Ke tiep:
  - Khoi tao Task Service/Project Service sau khi khoi core on dinh.

### Observability

- Da xong:
  - Da co Prometheus + Grafana trong cum infra.
- Dang lam:
  - Kiem tra do day du metric tu cac service.
- Ke tiep:
  - Chot dashboard theo canh bao 429/5xx/latency.

## 3) Blocker va rui ro hien tai

- Startup time khong dong deu giua cac service de gay false unhealthy.
- Phu thuoc compose tach lop can chay dung thu tu.
- Chua co full regression test cho toan bo route bao ve.

## 4) Next sprint focus (de xuat)

1. Chot startup sequence + healthcheck on dinh cho toan bo cum.
2. Chay test E2E cho auth flow qua gateway.
3. Chot bo test sync Auth -> HR.
4. Bat dau scaffolding Task/Project service.

## 5) Mau cap nhat nhanh moi ngay

- Ngay:
- Da xong:
- Dang lam:
- Blocker:
- Ke tiep (24h toi):

## 6) Nhat ky cap nhat

### 2026-05-04

- Da xong:
  - Chot file theo doi tien do trung tam: `TIEN-DO-TRIEN-KHAI.md`.
  - Ra soat lai trang thai core stack (infra/discovery/gateway/auth+kms/hr) de dong bo note hien tai.
  - Chuyen huong tai lieu tu "ban giao" sang "tracking trien khai" dung voi mode full-stack.
- Dang lam:
  - Chuan hoa startup order va healthcheck de giam false unhealthy.
  - Ra soat route bao ve qua gateway theo metadata public/protected/internal.
  - Chuan hoa mapping claim JWT giua auth -> gateway -> service con.
- Blocker:
  - Startup time cua mot so service khong dong deu.
  - Chua co bo regression test day du cho tat ca route bao ve.
- Ke tiep (24h toi):
  - Chot checklist run full stack theo thu tu: infra -> iam -> hr -> edge.
  - Chay lai smoke test auth flow qua gateway va ghi ket qua vao note.
  - Chuan bi scaffold ban dau cho Task/Project service sau khi core on dinh.
