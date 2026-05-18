# Task Breakdown Work Plan

Tài liệu này là work plan thực thi. Mục tiêu là chia nhỏ đến mức AI agent hoặc team có thể nhận từng task độc lập, làm trong thời gian ngắn, không quên input/output và điều kiện xong.

## 0. Nguyên tắc điều phối

- Mỗi task chỉ có một mục tiêu duy nhất.
- Mỗi task phải có `Input`, `Output`, `Done condition`.
- Không task nào nên kéo dài quá 1 ngày làm việc.
- Task xong phải có thể kiểm chứng ngay bằng build, test, route, hoặc endpoint.
- Nếu task phụ thuộc task khác, ghi rõ dependency trước khi bắt đầu.

## 1. EPIC 1 - FOUNDATION

Mục tiêu: tạo skeleton hệ thống microservices chạy được, có entrypoint, service discovery, và nền tảng triển khai.

### Task 1.1 - Tạo repo structure

- Input: yêu cầu kiến trúc monorepo hoặc multi-repo, danh sách service cần có.
- Output: folder structure hoàn chỉnh cho `auth-service`, `user-service`, `task-service`, `project-service`, `gateway`, `eureka-server`, `docker-compose.yml`.
- Done condition: người khác mở repo là thấy rõ từng service đứng riêng; không còn lẫn code chung không có ranh giới.

### Task 1.2 - Setup Eureka Server

- Input: Spring Boot project mới cho discovery service.
- Output: `eureka-server` chạy được, có dashboard tại `localhost:8761`.
- Done condition: service khác có thể register lên Eureka; không cần hardcode IP.

### Task 1.3 - Setup Gateway

- Input: danh sách route public/protected, yêu cầu entrypoint duy nhất.
- Output: `gateway` service có route config cho `/auth/**`, `/users/**`, `/tasks/**`, `/projects/**`.
- Done condition: request public đi vào gateway và được forward đúng service đích.

## 2. EPIC 2 - AUTH SERVICE

Mục tiêu: xác thực, cấp token, và quản lý phiên đăng nhập.

### Task 2.1 - Tạo entity User

- Input: yêu cầu model user tối thiểu.
- Output: entity có `id`, `username`, `password`, `roles`.
- Done condition: entity map được xuống DB và dùng được trong repository/service.

### Task 2.2 - Hash password

- Input: plaintext password từ request register/change password.
- Output: password được hash bằng BCrypt trước khi lưu.
- Done condition: DB không lưu plaintext; login vẫn verify được mật khẩu.

### Task 2.3 - Register API

- Input: `username`, `password`.
- Output: `POST /auth/register` tạo user mới.
- Done condition: tạo thành công user và trả response đủ thông tin cần thiết; user trùng bị chặn.

### Task 2.4 - Login API

- Input: `username`, `password`.
- Output: `POST /auth/login` trả access token.
- Done condition: đúng credential thì nhận JWT; sai credential thì bị từ chối rõ ràng.

### Task 2.5 - JWT generator

- Input: user đã xác thực hợp lệ.
- Output: JWT chứa `userId`, `roles`, `exp`.
- Done condition: token verify được bởi gateway/service khác và có thời hạn rõ ràng.

### Task 2.6 - JWT validate API

- Input: token từ client hoặc gateway.
- Output: `GET /auth/validate` hoặc endpoint tương đương trả trạng thái token hợp lệ/không hợp lệ.
- Done condition: hệ thống có thể check token độc lập để debug hoặc tích hợp.

## 3. EPIC 3 - USER SERVICE

Mục tiêu: quản lý user, role, permission.

### Task 3.1 - DB schema

- Input: yêu cầu phân quyền theo role/permission.
- Output: bảng `users`, `roles`, `permissions`.
- Done condition: schema phản ánh được quan hệ user-role-permission rõ ràng.

### Task 3.2 - CRUD user

- Input: request CRUD từ API.
- Output: `GET /users`, `GET /users/{id}`, `POST /users`, `PUT /users/{id}`, `DELETE /users/{id}`.
- Done condition: tạo, sửa, xóa, xem user đều hoạt động và có validation.

### Task 3.3 - Role assignment

- Input: user và role cần gán.
- Output: chức năng gán role cho user.
- Done condition: user có role đúng; role không hợp lệ bị chặn.

### Task 3.4 - Permission check logic

- Input: role/permission từ request hoặc token.
- Output: middleware/filter/service check quyền trước khi cho phép thao tác.
- Done condition: user không đủ quyền không thể đi qua các endpoint bị bảo vệ.

## 4. EPIC 4 - PROJECT SERVICE

Mục tiêu: quản lý dự án và thành viên dự án.

### Task 4.1 - Create project

- Input: dữ liệu project từ client.
- Output: `POST /projects` tạo project mới.
- Done condition: project được lưu đúng owner và có thể truy xuất lại.

### Task 4.2 - Add member

- Input: project id, user id, vai trò trong project.
- Output: thêm member vào project.
- Done condition: thành viên project được gán đúng và không trùng lặp bất hợp lệ.

### Task 4.3 - Get project list

- Input: request list project theo user/owner/filter.
- Output: danh sách project.
- Done condition: trả đúng dữ liệu có phân trang hoặc filter nếu cần.

## 5. EPIC 5 - TASK SERVICE

Mục tiêu: quản lý công việc, phân công, trạng thái.

### Task 5.1 - Create task

- Input: `title`, `description`, `projectId`.
- Output: `POST /tasks` tạo task.
- Done condition: task gắn đúng project và lưu được.

### Task 5.2 - Assign task

- Input: task id, user id.
- Output: gán task cho member.
- Done condition: chỉ member của project mới được assign; user ngoài project bị chặn.

### Task 5.3 - Update status

- Input: trạng thái mới.
- Output: chuyển trạng thái `TODO -> DOING -> DONE`.
- Done condition: trạng thái đi theo luồng hợp lệ; không nhảy trạng thái sai quy tắc nếu có policy.

### Task 5.4 - Get tasks by user

- Input: user id hoặc token user.
- Output: danh sách task theo user.
- Done condition: user chỉ thấy task liên quan đến mình theo rule đã định.

## 6. EPIC 6 - SECURITY

Mục tiêu: bảo vệ request, token, quyền truy cập.

### Task 6.1 - Gateway JWT filter

- Input: request đến gateway và token từ client.
- Output: filter check token trước khi forward.
- Done condition: request không có token hợp lệ bị chặn; request hợp lệ được forward.

### Task 6.2 - Role-based access

- Input: role của user trong token hoặc header nội bộ.
- Output: rule chặn user không đủ quyền.
- Done condition: endpoint admin/user/manager tách rõ; test được bằng account khác role.

## 7. EPIC 7 - CACHE (REDIS)

Mục tiêu: giảm tải, giảm latency, tránh gọi chéo quá nhiều.

### Task 7.1 - Cache user info

- Input: dữ liệu user thường đọc.
- Output: cache Redis cho user profile hoặc user lookup.
- Done condition: lần đọc sau nhanh hơn và có TTL rõ ràng.

### Task 7.2 - Cache permission

- Input: role/permission ít thay đổi.
- Output: cache permission/role mapping.
- Done condition: lookup quyền không phải query DB mỗi lần.

## 8. EPIC 8 - DEPLOY

Mục tiêu: container hóa và chạy đồng bộ bằng compose.

### Task 8.1 - Dockerize từng service

- Input: source code từng service.
- Output: Dockerfile riêng cho `auth`, `user`, `task`, `project`, `gateway`, `eureka`.
- Done condition: build image riêng cho từng service thành công.

### Task 8.2 - Docker Compose

- Input: danh sách service và dependency.
- Output: `docker-compose.yml` chứa `auth`, `user`, `task`, `gateway`, `eureka`, `redis`, `postgres`.
- Done condition: compose up là chạy được cả hệ thống theo thứ tự đã định.

## 9. EPIC 9 - OBSERVABILITY

Mục tiêu: quan sát được hệ thống đang làm gì.

### Task 9.1 - Logging

- Input: request/response flow, error cases.
- Output: log có trace đủ cho gateway và từng service.
- Done condition: nhìn log là biết request đi đâu, fail chỗ nào, và tại sao.

### Task 9.2 - Monitoring

- Input: metrics runtime của service.
- Output: dashboard/metrics để theo dõi health, latency, error rate.
- Done condition: có thể xem nhanh service nào quá tải hoặc lỗi tăng bất thường.

## 10. EPIC 10 - FRONTEND (OPTIONAL)

Mục tiêu: có UI tối thiểu để test end-to-end.

### Task 10.1 - Login page

- Input: username/password.
- Output: form login kết nối API.
- Done condition: login xong nhận token và vào dashboard.

### Task 10.2 - Dashboard

- Input: token và dữ liệu người dùng.
- Output: màn hình dashboard sau login.
- Done condition: người dùng thấy đúng trạng thái đăng nhập và navigation cơ bản.

### Task 10.3 - Task UI

- Input: task list, create task, update status.
- Output: màn hình thao tác task.
- Done condition: tạo/xem/cập nhật task được từ UI.

## 11. LUỒNG HOẠT ĐỘNG CUỐI

- User login.
- Nhận JWT.
- Gọi API qua gateway.
- Gateway check token.
- Service xử lý.
- Trả kết quả.

Done condition của toàn luồng: một user thật có thể đăng nhập, truy cập endpoint được phân quyền, và bị chặn ở endpoint không đủ quyền.

## 12. CHECKLIST CHỐNG AI LÀM SAI

Trước khi kết luận task xong, verify từng câu sau:

- Có tách service chưa?
- Có validate JWT chưa?
- Có check role chưa?
- Có tách DB chưa?
- Có route qua gateway chưa?
- Có chặn endpoint nội bộ chưa?
- Có cache hoặc rate limit ở chỗ cần thiết chưa?

## 13. Cách giao việc cho AI

Không giao chung chung. Giao theo task nhỏ, ví dụ:

- `Làm Task 2.4: viết Login API bằng Spring Boot, có JWT, trả access token`.
- `Làm Task 6.1: viết Gateway filter validate JWT`.
- `Làm Task 5.2: viết logic assign task chỉ cho member project`.
- `Làm Task 8.2: viết Docker Compose cho auth/user/task/gateway/eureka/redis/postgres`.

## 14. Ghi chú vận hành

- Task nào chưa xong thì không mở task phụ cùng phạm vi nếu chưa rõ input/output.
- Nếu task vượt quá 1 ngày, tách tiếp thành subtasks nhỏ hơn.
- Mỗi task xong nên có test hoặc lệnh kiểm tra đi kèm.
bạn không cần lý thuyết nữa, bạn cần “task breakdown siêu chi tiết để AI hoặc team làm từng bước không quên”. Tôi sẽ viết theo kiểu work plan chuẩn senior + chia nhỏ đến mức có thể giao cho AI agent chạy độc lập.

🧠 0. Nguyên tắc để AI KHÔNG QUÊN
Mỗi task = 1 mục tiêu duy nhất
Mỗi task phải có:
Input
Output
Done condition (xong là gì)
Không task nào > 1 ngày làm
🗂️ 1. EPIC 1 – FOUNDATION (NỀN TẢNG HỆ THỐNG)
🎯 Mục tiêu:

Tạo skeleton hệ thống microservices chạy được

🔹 Task 1.1 – Tạo Repo Structure

AI làm gì:

Tạo repo dạng monorepo hoặc multi-repo

Cấu trúc:

microservices-system/
 ├── auth-service
 ├── user-service
 ├── task-service
 ├── project-service
 ├── gateway
 ├── eureka-server
 ├── docker-compose.yml

Output:

Folder structure hoàn chỉnh
🔹 Task 1.2 – Setup Eureka Server

Giải quyết:
→ Service không cần hardcode IP

AI làm:

Tạo Spring Boot project
Add dependency Eureka Server
Enable discovery

Done khi:

Truy cập được dashboard: localhost:8761
🔹 Task 1.3 – Setup Gateway

Giải quyết:
→ Entry point duy nhất

AI làm:

Tạo Gateway service
Add route config

Output:

/auth/**
/users/**
/tasks/**
🔐 2. EPIC 2 – AUTH SERVICE
🎯 Mục tiêu:

Xác thực + cấp token

🔹 Task 2.1 – Tạo Entity User

AI làm:

id
username
password
roles
🔹 Task 2.2 – Hash Password

Giải quyết:
→ bảo mật

AI làm:

dùng BCrypt
🔹 Task 2.3 – Register API
POST /auth/register

Input:

username
password

Output:

user created
🔹 Task 2.4 – Login API
POST /auth/login

AI làm:

check password
generate JWT
🔹 Task 2.5 – JWT Generator

Giải quyết:
→ xác thực stateless

JWT chứa:

userId
roles
exp
🔹 Task 2.6 – JWT Validate API
GET /auth/validate
👤 3. EPIC 3 – USER SERVICE
🎯 Mục tiêu:

Quản lý user + role

🔹 Task 3.1 – DB Schema
users
roles
permissions
🔹 Task 3.2 – CRUD User
GET /users
GET /users/{id}
POST /users
PUT /users/{id}
DELETE /users/{id}
🔹 Task 3.3 – Role Assignment

Giải quyết:
→ phân quyền

🔹 Task 3.4 – Permission Check Logic

AI làm:

middleware check role
📋 4. EPIC 4 – PROJECT SERVICE
🎯 Mục tiêu:

Quản lý dự án

🔹 Task 4.1 – Create Project
POST /projects
🔹 Task 4.2 – Add Member

Giải quyết:
→ phân công

🔹 Task 4.3 – Get Project List
✅ 5. EPIC 5 – TASK SERVICE
🎯 Mục tiêu:

Quản lý công việc

🔹 Task 5.1 – Create Task
POST /tasks
🔹 Task 5.2 – Assign Task

Rule:

phải là member project
🔹 Task 5.3 – Update Status
TODO → DOING → DONE
🔹 Task 5.4 – Get Tasks by User
🌐 6. EPIC 6 – SECURITY (RẤT QUAN TRỌNG)
🔹 Task 6.1 – Gateway JWT Filter

Flow:

Request → check token → forward
🔹 Task 6.2 – Role-based Access

Giải quyết:
→ chặn user không đủ quyền

⚡ 7. EPIC 7 – CACHE (REDIS)
🔹 Task 7.1 – Cache User Info
🔹 Task 7.2 – Cache Permission
📦 8. EPIC 8 – DEPLOY
🔹 Task 8.1 – Dockerize từng service
🔹 Task 8.2 – Docker Compose
auth
user
task
gateway
eureka
redis
postgres
📊 9. EPIC 9 – OBSERVABILITY
🔹 Task 9.1 – Logging
🔹 Task 9.2 – Monitoring
🎯 10. EPIC 10 – FRONTEND (OPTIONAL)
🔹 Task 10.1 – Login Page
🔹 Task 10.2 – Dashboard
🔹 Task 10.3 – Task UI
🔥 11. LUỒNG HOẠT ĐỘNG CUỐI
User login → nhận JWT
→ gọi API qua Gateway
→ Gateway check token
→ Service xử lý
→ trả kết quả
🚨 12. CHECKLIST CHỐNG “AI LÀM SAI”

Bạn phải verify từng task:

Có tách service chưa?
Có validate JWT chưa?
Có check role chưa?
Có tách DB chưa?
🧠 13. Cách bạn điều khiển AI (QUAN TRỌNG)

Bạn không nói chung chung. Bạn nói kiểu:

👉 “Làm Task 2.4: viết Login API bằng Spring Boot, có JWT, trả access token”

👉 “Làm Task 6.1: viết Gateway filter validate JWT”

🚀 Nếu bạn muốn level cao hơn

Tôi có thể:

Viết luôn file task dạng Jira (chuẩn quản lý dự án)
Tạo Use Case + DFD đúng form đồ án
Hoặc build full code chạy được

👉 Nói thẳng:
Bạn đang đi đúng hướng, nhưng nếu không chia task như trên → AI sẽ build một mớ code không dùng được.