# Implementation Plan

- [ ] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - API V1 Auth Register Route 404 Error
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: Scope the property to concrete failing case: POST `/api/v1/auth/register` with valid registration data
  - Test that POST request to `/api/v1/auth/register` via API Gateway (port 8080) returns 404 NOT_FOUND instead of successful registration
  - Test implementation details from Bug Condition in design: `isBugCondition(input)` where input is POST request to `/api/v1/auth/register`
  - The test assertions should match the Expected Behavior Properties from design: successful routing and JWT token response
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS with 404 NOT_FOUND (this is correct - it proves the bug exists)
  - Document counterexamples found: "POST /api/v1/auth/register returns 404 'No static resource' instead of routing to authentication service"
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 2.1, 2.2_

- [ ] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Existing Authentication Routes Behavior
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for existing authentication routes: `/iam/user/login`, `/iam/user/register`, `/iam/auth/**`
  - Observe behavior on UNFIXED code for other routes: `/demo/**`, `/kms/**`, `/eureka/**`
  - Write property-based tests capturing observed behavior patterns from Preservation Requirements
  - Property-based testing generates many test cases for stronger guarantees
  - Test that existing routes continue to work correctly and return expected responses
  - Test that JWT token generation continues to work as before
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3_

- [ ] 3. Fix for auth register endpoint 404 error

  - [ ] 3.1 Add route configuration for /api/v1/auth/register in API Gateway
    - Add new route definition in `api-gateway/src/main/resources/application.yaml`
    - Configure route ID: `api-v1-auth-register-route`
    - Set URI to point to mock-service: `http://localhost:8081`
    - Add predicate: `Path=/api/v1/auth/register`
    - Add RewritePath filter: `/api/v1/auth/register,/iam/user/register`
    - Configure metadata: `requires-hmac: true`, `requires-jwt: false`
    - Ensure route is placed before generic `/iam/**` routes for proper precedence
    - _Bug_Condition: isBugCondition(input) where input.method == "POST" AND input.path == "/api/v1/auth/register" AND NOT routeExists("/api/v1/auth/register")_
    - _Expected_Behavior: expectedBehavior(result) - successful routing to authentication service with JWT token response_
    - _Preservation: Existing routes `/iam/user/*`, `/demo/**`, `/kms/**` must continue working normally_
    - _Requirements: 1.1, 1.2, 2.1, 2.2, 3.1, 3.2_

  - [ ] 3.2 Update docker-compose to include mock-service
    - Add mock-service service definition to `docker-compose.yml`
    - Configure port mapping: `8081:8081`
    - Add dependency on eureka-server for service discovery
    - Ensure mock-service can register with Eureka server
    - Configure environment variables for service discovery
    - _Bug_Condition: mockServiceNotDeployed() from design specification_
    - _Expected_Behavior: mock-service available to handle authentication requests_
    - _Preservation: Other services in docker-compose must continue working normally_
    - _Requirements: 1.3, 2.3, 3.1, 3.2, 3.3_

  - [ ] 3.3 Verify service discovery and routing configuration
    - Test that mock-service registers successfully with Eureka server
    - Verify API Gateway can discover mock-service through service registry
    - Test route matching and path rewriting functionality
    - Ensure security filters (HMAC, JWT) are applied correctly to new route
    - Verify load balancing works if multiple mock-service instances
    - _Expected_Behavior: Complete service discovery and routing pipeline working_
    - _Preservation: Existing service discovery for other services unchanged_
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2_

  - [ ] 3.4 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - API V1 Auth Register Route Success
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - Verify POST `/api/v1/auth/register` now returns successful response with JWT token
    - _Requirements: Expected Behavior Properties from design - successful routing and authentication_

  - [ ] 3.5 Verify preservation tests still pass
    - **Property 2: Preservation** - Existing Authentication Routes Behavior
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all existing routes still work: `/iam/user/login`, `/iam/user/register`, `/demo/**`, `/kms/**`
    - Confirm JWT token generation still works correctly
    - Confirm no impact on other services or authentication flows

- [ ] 4. Checkpoint - Ensure all tests pass
  - Run complete test suite to verify all functionality works
  - Verify API Gateway starts successfully with new route configuration
  - Verify mock-service deploys and registers with Eureka
  - Verify end-to-end registration flow works through `/api/v1/auth/register`
  - Verify no regressions in existing authentication or routing functionality
  - Ask the user if any questions arise or additional testing is needed