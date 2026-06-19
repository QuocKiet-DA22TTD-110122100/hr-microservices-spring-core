$timeoutSeconds = 180
$start = Get-Date
$healthy = $false
while ((Get-Date) - $start -lt (New-TimeSpan -Seconds $timeoutSeconds)) {
  try {
    $state = docker inspect api-gateway --format '{{json .State}}' 2>$null
    if ($state) {
      $obj = ConvertFrom-Json $state
      if ($obj.Health -ne $null) {
        Write-Host "api-gateway health: $($obj.Health.Status)"
        if ($obj.Health.Status -eq 'healthy') { $healthy = $true; break }
      } else {
        Write-Host "api-gateway status: $($obj.Status)"
        if ($obj.Status -eq 'running') { Write-Host 'No healthcheck defined; testing HTTP endpoint'; }
      }
    }
  } catch {
    Write-Host "docker inspect failed: $($_.Exception.Message)"
  }
  try {
    $resp = Invoke-WebRequest -UseBasicParsing -Uri http://127.0.0.1:8080/actuator/health -TimeoutSec 5 -ErrorAction Stop
    if ($resp.StatusCode -eq 200) {
      $body = $resp.Content
      Write-Host "HTTP /actuator/health: $body"
      if ($body -match 'UP') { $healthy = $true; break }
    }
  } catch {
    Write-Host 'HTTP check failed or not up yet'
  }
  Start-Sleep -Seconds 5
}
if (-not $healthy) { Write-Host 'api-gateway did not become healthy in time'; exit 2 }
Write-Host 'api-gateway is healthy; running smoke tests'
try {
  Write-Host 'Executing .\smoke-test-e2e.ps1'
  powershell -NoProfile -ExecutionPolicy Bypass -File .\smoke-test-e2e.ps1
  $rc = $LASTEXITCODE
  Write-Host "Smoke tests finished with exit code $rc"
  exit $rc
} catch {
  Write-Host "Smoke test execution failed: $($_.Exception.Message)"
  exit 3
}
