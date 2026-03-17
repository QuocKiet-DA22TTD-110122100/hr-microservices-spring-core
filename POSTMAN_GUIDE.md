# Huong Dan Test API Bang Postman

## Tong quan

Luong request:

1. Client goi vao API Gateway `http://localhost:8080`
2. Gateway kiem tra bao mat theo thu tu:
- IP blacklist
- Rate limit (Redis)
- HMAC
- JWT (voi route can JWT)
3. Gateway forward toi downstream service (`mock-iam-service`, `hr-service`)

Luu y:
- Khong goi truc tiep vao `mock-iam-service` neu muon test dung luong bao mat.
- Route HR public URL la `/api/hr/**` (qua Gateway), khong phai URL noi bo cua hr-service.

---

## 1. Cai dat Environment trong Postman

Tao environment `Microservices Local` voi cac bien:

| Variable | Value |
|---|---|
| `BASE_URL` | `http://localhost:8080` |
| `ACCESS_KEY_ID` | `client-app-001` |
| `SECRET_KEY` | `secret-key-12345` |
| `JWT_TOKEN` | *(de trong, auto save sau login)* |

Access key hop le:
- `client-app-001` / `secret-key-12345`
- `mobile-app-99` / `another-secret-67890`

---

## 2. Pre-request Script HMAC (Collection-level)

Dan script nay vao tab **Pre-request Script** cua collection:

```javascript
const accessKeyId = pm.environment.get("ACCESS_KEY_ID");
const secretKey = pm.environment.get("SECRET_KEY");

const timestamp = Math.floor(Date.now() / 1000).toString();
const nonce = Math.random().toString(36).substring(2) + Date.now().toString(36);

const method = pm.request.method.toUpperCase();
const url = pm.request.url.toString();
const path = "/" + url.split("/").slice(3).join("/").split("?")[0];

let bodyHash = "";
const rawBody = pm.request.body ? pm.request.body.raw : "";

if (rawBody && rawBody.trim() !== "") {
  const bodyBytes = CryptoJS.enc.Utf8.parse(rawBody);
  bodyHash = CryptoJS.SHA256(bodyBytes).toString(CryptoJS.enc.Hex);
} else {
  // Gateway hien tai dung bodyHash rong cho request khong co body
  bodyHash = "";
}

const canonicalString = [method, path, timestamp, nonce, bodyHash].join("\n");
const signature = CryptoJS.HmacSHA256(
  canonicalString,
  CryptoJS.enc.Utf8.parse(secretKey)
).toString(CryptoJS.enc.Base64);

pm.request.headers.upsert({ key: "X-Access-Key-Id", value: accessKeyId });
pm.request.headers.upsert({ key: "X-Signature", value: signature });
pm.request.headers.upsert({ key: "X-Timestamp", value: timestamp });
pm.request.headers.upsert({ key: "X-Nonce", value: nonce });
```

Luu y:
- Script nay nen dat o collection-level de ap dung cho request can HMAC.
- Route nao **khong can HMAC** thi tat script o request do (neu can).

---

## 3. Endpoint khong can HMAC/JWT (`/iam/auth/**`)

### 3.1 POST `{{BASE_URL}}/iam/auth/login`
- HMAC: Khong
- JWT: Khong
- Body: Bat buoc (JSON)

```json
{
  "username": "admin",
  "password": "password123"
}
```

### 3.2 POST `{{BASE_URL}}/iam/auth/register`
- HMAC: Khong
- JWT: Khong
- Body: Bat buoc (JSON)

```json
{
  "username": "newuser",
  "email": "newuser@example.com",
  "password": "123456"
}
```

### 3.3 GET `{{BASE_URL}}/iam/auth/profile`
- HMAC: Khong
- JWT: Khong

---

## 4. Dang nhap lay JWT (`/iam/user/login`)

### Request
- Method: `POST`
- URL: `{{BASE_URL}}/iam/user/login`
- Content-Type: `application/json`
- HMAC: Bat buoc
- JWT: Khong can (day la endpoint cap token)

Body:

```json
{
  "username": "admin",
  "password": "password123"
}
```

### Tests script de luu token

Dan vao tab **Tests** cua request login:

```javascript
if (pm.response.code === 200) {
  const json = pm.response.json();
  pm.environment.set("JWT_TOKEN", json.accessToken);
  console.log("Token saved:", (json.accessToken || "").substring(0, 30) + "...");
}
```

---

## 5. Endpoint can HMAC + JWT

### 5.1 GET `{{BASE_URL}}/iam/user/profile`
- HMAC: Bat buoc
- JWT: Bat buoc
- Header:
  - `Authorization: Bearer {{JWT_TOKEN}}`

### 5.2 HR route qua Gateway: GET `{{BASE_URL}}/api/hr/employees`
- HMAC: Bat buoc
- JWT: Bat buoc
- Header:
  - `Authorization: Bearer {{JWT_TOKEN}}`

Luu y quan trong:
- URL tren la URL Gateway.
- Neu goi truc tiep hr-service thi dung `http://localhost:8085/employees`.
- `http://localhost:8085/api/hr/employees` se 404 la binh thuong vi khong co mapping do trong hr-service.

---

## 6. Rate limiting

Gateway dang gioi han request theo IP. Neu goi qua nhanh co the nhan `429 Too Many Requests`.

Khuyen nghi khi test bang Postman:
- Khong bam send lien tuc qua nhanh
- Chen tre nho giua cac request (0.5-1s)

---

## 7. Checklist khi gap loi

Neu login hoac route qua Gateway loi, kiem tra theo thu tu:

1. Gateway song:
- `GET http://localhost:8080/actuator/health`

2. Eureka co service:
- `API-GATEWAY`
- `HR-SERVICE`

3. `mock-iam-service` dang chay (de login lay JWT)

4. Header co du:
- `X-Access-Key-Id`
- `X-Signature`
- `X-Timestamp`
- `X-Nonce`
- `Authorization` (voi route can JWT)

5. Path dung:
- Qua gateway: `/api/hr/...`
- Truc tiep hr-service: `/employees`

---

## 8. Tom tat nhanh

| Endpoint | HMAC | JWT |
|---|---|---|
| `POST {{BASE_URL}}/iam/auth/login` | No | No |
| `POST {{BASE_URL}}/iam/auth/register` | No | No |
| `GET {{BASE_URL}}/iam/auth/profile` | No | No |
| `POST {{BASE_URL}}/iam/user/login` | Yes | No |
| `GET {{BASE_URL}}/iam/user/profile` | Yes | Yes |
| `GET {{BASE_URL}}/api/hr/employees` | Yes | Yes |
