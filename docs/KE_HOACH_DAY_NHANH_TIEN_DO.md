# Kế hoạch bổ sung dữ liệu, phân công và đẩy nhanh tiến độ

## 1. Đánh giá hiện trạng

Qua đối chiếu tài liệu tiến độ và cây công việc frontend, dự án chưa nên ghi là hoàn thành toàn bộ. Mức đánh giá thực tế hiện tại phù hợp hơn là khoảng 30-40% nếu tính theo tiêu chí sản phẩm có thể demo trọn luồng, vì hệ thống đã có nền backend microservices, xác thực, HR, payroll, project/task service và một phần giao diện; tuy nhiên vẫn còn thiếu dữ liệu mẫu đầy đủ, kiểm thử tải, màn hình frontend chi tiết, form nhập liệu, liên kết API thật và kiểm thử E2E theo vai trò.

Có thể trình bày trong báo cáo như sau:

> Dự án hiện đã hoàn thành phần nền tảng kiến trúc và các module lõi ở mức chạy được theo từng service. Tuy nhiên, để được xem là sản phẩm hoàn chỉnh, cần tiếp tục bổ sung dữ liệu nghiệp vụ, hoàn thiện frontend theo từng vai trò, kiểm thử hiệu năng đăng nhập đồng thời và kiểm thử tích hợp end-to-end. Vì vậy, tiến độ sản phẩm được đánh giá ở mức 30-40%, chưa phải 100%.

## 2. Dữ liệu mẫu cần đưa vào hệ thống

| Nhóm dữ liệu | Số lượng đề xuất | Mục đích |
|---|---:|---|
| Người dùng | 30-50 tài khoản | Demo đăng nhập, phân quyền, quản trị tài khoản |
| Vai trò | 5-7 vai trò | ADMIN, HR_MANAGER, PAYROLL_OFFICER, MANAGER, EMPLOYEE, USER |
| Phòng ban | 5 phòng ban | Nhân sự, Kế toán, Kỹ thuật, Kinh doanh, Vận hành |
| Nhân viên | 30-50 hồ sơ | Gắn với tài khoản, phòng ban, chức vụ, lương cơ bản |
| Dự án | 6-10 dự án | Có trạng thái, trưởng dự án, ngày bắt đầu/kết thúc |
| Phân công dự án | 40-80 bản ghi | Một nhân viên có thể tham gia nhiều dự án |
| Công việc | 80-150 task | Lọc theo dự án, người được giao, trạng thái, mức ưu tiên |
| Kỳ lương | 2-3 kỳ | Demo tính lương, duyệt lương, xử lý lương |
| Kết quả lương | 30-50 bản ghi/kỳ | Demo payroll workflow và audit |

## 3. Phân bố thành viên phát triển

| Thành viên | Ưu tiên 1 | Ưu tiên 2 | Kết quả cần giao |
|---|---|---|---|
| Thành viên 1 - Backend/Auth | Đăng nhập, JWT, RBAC, gateway route | Seed user/role, kiểm thử token | Đăng nhập ổn định qua gateway, route bảo vệ đúng quyền |
| Thành viên 2 - Backend/HR Payroll | Employee, department, payroll workflow | Dữ liệu lương, lịch sử/audit | Có luồng tính lương -> duyệt -> xử lý chạy được |
| Thành viên 3 - Backend Project/Task | Project, assignment, task API | Event RabbitMQ, lọc task theo user/project | Có luồng tạo dự án -> phân công -> tạo task |
| Thành viên 4 - Frontend | Dashboard, layout, project/task pages | Form/detail/API integration | Demo được theo từng vai trò, không chỉ màn hình sơ bộ |
| Thành viên 5 - QA/DevOps/Tài liệu | Docker compose, smoke test, load test | Báo cáo kết quả, ảnh minh họa | Có số liệu đo, checklist demo, tài liệu bảo vệ |

Nếu nhóm ít người hơn, nên gộp vai trò như sau: một người phụ trách Auth/Gateway, một người phụ trách HR/Payroll, một người phụ trách Project/Task, một người phụ trách Frontend/QA.

## 4. Trả lời câu hỏi: hệ thống chịu được bao nhiêu người đăng nhập cùng lúc?

Không nên trả lời bằng một con số tuyệt đối khi chưa chạy kiểm thử tải. Câu trả lời đúng về mặt kỹ thuật là:

> Hệ thống sử dụng JWT stateless nên sau khi đăng nhập, các request tiếp theo không phụ thuộc session lưu trên server. Vì vậy khả năng mở rộng tốt hơn mô hình session truyền thống. Tuy nhiên, số người đăng nhập đồng thời cần được xác nhận bằng kiểm thử tải trên môi trường triển khai cụ thể. Trong giai đoạn hiện tại, nhóm đặt mục tiêu kiểm thử theo các mốc 50, 100 và 200 người dùng đồng thời. Hệ thống được xem là đạt nếu tỷ lệ lỗi dưới 1%, thời gian phản hồi đăng nhập trung vị dưới 500 ms và p95 dưới 2 giây trong môi trường demo.

Bảng mục tiêu kiểm thử đề xuất:

| Mốc tải | Ý nghĩa | Tiêu chí đạt |
|---:|---|---|
| 50 user đồng thời | Mức demo lớp/nhóm nhỏ | Login thành công >= 99%, p95 < 2 giây |
| 100 user đồng thời | Mức doanh nghiệp nhỏ | Login thành công >= 99%, p95 < 3 giây |
| 200 user đồng thời | Mức kiểm thử mở rộng | Không sập service, lỗi < 3%, cần theo dõi CPU/RAM/DB |

Các chỉ số cần đo: số request/giây, tỷ lệ lỗi, thời gian phản hồi trung bình, p95, p99, CPU/RAM của auth-service, PostgreSQL, api-gateway và Redis/KMS nếu có tham gia xác thực token.

## 5. Ai làm trước, ai làm thứ hai?

Thứ tự ưu tiên nên làm theo đường găng demo, không làm dàn trải:

1. Auth/Gateway trước: phải đăng nhập được, phân quyền đúng, gọi API qua gateway được.
2. Seed data thứ hai: phải có user, employee, project, task, payroll để frontend hiển thị dữ liệu thật.
3. Project/Task thứ ba: vì giảng viên đang hỏi quản lý task và phân bổ thành viên, cần có màn list/detail/form rõ.
4. Payroll thứ tư: hoàn thiện luồng tính lương, duyệt lương, xử lý lương và audit.
5. Frontend tích hợp song song: ưu tiên các màn có dữ liệu thật, bỏ bớt trang trang trí hoặc dashboard mock.
6. QA/load test cuối mỗi ngày: đo được mới ghi vào báo cáo.

## 6. Việc frontend còn thiếu

Frontend hiện có nền layout, auth shell, dashboard theo vai trò và một số màn list. Tuy nhiên để được xem là hoàn thiện, cần bổ sung:

| Module | Còn thiếu | Ưu tiên |
|---|---|---|
| Project | Detail đầy đủ, form validation, chọn lead, thành viên, timeline | Cao |
| Task | Detail, form tạo/sửa, chọn assignee/project, lịch sử trạng thái | Cao |
| Dashboard | Thay số liệu mock bằng API thật | Cao |
| Payroll | Màn danh sách kỳ lương, kết quả lương, duyệt/từ chối/xử lý | Cao |
| Auth/Admin | Audit/session activity, refresh token nếu backend có endpoint | Trung bình |
| QA frontend | Test protected routes, loading/empty/error states | Trung bình |

## 7. Kế hoạch đẩy nhanh từ 30% lên mức demo tốt

### Trong 3 ngày

| Ngày | Công việc chính | Kết quả |
|---|---|---|
| Ngày 1 | Chốt seed data, login qua gateway, user/role/employee mapping | Demo đăng nhập theo vai trò và có dữ liệu thật |
| Ngày 2 | Hoàn thiện Project/Task frontend: list, detail, form, filter | Demo phân bổ thành viên và quản lý task |
| Ngày 3 | Hoàn thiện Payroll demo + smoke test + load test login 50/100 user | Có số liệu đưa vào báo cáo |

### Trong 7 ngày

| Giai đoạn | Công việc | Kết quả |
|---|---|---|
| Ngày 1-2 | Dữ liệu mẫu + Auth/Gateway + route bảo vệ | Nền demo ổn định |
| Ngày 3-4 | Project/Task API + frontend tích hợp thật | Trả lời được phần phân bổ thành viên/task |
| Ngày 5 | Payroll workflow + dữ liệu kỳ lương | Trả lời được phần quản lý lương |
| Ngày 6 | E2E test + load test + sửa lỗi | Có bằng chứng kiểm thử |
| Ngày 7 | Chụp màn hình, cập nhật báo cáo, chuẩn bị kịch bản demo | Sẵn sàng bảo vệ/demo |

## 8. Câu trả lời ngắn dùng khi bảo vệ

> Hiện tại em đánh giá dự án khoảng 30-40% nếu xét theo tiêu chí sản phẩm hoàn chỉnh, vì backend microservices và các module lõi đã có nhưng frontend vẫn còn thiếu màn hình chi tiết, form nghiệp vụ, dữ liệu mẫu và kiểm thử tải. Để đẩy nhanh tiến độ, em ưu tiên theo đường găng: đăng nhập và phân quyền trước, sau đó đưa dữ liệu mẫu vào, tiếp theo hoàn thiện Project/Task để thể hiện phân bổ thành viên và quản lý công việc, sau đó hoàn thiện Payroll workflow. Về khả năng chịu tải đăng nhập đồng thời, em không đưa ra con số cảm tính mà sẽ đo bằng kịch bản load test 50, 100 và 200 user đồng thời; hệ thống đạt nếu tỷ lệ lỗi dưới 1% và p95 login dưới khoảng 2-3 giây trong môi trường demo.

## 9. Cập nhật triển khai sau khi bắt tay vào code

Các công việc đã hoàn thành hoặc đã chuẩn bị để bàn giao:

| Nhóm việc | Trạng thái | Bằng chứng |
|---|---|---|
| Project/Task frontend | Đã code lát cắt chính | Form/detail có selector nhân viên/dự án, build frontend pass |
| Payroll frontend | Đã code demo tối thiểu | Có trang `/payroll`, API wrapper, workflow tính/duyệt/từ chối/xử lý, build frontend pass |
| Gateway payroll route | Đã bổ sung | Có route `/api/payroll/**` và `/api/chi-tra/**` về `hr-service` |
| Payroll RBAC backend | Đã chỉnh | `PayrollController` cho phép `HR_ADMIN`, `HR_MANAGER`, `PAYROLL_OFFICER`, `ADMIN` |
| Seed data | Đã chuẩn bị script | Có auth/HR/project/task/payroll seed; thêm `payroll.officer` và payroll sample |
| Smoke test | Đã chuẩn bị script | `scripts/smoke-minimal-demo.ps1` parse OK |
| Load test login | Đã chuẩn bị script | `scripts/load-test-login.ps1` parse OK |
| Bàn giao demo | Đã chuẩn bị tài liệu | `docs/BAN_GIAO_DEMO_3_NGAY.md` |
| Permission test | Đã kiểm chứng | `npx vitest run src/utils/permissions.test.ts` pass 22/22 |

Blocker hiện tại:

```text
Docker Desktop chưa cho phép kết nối Docker engine:
permission denied while trying to connect to the docker API at npipe:////./pipe/dockerDesktopLinuxEngine
```

Vì vậy các phần chưa thể xác nhận bằng runtime:

- Chưa nạp seed vào database thật.
- Chưa chạy smoke test E2E qua gateway.
- Chưa chạy load test đăng nhập 50/100/200 user.
- Chưa chụp ảnh màn hình demo từ frontend kết nối backend thật.
- Chưa xác nhận lại compile `hr-service` do Maven bị chặn ghi `target/maven-status` trên máy hiện tại.

Việc tiếp theo ngay khi Docker mở quyền:

```powershell
docker ps
.\scripts\run-minimal-demo.ps1 -Build
.\scripts\smoke-minimal-demo.ps1
.\scripts\load-test-login.ps1 -ConcurrentUsers 50
```
