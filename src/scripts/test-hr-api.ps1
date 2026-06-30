$ErrorActionPreference = 'Stop'

$secret = 'change_me'
$base = 'http://localhost:8085'
$headersWrite = @{
    'X-Internal-Secret' = $secret
    'X-Auth-Role' = 'ADMIN'
}
$headersRead = @{
    'X-Internal-Secret' = $secret
}

$ts = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()

$orgBody = @{
    name = 'Test Corp'
    code = "CORP-$ts"
    level = 'CORPORATION'
} | ConvertTo-Json
$org = Invoke-RestMethod -Method Post -Uri "$base/organization-units" -Headers $headersWrite -ContentType 'application/json' -Body $orgBody
Write-Output ("ORG_OK id={0} code={1}" -f $org.id, $org.code)

$deptBody = @{
    name = 'Engineering'
    code = "ENG-$ts"
    organizationUnitId = $org.id
} | ConvertTo-Json
$dept = Invoke-RestMethod -Method Post -Uri "$base/departments" -Headers $headersWrite -ContentType 'application/json' -Body $deptBody
Write-Output ("DEPT_OK id={0} orgUnitId={1}" -f $dept.id, $dept.organizationUnitId)

$empBody = @{
    name = 'Test Employee'
    position = 'QA'
    departmentId = $dept.id
} | ConvertTo-Json
$emp = Invoke-RestMethod -Method Post -Uri "$base/employees" -Headers $headersWrite -ContentType 'application/json' -Body $empBody
Write-Output ("EMP_OK id={0} deptId={1} deptName={2}" -f $emp.id, $emp.departmentId, $emp.departmentName)

$empByDept = Invoke-RestMethod -Method Get -Uri "$base/employees?departmentId=$($dept.id)" -Headers $headersRead
$tree = Invoke-RestMethod -Method Get -Uri "$base/organization-units/tree" -Headers $headersRead
Write-Output ("VERIFY_OK employeesByDept={0} treeRoots={1}" -f $empByDept.Count, $tree.Count)
