Module M03 — E2E Smoke Tests (auth → gateway → hr flows)

Overview
This module provides automated E2E smoke tests that verify the core authentication and authorization flows:
- Auth service registration and login
- JWT token generation and validation via KMS
- Gateway JWT filter and header injection
- HR service access via gateway with token authentication

Files Added
- `smoke-test-e2e.ps1`: PowerShell script that runs automated smoke tests

Quick Start (after docker stack is running)

Run all tests with defaults (localhost ports):
```powershell
.\smoke-test-e2e.ps1
```

Run with custom service URLs:
```powershell
.\smoke-test-e2e.ps1 -GatewayUrl "http://gateway:8080" -AuthServiceUrl "http://auth:8081" -HrServiceUrl "http://hr:8082" -KmsUrl "http://kms:9000"
```

Test Flow
1. **Health Checks** (Phase 1)
   - Gateway health endpoint
   - Auth service health
   - HR service health (with X-Internal-Secret header)
   - KMS JWKS endpoint

2. **Auth Flow** (Phase 2)
   - Register new test user
   - Login and retrieve JWT token

3. **Protected API Access** (Phase 3)
   - Access HR APIs through gateway using JWT Bearer token
   - Verify token is correctly injected by gateway filters

Expected Results
- All health checks return HTTP 200
- Registration succeeds (HTTP 200 or 201)
- Login succeeds and returns JWT token
- HR API calls through gateway succeed with Authorization header

Troubleshooting
- **Health checks fail**: Services may not be running. Start with `.\run-full-stack.ps1 -Build`
- **Auth flow fails**: Check auth-service logs for credential/database issues
- **Gateway access fails**: Check gateway logs for JWT validation or routing errors
- **HR access fails**: Verify X-Internal-Secret header is configured correctly

Next Steps
- Integrate into CI/CD pipeline (GitHub Actions / Azure Pipelines)
- Add load-test variant for performance validation
- Monitor E2E test results in observability dashboard (Grafana)

Exit Codes
- 0: All tests passed
- 1: One or more tests failed

