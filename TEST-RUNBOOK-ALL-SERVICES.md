# TEST RUNBOOK - TOAN BO MICROSERVICES

Ngay cap nhat: 2026-04-02
Pham vi: eureka-peer1, api-gateway, auth-service, kms-service, hr-service, frontend, prometheus, grafana
Khong can tao script. Chay tay theo checklist duoi day.

## 1) Chuan bi

- Mo terminal tai root project.
- Khoi dong he thong:

```powershell
docker compose -f microservices-compose.yml up -d
```

- Kiem tra trang thai:

```powershell
docker compose -f microservices-compose.yml ps
```

- Neu can doi healthcheck on dinh (dac biet kms/auth):

```powershell
docker compose -f microservices-compose.yml ps kms-service auth-service
```

- Xem log khi service chua healthy:

```powershell
docker compose -f microservices-compose.yml logs -f eureka-peer1
docker compose -f microservices-compose.yml logs -f api-gateway
docker compose -f microservices-compose.yml logs -f kms-service
docker compose -f microservices-compose.yml logs -f hr-service
docker compose -f microservices-compose.yml logs -f auth-service
```

Ghi chu:
- Lan dau build co the >10 phut.
- kms-service co the can hon 300s de healthy.
- Tren PowerShell, uu tien dung `curl.exe` thay cho `curl`.

## 2) Smoke test nhanh (15-20 phut)

Muc tieu: xac nhan he thong dang song va luong chinh chay duoc.

### B1. Health endpoint (qua host ports)

```powershell
curl.exe -i http://localhost:8080/actuator/health
curl.exe -i http://localhost:8086/actuator/health
curl.exe -i http://localhost:8083/actuator/health
curl.exe -i http://localhost:8085/actuator/health
curl.exe -i http://localhost:3000/
curl.exe -i http://localhost:9090/-/healthy
curl.exe -i http://localhost:3001/api/health
```

Ky vong:
- Tra ve HTTP 200 (hoac body status UP voi actuator).

### B2. Eureka registration

- Mo trinh duyet: `http://localhost:18760`
- Dang nhap bang tai khoan Eureka trong file `.env` (neu duoc yeu cau).
- Xac nhan da co cac instance: API-GATEWAY, AUTH-SERVICE, KMS-SERVICE, HR-SERVICE.

### B3. Smoke Postman collections

Trong Postman:
- Import environment: `postman/full-system-pass-once.postman_environment.json`
- Chay lan luot:
  - `postman/full-system-pass-once.postman_collection.json`

Ky vong:
- Request quan trong pass (login, token, endpoint HR/KMS co auth).
- Khong co loi 5xx bat thuong.

## 3) Regression day du (60-90 phut)

Muc tieu: test du luong nghiep vu + quan tri + theo doi he thong.

### Thu tu chay collection de tranh phu thuoc

1. `postman/full-system-pass-once.postman_collection.json`
2. `postman/full-system-report.postman_collection.json`

### Cac diem phai check trong khi chay

- Auth:
  - Login thanh cong, lay duoc access token.
  - Flow doi mat khau / reset pass pass.
  - Case sai mat khau, token het han, thieu quyen cho ket qua dung (4xx).
- KMS:
  - Encrypt/decrypt (hoac API tuong duong) phan hoi dung schema.
- HR:
  - CRUD nhan su/phong ban pass theo role.
- Gateway:
  - Route dung service dich.
  - Header/authorization duoc xu ly dung.
- Integration:
  - Luong lien service auth -> gateway -> hr/kms pass.

## 4) Monitoring va observability

- Prometheus: `http://localhost:9090`
- Grafana: `http://localhost:3001` (mac dinh admin/admin)

Check:
- Co metrics cua gateway/auth/hr/kms.
- Co request count va error count tuong ung voi ket qua Postman.

## 5) Tieu chi PASS cuoi cung

Tat ca dieu kien duoi day phai dat:
- Tat ca container chinh `Up` va service can thiet `healthy`.
- Cac service da register tren Eureka.
- Smoke test pass khong co loi nghiem trong.
- Regression test khong co blocker (khong co 5xx lap lai, khong timeout bat thuong).
- Monitoring co du lieu cho service chinh.

## 6) Neu fail thi xu ly nhanh

- Xem logs:

```powershell
docker compose -f microservices-compose.yml logs --tail=200 auth-service
docker compose -f microservices-compose.yml logs --tail=200 kms-service
docker compose -f microservices-compose.yml logs --tail=200 hr-service
docker compose -f microservices-compose.yml logs --tail=200 api-gateway
```

- Kiem tra lai health:

```powershell
docker compose -f microservices-compose.yml ps
```

- Neu can restart mot service:

```powershell
docker compose -f microservices-compose.yml restart kms-service
```
