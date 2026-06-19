param(
  [string]$containerName = 'api-gateway',
  [int]$timeoutSeconds = 180
)

$start = Get-Date
while ((Get-Date) - $start -lt (New-TimeSpan -Seconds $timeoutSeconds)) {
  try {
    $state = docker inspect $containerName --format '{{json .State}}' 2>$null
    if (-not $state) { Start-Sleep -Seconds 3; continue }
    $obj = ConvertFrom-Json $state
    if ($obj.Health -ne $null) {
      Write-Host "Health status: $($obj.Health.Status) (F: $($obj.Health.FailingStreak))"
      if ($obj.Health.Status -eq 'healthy') { exit 0 }
    } else {
      Write-Host "No health info for $containerName; Checking status: $($obj.Status)"
      if ($obj.Status -eq 'running') { exit 0 }
    }
  } catch {
    Write-Host "Inspect failed, retrying: $($_.Exception.Message)"
  }
  Start-Sleep -Seconds 3
}
Write-Host "Timed out waiting for $containerName to be healthy"
exit 1
