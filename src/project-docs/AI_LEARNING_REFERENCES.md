# AI Learning References

File này lưu các repo/skill mà người dùng đã yêu cầu Codex học hoặc tham chiếu khi triển khai giao diện, auth flow, backend contract và workflow kỹ thuật cho dự án HR Microservices.

## Frontend/UI Skills

- `QuocKiet-DA22TTD-110122100/gsap-skillsweb.git`
  - Tham chiếu cách làm giao diện có chuyển động, UI giàu cảm giác, nhưng dùng tiết chế cho app nghiệp vụ.

- `QuocKiet-DA22TTD-110122100/awesome-frontend-skills.git`
  - Repo tham chiếu frontend tổng hợp. Nếu không có sẵn hoặc không truy cập được thì bỏ qua theo chỉ đạo trước đó.

## Agent/Workflow Skills

- `QuocKiet-DA22TTD-110122100/skills_Agent.git`
  - Tham chiếu workflow agent/skill và cách chia nhỏ công việc để Codex triển khai có hệ thống.

- `QuocKiet-DA22TTD-110122100/agent-skills-Update.git`
  - Đã kiểm tra truy cập GitHub ngày 2026-06-07, HEAD `2e0dfbf`.
  - Đã clone shallow vào `.agents/reference-repos/agent-skills-Update`.
  - Dùng làm bộ skill tham chiếu chính cho cách viết code production-grade:
    - `frontend-ui-engineering`: ưu tiên design system, accessibility, responsive, loading/empty/error state, tránh giao diện kiểu AI-generated.
    - `api-and-interface-design`: contract-first, response shape ổn định, error semantics nhất quán, validate ở boundary, thêm field theo hướng backward-compatible.
    - `context-engineering`: nạp đúng context theo task, đọc file liên quan trước khi sửa, tránh quét lan man.
    - `incremental-implementation`: làm theo lát cắt nhỏ, verify từng bước, rollback-friendly.
    - `test-driven-development`: thay đổi behavior phải có kiểm chứng; build/test là bằng chứng.
    - `security-and-hardening`: kiểm tra auth, input validation, secrets, boundary trust khi chạm API/user data.
    - `code-review-and-quality`: review theo bug/risk/regression/test gap trước khi tổng kết.

## Token/Context Reduction

- `QuocKiet-DA22TTD-110122100/RTK_GiamThieutoken.git`
  - Tham chiếu nguyên tắc giảm token: ưu tiên cấu hình tập trung, component reusable, hạn chế đọc/quét lan man, chỉ mở file đúng phạm vi.

## Auth/SaaS Reference

- `QuocKiet-DA22TTD-110122100/open-saas-auth.git`
  - Tham chiếu cho login/register/forgot password/change password/profile, route guard, account dropdown, auth/session flow.

## Installed/Attempted Codex Skills

- `shadcn-ui/ui/skills/shadcn`
  - Đã cài bằng `npx codex-marketplace add --global --skill shadcn-ui/ui/skills/shadcn --yes`.
  - Dùng khi làm UI component, component registry hoặc dự án có `components.json`.

- `sanyuan0704/skills/shadcn-ui-expert`
  - Người dùng từng yêu cầu cài qua marketplace.
  - Nếu skill không có sẵn trong phiên hiện tại, dùng fallback theo design system hiện có.

- `tailwindlabs/skills/tailwind-expert`
  - Người dùng từng yêu cầu cài, nhưng trước đó marketplace không tìm thấy/không hợp lệ.
  - Khi cần Tailwind, áp dụng trực tiếp bằng pattern hiện có trong repo.

## Project-Specific Working Rules

- Ưu tiên giao diện theo vai trò:
  - `USER`: tài khoản, bảo mật, quyền truy cập.
  - `EMPLOYEE`: chấm công, nghỉ phép, task cá nhân.
  - `MANAGER`: duyệt timesheet, task nhóm.
  - `DEPARTMENT_HEAD`: báo cáo phòng ban, phê duyệt cấp phòng.
  - `HR`: hồ sơ nhân sự, phúc lợi.
  - `ADMIN`: tài khoản, role, audit.

- UI phải tách component reusable để dễ nối API:
  - metric cards
  - status list
  - filters
  - action/detail panel
  - table/list pattern chung

- Auth flow cần giữ thống nhất:
  - login/register/forgot/change password/profile cùng style
  - route guard rõ
  - unauthorized page tiếng Việt đúng encoding
  - account dropdown có profile/change password/logout

- Khi sửa frontend:
  - ưu tiên component sẵn có trong `frontend/src/components/UI`
  - giữ style production, không làm landing page
  - luôn có loading/empty/error state cho trang dữ liệu
  - dùng filter/search/sort/table/list chung khi phù hợp
  - build kiểm tra bằng `npm run build`

- Khi sửa API/backend:
  - contract trước implementation
  - DTO/request/response rõ ràng
  - lỗi trả về nhất quán, không leak implementation detail
  - validate ở controller/service boundary
  - smoke test qua gateway nếu endpoint phục vụ UI
