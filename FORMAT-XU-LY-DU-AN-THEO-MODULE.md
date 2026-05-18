# FORMAT XU LY DU AN THEO MODULE

Muc tieu: chia cong viec dang do thanh tung module nho, xu ly theo thu tu, moi module co dau ra va dieu kien done ro rang.

## 0) Trang thai build hien tai

- Build command: ./mvnw clean install -DskipTests
- Ket qua: BUILD SUCCESS
- Tong thoi gian: 01:37
- Ghi chu: Build pass, nhung van con nhom can hardening (warning deprecation, null-safety warning trong IDE, route security review, E2E tests).

## 1) Nguyen tac thuc thi

- Lam theo thu tu: Foundation -> Security/Gateway -> Auth/KMS -> HR -> Observability -> Business services.
- Moi module phai co:
  - Input
  - Output
  - Checklist fix
  - Done condition
  - Lenh verify
- Khong mo module sau neu module truoc chua co ket qua verify toi thieu.

## 2) Mau card module

### [MODULE-NAME]
- Muc tieu:
- Input:
- Van de hien tai:
  -
- Viec can lam:
  1.
  2.
  3.
- Output mong doi:
- Done condition:
  - [ ]
  - [ ]
- Lenh verify:
  -
- Trang thai: Todo | Doing | Done | Blocked
- Owner:
- ETA:

## 3) Backlog theo module (de xai ngay)

### M01 - Build and Dependency Hygiene
- Muc tieu: giu build on dinh va warning quan trong duoc kiem soat.
- Input: root pom + module pom.
- Van de hien tai:
  - Sonar Maven plugin chua pin version trong root pom.
  - Deprecation warning MockBean trong test eureka.
- Viec can lam:
  1. Pin version cho sonar-maven-plugin trong root pom.
  2. Lap ticket thay MockBean de phu hop huong cap nhat Spring Boot.
- Output mong doi: build clean hon, giam canh bao ky thuat.
- Done condition:
  - [ ] Root pom co plugin version ro rang.
  - [ ] Co plan xu ly deprecation warning.
- Lenh verify:
  - ./mvnw -q -DskipTests clean install

### M02 - API Gateway Security Hardening
- Muc tieu: chot full bo bao ve route va auth flow.
- Input: JwtAuthFilter, HmacSecurityFilter, HeaderSanitizationFilter, route metadata.
- Van de hien tai:
  - Can ra soat null-safe va non-null contract trong gateway filters.
  - Can chot metadata public/protected/internal cho route.
- Viec can lam:
  1. Chuan hoa null-safe cho remoteAddress/getStatusCode/getAttribute.
  2. Chot danh sach route can JWT, route public, route internal.
  3. Chot behavior loi 401/403/429 nhat quan.
- Output mong doi: gateway la diem chan duy nhat, khong hở route.
- Done condition:
  - [ ] Route matrix duoc chot va ap dung.
  - [ ] Test auth qua gateway pass (token hop le/khong hop le/revoked).
  - [ ] Header spoofing bi chan.
- Lenh verify:
  - ./mvnw -f api-gateway/pom.xml -DskipTests clean install
  - Smoke qua postman collection gateway/auth

### M03 - Auth Service Token Lifecycle
- Muc tieu: issue/verify/revoke token on dinh va claim mapping nhat quan.
- Input: AuthService + AuthController + user sync outbox.
- Van de hien tai:
  - Can chot mapping claim role/roles giua auth va gateway/service con.
- Viec can lam:
  1. Chuan hoa claim role/roles.
  2. Verify logout/revoke blacklist flow.
  3. Recheck password policy va account lock logic.
- Output mong doi: token lifecycle ro rang va dung contract.
- Done condition:
  - [ ] Login -> verify -> logout -> token bi chan pass.
  - [ ] Claim role/roles thong nhat tren gateway va HR.
- Lenh verify:
  - ./mvnw -f auth-service/pom.xml -DskipTests clean install

### M04 - KMS and JWKS Reliability
- Muc tieu: dam bao signing va JWKS phuc vu gateway/auth on dinh.
- Input: KMS service + JWKS endpoint + cache config.
- Van de hien tai:
  - Can verify do on dinh khi goi dong thoi.
- Viec can lam:
  1. Recheck healthcheck/start_period cho KMS.
  2. Test burst verify token tu gateway.
  3. Xac nhan cache TTL hop ly.
- Output mong doi: KMS khong la bottleneck khi traffic tang.
- Done condition:
  - [ ] JWKS endpoint tra loi on dinh.
  - [ ] Auth/Gateway verify khong bi timeout bat thuong.
- Lenh verify:
  - ./mvnw -f kms/pom.xml -DskipTests clean install

### M05 - HR Service Authorization and Sync
- Muc tieu: endpoint HR duoc bao ve dung muc, sync Auth -> HR dung luong.
- Input: SecurityValidator + HR controllers + sync endpoint.
- Van de hien tai:
  - Can chot test bao ve endpoint theo role thuc te.
  - Can test sync duong noi bo theo event.
- Viec can lam:
  1. Ma tran quyen cho tung endpoint HR.
  2. Test sync internal secret + idempotency.
  3. Test error path (invalid secret, duplicate event, invalid userId).
- Output mong doi: HR an toan va dong bo user dung.
- Done condition:
  - [ ] Endpoint admin bi chan khi role khong du.
  - [ ] Sync endpoint pass ca happy path va duplicate path.
- Lenh verify:
  - ./mvnw -f hr-service/pom.xml -DskipTests clean install

### M06 - Compose and Runtime Orchestration
- Muc tieu: startup full stack theo thu tu on dinh, giam false unhealthy.
- Input: compose.infra/iam/hr/edge.
- Van de hien tai:
  - Service startup time khong dong deu.
- Viec can lam:
  1. Chot thu tu run: infra -> iam -> hr -> edge.
  2. Chinh healthcheck va start_period cho service cham.
  3. Chot checklist runbook full stack.
- Output mong doi: len stack mot lan, it fail phu thuoc.
- Done condition:
  - [ ] Full stack boot on dinh 2 lan lien tiep.
  - [ ] Khong con false unhealthy o service chinh.
- Lenh verify:
  - docker compose -f compose.infra.yml up -d --build
  - docker compose -f compose.iam.yml up -d --build
  - docker compose -f compose.hr.yml up -d --build
  - docker compose -f compose.edge.yml up -d --build

### M07 - Observability and Alert Baseline
- Muc tieu: metric va dashboard dung cho theo doi trien khai.
- Input: Prometheus + Grafana dashboards.
- Van de hien tai:
  - Can xac nhan metric day du tu tat ca service.
- Viec can lam:
  1. Check scrape targets.
  2. Chot dashboard 429/5xx/latency.
  3. Chot nguong alert co ban.
- Output mong doi: nhin dashboard biet ngay service bat on.
- Done condition:
  - [ ] Dashboard co du du lieu runtime.
  - [ ] Co nguong canh bao toi thieu.
- Lenh verify:
  - curl.exe http://localhost:9090/-/healthy
  - curl.exe http://localhost:3001/api/health

### M08 - Business Services Scaffold (Task/Project)
- Muc tieu: bat dau nghiep vu sau khi core on dinh.
- Input: architecture va route naming hien tai.
- Van de hien tai:
  - Chua co module Task/Project service rieng.
- Viec can lam:
  1. Tao skeleton service + Dockerfile + compose entry.
  2. Dinh nghia API toi thieu cho create/list/update.
  3. Gan auth contract qua gateway headers.
- Output mong doi: co bo khung nghiep vu de phat trien tiep.
- Done condition:
  - [ ] Service chay duoc qua gateway.
  - [ ] Co it nhat 1 luong CRUD toi thieu pass.
- Lenh verify:
  - Module build pass
  - Route smoke pass qua gateway

## 4) Thu tu xu ly de xuat (thuc thi)

1. M01
2. M02
3. M03
4. M04
5. M05
6. M06
7. M07
8. M08

## 5) Mau cap nhat nhanh sau moi module

- Module:
- Da xong:
- Chua xong:
- Blocker:
- Quyet dinh ky thuat:
- Lenh verify da chay:
- Ket qua:
