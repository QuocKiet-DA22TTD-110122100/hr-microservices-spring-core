# Bao Cao Ban Giao - HR Service

Ngay: 2026-04-01
Pham vi: Docker Hub pipeline, compose runtime, hardening logic hr-service, DID, idempotency eventId.

## 1) Muc tieu

- Toi uu quy trinh build/push image bang Docker Hub.
- On dinh runtime stack khi chay bang compose dung registry image.
- Sua cac diem loi logic trong hr-service.
- Bo sung DID va idempotency cho endpoint sync noi bo.

## 2) Hang muc da hoan thanh

### 2.1 Docker Hub va build pipeline

- Tao/sua script build-push image:
  - docker-build-registry.ps1
  - docker-build-registry.sh
- Sua loi build context de moi service build dung folder module.
- Chuan hoa base image:
  - Dockerfile.base
- Sua .dockerignore de khong loai nham .mvn wrapper.

### 2.2 Compose runtime va moi truong

- Chinh compose chay image tu Docker Hub:
  - microservices-compose-registry.yml
- Bo sung bien moi truong thieu:
  - .env
- Chinh lai HAProxy mode dev 1 peer:
  - haproxy/haproxy.cfg
- Chinh startup/healthcheck de giam false unhealthy.

### 2.3 Hardening logic hr-service

- Harden check role ADMIN (exact-match, khong dung contains substring) tai:
  - hr-service/src/main/java/com/example/hrservice/controller/EmployeeController.java
  - hr-service/src/main/java/com/example/hrservice/controller/DepartmentController.java
  - hr-service/src/main/java/com/example/hrservice/controller/OrganizationUnitController.java
- Validate UUID trong sync, tra 400 neu sai format.
- Delete employee tra 404 neu id khong ton tai.

### 2.4 DID end-to-end

- Them did vao entity Employee:
  - hr-service/src/main/java/com/example/hrservice/entity/Employee.java
- Them finder theo did:
  - hr-service/src/main/java/com/example/hrservice/repository/EmployeeRepository.java
- Day did qua request/response/sync:
  - hr-service/src/main/java/com/example/hrservice/controller/EmployeeController.java
- Them check trung did truoc save, tra 409 Conflict.

### 2.5 Idempotency theo eventId

- Them entity luu event da xu ly:
  - hr-service/src/main/java/com/example/hrservice/entity/ProcessedSyncEvent.java
- Them repository:
  - hr-service/src/main/java/com/example/hrservice/repository/ProcessedSyncEventRepository.java
- Tich hop vao /employees/internal/users/sync:
  - event moi => SYNCED
  - event trung => DUPLICATE_IGNORED
  - co xu ly race condition bang DataIntegrityViolationException

## 3) Kiem chung da thuc hien

- Compile module hr-service thanh cong (skip tests).
- Test sync 2 lan cung eventId:
  - Lan 1: status = SYNCED
  - Lan 2: status = DUPLICATE_IGNORED
- Truy van DB xac nhan chi 1 record trong processed_sync_events cho event test.

## 4) Ket qua hien tai

- Luong sync an toan hon: validate input, chong trung DID, chong xu ly lap event.
- Runtime stack da on dinh hon o moi truong dev.
- Cac thay doi chinh da vao code va build pass.

## 5) Rui ro con lai

- Bao mat noi bo hien dua tren X-Internal-Secret + role headers; nen tang cuong bang network policy hoac mTLS khi len moi truong cao hon.
- Chua co test tu dong cho cac case quan trong (duplicate eventId, duplicate DID, invalid UUID, role parsing edge cases).
- Can tiep tuc duy tri contract giua auth-service, api-gateway va hr-service de tranh lech field trong tuong lai.

## 6) De xuat tiep theo

1. Bo sung integration tests cho endpoint sync (happy path + duplicate path + invalid path).
2. Bo sung global exception mapping de thong diep loi nhat quan hon.
3. Bo sung migration script ro rang cho bang processed_sync_events neu doi moi truong.
4. Khoa route noi bo bang private network/gateway-only va khong expose truc tiep service ports tren prod.

## 7) Lenh kiem tra nhanh

- Kiem tra runtime:
  - docker ps
- Kiem tra health:
  - curl http://localhost:8085/actuator/health
- Kiem tra idempotency record:
  - docker exec hr-mysql mysql -uroot -pchange_me -D hr_db -e "SELECT event_id, employee_id, auth_user_id, username, did, created_at FROM processed_sync_events ORDER BY id DESC LIMIT 10;"


