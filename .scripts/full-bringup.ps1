$composeFiles = '-f compose.infra.yml -f compose.messaging.yml -f compose.business.yml -f compose.hr.yml -f compose.iam.yml -f compose.edge.yml'
$composeCmd = "docker compose $composeFiles up -d --no-build --remove-orphans"

# Try compose up (3 attempts)
$success = $false
for ($i = 1; $i -le 3; $i++) {
    Write-Host ("Compose attempt {0}/3" -f $i)
    try {
        iex $composeCmd
        Write-Host 'Compose command returned (may be partial)'
        $success = $true
        break
    } catch {
        Write-Host ("Compose attempt failed: {0}" -f $_.Exception.Message)
        Start-Sleep -Seconds 3
    }
}
if (-not $success) {
    Write-Host 'Compose up failed after retries'
    exit 1
}

# Poll HTTP health endpoint on localhost:8080
$timeout = 300 # seconds
$interval = 5
$deadline = (Get-Date).AddSeconds($timeout)
$healthy = $false
while ((Get-Date) -lt $deadline) {
    try {
        $resp = Invoke-WebRequest -Uri 'http://127.0.0.1:8080/actuator/health' -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        if ($resp.StatusCode -eq 200) {
            $body = $resp.Content
            Write-Host ("HTTP /actuator/health returned: {0}" -f $body)
            if ($body -match 'UP') { $healthy = $true; break }
        }
    } catch {
        Write-Host ("Health check not ready: {0}" -f $_.Exception.Message)
    }
    Start-Sleep -Seconds $interval
}

if (-not $healthy) {
    Write-Host 'Gateway did not become healthy within timeout; attempting to fetch docker logs'
    try {
        docker logs api-gateway --tail 400 2>$null
    } catch {
        Write-Host "docker logs failed: $($_.Exception.Message)"
    }
    exit 2
}

Write-Host 'Gateway is healthy — running smoke tests'
try {
    powershell -NoProfile -ExecutionPolicy Bypass -File .\smoke-test-e2e.ps1
    exit $LASTEXITCODE
} catch {
    Write-Host "Smoke tests failed to execute: $($_.Exception.Message)"
    exit 3
}
