$tries = 8
for ($i=1; $i -le $tries; $i++) {
  Write-Host ("Attempt {0}/{1}: docker ps -a --filter name=api-gateway" -f $i, $tries)
  try {
    docker ps -a --filter name=api-gateway --format "{{.ID}} {{.Names}} {{.Status}}"
  } catch {
    Write-Host "ps failed: $($_.Exception.Message)"
  }
  Write-Host ("Attempt {0}/{1}: docker logs api-gateway --tail 200" -f $i, $tries)
  try {
    docker logs api-gateway --tail 200
    exit 0
  } catch {
    Write-Host "logs failed: $($_.Exception.Message)"
  }
  Start-Sleep -Seconds 3
}
Write-Host 'Could not fetch api-gateway logs after retries'
exit 1
