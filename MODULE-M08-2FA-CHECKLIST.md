## M08 — 2FA (Tóm tắt & Checklist)

Mục tiêu: Xác nhận flow 2FA end-to-end và đảm bảo tích hợp gateway ↔ auth-service hoạt động đúng.

**Tóm tắt nhanh**
- Endpoints chính (auth-service, base `/xac-thuc`):
  - `/2fa/khoi-tao` — khởi tạo 2FA, trả về `secret` và `otpAuthUri`.
  - `/2fa/xac-nhan` — xác nhận 2FA bằng TOTP.
  - `/dang-nhap` — login; nếu user đã bật 2FA sẽ trả HTTP 202 với `mfa_required=true`; khi có `otp` trả `access_token`.
  - `/oauth2/token` — grant_type=password; nếu thiếu OTP và cần 2FA trả 401 với message `mfa_required`.
- Gateway: public routes đã cấu hình cho `/api/xac-thuc/dang-nhap`, `/api/xac-thuc/oauth2/token`, `/api/xac-thuc/2fa/**` (xem `api-gateway/src/main/resources/application.yaml`).

**Đã kiểm tra / Đã hoàn tất**
- Controller và behavior: [auth-service/src/main/java/com/hrservice/auth/iam/controller/AuthController.java] — endpoints và status codes đã implement.
- TOTP implementation: `TotpService` exists và script test tạo/verify TOTP tương thích.
- Gateway routes: public routes cho IAM đã cấu hình (StripPrefix + requires-jwt:false).

**Cần thực hiện / Chưa xong**
- Chạy test end-to-end (yêu cầu `auth-service` và `api-gateway` đang chạy).  
- Xác minh response qua gateway giữ nguyên format JSON (không bị gateway thay đổi/format lại).  
- Rà soát warnings/lint trong M08 (non-blocking).  
- Kiểm tra xung đột security/OAuth2: custom `AuthRoleInterceptor` vs bất kỳ Spring ResourceServer/JWT filter nào (đảm bảo không double-validate hoặc chặn header).  

**Cách test nhanh (tự động bằng script)**
1) Khởi động `auth-service` (port mặc định trong script là 8086):

```powershell
cd 'c:\Thuctap\self-up\hr-microservices-spring-core\auth-service'
.\mvnw.cmd spring-boot:run
```

2) (Nếu sử dụng gateway) Khởi động `api-gateway` tương tự.

3) Từ root repo chạy script test 2FA (PowerShell):

```powershell
cd 'c:\Thuctap\self-up\hr-microservices-spring-core'
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\test-2fa.ps1
```

4) Kết quả mong đợi:
  - Bước login lần 1 (không có `otp`) -> HTTP 202 và body chứa `mfa_required=true`.
  - Bước login lần 2 (có `otp`) -> HTTP 200 và body chứa `access_token` (hoặc `oauth2/token` trả access_token khi dùng grant password + otp).

**Ví dụ field trả về (AuthController record)**
- `LoginResponse`: `access_token`, `token_type`, `expires_in`, `scope`, `mfa_required`, `mfa_method`, `token`.
- `OAuth2TokenResponse`: `access_token`, `token_type`, `expires_in`, `scope`.

**Ghi chú kỹ thuật & đề xuất**
- `AuthRoleInterceptor` thực hiện verify token và role-check; không dùng Spring Security HandlerChain cho role-check ở đây — đảm bảo gateway không loại bỏ header Authorization khi forward.
- Nếu muốn: bổ sung một short integration test (rest-assured hoặc script) để CI kiểm tra flow 2FA tự động.
- Dọn warnings/lint nhỏ để giữ code sạch (chạy `mvn -DskipTests`/IDE inspections và xử lý các warnings không ảnh hưởng build).

--
File này do công cụ nội bộ tạo để tóm gọn trạng thái M08. Nếu bạn muốn, tôi có thể:
- Bổ sung ví dụ payload mẫu và sample responses (JSON).  
- Chạy test thực tế bây giờ (tôi sẽ khởi động `auth-service` và `api-gateway`) — chọn A.  
- Hoặc chỉ lưu file checklist này (hiện đã lưu) — chọn B.

**Ví dụ payload & sample responses**

- Register (POST `/api/xac-thuc/dang-ky`)

Request JSON:

```json
{
  "username": "alice",
  "password": "TestPass123!",
  "role": "USER"
}
```

Response (201):

```json
{
  "userId": "<uuid>",
  "username": "alice",
  "role": "USER"
}
```

- Init 2FA (POST `/api/xac-thuc/2fa/khoi-tao`)

Request JSON:

```json
{
  "username": "alice",
  "password": "TestPass123!"
}
```

Response (200):

```json
{
  "secret": "JBSWY3DPEHPK3PXP",
  "otpAuthUri": "otpauth://totp/HRSystem:alice?secret=JBSWY3DPEHPK3PXP&issuer=HRSystem"
}
```

- Confirm 2FA (POST `/api/xac-thuc/2fa/xac-nhan`)

Request JSON:

```json
{
  "username": "alice",
  "password": "TestPass123!",
  "otp": "123456"
}
```

Response (200):

```json
{
  "message": "2FA enabled successfully"
}
```

- Login step 1 (POST `/api/xac-thuc/dang-nhap`) — no OTP

Request JSON:

```json
{
  "username": "alice",
  "password": "TestPass123!"
}
```

Response (202 Accepted):

```json
{
  "mfa_required": true,
  "mfa_method": "totp"
}
```

- Login step 2 (POST `/api/xac-thuc/dang-nhap`) — with OTP

Request JSON:

```json
{
  "username": "alice",
  "password": "TestPass123!",
  "otp": "123456"
}
```

Response (200):

```json
{
  "access_token": "ey...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "hr.read hr.write",
  "mfa_required": false
}
```

- OAuth2 token (POST `/api/xac-thuc/oauth2/token`) — missing OTP when required

Request JSON:

```json
{
  "grantType": "password",
  "username": "alice",
  "password": "TestPass123!"
}
```

Response (401): body/message = `mfa_required`

