$now = Get-Date -Format 'yyyyMMdd_HHmmss'
$dir = ".logs\$now"
New-Item -ItemType Directory -Path $dir -Force | Out-Null
$map = @{
  'api-gateway' = '4d389aa69d7d'
  'eureka-peer1' = 'f6576a9c44eb'
  'eureka-peer2' = 'cc1128f94566'
  'eureka-peer3' = 'ea526921cd9b'
  'auth-service' = '0af93fb0e6db'
  'hr-service' = 'b57a67e3cecb'
}
$summary = "$dir\summary.txt"
if (Test-Path $summary) { Remove-Item $summary -Force }
foreach ($k in $map.Keys) {
  Write-Host "Saving $k logs..."
  docker logs $map[$k] --tail 10000 > "$dir\$k.log" 2>&1
  Write-Host "Extracting errors from $k..."
  Select-String -Path "$dir\$k.log" -Pattern 'ERROR|Exception|Caused by|WARN|Connection refused|UnknownHostException' -AllMatches | ForEach-Object { $_.Line } | Out-File -Append $summary -Encoding utf8
}
Write-Host "Summary saved to $summary"
Get-Content $summary -TotalCount 400
