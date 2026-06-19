<#
Simple login load test for the API Gateway auth endpoint.

Usage:
  .\scripts\load-test-login.ps1
  .\scripts\load-test-login.ps1 -ConcurrentUsers 100 -Username admin -Password "Admin@123"
  .\scripts\load-test-login.ps1 -ConcurrentUsers 50 -TimeoutSeconds 60 -TotalTimeoutSeconds 180
#>

param(
    [string]$GatewayUrl = "http://localhost:8080",
    [string]$Username = "admin",
    [string]$Password = "Admin@123",
    [int]$ConcurrentUsers = 50,
    [int]$TimeoutSeconds = 30,
    [int]$TotalTimeoutSeconds = 180
)

$ErrorActionPreference = 'Stop'
$endpoint = "$GatewayUrl/api/xac-thuc/dang-nhap"
$body = @{ username = $Username; password = $Password } | ConvertTo-Json -Compress

Write-Host "==== Login Load Test ===="
Write-Host "Endpoint: $endpoint"
Write-Host "Concurrent users: $ConcurrentUsers"
Write-Host "Username: $Username"
Write-Host "Per-request timeout seconds: $TimeoutSeconds"
Write-Host "Total timeout seconds: $TotalTimeoutSeconds"

$scriptBlock = {
    param($Endpoint, $Body, $TimeoutSeconds, $Index)

    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    try {
        $response = Invoke-WebRequest `
            -Uri $Endpoint `
            -Method POST `
            -ContentType 'application/json' `
            -Body $Body `
            -UseBasicParsing `
            -TimeoutSec $TimeoutSeconds

        $sw.Stop()
        [pscustomobject]@{
            Index = $Index
            Success = $response.StatusCode -ge 200 -and $response.StatusCode -lt 300
            StatusCode = $response.StatusCode
            Ms = $sw.ElapsedMilliseconds
            Error = $null
        }
    } catch {
        $sw.Stop()
        $statusCode = $null
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode
        }

        [pscustomobject]@{
            Index = $Index
            Success = $false
            StatusCode = $statusCode
            Ms = $sw.ElapsedMilliseconds
            Error = $_.Exception.Message
        }
    }
}

$pool = [runspacefactory]::CreateRunspacePool(1, $ConcurrentUsers)
$pool.Open()
$workers = @()

try {
    for ($i = 1; $i -le $ConcurrentUsers; $i++) {
        $ps = [powershell]::Create()
        $ps.RunspacePool = $pool
        [void]$ps.AddScript($scriptBlock)
        [void]$ps.AddArgument($endpoint)
        [void]$ps.AddArgument($body)
        [void]$ps.AddArgument($TimeoutSeconds)
        [void]$ps.AddArgument($i)

        $workers += [pscustomobject]@{
            Index = $i
            PowerShell = $ps
            Handle = $ps.BeginInvoke()
        }
    }

    $deadline = (Get-Date).AddSeconds($TotalTimeoutSeconds)
    while ((Get-Date) -lt $deadline -and @($workers | Where-Object { -not $_.Handle.IsCompleted }).Count -gt 0) {
        Start-Sleep -Milliseconds 200
    }

    $results = @()
    foreach ($worker in $workers) {
        if ($worker.Handle.IsCompleted) {
            $results += $worker.PowerShell.EndInvoke($worker.Handle)
        } else {
            $worker.PowerShell.Stop()
            $results += [pscustomobject]@{
                Index = $worker.Index
                Success = $false
                StatusCode = $null
                Ms = $TotalTimeoutSeconds * 1000
                Error = "Total timeout reached before request completed"
            }
        }
    }
} finally {
    foreach ($worker in $workers) {
        $worker.PowerShell.Dispose()
    }
    $pool.Close()
    $pool.Dispose()
}

$successes = @($results | Where-Object { $_.Success })
$failures = @($results | Where-Object { -not $_.Success })
$durations = @($results | ForEach-Object { [double]$_.Ms } | Sort-Object)

function Get-Percentile {
    param([double[]]$Values, [double]$Percentile)
    if (-not $Values -or $Values.Length -eq 0) {
        return 0
    }

    $rank = [Math]::Ceiling(($Percentile / 100) * $Values.Length) - 1
    $rank = [Math]::Max(0, [Math]::Min($rank, $Values.Length - 1))
    return [Math]::Round($Values[$rank], 2)
}

$avg = if ($durations.Length -gt 0) { [Math]::Round(($durations | Measure-Object -Average).Average, 2) } else { 0 }
$p95 = Get-Percentile -Values $durations -Percentile 95
$p99 = Get-Percentile -Values $durations -Percentile 99
$errorRate = if ($results.Count -gt 0) { [Math]::Round(($failures.Count / $results.Count) * 100, 2) } else { 100 }

Write-Host ""
Write-Host "==== Results ===="
Write-Host "Total:      $($results.Count)"
Write-Host "Success:    $($successes.Count)"
Write-Host "Failed:     $($failures.Count)"
Write-Host "Error rate: $errorRate%"
Write-Host "Avg ms:     $avg"
Write-Host "P95 ms:     $p95"
Write-Host "P99 ms:     $p99"

if ($failures.Count -gt 0) {
    Write-Host ""
    Write-Host "Failure samples:"
    $failures | Select-Object -First 5 | Format-Table Index, StatusCode, Ms, Error -AutoSize
}

if ($errorRate -gt 3) {
    exit 1
}

exit 0
