$tries = 10
for ($i = 1; $i -le $tries; $i++) {
  Write-Host ("Attempt {0}/{1}: docker info" -f $i, $tries)
  try {
    docker info --format '{{.ServerVersion}} {{.OperatingSystem}}' 
    Write-Host 'docker info succeeded'
    exit 0
  } catch {
    Write-Host "docker info failed: $($_.Exception.Message)"
    Start-Sleep -Seconds 3
  }
}
Write-Host 'docker info never stabilized'
exit 1
