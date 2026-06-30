# Next steps when Docker is ready

Run these commands from the repository root, in order.

## 1. Check Docker access

```powershell
docker ps
docker compose version
```

Expected:

- Commands return without `permission denied`.

## 2. Start minimal demo stack

```powershell
.\scripts\run-minimal-demo.ps1 -Build
```

Expected:

- KMS, Auth, HR, Project, Task, Gateway health checks pass.
- Auth/HR/Business seed files are applied.

## 3. Start frontend

```powershell
cd frontend
npm run dev -- --host 127.0.0.1 --port 5173
```

Open:

```text
http://127.0.0.1:5173
```

## 4. Run smoke test

```powershell
.\scripts\smoke-minimal-demo.ps1
```

Expected:

- Gateway health pass.
- Login pass.
- Token validate pass.
- HR employees pass.
- Projects pass.
- Tasks pass.
- Payroll current employee `#4` pass.

## 5. Run login load test

```powershell
.\scripts\load-test-login.ps1 -ConcurrentUsers 50
.\scripts\load-test-login.ps1 -ConcurrentUsers 100
```

Only run 200 users if 100 users is stable:

```powershell
.\scripts\load-test-login.ps1 -ConcurrentUsers 200
```

## 6. Update report tables

Copy results into:

- `docs/KET_QUA_KIEM_THU_BAN_GIAO.md`
- `docs/KET_QUA_KIEM_THU_CAP_NHAT.md`
- `docs/KE_HOACH_DAY_NHANH_TIEN_DO.md`

## 7. Capture screenshots

Capture these screens:

- Login.
- Dashboard.
- Employees.
- Projects list.
- Project detail with members/tasks.
- Task form.
- Payroll page.
- Smoke test terminal.
- Load test terminal.
