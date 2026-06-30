<#
Smoke test for the minimal demo stack through API Gateway.

Usage:
  .\scripts\smoke-minimal-demo.ps1
  .\scripts\smoke-minimal-demo.ps1 -Password "Admin@123"
#>

param(
    [string]$GatewayUrl = "http://localhost:8080",
    [string]$Username = "admin",
    [string]$Password = "Admin@123"
)

$ErrorActionPreference = 'Stop'
$passed = 0
$failed = 0

function Add-Pass {
    param([string]$Name)
    $script:passed++
    Write-Host "[PASS] $Name" -ForegroundColor Green
}

function Add-Fail {
    param([string]$Name, [string]$Message)
    $script:failed++
    Write-Host "[FAIL] $Name -> $Message" -ForegroundColor Red
}

function Invoke-Check {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Url,
        [hashtable]$Headers = @{},
        [object]$Body = $null
    )

    try {
        $request = @{
            Uri = $Url
            Method = $Method
            Headers = $Headers
            UseBasicParsing = $true
            TimeoutSec = 60
        }

        if ($null -ne $Body) {
            $request.ContentType = 'application/json'
            $request.Body = ($Body | ConvertTo-Json -Compress)
        }

        $response = Invoke-WebRequest @request
        if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 300) {
            Add-Pass $Name
            return $response.Content
        }

        Add-Fail $Name "HTTP $($response.StatusCode)"
    } catch {
        Add-Fail $Name $_.Exception.Message
    }

    return $null
}

Write-Host "==== Minimal Demo Smoke Test ===="
Write-Host "Gateway: $GatewayUrl"

Invoke-Check -Name "Gateway health" -Method GET -Url "$GatewayUrl/actuator/health" | Out-Null

$loginContent = Invoke-Check `
    -Name "Login $Username" `
    -Method POST `
    -Url "$GatewayUrl/api/xac-thuc/dang-nhap" `
    -Body @{ username = $Username; password = $Password }

$token = $null
if ($loginContent) {
    try {
        $loginJson = $loginContent | ConvertFrom-Json
        $token = $loginJson.token
        if (-not $token) {
            $token = $loginJson.access_token
        }
        if (-not $token) {
            $token = $loginJson.accessToken
        }
        if (-not $token -and $loginJson.data) {
            $token = $loginJson.data.token
        }
        if (-not $token -and $loginJson.data) {
            $token = $loginJson.data.access_token
        }
        if (-not $token -and $loginJson.data) {
            $token = $loginJson.data.accessToken
        }
    } catch {
        Add-Fail "Parse login token" $_.Exception.Message
    }
}

if (-not $token) {
    Add-Fail "Token available" "Login did not return token"
} else {
    Add-Pass "Token available"
    $authHeaders = @{ Authorization = "Bearer $token"; Accept = "application/json" }

    Invoke-Check -Name "Validate token" -Method POST -Url "$GatewayUrl/api/xac-thuc/kiem-tra" -Headers $authHeaders -Body @{ token = $token } | Out-Null
    Invoke-Check -Name "HR employees" -Method GET -Url "$GatewayUrl/api/hr/employees" -Headers $authHeaders | Out-Null
    Invoke-Check -Name "Projects" -Method GET -Url "$GatewayUrl/api/projects" -Headers $authHeaders | Out-Null
    Invoke-Check -Name "Tasks" -Method GET -Url "$GatewayUrl/api/tasks" -Headers $authHeaders | Out-Null
    Invoke-Check -Name "Payroll current employee 4" -Method GET -Url "$GatewayUrl/api/payroll/4/current" -Headers $authHeaders | Out-Null
}

Write-Host ""
Write-Host "==== Summary ===="
Write-Host "Passed: $passed"
Write-Host "Failed: $failed"

if ($failed -gt 0) {
    exit 1
}

exit 0
