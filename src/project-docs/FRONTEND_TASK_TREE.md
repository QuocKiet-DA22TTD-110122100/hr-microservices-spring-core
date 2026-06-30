# Frontend Development Task Tree

Mục tiêu: phát triển frontend HR Microservices theo hướng production-ready, role-aware, dễ nối API và tiết kiệm context/token.

## 1. Foundation

- [x] Design tokens/components cơ bản: `Button`, `Table`, `Modal`, `Badge`, `Card`, `PageHeader`, `DataListPage`
- [x] Auth shell thống nhất cho login/register/forgot password
- [x] Layout responsive: sidebar, header, account dropdown
- [x] Role experience config: dashboard/menu/workspace theo vai trò
- [x] Workspace reusable components: metric cards, filters, status list, action panel

## 2. Auth And Account

- [x] Login xác thực token và map claims sang user session
- [x] Register/Forgot password cùng style với login
- [x] Change password và Profile cùng ngôn ngữ UI
- [x] Route guard và unauthorized page
- [x] Account dropdown: profile, change password, logout
- [ ] Bổ sung refresh-token flow khi backend có endpoint chính thức
- [ ] Màn hình audit/session activity cho ADMIN

## 3. Role Dashboards

- [x] USER: tài khoản, bảo mật, quyền truy cập
- [x] EMPLOYEE: chấm công, nghỉ phép, task cá nhân
- [x] MANAGER: duyệt timesheet, task nhóm
- [x] DEPARTMENT_HEAD: báo cáo phòng ban, phê duyệt cấp phòng
- [x] HR: hồ sơ nhân sự, phúc lợi
- [x] ADMIN: tài khoản, role, audit
- [ ] Thay metric mock bằng API aggregation theo từng role

## 4. Management Pages

- [x] User management: summary cards, filters, table, modals
- [x] Role management: card layout, role permission matrix
- [x] Employee management: list/form/detail polish
- [x] Department management: list/form polish
- [x] Organization management: list/form polish
- [x] Project management: summary cards, status filters, risk cues
- [x] Task management: summary cards, priority/status views, due date cues

## 5. Project And Task Modules

- [x] Project list: API-backed table, metrics, filters, row actions
- [x] Project detail: project health, members, tasks, timeline
- [x] Project form: validation, status, lead assignment
- [x] Task list: API-backed table, metrics, filters, row actions
- [x] Task detail: ownership, status history, priority, related project
- [x] Task form: validation, assignee/project selectors

## 6. Workspace To API

- [ ] Replace mock `account-security` with auth/profile endpoints
- [ ] Replace mock `timekeeping` with attendance endpoint when available
- [ ] Replace mock `leave` with leave endpoint when available
- [ ] Replace mock `personal-tasks` with task-service filtered by current user
- [ ] Replace mock `team-tasks` with task-service filtered by manager/team
- [ ] Replace mock `department-reports` with HR/project aggregate
- [ ] Replace mock `benefits` with HR benefits/payroll endpoint when available

## 6.1 Payroll Demo

- [x] Payroll API wrapper for run, calculate, current, history, approve, reject, process
- [x] Payroll page route `/payroll` with employee selector and month selector
- [x] Payroll workflow actions: calculate, approve, reject, process
- [x] Gateway route for `/api/payroll/**` and `/api/chi-tra/**`
- [ ] Runtime E2E with seeded employees and payroll data

## 7. QA And Delivery

- [x] Frontend production build passes with `npm run build`
- [ ] Add smoke checks for protected routes by role
- [x] Add minimal demo smoke script for gateway/auth/HR/project/task/payroll
- [x] Add login load-test script for 50/100/200 user milestones
- [x] Add payroll HTTP demo collection for API fallback
- [ ] Add component tests for role menus and account dropdown
- [ ] Add API error/loading/empty-state checks for Project/Task modules
- [ ] Rebuild Docker frontend image after each frontend release
