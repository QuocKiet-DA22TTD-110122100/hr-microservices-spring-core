# IAM Service - User Authentication

Spring Boot 3.5.11, Java 21.

## Features implemented

- User registration, login, refresh token.
- Password hashing with BCrypt.
- JWT access and refresh token signed with RSA 2048 (RS256).
- Account lock after 5 failed logins in 30 minutes.
- IP lock after 10 failed auth attempts in 60 minutes.
- IP rate limit 100 requests per second.
- Password expiry after 90 days.
- AES-GCM encryption for sensitive data (example: phone field).
- Internal service request signature validation by HMAC SHA-256 on /internal/**.
- API request logging filter.

## Endpoints

- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/refresh
- GET /internal/ping (requires internal HMAC headers)

## Quick start

1. Set environment variables (recommended):

- AES_KEY_BASE64: Base64 key length 32 bytes.
- JWT_PRIVATE_KEY_BASE64: RSA private key in PKCS8, Base64 encoded.
- JWT_PUBLIC_KEY_BASE64: RSA public key in X509, Base64 encoded.
- INTERNAL_SERVICE_SECRETS: serviceId:secret pairs.
- REDIS_HOST, REDIS_PORT

2. Run service:

- mvn spring-boot:run

## Generate keys (PowerShell)

### AES 256 key

```powershell
$bytes = New-Object byte[] 32
[System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
[Convert]::ToBase64String($bytes)
```

### RSA 2048 keypair (OpenSSL)

```powershell
openssl genrsa -out private.pem 2048
openssl pkcs8 -topk8 -inform PEM -outform DER -in private.pem -nocrypt | openssl base64 -A
openssl rsa -in private.pem -pubout -outform DER | openssl base64 -A
```

## Sample payloads

### Register

```json
{
  "username": "demo.user",
  "email": "demo@example.com",
  "password": "P@ssw0rd123",
  "phone": "+84901234567"
}
```

### Login

```json
{
  "username": "demo.user",
  "password": "P@ssw0rd123"
}
```

### Refresh

```json
{
  "refreshToken": "<token>"
}
```

## Internal HMAC header format

Headers:

- X-Internal-Service
- X-Internal-Timestamp (epoch seconds)
- X-Internal-Signature

Signing payload:

METHOD + "\n" + REQUEST_URI + "\n" + TIMESTAMP

Signature algorithm: HmacSHA256, output Base64.

## Notes for full microservices assignment

- Gateway request logging should be implemented in gateway-service.
- Eureka basic auth, Config service basic auth, and KMS key rotation are outside this IAM module and can be added in next phase.
