# Postman Testing Collections

Đây là bộ test collections cho hệ thống microservices, được tạo để verify fix cho lỗi 404 NOT_FOUND của endpoint `/api/v1/auth/register` và test toàn bộ hệ thống.

## Collections

### 1. Auth-Register-Fix-Test.postman_collection.json
**Mục đích**: Test specific cho việc fix lỗi 404 của endpoint `/api/v1/auth/register`

**Test Cases**:
- ✅ Bug Condition Tests: Verify `/api/v1/auth/register` hoạt động (không còn 404)
- ✅ Preservation Tests: Verify existing endpoints vẫn hoạt động bình thường
- ✅ Error Handling Tests: Test với invalid data và empty body
- ✅ Service Health Tests: Verify services đang chạy

**Property-Based Tests**:
- Property 1: Bug Condition - API V1 Auth Register Route
- Property 2: Preservation - Existing Authentication Routes

### 2. Microservices-System-Test.postman_collection.json
**Mục đích**: Comprehensive testing cho toàn bộ hệ thống microservices

**Test Categories**:
- 🏥 Service Health Checks: API Gateway, Eureka, Mock IAM Service
- 🔐 Authentication Endpoints: Tất cả auth routes
- 🔗 Service Integration Tests: Cross-service communication
- ❌ Error Handling Tests: Invalid endpoints, malformed data

## Environment

### Local-Development.postman_environment.json
Environment variables cho local development:
- `api_gateway_url`: http://localhost:8080
- `mock_service_url`: http://localhost:8081
- `eureka_server_url`: http://localhost:8761
- `demo_service_url`: http://localhost:8084
- `kms_service_url`: http://localhost:8083
- Test credentials và tokens

## Cách sử dụng

### 1. Manual Testing (Postman GUI)
1. Import collections và environment vào Postman
2. Select "Local Development Environment"
3. Run collections hoặc individual requests

### 2. Automated Testing (Newman CLI)

#### Quick Test - Auth Fix Only
```bash
run-auth-fix-tests.bat
```

#### Comprehensive Testing
```bash
run-comprehensive-tests.bat
```

#### Manual Newman Commands
```bash
# Test auth fix
newman run "postman-collections/Auth-Register-Fix-Test.postman_collection.json" \
    --environment "postman-collections/Local-Development.postman_environment.json" \
    --reporters cli,html \
    --reporter-html-export "test-reports/auth-fix-report.html"

# Test entire system
newman run "postman-collections/Microservices-System-Test.postman_collection.json" \
    --environment "postman-collections/Local-Development.postman_environment.json" \
    --reporters cli,html \
    --reporter-html-export "test-reports/system-report.html"
```

## Prerequisites

### 1. Services Running
Ensure tất cả services đang chạy:
```bash
# Start services
start-with-iam-fix.bat

# Or manually
docker-compose -f microservices-compose.yml up --build
```

### 2. Newman Installation
```bash
npm install -g newman newman-reporter-html
```

## Test Reports

Sau khi chạy tests, reports sẽ được generate trong `test-reports/`:
- `auth-fix-test-report.html`: Auth fix test results
- `system-test-report.html`: Comprehensive system test results

## Expected Results

### ✅ Success Criteria
- `/api/v1/auth/register` returns 200 với JWT token (không còn 404)
- Existing endpoints `/iam/auth/*` và `/iam/user/*` vẫn hoạt động
- Demo service accessible qua API Gateway
- Tất cả services healthy và responsive

### ❌ Failure Indicators
- 404 NOT_FOUND cho `/api/v1/auth/register`
- "No static resource" error messages
- Existing endpoints bị broken
- Services không healthy

## Integration với CI/CD

Các scripts có thể được integrate vào CI/CD pipeline:

```yaml
# Example GitHub Actions
- name: Run Microservices Tests
  run: |
    docker-compose -f microservices-compose.yml up -d
    sleep 30
    ./run-comprehensive-tests.bat
    docker-compose -f microservices-compose.yml down
```

## Troubleshooting

### Common Issues

1. **Newman not found**
   ```bash
   npm install -g newman newman-reporter-html
   ```

2. **Services not running**
   ```bash
   docker-compose -f microservices-compose.yml up --build
   ```

3. **Port conflicts**
   - Check ports 8080, 8081, 8761, 8084, 8083 are available
   - Update environment variables if needed

4. **Tests failing**
   - Check service logs: `docker-compose logs [service-name]`
   - Verify API Gateway routes configuration
   - Check mock-service endpoints

## Next Steps

Đây là phần đầu tiên của comprehensive testing strategy. Tiếp theo sẽ implement:
- Security filter testing (JWT, HMAC, IP blacklist, rate limiting)
- Performance và load testing
- Cross-service integration testing
- Monitoring và alerting integration
- CI/CD automation pipeline