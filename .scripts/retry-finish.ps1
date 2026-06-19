param(
  [int]$DurationMinutes = 5
)

$composeFiles = @(
  'compose.infra.yml',
  'compose.messaging.yml',
  'compose.business.yml',
  'compose.hr.yml',
  'compose.iam.yml',
  'compose.edge.yml'
)
$composeArgs = @()
foreach ($file in $composeFiles) {
  $composeArgs += @('-f', $file)
}
$composeArgs += @('up', '-d', '--no-build', '--remove-orphans')

$deadline = (Get-Date).AddMinutes($DurationMinutes)
$lastComposeAttempt = Get-Date '2000-01-01'
$composeInterval = New-TimeSpan -Seconds 60
$healthUrl = 'http://127.0.0.1:8080/actuator/health'
$healthy = $false
$logsCaptured = $false

while ((Get-Date) -lt $deadline) {
  if (((Get-Date) - $lastComposeAttempt) -ge $composeInterval) {
    $lastComposeAttempt = Get-Date
    Write-Host ('[{0}] compose up -d --no-build --remove-orphans' -f (Get-Date).ToString('HH:mm:ss'))
    try {
      docker compose @composeArgs
    } catch {
      Write-Host ('compose up failed: {0}' -f $_.Exception.Message)
    }
  }

  try {
    $resp = Invoke-WebRequest -UseBasicParsing -Uri $healthUrl -TimeoutSec 5 -ErrorAction Stop
    if ($resp.StatusCode -eq 200 -and $resp.Content -match 'UP') {
      Write-Host ('[{0}] api-gateway health is UP' -f (Get-Date).ToString('HH:mm:ss'))
      $healthy = $true
      break
    }
    Write-Host ('[{0}] health response: {1}' -f (Get-Date).ToString('HH:mm:ss'), $resp.Content)
  } catch {
    Write-Host ('[{0}] health not ready: {1}' -f (Get-Date).ToString('HH:mm:ss'), $_.Exception.Message)
  }

  if (-not $logsCaptured) {
    try {
      Write-Host ('[{0}] trying docker logs api-gateway --tail 120' -f (Get-Date).ToString('HH:mm:ss'))
      docker logs api-gateway --tail 120
      $logsCaptured = $true
    } catch {
      Write-Host ('logs unavailable yet: {0}' -f $_.Exception.Message)
    }
  }

  Start-Sleep -Seconds 10
}

if (-not $healthy) {
  Write-Host 'Gateway did not become healthy within retry window.'
  exit 2
}

Write-Host 'Gateway healthy; launching smoke tests.'
try {
  powershell -NoProfile -ExecutionPolicy Bypass -File .\smoke-test-e2e.ps1
  exit $LASTEXITCODE
} catch {
  Write-Host ('Smoke test invocation failed: {0}' -f $_.Exception.Message)
  exit 3
}
