<#
E2E Smoke Tests: Auth → Gateway → HR flows
Usage:
  .\smoke-test-e2e.ps1 -GatewayUrl "http://localhost:8080" -AuthServiceUrl "http://localhost:8081" -HrServiceUrl "http://localhost:8082" -KmsUrl "http://localhost:9000"

This script tests:
1. Service health checks (Gateway, Auth, HR, KMS)
2. User registration
3. User login and JWT token generation
4. Token verification via KMS JWKS
5. HR API access through Gateway with JWT auth
#>

param(
    [string]$GatewayUrl = "http://localhost:8080",
    [string]$AuthServiceUrl = "http://localhost:8081",
    [string]$HrServiceUrl = "http://localhost:8082",
    [string]$KmsUrl = "http://localhost:9000",
    [string]$InternalSecret = "your-internal-secret-key"
)

$testsPassed = 0
$testsFailed = 0

function Test-Endpoint {
    param([string]$Name, [string]$Method, [string]$Url, [hashtable]$Headers = @{})
    try {
        Write-Host "  [TEST] $Name..." -NoNewline
        $response = Invoke-WebRequest -Uri $Url -Method $Method -Headers $Headers -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
        if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 300) {
            Write-Host " ✓" -ForegroundColor Green
            $script:testsPassed++
            return $response.Content
        } else {
            Write-Host " ✗ (Status: $($response.StatusCode))" -ForegroundColor Red
            $script:testsFailed++
            return $null
        }
    } catch {
        Write-Host " ✗ (Error: $($_.Exception.Message))" -ForegroundColor Red
        $script:testsFailed++
        return $null
    }
}

Write-Host "=========== HR Microservices E2E Smoke Tests ===========" -ForegroundColor Cyan
Write-Host "Gateway: $GatewayUrl"
Write-Host "Auth: $AuthServiceUrl"
Write-Host "HR: $HrServiceUrl"
Write-Host "KMS: $KmsUrl"
Write-Host ""

# === Phase 1: Health Checks ===
Write-Host "[1] HEALTH CHECKS" -ForegroundColor Yellow
Test-Endpoint "Gateway Health" "GET" "$GatewayUrl/actuator/health" @{"Accept" = "application/json"} | Out-Null
Test-Endpoint "Auth Service Health" "GET" "$AuthServiceUrl/actuator/health" @{"Accept" = "application/json"} | Out-Null
Test-Endpoint "HR Service Health (Direct)" "GET" "$HrServiceUrl/actuator/health" @{"Accept" = "application/json"; "X-Internal-Secret" = $InternalSecret} | Out-Null
Test-Endpoint "KMS JWKS" "GET" "$KmsUrl/.well-known/jwks.json" @{"Accept" = "application/json"} | Out-Null
Write-Host ""

# === Phase 2: Auth Flow ===
Write-Host "[2] AUTH FLOW" -ForegroundColor Yellow
$testUser = "test_$(Get-Random)@example.com"
$testPassword = "TempPass@123"

# Register user
$registerBody = @{
    email = $testUser
    password = $testPassword
    firstName = "Test"
    lastName = "User"
} | ConvertTo-Json

try {
    Write-Host "  [TEST] Register user..." -NoNewline
    $registerResp = Invoke-WebRequest -Uri "$GatewayUrl/api/iam/register" `
        -Method POST `
        -Headers @{"Content-Type" = "application/json"} `
        -Body $registerBody `
        -UseBasicParsing `
        -TimeoutSec 10 `
        -ErrorAction Stop
    if ($registerResp.StatusCode -eq 200 -or $registerResp.StatusCode -eq 201) {
        Write-Host " ✓" -ForegroundColor Green
        $script:testsPassed++
    } else {
        Write-Host " ✗ (Status: $($registerResp.StatusCode))" -ForegroundColor Red
        $script:testsFailed++
    }
} catch {
    Write-Host " ✗ (Error: $($_.Exception.Message))" -ForegroundColor Red
    $script:testsFailed++
}

# Login
$loginBody = @{
    email = $testUser
    password = $testPassword
} | ConvertTo-Json

$jwtToken = $null
try {
    Write-Host "  [TEST] Login user..." -NoNewline
    $loginResp = Invoke-WebRequest -Uri "$GatewayUrl/api/iam/login" `
        -Method POST `
        -Headers @{"Content-Type" = "application/json"} `
        -Body $loginBody `
        -UseBasicParsing `
        -TimeoutSec 10 `
        -ErrorAction Stop
    
    if ($loginResp.StatusCode -eq 200) {
        $loginData = $loginResp.Content | ConvertFrom-Json
        if ($loginData.data.token) {
            $jwtToken = $loginData.data.token
            Write-Host " ✓ (Token: $($jwtToken.Substring(0, 20))...)" -ForegroundColor Green
            $script:testsPassed++
        } else {
            Write-Host " ✗ (No token in response)" -ForegroundColor Red
            $script:testsFailed++
        }
    } else {
        Write-Host " ✗ (Status: $($loginResp.StatusCode))" -ForegroundColor Red
        $script:testsFailed++
    }
} catch {
    Write-Host " ✗ (Error: $($_.Exception.Message))" -ForegroundColor Red
    $script:testsFailed++
}
Write-Host ""

# === Phase 3: Protected API Access ===
if ($jwtToken) {
    Write-Host "[3] GATEWAY PROTECTED API ACCESS" -ForegroundColor Yellow
    $authHeaders = @{"Authorization" = "Bearer $jwtToken"; "Accept" = "application/json"}
    
    # Try accessing HR API through Gateway
    Test-Endpoint "HR List (via Gateway)" "GET" "$GatewayUrl/api/hr/employees" $authHeaders | Out-Null
    Test-Endpoint "HR Departments (via Gateway)" "GET" "$GatewayUrl/api/hr/departments" $authHeaders | Out-Null
    Write-Host ""
}

# === Summary ===
Write-Host "[SUMMARY]" -ForegroundColor Yellow
$totalTests = $testsPassed + $testsFailed
Write-Host "Passed: $testsPassed / $totalTests" -ForegroundColor Green
Write-Host "Failed: $testsFailed / $totalTests" -ForegroundColor Red

if ($testsFailed -eq 0) {
    Write-Host "`n✓ All smoke tests passed!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "`n✗ Some tests failed. Check logs above." -ForegroundColor Red
    exit 1
}
