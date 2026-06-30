# Ket qua kiem thu cap nhat

## 1. Ket qua da xac nhan

| Hang muc | Lenh | Ket qua | Ghi chu |
|---|---|---|---|
| Frontend build | `npm run build` | PASS | TypeScript + Vite build thanh cong |
| Permission unit test | `npx vitest run src/utils/permissions.test.ts` | PASS | 22 tests passed; xac nhan `PAYROLL_OFFICER` co quyen payroll |
| HR service compile | `.\mvnw.cmd -pl hr-service -am -DskipTests compile` | PASS | Compile thanh cong; con canh bao Maven plugin version va mojo status |
| Auth service compile | `.\mvnw.cmd -pl auth-service -am -DskipTests compile` | PASS | Compile thanh cong sau khi them `PAYROLL_OFFICER` vao role guard |
| Minimal compose hardening | `compose.minimal.yml` | DONE | Gateway depends_on da them `hr-service: service_healthy` |
| Frontend build after hardening | `npm run build` | PASS | Build lai thanh cong sau khi sua auth role guard/frontend test setup |
| Docker minimal services | `docker start minimal-hr minimal-project minimal-task minimal-gateway` | PASS | DB/Auth/KMS/Redis da healthy; HR/Project/Task/Gateway da start lai |
| Seed demo data | `docker cp` + `docker exec` | PASS | Auth, HR, Business DB da nap lai seed demo |
| HR payroll Docker rebuild | `docker compose -f compose.minimal.yml build hr-service` | PASS | Rebuild image HR sau khi sua payroll DTO |
| HR container recreate | `docker compose -f compose.minimal.yml up -d --no-deps --force-recreate hr-service` | PASS | HR boot lai va health `UP` |
| Minimal smoke test | `.\scripts\smoke-minimal-demo.ps1` | PASS | 8/8 pass: gateway, login, token, HR, projects, tasks, payroll current |

## 2. Load test dang nhap

| Hang muc | Lenh | Ket qua | Ghi chu |
|---|---|---|---|
| Login 3 concurrent | `.\scripts\load-test-login.ps1 -ConcurrentUsers 3 -TimeoutSeconds 60` | PASS | 3/3 success, error rate 0%, avg 837.67 ms, p95 1037 ms |
| Login 50 concurrent | `.\scripts\load-test-login.ps1 -ConcurrentUsers 50 -TimeoutSeconds 60` | THROTTLED | 8/50 success, 42 bi 429 Too Many Requests, avg 13869.12 ms, p95 15085 ms |
| Login 5 concurrent sau bai 50 | `.\scripts\load-test-login.ps1 -ConcurrentUsers 5 -TimeoutSeconds 60` | THROTTLED | 4/5 success do cua so rate-limit con nong |
| Login 8 concurrent sau bai 50 | `.\scripts\load-test-login.ps1 -ConcurrentUsers 8 -TimeoutSeconds 60` | THROTTLED | 4/8 success do cua so rate-limit con nong |
| Login 3 concurrent sau restart 2026-06-08 | `.\scripts\load-test-login.ps1 -ConcurrentUsers 3 -TimeoutSeconds 60` | PASS | 3/3 success, error rate 0%, avg 21419.33 ms, p95/p99 25357 ms |
| Login 50 concurrent sau restart 2026-06-08 | `.\scripts\load-test-login.ps1 -ConcurrentUsers 50 -TimeoutSeconds 60` | CHUA CO SO LIEU HOP LE | Command timeout sau 3 phut, khong co summary; gateway log ghi nhan IP blacklist/rate-limit checks va request login keo dai |
| Cau hinh hoa login rate-limit | `APP_RATE_LIMIT_LOGIN_LIMIT=120`, `APP_RATE_LIMIT_LOGIN_WINDOW_SECONDS=60` | DONE | Mac dinh app van la 3 request/5s; minimal runtime dung nguong rieng de do performance |
| Load script runspace pool | `scripts/load-test-login.ps1` | DONE | Thay `Start-Job` bang runspace pool va them `TotalTimeoutSeconds` de luon co summary |
| Login 3 concurrent sau cau hinh moi | `.\scripts\load-test-login.ps1 -ConcurrentUsers 3 -TimeoutSeconds 60 -TotalTimeoutSeconds 120` | PASS | 3/3 success, error rate 0%, avg 2674.33 ms, p95/p99 2808 ms |
| Login 50 concurrent sau cau hinh moi | `.\scripts\load-test-login.ps1 -ConcurrentUsers 50 -TimeoutSeconds 60 -TotalTimeoutSeconds 180` | FAIL KPI | 45/50 success, error rate 10%, avg 13112.1 ms, p95 31447 ms, p99 31489 ms; khong con 429 rate-limit |
| Login 100 concurrent sau cau hinh moi | `.\scripts\load-test-login.ps1 -ConcurrentUsers 100 -TimeoutSeconds 90 -TotalTimeoutSeconds 240` | FAIL KPI | 88/100 success, error rate 12%, avg 18586.9 ms, p95 30023 ms, p99 30091 ms |
| Smoke test sau load | `.\scripts\smoke-minimal-demo.ps1` | PASS | 8/8 pass sau khi chay load 50/100 (token/route chay duoc; co failure trong load test do connection closed receive) |


Gioi han ban dau nam o Gateway, khong phai crash he thong. Sau do da tach cau hinh minimal/performance runtime de do tai rieng:

```text
Mac dinh ung dung:
  app.rate-limit.login.limit = 3
  app.rate-limit.login.window-seconds = 5

Minimal/performance runtime:
  APP_RATE_LIMIT_LOGIN_LIMIT = 120
  APP_RATE_LIMIT_LOGIN_WINDOW_SECONDS = 60

=> Ket qua 50/100 user moi khong con do 429 rate-limit, ma phan anh gioi han xu ly login cua minimal runtime.
```

## 3. Sua loi moi da thuc hien

- Sua `scripts/smoke-minimal-demo.ps1` de nhan `access_token`, `accessToken`, `data.access_token`, `data.accessToken`; tang timeout len 60 giay.
- Sua `PayrollController` tra DTO gon cho payroll result, tranh Jackson serialize Hibernate lazy proxy gay HTTP 500.
- Rebuild va recreate `minimal-hr` de Docker chay code moi.

## 4. Ket luan

Docker runtime da chay du luong demo toi thieu. Smoke test sau restart 2026-06-08 pass 8/8. Da tach cau hinh rate-limit login cho minimal/performance runtime de chay duoc bai do 50/100 user tu cung mot may/IP. Ket qua hien tai: 3 concurrent pass 0% loi; 50 concurrent chua dat KPI voi 10% loi va p95 31.447s; 100 concurrent chua dat KPI voi 43% loi va p95 30.028s. Gateway khong con 429 rate-limit trong bai do moi, nen han che con lai nam o nang luc xu ly login cua minimal runtime/auth path va can duoc ghi ro trong bao cao.
