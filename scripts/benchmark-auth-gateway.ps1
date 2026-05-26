param(
    [string]$BaseUrl = 'http://localhost:8080/api/iam',
    [string]$Password = 'Abc@1234',
    [int]$Warmup = 5,
    [int]$Samples = 50,
    [int]$TimeoutSec = 20
)

$ErrorActionPreference = 'Stop'

function Get-Percentile {
    param(
        [double[]]$Values,
        [double]$P
    )

    if (-not $Values -or $Values.Count -eq 0) {
        return 0
    }

    $sorted = $Values | Sort-Object
    $index = [Math]::Ceiling($P * $sorted.Count) - 1
    if ($index -lt 0) { $index = 0 }
    if ($index -ge $sorted.Count) { $index = $sorted.Count - 1 }
    return [Math]::Round($sorted[$index], 2)
}

function Invoke-JsonPost {
    param(
        [string]$Url,
        [hashtable]$Body,
        [hashtable]$Headers,
        [int]$Timeout
    )

    return Invoke-RestMethod -Method Post -Uri $Url -Headers $Headers -Body ($Body | ConvertTo-Json -Compress) -TimeoutSec $Timeout
}

$healthUrl = ($BaseUrl -replace '/api/iam$', '') + '/actuator/health'
$healthCode = curl.exe -s -o NUL -w "%{http_code}" $healthUrl
if ($healthCode -ne '200') {
    throw "Gateway is not reachable at $healthUrl (HTTP=$healthCode)"
}

$username = "perf_user_$([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())"
$jsonHeaders = @{ 'Content-Type' = 'application/json' }

try {
    Invoke-JsonPost -Url "$BaseUrl/register" -Body @{ username = $username; password = $Password; role = 'USER' } -Headers $jsonHeaders -Timeout $TimeoutSec | Out-Null
} catch {
    throw "Unable to register benchmark user: $($_.Exception.Message)"
}

$loginTimes = @()
$verifyTimes = @()
$totalRuns = $Warmup + $Samples

for ($i = 0; $i -lt $totalRuns; $i++) {
    $swLogin = [System.Diagnostics.Stopwatch]::StartNew()
    $loginResponse = Invoke-JsonPost -Url "$BaseUrl/login" -Body @{ username = $username; password = $Password } -Headers $jsonHeaders -Timeout $TimeoutSec
    $swLogin.Stop()

    if (-not $loginResponse.token) {
        throw 'Login benchmark failed: token is empty'
    }

    if ($i -ge $Warmup) {
        $loginTimes += $swLogin.Elapsed.TotalMilliseconds
    }

    $verifyHeaders = @{ 'Content-Type' = 'application/json' }

    $swVerify = [System.Diagnostics.Stopwatch]::StartNew()
    Invoke-JsonPost -Url "$BaseUrl/verify" -Body @{ token = $loginResponse.token } -Headers $verifyHeaders -Timeout $TimeoutSec | Out-Null
    $swVerify.Stop()

    if ($i -ge $Warmup) {
        $verifyTimes += $swVerify.Elapsed.TotalMilliseconds
    }
}

$loginAvg = [Math]::Round((($loginTimes | Measure-Object -Average).Average), 2)
$loginMin = [Math]::Round((($loginTimes | Measure-Object -Minimum).Minimum), 2)
$loginMax = [Math]::Round((($loginTimes | Measure-Object -Maximum).Maximum), 2)
$loginP95 = Get-Percentile -Values $loginTimes -P 0.95

$verifyAvg = [Math]::Round((($verifyTimes | Measure-Object -Average).Average), 2)
$verifyMin = [Math]::Round((($verifyTimes | Measure-Object -Minimum).Minimum), 2)
$verifyMax = [Math]::Round((($verifyTimes | Measure-Object -Maximum).Maximum), 2)
$verifyP95 = Get-Percentile -Values $verifyTimes -P 0.95

Write-Output "PERF_USER=$username"
Write-Output ("LOGIN_MS avg={0} p95={1} min={2} max={3} n={4}" -f $loginAvg, $loginP95, $loginMin, $loginMax, $Samples)
Write-Output ("VERIFY_MS avg={0} p95={1} min={2} max={3} n={4}" -f $verifyAvg, $verifyP95, $verifyMin, $verifyMax, $Samples)
