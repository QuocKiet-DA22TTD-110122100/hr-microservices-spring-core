# Cap nhat hang doi runtime 2026-06-08

## Trang thai moi

| Task | Trang thai moi | Bang chung |
|---|---|---|
| Q-01 | DONE | Minimal containers da start/recreate; Gateway, Auth, HR, Project, Task chay du de smoke test |
| Q-02 | DONE | Auth/HR/Business seed da nap lai vao Docker DB |
| Q-03 | DONE | Smoke test login admin + validate token PASS |
| Q-05 | DONE toi thieu | Payroll current API da PASS sau khi sua DTO tranh Hibernate lazy proxy |
| Q-06 | DONE | `.\scripts\smoke-minimal-demo.ps1` PASS 8/8 |
| Q-07 | DONE co gioi han | 3 concurrent login PASS 0% loi; 50 concurrent bi Gateway rate-limit 429 theo policy 3 request/5s/IP |
| Q-08 | DONE cap nhat | `docs/KET_QUA_KIEM_THU_CAP_NHAT.md` da ghi ket qua moi |

## Ket luan ngan

Demo toi thieu da co bang chung chay that. Neu muon bao cao "50 user dang nhap cung luc PASS", can thay doi hoac parameter hoa `CustomRateLimitFilter.LOGIN_LIMIT` va test lai sau khi thong nhat day la muc tieu hieu nang, khong phai cau hinh bao ve hien tai.
