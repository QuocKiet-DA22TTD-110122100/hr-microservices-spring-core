# Hàng đợi công việc 3 ngày cuối để báo cáo và bàn giao

## 1. Nguyên tắc làm việc

Thời gian còn lại chỉ khoảng 3 ngày, mỗi ngày khoảng 7 giờ làm việc, nên không mở rộng phạm vi mới. Mọi task phải phục vụ trực tiếp cho một trong bốn mục tiêu:

1. Demo được luồng đăng nhập và phân quyền.
2. Demo được quản lý dự án, phân bổ thành viên và quản lý task.
3. Demo được quản lý nhân sự và bảng lương ở mức nghiệp vụ chính.
4. Có bằng chứng bàn giao: dữ liệu mẫu, ảnh màn hình, kết quả build/test/load test, tài liệu hướng dẫn chạy.

Quy tắc kỹ thuật bắt buộc:

- Không sửa lan man ngoài module đang làm.
- Mọi API bảo vệ phải đi qua gateway và token JWT.
- Frontend không dùng dữ liệu mock cho màn hình demo chính nếu backend đã có API.
- Mỗi task phải có đầu ra kiểm chứng được: màn hình chạy được, API trả dữ liệu, build pass, test pass hoặc ảnh minh họa.
- Không ghi báo cáo là "hoàn thành" nếu chưa có bằng chứng chạy.

## 2. Hàng đợi ưu tiên tổng thể

Trạng thái cập nhật:

| Mã task | Trạng thái | Ghi chú |
|---|---|---|
| Q-01 | DONE sau restart | Docker minimal runtime đang chạy đủ Gateway, Auth, HR, Project, Task, KMS, Redis và database seed; `docker ps` healthy |
| Q-02 | DONE | Seed Auth/HR/Business đã chuẩn bị và đã có dữ liệu demo phục vụ smoke test |
| Q-03 | DONE | Smoke test login admin + validate token qua gateway PASS |
| Q-04 | Đã code lát cắt chính | Project/Task form/detail đã có selector và API-backed flow; cần runtime E2E |
| Q-05 | DONE tối thiểu | Payroll current employee `#4` qua gateway PASS; có UI/API tối thiểu và `payroll-demo.http` |
| Q-06 | DONE | `scripts/smoke-minimal-demo.ps1` sau restart PASS 8/8 |
| Q-07 | DONE có số liệu | Đã cấu hình hóa login rate-limit cho minimal/performance test; 3 concurrent PASS 0% lỗi, 50 concurrent đạt 45/50 success (10% lỗi), 100 concurrent đạt 57/100 success (43% lỗi), smoke test sau tải vẫn PASS 8/8 |
| Q-08 | Đã cập nhật theo kết quả mới | `docs/KET_QUA_KIEM_THU_BAN_GIAO.md`, `docs/KET_QUA_KIEM_THU_CAP_NHAT.md` và Chương 4 báo cáo đã ghi kết quả sau restart |
| Q-09 | Đã cập nhật tài liệu bàn giao | `docs/BAN_GIAO_DEMO_3_NGAY.md` đã bỏ trạng thái Docker bị chặn và ghi kết quả runtime hiện tại |

| Thứ tự | Mã task | Công việc | Mục đích | Người phụ trách | Thời lượng | Điều kiện hoàn thành |
|---:|---|---|---|---|---:|---|
| 1 | Q-01 | Chốt môi trường chạy tối thiểu | Có hệ thống chạy được để demo | DevOps/Backend | 2h | Docker compose hoặc local services chạy được gateway, auth, HR, project, task |
| 2 | Q-02 | Nạp dữ liệu mẫu tối thiểu | Màn hình có dữ liệu thật | Backend/DB | 3h | Có user, role, employee, project, assignment, task, payroll seed |
| 3 | Q-03 | Kiểm tra login qua gateway | Chứng minh đăng nhập và phân quyền | Auth/Gateway | 2h | Admin/HR/Manager/Employee đăng nhập được, token gọi API được |
| 4 | Q-04 | Hoàn thiện demo Project/Task | Trả lời phần phân bổ thành viên và task | Frontend + Backend | 5h | Tạo/sửa/xem project, thêm thành viên, tạo/sửa/xem task chạy được |
| 5 | Q-05 | Hoàn thiện demo Payroll | Trả lời phần quản lý lương | HR/Payroll | 5h | Tính lương, duyệt/từ chối/xử lý lương demo được bằng API hoặc UI |
| 6 | Q-06 | Smoke test E2E | Bảo đảm luồng chính không đứt | QA | 3h | Có checklist pass/fail cho auth, HR, project, task, payroll |
| 7 | Q-07 | Load test đăng nhập | Có số liệu trả lời chịu tải | QA/DevOps | 3h | Có kết quả mốc 50/100 user đồng thời hoặc ghi rõ mốc chưa đạt |
| 8 | Q-08 | Cập nhật báo cáo | Báo cáo khớp với sản phẩm thật | Tài liệu | 4h | Báo cáo ghi đúng tiến độ, chức năng, hạn chế, số liệu |
| 9 | Q-09 | Chuẩn bị bàn giao | Người khác chạy lại được | DevOps/Tài liệu | 2h | Có runbook, tài khoản demo, checklist demo, ảnh màn hình |

## 3. Lịch làm 3 ngày

### Ngày 1 - Chạy được hệ thống và có dữ liệu thật

| Khung giờ | Task | Việc cần làm | Kết quả |
|---|---|---|---|
| 0h-1h | Q-01 | Kiểm tra compose/local startup, xác định service nào bắt buộc demo | Danh sách service chạy được |
| 1h-3h | Q-02 | Nạp seed Auth/HR/Project/Task/Payroll | Có dữ liệu mẫu thống nhất |
| 3h-4h | Q-03 | Test login admin/hr/manager/employee qua gateway | Token hợp lệ, route bảo vệ gọi được |
| 4h-6h | Q-04 | Kiểm tra frontend Project/Task với dữ liệu seed | Màn Project/Task có dữ liệu thật |
| 6h-7h | Q-06 | Ghi checklist lỗi còn lại | Có danh sách bug ưu tiên ngày 2 |

### Ngày 2 - Hoàn thiện luồng nghiệp vụ chính

| Khung giờ | Task | Việc cần làm | Kết quả |
|---|---|---|---|
| 0h-2h | Q-04 | Sửa lỗi Project/Task: list, detail, form, phân bổ thành viên | Demo được phân bổ thành viên/task |
| 2h-4h | Q-05 | Chốt Payroll API hoặc UI tối thiểu | Demo được tính/duyệt/xử lý lương |
| 4h-5h | Q-06 | Chạy smoke test toàn luồng | Biết luồng nào pass/fail |
| 5h-6h | Q-07 | Chạy load test login mốc 50 user | Có số liệu bước đầu |
| 6h-7h | Q-08 | Ghi kết quả vào báo cáo | Báo cáo bắt đầu có bằng chứng |

### Ngày 3 - Đóng gói báo cáo và bàn giao

| Khung giờ | Task | Việc cần làm | Kết quả |
|---|---|---|---|
| 0h-1h | Q-06 | Chạy lại build/test/smoke test sau sửa lỗi | Kết quả xác nhận cuối |
| 1h-2h | Q-07 | Chạy load test 50/100 user nếu môi trường chịu được | Có bảng kết quả hiệu năng |
| 2h-4h | Q-08 | Cập nhật báo cáo: tiến độ, chức năng, hạn chế, ảnh minh họa | Báo cáo khớp sản phẩm |
| 4h-5h | Q-09 | Viết hướng dẫn chạy, tài khoản demo, thứ tự demo | Có tài liệu bàn giao |
| 5h-6h | Q-09 | Chụp ảnh màn hình các luồng chính | Có bằng chứng trình bày |
| 6h-7h | Q-09 | Tổng duyệt demo và ghi rủi ro còn lại | Sẵn sàng nộp/bàn giao |

## 4. Chi tiết task theo hàng đợi

### Q-01. Chốt môi trường chạy tối thiểu

Mục đích: tránh mất thời gian debug toàn hệ thống khi chỉ cần demo các luồng chính.

Việc cần làm:

- Xác định service bắt buộc: `api-gateway`, `auth-service`, `hr-service`, `project-service`, `task-service`, database tương ứng.
- Kiểm tra port, healthcheck, biến môi trường.
- Ghi lại lệnh chạy ổn định nhất.

Đầu ra:

- Một lệnh hoặc một checklist chạy hệ thống.
- Ảnh/ghi chú trạng thái container/service healthy.

### Q-02. Nạp dữ liệu mẫu tối thiểu

Mục đích: frontend và báo cáo có dữ liệu thật, không còn cảm giác sơ sài.

Seed tối thiểu:

| Dữ liệu | Số lượng tối thiểu |
|---|---:|
| User demo | 5 |
| Role | 5 |
| Employee | 10 |
| Department | 3 |
| Project | 3 |
| Project assignment | 10 |
| Task | 20 |
| Payroll run/result | 1 kỳ lương cho 5-10 nhân viên |

Tài khoản demo đề xuất:

| Vai trò | Username | Mục đích |
|---|---|---|
| ADMIN | `admin` | Quản trị toàn hệ thống |
| HR_MANAGER | `hr.manager` | Quản lý nhân sự |
| PAYROLL_OFFICER | `payroll.officer` | Duyệt và xử lý lương |
| MANAGER | `manager` | Quản lý dự án/task |
| EMPLOYEE | `employee` | Xem task cá nhân |

### Q-03. Kiểm tra login qua gateway

Mục đích: chứng minh kiến trúc bảo mật hoạt động đúng.

Checklist:

- Login đúng tài khoản trả JWT.
- Gọi API bảo vệ có token thành công.
- Gọi API bảo vệ không token bị chặn.
- Role không đủ quyền bị chặn.
- Frontend lưu session và route guard đúng.

### Q-04. Hoàn thiện demo Project/Task

Mục đích: trả lời trực tiếp câu hỏi "phân bổ thành viên thế nào, quản lý task thế nào".

Checklist Project:

- Xem danh sách dự án.
- Tạo/sửa dự án.
- Chọn trưởng dự án từ nhân viên.
- Xem chi tiết dự án.
- Thêm/gỡ thành viên dự án.
- Xem task thuộc dự án.

Checklist Task:

- Xem danh sách task.
- Tạo/sửa task.
- Chọn dự án từ danh sách.
- Chọn người phụ trách từ nhân viên.
- Xem trạng thái, ưu tiên, người phụ trách.
- Lọc task theo dự án/trạng thái/người phụ trách nếu API hỗ trợ.

### Q-05. Hoàn thiện demo Payroll

Mục đích: trả lời phần quản lý lương không chỉ nằm trên báo cáo.

Checklist tối thiểu:

- Có danh sách nhân viên có lương cơ bản.
- Có kỳ lương.
- Tính kết quả lương.
- Duyệt hoặc từ chối kết quả lương.
- Xử lý lương sau khi duyệt.
- Có lịch sử/audit hoặc trạng thái để chứng minh quy trình.

Nếu chưa đủ thời gian làm UI, phải có Postman/API script và ảnh kết quả response.

### Q-06. Smoke test E2E

Mục đích: biết chắc luồng demo chính không gãy.

Checklist pass/fail:

| Luồng | Kết quả |
|---|---|
| Login admin | Chưa chạy |
| Login manager | Chưa chạy |
| Xem employee | Chưa chạy |
| Tạo project | Chưa chạy |
| Thêm thành viên project | Chưa chạy |
| Tạo task | Chưa chạy |
| Xem task theo project | Chưa chạy |
| Tính lương | Chưa chạy |
| Duyệt lương | Chưa chạy |

### Q-07. Load test đăng nhập

Mục đích: có số liệu trả lời câu "hệ thống chịu được bao nhiêu người đăng nhập cùng lúc".

Kịch bản tối thiểu:

| Mốc | Kỳ vọng |
|---:|---|
| 50 user đồng thời | Tỷ lệ lỗi dưới 1%, p95 dưới 2 giây |
| 100 user đồng thời | Tỷ lệ lỗi dưới 3%, p95 dưới 3 giây |
| 200 user đồng thời | Chỉ chạy nếu 100 user ổn định |

Kết quả cần ghi:

- Số user đồng thời.
- Tổng request.
- Tỷ lệ lỗi.
- Response time trung bình.
- p95/p99.
- CPU/RAM nếu lấy được.

### Q-08. Cập nhật báo cáo

Mục đích: báo cáo không nói quá và có bằng chứng.

Nội dung phải cập nhật:

- Tiến độ thật: phần nào đã hoàn thành, phần nào còn hạn chế.
- Ảnh màn hình login, dashboard, project, task, payroll.
- Bảng dữ liệu demo.
- Bảng kiểm thử.
- Bảng hiệu năng đăng nhập.
- Hạn chế và hướng phát triển.

### Q-09. Chuẩn bị bàn giao

Mục đích: người nhận có thể chạy lại.

Tài liệu bàn giao cần có:

- Lệnh chạy backend/frontend.
- Tài khoản demo.
- Thứ tự demo.
- Danh sách API chính.
- File seed data.
- Kết quả build/test.
- Rủi ro còn lại.

## 5. Definition of Done cho bàn giao

Dự án chỉ được xem là đủ bàn giao khi đạt các điều kiện sau:

- Frontend build pass.
- Hệ thống login được ít nhất 3 vai trò: Admin, Manager, Employee hoặc HR.
- Có dữ liệu mẫu thật cho employee, project, task.
- Demo được tạo project, phân bổ thành viên, tạo task.
- Demo được ít nhất một bước payroll bằng UI hoặc API.
- Có checklist smoke test.
- Có kết quả load test hoặc ghi rõ chưa chạy được vì lý do môi trường.
- Báo cáo cập nhật đúng với trạng thái thật, không ghi vượt quá khả năng đã kiểm chứng.

## 6. Công việc không làm trong 3 ngày cuối

Để tránh đi sai hướng, tạm thời không làm:

- Không thêm module nghiệp vụ mới.
- Không đổi kiến trúc microservices.
- Không refactor lớn backend/frontend.
- Không đổi database schema nếu không bắt buộc.
- Không làm UI trang trí không phục vụ demo.
- Không tối ưu hiệu năng sâu khi chưa có số liệu load test.

## 7. Câu chốt tiến độ dùng trong báo cáo

> Trong 3 ngày cuối, nhóm tập trung hoàn thiện các luồng có giá trị bàn giao cao nhất: đăng nhập và phân quyền, dữ liệu mẫu, quản lý dự án, phân bổ thành viên, quản lý task, luồng bảng lương tối thiểu, kiểm thử smoke test và kiểm thử tải đăng nhập. Các công việc được xếp theo hàng đợi ưu tiên để đảm bảo mỗi đầu việc đều có mục đích rõ ràng, có tiêu chí hoàn thành và có bằng chứng kiểm chứng khi đưa vào báo cáo.
