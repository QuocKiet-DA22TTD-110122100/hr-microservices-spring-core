# Hướng Dẫn Test API Bằng Postman

## Tổng quan kiến trúc & luồng bảo mật

```
Client (Postman)
     │
     ▼
API Gateway :8080
     │
     ├─[1] IP Blacklist Check    (Redis)
     ├─[2] Rate Limit Check      (Redis, 1 req/s/IP)
     ├─[3] HMAC Signature Verify (X-Access-Key-Id, X-Signature, X-Timestamp, X-Nonce)
     ├─[4] JWT Token Verify      (Authorization: Bearer <token>)
     │      └── truyền X-Auth-User, X-Auth-Roles xuống downstream
     └─[5] Forward đến mock-service :8081
               └── ZeroTrust: kiểm tra X-Internal-Secret
```

> **Lưu ý quan trọng:** Tất cả request phải đi qua **API Gateway (port 8080)**. Không gọi thẳng mock-service (sẽ bị 403).

---

## Mục lục

1. [Cài đặt môi trường Postman](#1-cài-đặt-môi-trường-postman)
2. [Pre-request Script tạo HMAC Signature](#2-pre-request-script-tạo-hmac-signature)
3. [Các API không cần HMAC/JWT - `/iam/auth`](#3-các-api-không-cần-hmacjwt---iamauth)
4. [Đăng nhập lấy JWT Token - `/iam/user/login`](#4-đăng-nhập-lấy-jwt-token---iamuserlogin)
5. [Các API cần HMAC + JWT - `/iam/user`](#5-các-api-cần-hmac--jwt---iamuser)
6. [Kiểm tra Rate Limiting](#6-kiểm-tra-rate-limiting)
7. [Giải thích cơ chế bảo mật](#7-giải-thích-cơ-chế-bảo-mật)

---

## 1. Cài đặt môi trường Postman

Vào **Environments** → **New** → Đặt tên `Microservices Local`, thêm các biến:

| Variable | Initial Value | Mô tả |
|----------|--------------|-------|
| `BASE_URL` | `http://localhost:8080` | Địa chỉ API Gateway |
| `ACCESS_KEY_ID` | `client-app-001` | HMAC Access Key |
| `SECRET_KEY` | `secret-key-12345` | HMAC Secret |
| `JWT_TOKEN` | *(để trống)* | Tự động điền sau khi login |

> **Access Key khả dụng:**
> - `client-app-001` / `secret-key-12345`
> - `mobile-app-99` / `another-secret-67890`

---

## 2. Pre-request Script tạo HMAC Signature

Dán script sau vào tab **Pre-request Script** ở **Collection-level** để áp dụng cho tất cả request cần HMAC.

```javascript
// ============================================================
// HMAC-SHA256 Pre-request Script
// ============================================================

const accessKeyId = pm.environment.get("ACCESS_KEY_ID");
const secretKey   = pm.environment.get("SECRET_KEY");

const timestamp = Math.floor(Date.now() / 1000).toString();
const nonce     = Math.random().toString(36).substring(2) + Date.now().toString(36);

const method = pm.request.method.toUpperCase();
const url    = pm.request.url.toString();
const path   = "/" + url.split("/").slice(3).join("/").split("?")[0];

let bodyHash = "";
const rawBody = pm.request.body ? pm.request.body.raw : "";

if (rawBody && rawBody.trim() !== "") {
    const bodyBytes = CryptoJS.enc.Utf8.parse(rawBody);
    bodyHash = CryptoJS.SHA256(bodyBytes).toString(CryptoJS.enc.Hex);
} else {
    bodyHash = CryptoJS.SHA256("").toString(CryptoJS.enc.Hex);
}

const canonicalString = [method, path, timestamp, nonce, bodyHash].join("\n");

const signature = CryptoJS.HmacSHA256(
    canonicalString,
    CryptoJS.enc.Utf8.parse(secretKey)
).toString(CryptoJS.enc.Base64);

pm.request.headers.add({ key: "X-Access-Key-Id", value: accessKeyId });
pm.request.headers.add({ key: "X-Signature",     value: signature });
pm.request.headers.add({ key: "X-Timestamp",     value: timestamp });
pm.request.headers.add({ key: "X-Nonce",         value: nonce });

console.log("=== HMAC Debug ===");
console.log("Canonical String:\n" + canonicalString);
console.log("Signature:", signature);
```

> Postman đã tích hợp sẵn `CryptoJS`, không cần cài thêm.

---

## 3. Các API không cần HMAC/JWT - `/iam/auth`

Route `/iam/auth/**` là public — **không cần** HMAC, không cần JWT.

### 3.1 POST /iam/auth/login

| Field | Value |
|-------|-------|
| Method | `POST` |
| URL | `{{BASE_URL}}/iam/auth/login` |
| Body | Không cần |

**Response (200):** `Login success from IAM service`

---

### 3.2 POST /iam/auth/register

| Field | Value |
|-------|-------|
| Method | `POST` |
| URL | `{{BASE_URL}}/iam/auth/register` |
| Body | Không cần |

**Response (200):** `Register success`

---

### 3.3 GET /iam/auth/profile

| Field | Value |
|-------|-------|
| Method | `GET` |
| URL | `{{BASE_URL}}/iam/auth/profile` |

**Response (200):** `User profile`

---

## 4. Đăng nhập lấy JWT Token - `/iam/user/login`

Đây là bước quan trọng: đăng nhập để lấy **JWT access token** dùng cho các request tiếp theo.

| Field | Value |
|-------|-------|
| Method | `POST` |
| URL | `{{BASE_URL}}/iam/user/login` |
| Content-Type | `application/json` |
| HMAC | **Bắt buộc** (Pre-request Script) |
| JWT | Không cần — đây là endpoint lấy token |

**Request Body:**
```json
{
    "username": "admin",
    "password": "password123"
}
```

**Response thành công (200):**
```json
{
    "accessToken": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbiIsInJvbGVzIjpbIlJPTEVfVVNFUiJdfQ.xxx",
    "tokenType": "Bearer",
    "expiresIn": 86400,
    "user": "admin"
}
```

### Tự động lưu token vào biến môi trường

Thêm đoạn sau vào tab **Tests** của request login:

```javascript
if (pm.response.code === 200) {
    const json = pm.response.json();
    pm.environment.set("JWT_TOKEN", json.accessToken);
    console.log("✅ Token saved:", json.accessToken.substring(0, 40) + "...");
}
```

Sau khi chạy request login, biến `{{JWT_TOKEN}}` sẽ tự động được điền.

---

## 5. Các API cần HMAC + JWT - `/iam/user`

Các endpoint này yêu cầu **đồng thời cả 2**:
1. **HMAC headers** — thêm qua Pre-request Script ở Collection-level
2. **JWT Token** — thêm header `Authorization: Bearer {{JWT_TOKEN}}`

> **Cách thêm JWT:** Vào tab **Authorization** → chọn **Bearer Token** → điền `{{JWT_TOKEN}}`

---

### 5.1 POST /iam/user/register

| Field | Value |
|-------|-------|
| Method | `POST` |
| URL | `{{BASE_URL}}/iam/user/register` |
| Content-Type | `application/json` |
| HMAC | **Bắt buộc** |
| JWT | Không cần |

**Request Body:**
```json
{
    "username": "newuser",
    "email": "newuser@example.com",
    "password": "123456"
}
```

**Response (200):**
```json
{
    "message": "Register success",
    "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
    "tokenType": "Bearer",
    "expiresIn": 86400,
    "receivedData": {
        "username": "newuser",
        "email": "newuser@example.com",
        "password": "123456"
    }
}
```

---

### 5.2 GET /iam/user/profile

| Field | Value |
|-------|-------|
| Method | `GET` |
| URL | `{{BASE_URL}}/iam/user/profile` |
| HMAC | **Bắt buộc** |
| JWT | **Bắt buộc** — `Authorization: Bearer {{JWT_TOKEN}}` |

**Response (200):**
```json
{
    "user": "admin",
    "content": "User profile of admin"
}
```

**Response khi thiếu JWT (401):**
```json
{
    "status": 401,
    "message": "Missing or invalid Authorization header",
    "data": null,
    "timestamp": "2026-03-12T10:00:00"
}
```

**Response khi JWT hết hạn (401):**
```json
{
    "status": 401,
    "message": "Invalid or expired token",
    "data": null,
    "timestamp": "2026-03-12T10:00:00"
}
```

---

## 6. Kiểm tra Rate Limiting

API Gateway giới hạn **1 request/giây/IP** (Redis).

Gửi 2-3 request liên tiếp nhanh đến bất kỳ endpoint nào. Request thứ 2 trở đi sẽ nhận:

**Response (429):**
```json
{
    "status": 429,
    "error": "Too Many Requests",
    "message": "You are sending requests too fast. Limit: 1 request/sec",
    "retryAfter": "1 second"
}
```

> Chờ 1 giây rồi gửi lại sẽ bình thường.

---

## 7. Giải thích cơ chế bảo mật

### 7.1 JWT Token

JWT được ký bằng `HmacSHA256` với secret key chung giữa api-gateway và mock-service (lấy từ `JWT_SECRET` trong `.env`).

**Payload của token:**
```json
{
    "sub": "admin",
    "roles": ["ROLE_USER"],
    "jti": "uuid-random",
    "iat": 1741776000,
    "exp": 1741862400
}
```

**Luồng:**
```
1. POST /iam/user/login → mock-service tạo JWT → trả accessToken
2. Client gửi request với "Authorization: Bearer <token>"
3. api-gateway validate JWT (chữ ký + hạn sử dụng)
4. Hợp lệ → thêm X-Auth-User, X-Auth-Roles vào request forward
5. Service đọc X-Auth-User để biết đang phục vụ user nào
```

### 7.2 HMAC-SHA256

**Canonical String format:**
```
{METHOD}
{PATH}
{TIMESTAMP}
{NONCE}
{SHA256_HEX(BODY)}
```

**Luồng xác thực:**
```
Request đến Gateway
  ├── Timestamp trong ±5 phút?   → Không → 401
  ├── Nonce đã dùng (Redis)?     → Có    → 401 (Replay Attack)
  ├── Lookup secret theo KeyId
  ├── Tính lại HMAC-SHA256
  └── So sánh X-Signature        → Sai   → 401 | Đúng → tiếp tục
```

### 7.3 Zero Trust

Gateway tự thêm `X-Internal-Secret` vào mọi request forward xuống mock-service. Mock-service từ chối request thiếu header này → không thể bypass Gateway.

### 7.4 IP Blacklist

Redis key `blacklist:ip:{ip}`. IP bị block nhận 403 kèm thời gian còn lại bị cấm.

---

## Tóm tắt nhanh

> ⚠️ Không có prefix `/api` trước `/iam/...`

| Endpoint | Method | HMAC | JWT | Mô tả |
|----------|--------|------|-----|-------|
| `{{BASE_URL}}/iam/auth/login` | POST | ❌ | ❌ | Login đơn giản |
| `{{BASE_URL}}/iam/auth/register` | POST | ❌ | ❌ | Register đơn giản |
| `{{BASE_URL}}/iam/auth/profile` | GET | ❌ | ❌ | Profile đơn giản |
| `{{BASE_URL}}/iam/user/login` | POST | ✅ | ❌ | **Login → nhận JWT** |
| `{{BASE_URL}}/iam/user/register` | POST | ✅ | ❌ | Register → nhận JWT |
| `{{BASE_URL}}/iam/user/profile` | GET | ✅ | ✅ | Profile (cần đăng nhập) |
| `{{BASE_URL}}/api/hr/**` | * | ✅ | ✅ | HR Service (chưa triển khai) |
Client (Postman)
     │
     ▼
API Gateway :8080  ──────► mock-service :8081 (/iam/auth/**, /iam/user/**)
     │                ──►  hr-service   :8082 (/api/hr/**)  [chưa implement]
     │
     ├── Redis :6379  (Rate Limit, Nonce, IP Blacklist)
     └── KMS          (chưa implement)
```

> **Lưu ý quan trọng:** Tất cả request phải đi qua **API Gateway (port 8080)**, KHÔNG gọi thẳng vào mock-service (sẽ bị 403 - Zero Trust Policy).

---

## Mục lục

1. [Cài đặt môi trường Postman](#1-cài-đặt-môi-trường-postman)
2. [Pre-request Script tạo HMAC Signature](#2-pre-request-script-tạo-hmac-signature)
3. [Các API không cần HMAC - `/iam/auth`](#3-các-api-không-cần-hmac---iamauth)
4. [Đăng nhập lấy JWT Token](#4-đăng-nhập-lấy-jwt-token)
5. [Các API cần HMAC + JWT - `/iam/user`](#5-các-api-cần-hmac--jwt---iamuser)
6. [Kiểm tra Rate Limiting](#6-kiểm-tra-rate-limiting)
7. [Giải thích cơ chế bảo mật](#7-giải-thích-cơ-chế-bảo-mật)

---

## 1. Cài đặt môi trường Postman

### Tạo Environment mới

Vào **Environments** → **New** → Đặt tên `Microservices Local`, thêm các biến:

| Variable | Initial Value | Current Value |
|----------|--------------|---------------|
| `BASE_URL` | `http://localhost:8080` | `http://localhost:8080` |
| `ACCESS_KEY_ID` | `client-app-001` | `client-app-001` |
| `SECRET_KEY` | `secret-key-12345` | `secret-key-12345` |

> **Access Key khả dụng:**
> - `client-app-001` / `secret-key-12345`
> - `mobile-app-99` / `another-secret-67890`

---

## 2. Pre-request Script tạo HMAC Signature

Dán script sau vào tab **Pre-request Script** của từng request **hoặc** đặt ở Collection-level để dùng chung cho tất cả request cần HMAC.

```javascript
// ============================================================
// HMAC-SHA256 Pre-request Script
// Dán vào Pre-request Script của request hoặc Collection
// ============================================================

const accessKeyId = pm.environment.get("ACCESS_KEY_ID");
const secretKey   = pm.environment.get("SECRET_KEY");

// Tạo timestamp (giây) và nonce ngẫu nhiên
const timestamp = Math.floor(Date.now() / 1000).toString();
const nonce     = Math.random().toString(36).substring(2) + Date.now().toString(36);

// Lấy method và path
const method = pm.request.method.toUpperCase();
const url    = pm.request.url.toString();
const path   = "/" + url.split("/").slice(3).join("/").split("?")[0];

// Hash body (SHA-256 hex)
let bodyHash = "";
const rawBody = pm.request.body ? pm.request.body.raw : "";

if (rawBody && rawBody.trim() !== "") {
    const bodyBytes  = CryptoJS.enc.Utf8.parse(rawBody);
    bodyHash = CryptoJS.SHA256(bodyBytes).toString(CryptoJS.enc.Hex);
} else {
    // Body rỗng → hash của chuỗi rỗng
    bodyHash = CryptoJS.SHA256("").toString(CryptoJS.enc.Hex);
}

// Tạo canonical string
const canonicalString = [method, path, timestamp, nonce, bodyHash].join("\n");

// Ký HMAC-SHA256
const signature = CryptoJS.HmacSHA256(
    canonicalString,
    CryptoJS.enc.Utf8.parse(secretKey)
).toString(CryptoJS.enc.Base64);

// Gán vào header của request
pm.request.headers.add({ key: "X-Access-Key-Id", value: accessKeyId });
pm.request.headers.add({ key: "X-Signature",     value: signature });
pm.request.headers.add({ key: "X-Timestamp",     value: timestamp });
pm.request.headers.add({ key: "X-Nonce",         value: nonce });

console.log("=== HMAC Debug ===");
console.log("Method:", method);
console.log("Path:", path);
console.log("Timestamp:", timestamp);
console.log("Nonce:", nonce);
console.log("Body Hash:", bodyHash);
console.log("Canonical String:\n" + canonicalString);
console.log("Signature:", signature);
```

> **Lưu ý:** Postman đã tích hợp sẵn `CryptoJS`, không cần cài thêm thư viện.

---

## 4. Đăng nhập lấy JWT Token

Login trả về `accessToken`. Lưu token này vào biến môi trường để dùng cho các request tiếp theo.

### 4.1 POST /iam/user/login

| Field | Value |
|-------|-------|
| Method | `POST` |
| URL | `{{BASE_URL}}/iam/user/login` |
| Content-Type | `application/json` |
| HMAC | **Bắt buộc** (Pre-request Script) |
| JWT | Không cần (đây là endpoint lấy token) |

**Request Body:**
```json
{
    "username": "admin",
    "password": "password123"
}
```

**Response thành công (200):**
```json
{
    "accessToken": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbiIsInJvbGVzIjpbIlJPTEVfVVNFUiJdLCJqdGkiOiJ1dWlkIiwiaWF0IjoxNzQxNzc2MDAwLCJleHAiOjE3NDE4NjI0MDB9.xxx",
    "tokenType": "Bearer",
    "expiresIn": 86400,
    "user": "admin"
}
```

### Tự động lưu token vào biến môi trường

Thêm script sau vào tab **Tests** của request login để tự động lưu token:

```javascript
if (pm.response.code === 200) {
    const json = pm.response.json();
    pm.environment.set("JWT_TOKEN", json.accessToken);
    console.log("Token saved:", json.accessToken.substring(0, 30) + "...");
}
```

Sau đó thêm biến `JWT_TOKEN` vào Environment (để trống Current Value, script sẽ tự điền).

---

## 5. Các API cần HMAC + JWT - `/iam/user`

Các endpoint sau yêu cầu **đồng thời cả 2**:
1. **HMAC headers** (X-Access-Key-Id, X-Signature, X-Timestamp, X-Nonce) — thêm qua Pre-request Script
2. **JWT token** trong header `Authorization: Bearer {{JWT_TOKEN}}`

> **Cách thêm Authorization header:** Vào tab **Headers** → thêm key `Authorization`, value `Bearer {{JWT_TOKEN}}`

### 5.1 GET /iam/user/profile

| Field | Value |
|-------|-------|
| Method | `GET` |
| URL | `{{BASE_URL}}/iam/user/profile` |
| HMAC | **Bắt buộc** |
| JWT | **Bắt buộc** — `Authorization: Bearer {{JWT_TOKEN}}` |

**Response thành công (200):**
```json
{
    "user": "admin",
    "content": "User profile of admin"
}
```

**Response khi thiếu/sai JWT (401):**
```json
{
    "status": 401,
    "message": "Missing or invalid Authorization header",
    "data": null,
    "timestamp": "2026-03-12T10:00:00"
}
```

**Response khi token hết hạn (401):**
```json
{
    "status": 401,
    "message": "Invalid or expired token",
    "data": null,
    "timestamp": "2026-03-12T10:00:00"
}
```

### 5.2 POST /iam/user/register

| Field | Value |
|-------|-------|
| Method | `POST` |
| URL | `{{BASE_URL}}/iam/user/register` |
| Content-Type | `application/json` |
| HMAC | **Bắt buộc** |
| JWT | Không cần (tạo tài khoản mới) |

**Request Body:**
```json
{
    "username": "newuser",
    "email": "newuser@example.com",
    "password": "123456"
}
```

**Response thành công (200):**
```json
{
    "message": "Register success",
    "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
    "tokenType": "Bearer",
    "expiresIn": 86400,
    "receivedData": {
        "username": "newuser",
        "email": "newuser@example.com"
    }
}
```

---

Route `/iam/auth/**` được cấu hình `requires-hmac: false` → **không cần** thêm HMAC headers.

### 3.1 POST /iam/auth/login

| Field | Value |
|-------|-------|
| Method | `POST` |
| URL | `{{BASE_URL}}/iam/auth/login` |
| Body | Không cần |
| HMAC | Không cần |

**Response thành công (200):**
```
Login success from IAM service
```

---

### 3.2 POST /iam/auth/register

| Field | Value |
|-------|-------|
| Method | `POST` |
| URL | `{{BASE_URL}}/iam/auth/register` |
| Body | Không cần |
| HMAC | Không cần |

**Response thành công (200):**
```
Register success
```

---

### 3.3 GET /iam/auth/profile

| Field | Value |
|-------|-------|
| Method | `GET` |
| URL | `{{BASE_URL}}/iam/auth/profile` |
| HMAC | Không cần |

**Response thành công (200):**
```
User profile
```

---

## 4. Các API cần HMAC - `/iam/user`

Route `/iam/user/**` được cấu hình `requires-hmac: true` → **bắt buộc** phải có HMAC headers.

> **Trước khi test:** Đảm bảo đã gán Pre-request Script từ [mục 2](#2-pre-request-script-tạo-hmac-signature) vào request hoặc Collection.

### 4.1 POST /iam/user/login

| Field | Value |
|-------|-------|
| Method | `POST` |
| URL | `{{BASE_URL}}/iam/user/login` |
| Content-Type | `application/json` |
| HMAC | **Bắt buộc** (thêm Pre-request Script) |

**Request Body:**
```json
{
    "username": "testuser"
}
```

**Response thành công (200):**
```json
{
    "message": "Login success from IAM service",
    "user": "testuser",
    "status": "authenticated"
}
```

**Response lỗi - HMAC sai (401/403):**
```json
{
    "status": 401,
    "message": "Invalid HMAC signature",
    "data": null,
    "timestamp": "2026-03-12T10:00:00"
}
```

---

### 4.2 POST /iam/user/register

| Field | Value |
|-------|-------|
| Method | `POST` |
| URL | `{{BASE_URL}}/iam/user/register` |
| Content-Type | `application/json` |
| HMAC | **Bắt buộc** (thêm Pre-request Script) |

**Request Body:**
```json
{
    "username": "newuser",
    "email": "newuser@example.com",
    "password": "123456",
    "fullName": "New User"
}
```

**Response thành công (200):**
```json
{
    "message": "Register success",
    "receivedData": {
        "username": "newuser",
        "email": "newuser@example.com",
        "password": "123456",
        "fullName": "New User"
    },
    "timestamp": 1741776000
}
```

---

### 4.3 GET /iam/user/profile

| Field | Value |
|-------|-------|
| Method | `GET` |
| URL | `{{BASE_URL}}/iam/user/profile?name=John` |
| HMAC | **Bắt buộc** (thêm Pre-request Script) |

**Query Parameter:**

| Param | Mô tả | Bắt buộc | Mặc định |
|-------|--------|----------|----------|
| `name` | Tên user cần lấy profile | Không | `Guest` |

**Response thành công (200):**
```json
{
    "content": "User profile of John"
}
```

**Khi không truyền `name`:**
```json
{
    "content": "User profile of Guest"
}
```

---

## 5. Kiểm tra Rate Limiting

API Gateway giới hạn **1 request/giây/IP** (sử dụng Redis).

### Cách test

Tạo request lặp lại nhanh liên tiếp đến bất kỳ endpoint nào, ví dụ gửi 3 request liên tiếp đến `POST {{BASE_URL}}/iam/auth/login`.

**Response khi bị rate limit (429):**
```json
{
    "status": 429,
    "message": "Too Many Requests",
    "data": null,
    "timestamp": "2026-03-12T10:00:00"
}
```

> Chờ 1 giây rồi gửi lại sẽ hoạt động bình thường.

---

## 6. Giải thích cơ chế bảo mật

### 6.1 HMAC-SHA256 Signature

API Gateway xác thực mỗi request bằng chữ ký số. Client phải tạo **Canonical String** và ký bằng secret key:

```
{METHOD}\n
{PATH}\n
{TIMESTAMP}\n
{NONCE}\n
{SHA256_HEX(BODY)}
```

**Ví dụ Canonical String:**
```
POST
/iam/user/login
1741776000
abc123xyz
9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08
```

**Luồng xác thực:**

```
Request đến Gateway
       │
       ├── Kiểm tra Timestamp ±5 phút?  →  Sai → 401
       │
       ├── Kiểm tra Nonce đã dùng?      →  Có  → 401 (Replay Attack)
       │
       ├── Tra cứu Secret Key theo AccessKeyId
       │
       ├── Tính lại HMAC-SHA256
       │
       └── So sánh với X-Signature      →  Sai → 401
                                         →  Đúng → Forward đến service
```

### 6.2 Zero Trust (Internal Secret)

API Gateway tự động thêm header `X-Internal-Secret: your-very-secure-secret-key-2026` vào mọi request chuyển tiếp xuống mock-service. Mock-service từ chối mọi request không có header này → Ngăn truy cập trực tiếp bỏ qua Gateway.

### 6.3 IP Blacklist

Redis lưu danh sách IP bị chặn với key `blacklist:ip:{ip}`. Nếu IP bị blacklist, mọi request sẽ nhận **403** kèm thời gian còn lại bị cấm.

---

## Tóm tắt nhanh

> ⚠️ **Chú ý:** Không có prefix `/api` trước `/iam/...`. URL phải bắt đầu thẳng bằng `/iam/`.

| Endpoint đầy đủ | Method | HMAC | Mô tả |
|----------|--------|------|-------|
| `http://localhost:8080/iam/auth/login` | POST | Không | Đăng nhập (AuthController) |
| `http://localhost:8080/iam/auth/register` | POST | Không | Đăng ký (AuthController) |
| `http://localhost:8080/iam/auth/profile` | GET | Không | Profile (AuthController) |
| `http://localhost:8080/iam/user/login` | POST | **Có** | Đăng nhập có response JSON |
| `http://localhost:8080/iam/user/register` | POST | **Có** | Đăng ký có response JSON |
| `http://localhost:8080/iam/user/profile` | GET | **Có** | Profile theo tên |
| `http://localhost:8080/api/hr/**` | * | **Có** | HR Service (chưa triển khai) |
