# Auth Register Endpoint 404 Fix Design

## Overview

Lỗi 404 NOT_FOUND xảy ra khi gửi POST request đến `/api/v1/auth/register` qua API Gateway do thiếu route configuration và mock-service không được deploy. Design này sẽ thêm route configuration cho `/api/v1/auth/register` trong API Gateway và đảm bảo mock-service được deploy để xử lý authentication requests.

## Glossary

- **Bug_Condition (C)**: Condition khi request đến `/api/v1/auth/register` qua API Gateway trả về 404 NOT_FOUND
- **Property (P)**: Behavior mong muốn khi request được route thành công đến authentication service và trả về response hợp lệ
- **Preservation**: Existing routes và authentication behavior phải hoạt động bình thường sau khi fix
- **API Gateway**: Service gateway tại port 8080 chịu trách nhiệm routing requests đến các backend services
- **mock-service**: Authentication service tại port 8081 chứa các endpoints `/iam/auth/*` và `/iam/user/*`
- **Route Configuration**: Spring Cloud Gateway route definitions trong `application.yaml`

## Bug Details

### Bug Condition

Lỗi xảy ra khi client gửi POST request đến `/api/v1/auth/register` qua API Gateway. API Gateway không tìm thấy route configuration phù hợp và xử lý request như static resource, dẫn đến 404 NOT_FOUND.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type HttpRequest
  OUTPUT: boolean
  
  RETURN input.method == "POST"
         AND input.path == "/api/v1/auth/register"
         AND input.targetHost == "api-gateway:8080"
         AND NOT routeExists("/api/v1/auth/register")
         AND mockServiceNotDeployed()
END FUNCTION
```

### Examples

- **Request**: `POST http://localhost:8080/api/v1/auth/register` với body `{"username": "testuser", "password": "password123"}`
  - **Current**: 404 NOT_FOUND với message "No static resource api/v1/auth/register"
  - **Expected**: 200 OK với JWT token và user information

- **Request**: `POST http://localhost:8080/api/v1/auth/register` với empty body
  - **Current**: 404 NOT_FOUND
  - **Expected**: 400 Bad Request hoặc validation error từ authentication service

- **Edge Case**: `GET http://localhost:8080/api/v1/auth/register`
  - **Expected**: 405 Method Not Allowed (chỉ hỗ trợ POST)

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Existing routes `/iam/user/login`, `/iam/user/register` phải tiếp tục hoạt động bình thường
- Routes khác như `/demo/**`, `/kms/**`, `/eureka/**` phải không bị ảnh hưởng
- Authentication và JWT token generation phải hoạt động như hiện tại

**Scope:**
Tất cả requests không liên quan đến `/api/v1/auth/register` phải hoạt động bình thường. Bao gồm:
- Mouse clicks và interactions với existing endpoints
- Authentication flows qua `/iam/user/*` endpoints
- Service discovery và load balancing cho các services khác

## Hypothesized Root Cause

Dựa trên phân tích bug, các nguyên nhân có thể là:

1. **Missing Route Configuration**: API Gateway thiếu route definition cho `/api/v1/auth/register`
   - Current routes chỉ có `/iam/auth/**` và `/iam/user/**`
   - Không có route nào match với pattern `/api/v1/auth/register`

2. **Service Deployment Issue**: mock-service không được include trong docker-compose
   - Service không khả dụng để xử lý authentication requests
   - API Gateway không thể forward requests đến backend service

3. **Path Mapping Mismatch**: Route configuration có thể cần StripPrefix filter
   - Request path `/api/v1/auth/register` cần được map đến `/iam/user/register`

4. **Service Discovery Issue**: mock-service có thể không được register với Eureka
   - API Gateway không thể discover service qua service name

## Correctness Properties

Property 1: Bug Condition - API V1 Auth Register Route

_For any_ POST request đến `/api/v1/auth/register` qua API Gateway với valid authentication data, the fixed system SHALL route request đến mock-service và trả về successful response với JWT token và user information.

**Validates: Requirements 2.1, 2.2**

Property 2: Preservation - Existing Authentication Routes

_For any_ request đến existing routes như `/iam/user/login`, `/iam/user/register`, `/iam/auth/**`, the fixed system SHALL produce exactly the same behavior as the original system, preserving all authentication functionality và JWT token generation.

**Validates: Requirements 3.1, 3.2, 3.3**

## Fix Implementation

### Changes Required

Assuming root cause analysis đúng:

**File**: `api-gateway/src/main/resources/application.yaml`

**Section**: `spring.cloud.gateway.routes`

**Specific Changes**:
1. **Add New Route Configuration**: Thêm route cho `/api/v1/auth/register`
   - Route ID: `api-v1-auth-register-route`
   - URI: `http://localhost:8081` (mock-service)
   - Predicate: `Path=/api/v1/auth/register`
   - Filter: `RewritePath=/api/v1/auth/register,/iam/user/register`

2. **Update Docker Compose**: Include mock-service trong deployment
   - Add mock-service service definition
   - Configure port mapping 8081:8081
   - Add dependency relationships

3. **Verify Service Registration**: Ensure mock-service có thể register với Eureka
   - Check eureka client configuration trong mock-service
   - Verify service discovery hoạt động

4. **Add Metadata Configuration**: Configure security requirements
   - `requires-hmac: true`
   - `requires-jwt: false` (registration không cần JWT)

5. **Test Route Priority**: Ensure new route không conflict với existing routes
   - Place route before generic `/iam/**` routes
   - Verify route matching order

## Testing Strategy

### Validation Approach

Testing strategy sử dụng two-phase approach: đầu tiên surface counterexamples để demonstrate bug trên unfixed code, sau đó verify fix hoạt động correctly và preserve existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples để demonstrate bug BEFORE implementing fix. Confirm hoặc refute root cause analysis. Nếu refute, cần re-hypothesize.

**Test Plan**: Write tests simulate POST requests đến `/api/v1/auth/register` và assert rằng response là successful với JWT token. Run tests trên UNFIXED code để observe failures và understand root cause.

**Test Cases**:
1. **Basic Registration Test**: POST `/api/v1/auth/register` với valid user data (will fail on unfixed code)
2. **Empty Body Test**: POST `/api/v1/auth/register` với empty body (will fail on unfixed code)
3. **Invalid Method Test**: GET `/api/v1/auth/register` (will fail on unfixed code)
4. **Service Availability Test**: Check mock-service accessibility (may fail on unfixed code)

**Expected Counterexamples**:
- 404 NOT_FOUND responses thay vì successful registration
- Possible causes: missing route configuration, service not deployed, path mapping issues

### Fix Checking

**Goal**: Verify rằng for all inputs where bug condition holds, fixed system produces expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := apiGateway_fixed(input)
  ASSERT expectedBehavior(result)
END FOR
```

### Preservation Checking

**Goal**: Verify rằng for all inputs where bug condition does NOT hold, fixed system produces same result as original system.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT apiGateway_original(input) = apiGateway_fixed(input)
END FOR
```

**Testing Approach**: Property-based testing được recommend cho preservation checking vì:
- Generates many test cases automatically across input domain
- Catches edge cases mà manual unit tests có thể miss
- Provides strong guarantees rằng behavior unchanged cho all non-buggy inputs

**Test Plan**: Observe behavior trên UNFIXED code đầu tiên cho existing routes, sau đó write property-based tests capturing behavior đó.

**Test Cases**:
1. **Existing Auth Routes Preservation**: Observe `/iam/user/login`, `/iam/user/register` work correctly on unfixed code, then verify continues after fix
2. **Other Routes Preservation**: Observe `/demo/**`, `/kms/**` work correctly on unfixed code, then verify continues after fix
3. **JWT Token Generation Preservation**: Observe JWT tokens generated correctly on unfixed code, then verify continues after fix

### Unit Tests

- Test route configuration parsing và matching
- Test path rewriting từ `/api/v1/auth/register` đến `/iam/user/register`
- Test service discovery và load balancing cho mock-service

### Property-Based Tests

- Generate random valid registration data và verify successful routing
- Generate random existing route requests và verify preservation of behavior
- Test across many scenarios với different user data và request formats

### Integration Tests

- Test full registration flow qua API Gateway đến mock-service
- Test service startup và discovery trong docker-compose environment
- Test rằng JWT tokens generated correctly và có thể được used cho subsequent requests