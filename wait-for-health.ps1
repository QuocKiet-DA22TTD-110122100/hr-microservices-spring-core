<#
Simple health-check waiter for the local stack.
Usage:
  .\wait-for-health.ps1                # uses default endpoints
  .\wait-for-health.ps1 -Timeout 300   # increase overall timeout
  .\wait-for-health.ps1 -Urls @('http://localhost:8081/actuator/health','http://localhost:9000/.well-known/jwks.json')

Exits 0 when all endpoints return healthy within timeout, otherwise exits 1.
#>

param(
    [int]$Timeout = 300,
    [int]$Interval = 5,
    [string[]]$Urls
)

if (-not $Urls -or $Urls.Length -eq 0) {
    $Urls = @(
        'http://localhost:8761/',                       # Eureka UI
        'http://localhost:8080/',                       # API Gateway root
        'http://localhost:8081/actuator/health',        # Auth service
        'http://localhost:9000/.well-known/jwks.json',  # KMS JWKS
        'http://localhost:8082/actuator/health',        # HR service
        'http://localhost:8083/api/tasks/health',       # Task service
        'http://localhost:8084/api/projects/health',    # Project service
        'http://localhost:16686/',                      # Jaeger UI
        'http://localhost:15672/',                      # RabbitMQ Management UI
        'http://localhost:6379/'                        # Redis (PING via CLI)
    )
}

Write-Host "Waiting up to $Timeout seconds for services to become healthy..."
$deadline = (Get-Date).AddSeconds($Timeout)
$allOk = $false

while ((Get-Date) -lt $deadline) {
    $remaining = ($deadline - (Get-Date)).TotalSeconds
    Write-Host "Checking endpoints (remaining seconds: [int]$remaining)"
    $allOk = $true
    foreach ($u in $Urls) {
        try {
            $resp = Invoke-WebRequest -Uri $u -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
            $statusOK = $false
            if ($resp.StatusCode -ge 200 -and $resp.StatusCode -lt 300) {
                # For actuator/health we expect payload containing 'UP'
                $body = $resp.Content
                if ($body -and $body.Trim().Length -gt 0) {
                    if ($body -match 'UP' -or $u -match 'jwks') {
                        $statusOK = $true
                    } else {
                        # Some endpoints return HTML (e.g., gateway root) — treat 2xx as OK
                        $statusOK = $true
                    }
                } else {
                    $statusOK = $true
                }
            }
            if ($statusOK) {
                Write-Host "OK: $u"
            } else {
                Write-Host "NOT READY: $u (response present but not healthy)"
                $allOk = $false
            }
        } catch {
            Write-Host "FAILED: $u -> $($_.Exception.Message)"
            $allOk = $false
        }
    }

    if ($allOk) { break }
    Start-Sleep -Seconds $Interval
}

if ($allOk) {
    Write-Host "All endpoints healthy."
    exit 0
} else {
    Write-Host "Timeout reached, some endpoints still unhealthy."
    exit 1
}
