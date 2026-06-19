$tries = 3
$cmd = 'docker compose -f compose.infra.yml -f compose.messaging.yml -f compose.business.yml -f compose.hr.yml -f compose.iam.yml -f compose.edge.yml up -d --no-build --remove-orphans'
for ($i=1; $i -le $tries; $i++) {
  Write-Host ("Attempt {0}/{1}: running compose up" -f $i, $tries)
  try {
    iex $cmd
    Write-Host 'Compose up succeeded'
    exit 0
  } catch {
    Write-Host "Compose up failed: $($_.Exception.Message)"
    Start-Sleep -Seconds 3
  }
}
Write-Host 'All attempts failed'
exit 1
