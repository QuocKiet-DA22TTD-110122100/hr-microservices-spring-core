# Short 2FA flow test for auth-service
# Steps:
# 1) register user
# 2) init 2FA -> get secret
# 3) confirm 2FA with TOTP
# 4) login (first: expect mfa_required)
# 5) login (with otp -> expect access_token)

param(
    [string]$AuthBaseUrl = "http://localhost:8086/xac-thuc"
)

function Base32-Decode {
    param([string]$input)
    $alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"
    $s = ($input -replace "=", "") -replace "\s", "" -replace "-", "" -replace ":", ""
    $s = $s.ToUpper()
    $bits = 0
    $value = 0
    $bytes = New-Object System.Collections.Generic.List[byte]
    foreach ($c in $s.ToCharArray()) {
        $v = $alphabet.IndexOf($c)
        if ($v -lt 0) { throw "Invalid base32 character: $c" }
        $value = ($value -shl 5) -bor $v
        $bits += 5
        while ($bits -ge 8) {
            $bits -= 8
            $b = ($value -shr $bits) -band 0xFF
            [void]$bytes.Add([byte]$b)
        }
    }
    return ,($bytes.ToArray())
}

function Generate-TOTP {
    param(
        [string]$secret,
        [int]$digits = 6,
        [int]$timeStep = 30
    )
    $key = Base32-Decode $secret
    $epoch = [int][double]((Get-Date).ToUniversalTime() - [DateTime]::new(1970,1,1,0,0,0,[DateTimeKind]::Utc)).TotalSeconds
    $counter = [math]::Floor($epoch / $timeStep)
    $counterBytes = New-Object byte[] 8
    $ctr = [long]$counter
    for ($i = 7; $i -ge 0; $i--) {
        $counterBytes[$i] = $ctr -band 0xFF
        $ctr = $ctr -shr 8
    }

    $hmac = New-Object System.Security.Cryptography.HMACSHA1
    $hmac.Key = $key
    $hash = $hmac.ComputeHash($counterBytes)
    $offset = $hash[$hash.Length - 1] -band 0x0F
    $binary = ((($hash[$offset] -band 0x7F) -shl 24) -bor (($hash[$offset + 1] -band 0xFF) -shl 16) -bor (($hash[$offset + 2] -band 0xFF) -shl 8) -bor ($hash[$offset + 3] -band 0xFF))
    $mod = [int][math]::Pow(10, $digits)
    $otp = $binary % $mod
    return $otp.ToString().PadLeft($digits,'0')
}

function Post-Json {
    param($url, $obj)
    $json = $obj | ConvertTo-Json -Depth 5
    try {
        return Invoke-RestMethod -Method Post -Uri $url -Body $json -ContentType 'application/json' -ErrorAction Stop
    } catch {
        if ($_.Exception.Response -ne $null) {
            $respStream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($respStream)
            $body = $reader.ReadToEnd()
            Write-Host "HTTP error: $($_.Exception.Response.StatusCode) - $body"
        } else {
            Write-Host "Request failed: $_"
        }
        throw $_
    }
}

# Test user
$username = "test2fa_" + ([guid]::NewGuid().ToString().Substring(0,8))
$password = "TestPass123!"
Write-Host "Using user: $username"

# 1) register
Write-Host "Registering user..."
$reg = @{ username = $username; password = $password; role = 'USER' }
$regResp = Post-Json "$AuthBaseUrl/dang-ky" $reg
Write-Host "Registered: $($regResp.username) id=$($regResp.userId)"

# 2) init 2FA
Write-Host "Initializing 2FA..."
$init = @{ username = $username; password = $password }
$initResp = Post-Json "$AuthBaseUrl/2fa/khoi-tao" $init
$secret = $initResp.secret
Write-Host "Secret (base32): $secret"
Write-Host "otpAuthUri: $($initResp.otpAuthUri)"

# 3) confirm 2FA
$code = Generate-TOTP $secret
Write-Host "Generated TOTP: $code"
$confirm = @{ username = $username; password = $password; otp = $code }
$confirmResp = Post-Json "$AuthBaseUrl/2fa/xac-nhan" $confirm
Write-Host "2FA confirmed: $($confirmResp.message)"

# 4) login first time (without otp) -> expect mfa_required = true (202 accepted)
Write-Host "Login (first attempt, no otp)..."
$login1 = @{ username = $username; password = $password }
$login1Resp = Post-Json "$AuthBaseUrl/dang-nhap" $login1
if ($login1Resp.mfa_required) {
    Write-Host "MFA required as expected"
} else {
    Write-Host "Unexpected login1 response: $($login1Resp | ConvertTo-Json -Depth 3)"
}

# 5) login second time with otp -> expect access_token
$code2 = Generate-TOTP $secret
Write-Host "Generated TOTP for login: $code2"
$login2 = @{ username = $username; password = $password; otp = $code2 }
$login2Resp = Post-Json "$AuthBaseUrl/dang-nhap" $login2
Write-Host "Access token received: $($login2Resp.access_token)"

Write-Host "2FA flow test completed."
