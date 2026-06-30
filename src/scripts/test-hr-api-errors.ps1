$ErrorActionPreference = 'Stop'

$secret = 'change_me'
$wrongSecret = 'wrong_secret_123'
$base = 'http://localhost:8085'
$headersValid = @{
    'X-Internal-Secret' = $secret
    'X-Auth-Role' = 'ADMIN'
}
$headersNoSecret = @{
    'X-Auth-Role' = 'ADMIN'
}
$headersWrongSecret = @{
    'X-Internal-Secret' = $wrongSecret
    'X-Auth-Role' = 'ADMIN'
}
$headersNoRole = @{
    'X-Internal-Secret' = $secret
    'X-Auth-Role' = 'USER'
}
$headersRead = @{
    'X-Internal-Secret' = $secret
}

$testsPassed = 0
$testsFailed = 0

function Test-Error {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Uri,
        [hashtable]$Headers,
        [string]$Body,
        [int]$ExpectedCode
    )
    
    try {
        $response = Invoke-WebRequest -Method $Method -Uri $Uri -Headers $Headers -ContentType 'application/json' -Body $Body -UseBasicParsing
        Write-Output "FAIL: $Name - Expected $ExpectedCode but got $($response.StatusCode)"
        $script:testsFailed++
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.Value__
        if ($statusCode -eq $ExpectedCode) {
            Write-Output "PASS: $Name - Got expected $ExpectedCode"
            $script:testsPassed++
        } else {
            Write-Output "FAIL: $Name - Expected $ExpectedCode but got $statusCode"
            $script:testsFailed++
        }
    }
}

# Test 1: Missing X-Internal-Secret header (should be 403)
Test-Error -Name 'POST /organization-units without secret' `
    -Method 'Post' `
    -Uri "$base/organization-units" `
    -Headers $headersNoSecret `
    -Body (@{ name='Test'; code='TST1'; level='CORPORATION' } | ConvertTo-Json) `
    -ExpectedCode 403

# Test 2: Wrong X-Internal-Secret header (should be 403)
Test-Error -Name 'POST /organization-units with wrong secret' `
    -Method 'Post' `
    -Uri "$base/organization-units" `
    -Headers $headersWrongSecret `
    -Body (@{ name='Test'; code='TST2'; level='CORPORATION' } | ConvertTo-Json) `
    -ExpectedCode 403

# Test 3: Missing ADMIN role on write (should be 403)
Test-Error -Name 'POST /organization-units without ADMIN role' `
    -Method 'Post' `
    -Uri "$base/organization-units" `
    -Headers $headersNoRole `
    -Body (@{ name='Test'; code='TST3'; level='CORPORATION' } | ConvertTo-Json) `
    -ExpectedCode 403

# Test 4: Invalid organizationUnitId in department create (should be 400)
Test-Error -Name 'POST /departments with non-existent organizationUnitId' `
    -Method 'Post' `
    -Uri "$base/departments" `
    -Headers $headersValid `
    -Body (@{ name='Test'; code='TST4'; organizationUnitId=999999 } | ConvertTo-Json) `
    -ExpectedCode 400

# Test 5: Invalid departmentId in employee create (should be 400)
Test-Error -Name 'POST /employees with non-existent departmentId' `
    -Method 'Post' `
    -Uri "$base/employees" `
    -Headers $headersValid `
    -Body (@{ name='Test'; position='QA'; departmentId=999999 } | ConvertTo-Json) `
    -ExpectedCode 400

# Test 6: Missing required field 'name' in organization unit (should be 400)
Test-Error -Name 'POST /organization-units without name field' `
    -Method 'Post' `
    -Uri "$base/organization-units" `
    -Headers $headersValid `
    -Body (@{ code='TST6'; level='CORPORATION' } | ConvertTo-Json) `
    -ExpectedCode 400

# Test 7: Missing required field 'level' in organization unit (should be 400)
Test-Error -Name 'POST /organization-units without level field' `
    -Method 'Post' `
    -Uri "$base/organization-units" `
    -Headers $headersValid `
    -Body (@{ name='Test'; code='TST7' } | ConvertTo-Json) `
    -ExpectedCode 400

# Test 8: Missing required field 'name' in department (should be 400)
Test-Error -Name 'POST /departments without name field' `
    -Method 'Post' `
    -Uri "$base/departments" `
    -Headers $headersValid `
    -Body (@{ code='TST8'; organizationUnitId=1 } | ConvertTo-Json) `
    -ExpectedCode 400

# Test 9: Missing required field 'name' in employee (should be 400)
Test-Error -Name 'POST /employees without name field' `
    -Method 'Post' `
    -Uri "$base/employees" `
    -Headers $headersValid `
    -Body (@{ position='QA'; departmentId=1 } | ConvertTo-Json) `
    -ExpectedCode 400

# Test 10: DELETE without ADMIN role (should be 403)
Test-Error -Name 'DELETE /organization-units without ADMIN role' `
    -Method 'Delete' `
    -Uri "$base/organization-units/1" `
    -Headers $headersNoRole `
    -Body '' `
    -ExpectedCode 403

Write-Output ""
Write-Output "====== TEST SUMMARY ======"
Write-Output "Passed: $testsPassed"
Write-Output "Failed: $testsFailed"
Write-Output "Total: $($testsPassed + $testsFailed)"
