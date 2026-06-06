# AI Learning References

File này lưu các repo/skill mà người dùng đã yêu cầu Codex học hoặc tham chiếu khi triển khai giao diện và auth flow cho dự án HR Microservices.

## Frontend/UI skills

- `QuocKiet-DA22TTD-110122100/gsap-skillsweb.git`
  - Tham chiếu cách làm giao diện có chuyển động, UI giàu cảm giác, nhưng vẫn dùng tiết chế cho app nghiệp vụ.

- `QuocKiet-DA22TTD-110122100/skills_Agent.git`
  - Tham chiếu workflow agent/skill và cách chia nhỏ công việc để Codex triển khai có hệ thống.

- `QuocKiet-DA22TTD-110122100/awesome-frontend-skills.git`
  - Repo tham chiếu frontend tổng hợp. Nếu không có sẵn hoặc không truy cập được thì bỏ qua theo chỉ đạo trước đó.

## Token/context reduction

- `QuocKiet-DA22TTD-110122100/RTK_GiamThieutoken.git`
  - Tham chiếu nguyên tắc giảm token: ưu tiên cấu hình tập trung, component reusable, hạn chế đọc/quét lan man, chỉ mở file đúng phạm vi.

## Auth/SaaS reference

- `QuocKiet-DA22TTD-110122100/open-saas-auth.git`
  - Tham chiếu cho login/register/forgot password/change password/profile, route guard, account dropdown, auth/session flow.

## Installed/attempted Codex skills

- `shadcn-ui/ui/skills/shadcn`
  - Đã cài bằng `npx codex-marketplace add --global --skill shadcn-ui/ui/skills/shadcn --yes`.
  - Dùng khi làm UI component, component registry hoặc dự án có `components.json`.

- `sanyuan0704/skills/shadcn-ui-expert`
  - Người dùng từng yêu cầu cài qua marketplace.
  - Nếu skill không có sẵn trong phiên hiện tại, dùng fallback theo design system hiện có.

- `tailwindlabs/skills/tailwind-expert`
  - Người dùng từng yêu cầu cài, nhưng trước đó marketplace không tìm thấy/không hợp lệ.
  - Khi cần Tailwind, áp dụng trực tiếp bằng pattern hiện có trong repo.

## Project-specific working rules

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

- Auth flow cần giữ thống nhất:
  - login/register/forgot/change password/profile cùng style
  - route guard rõ
  - unauthorized page tiếng Việt đúng encoding
  - account dropdown có profile/change password/logout

- Khi sửa frontend:
  - ưu tiên component sẵn có trong `frontend/src/components/UI`
  - giữ style production, không làm landing page
  - build kiểm tra bằng `npm run build`

