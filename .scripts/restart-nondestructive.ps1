$ErrorActionPreference='Stop'
Write-Host 'Restarting rabbitmq...'
try { docker restart 3f1f3ce0a112 } catch { Write-Host 'docker restart failed:' $_.Exception.Message; exit 2 }
Start-Sleep -s 8
Write-Host 'RabbitMQ health:'
try { docker inspect 3f1f3ce0a112 --format '{{json .State.Health}}' } catch { Write-Host 'inspect failed:' $_.Exception.Message }

Write-Host 'Restarting eureka peers...'
$peers = @('f6576a9c44eb','cc1128f94566','ea526921cd9b')
foreach ($id in $peers) {
  try { docker restart $id } catch { Write-Host "restart failed for $id : $($_.Exception.Message)" }
  Start-Sleep -s 3
  try { docker inspect $id --format '{{json .State.Health}}' } catch { Write-Host "inspect failed for $id : $($_.Exception.Message)" }
}

Write-Host 'Restarting api-gateway...'
try { docker restart 4d389aa69d7d } catch { Write-Host 'gateway restart failed:' $_.Exception.Message }
Start-Sleep -s 4

Write-Host 'Polling gateway for up to 120s...'
$end = (Get-Date).AddSeconds(120)
while ((Get-Date) -lt $end) {
  try {
    $r = Invoke-RestMethod -Uri 'http://127.0.0.1:8080/actuator/health' -TimeoutSec 5
    if ($r.status -eq 'UP') { Write-Host 'GATEWAY_UP'; $r | ConvertTo-Json; exit 0 } else { Write-Host "Gateway status: $($r.status)" }
  } catch { Write-Host 'Gateway not ready:' $_.Exception.Message }
  Start-Sleep -s 5
}
Write-Host 'Gateway did not become UP within timeout'
exit 2
