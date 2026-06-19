# Recovery script: restart RabbitMQ, ensure Eureka cluster, restart services, run smoke tests
Set-StrictMode -Version Latest
$logDir = ".logs\recover_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
New-Item -ItemType Directory -Path $logDir -Force | Out-Null
$log = "$logDir\recover.log"
function Log([string]$m){ $t = Get-Date -Format 'o'; "$t $m" | Out-File -FilePath $log -Append; Write-Host $m }

function Try-Restart($id, $name){
  for($i=1;$i -le 6;$i++){
    Log ("Attempt $i/6 restart $name ($id)")
    & docker restart $id 2>&1 | Out-File -FilePath $log -Append
    if($LASTEXITCODE -eq 0){ Log ("Restarted $name ($id)"); return $true }
    Log ("Restart $name failed (code $LASTEXITCODE). Retrying in 3s")
    Start-Sleep -Seconds 3
  }
  Log ("Failed to restart $name after retries")
  return $false
}

function Wait-Healthy($id, $name, $timeoutSec){
  $deadline = (Get-Date).AddSeconds($timeoutSec)
  while((Get-Date) -lt $deadline){
    try{
      $status = (& docker inspect --format '{{.State.Health.Status}}' $id) -join ''
      Log ("Health for $name ($id): $status")
      if($status -eq 'healthy'){ return $true }
    } catch { Log ("Could not inspect $name ($id): $($_.Exception.Message)") }
    Start-Sleep -Seconds 5
  }
  Log ("Timeout waiting for $name to become healthy")
  return $false
}

try{
  # Step 1: restart RabbitMQ and wait healthy
  $rabbit = '3f1f3ce0a112'
  Log "--- Restarting RabbitMQ ($rabbit) ---"
  Try-Restart $rabbit 'rabbitmq' | Out-Null
  $rHealthy = Wait-Healthy $rabbit 'rabbitmq' 180
  if(-not $rHealthy){ Log 'RabbitMQ did not become healthy; continuing but this may block services.' }

  # Step 2: restart Eureka peers
  $peers = @{
    'eureka-peer1' = 'f6576a9c44eb'
    'eureka-peer2' = 'cc1128f94566'
    'eureka-peer3' = 'ea526921cd9b'
  }
  foreach($k in $peers.Keys){ Try-Restart $peers[$k] $k | Out-Null }
  Start-Sleep -Seconds 6
  foreach($k in $peers.Keys){ Wait-Healthy $peers[$k] $k 120 | Out-Null }

  # Step 3: restart dependent services in safe order
  $order = @{
    'auth-service' = '0af93fb0e6db'
    'api-gateway'  = '4d389aa69d7d'
    'kms-service'  = '96c99fdafc80'
    'project-service' = '3871c08bbe2f'
    'task-service' = '796e7455eac1'
    'hr-service' = 'b57a67e3cecb'
  }
  foreach($k in $order.Keys){ Try-Restart $order[$k] $k | Out-Null; Start-Sleep -Seconds 4 }

  # Step 4: poll gateway /actuator/health
  Log '--- Polling gateway /actuator/health up to 180s ---'
  $deadline = (Get-Date).AddSeconds(180)
  $gatewayUp = $false
  while((Get-Date) -lt $deadline){
    try{
      $h = Invoke-WebRequest -Uri 'http://127.0.0.1:8080/actuator/health' -UseBasicParsing -TimeoutSec 5
      $body = $h.Content
      if($body -is [byte[]]){
        $body = [System.Text.Encoding]::UTF8.GetString($body)
      }
      Log ("Gateway health returned: $body")
      if($body -match '"status"\s*:\s*"UP"' -or $body -match '\bUP\b'){ $gatewayUp = $true; break }
    } catch { Log ("Gateway health not ready: $($_.Exception.Message)") }
    Start-Sleep -Seconds 5
  }

  if($gatewayUp){
    Log 'Gateway is UP — running smoke tests'
    try{
      powershell -NoProfile -ExecutionPolicy Bypass -File .\smoke-test-e2e.ps1 2>&1 | Out-File -FilePath $log -Append
      Log 'Smoke tests completed — see log for results'
    } catch { Log ("Smoke tests failed to run: $($_.Exception.Message)") }
  } else {
    Log 'Gateway did not become UP within timeout — collection of logs recommended.'
  }
} catch {
  Log ("Recovery script failed: $($_.Exception.Message)")
}
Log "Recovery script finished; logs in $logDir"
