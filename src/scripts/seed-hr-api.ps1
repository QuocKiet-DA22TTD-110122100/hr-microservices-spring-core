# ============================================================
# HR Service Seed Data via API Script
# ============================================================
# This script:
# 1. Creates admin user in database
# 2. Logs in to get JWT token
# 3. Seeds Organizations, Departments, Employees via API
# ============================================================

$ErrorActionPreference = "Stop"

# Configuration
$base_url = "http://localhost:3000/api"
$hr_url = "http://localhost:3000/api/hr"
$admin_username = "admin_seed"
$admin_password = "Admin@12345"
$admin_email = "admin@demo.com"

Write-Output "==============================================="
Write-Output "HR Service API Seed Script"
Write-Output "==============================================="
Write-Output ""

# ============================================================
# Step 1: Create Admin User in Auth Database
# ============================================================
Write-Output "[STEP 1] Creating admin user in database..."

$create_admin_sql = @"
INSERT IGNORE INTO public.users (username, email, password, full_name, status, created_at, updated_at) 
VALUES ('$admin_username', '$admin_email', `$2a`$10`$placeholder`, 'Admin Seed User', 'ACTIVE', NOW(), NOW());
"@

# Since direct DB manipulation is complex, we'll try to register via API first
$register_body = @{
    username = $admin_username
    email = $admin_email
    password = $admin_password
    fullName = "Admin Seed User"
} | ConvertTo-Json

try {
    $register_resp = Invoke-RestMethod -Method Post -Uri "$base_url/iam/register" `
        -ContentType "application/json" -Body $register_body
    Write-Output "✓ Admin user registered via API"
} catch {
    Write-Output "ℹ Admin user may already exist, attempting login..."
}

# ============================================================
# Step 2: Login and Get JWT Token
# ============================================================
Write-Output "[STEP 2] Logging in and retrieving JWT token..."

$login_body = @{
    username = $admin_username
    password = $admin_password
} | ConvertTo-Json

try {
    $login_resp = Invoke-RestMethod -Method Post -Uri "$base_url/iam/login" `
        -ContentType "application/json" -Body $login_body
    
    $token = $login_resp.token
    if ($null -eq $token) {
        $token = $login_resp.data.token
    }
    
    if ($null -eq $token) {
        throw "Failed to extract token from login response"
    }
    
    Write-Output "✓ Login successful, token obtained"
} catch {
    Write-Output "Failed to login: $_"
    exit 1
}

# Setup headers for authenticated requests
$headers = @{
    Authorization = "Bearer $token"
    "Content-Type" = "application/json"
}

# ============================================================
# Step 3: Seed Organizations (4-level hierarchy)
# ============================================================
Write-Output "[STEP 3] Creating Organization hierarchy..."

# Level 1: CORPORATION
$corp_body = @{
    code = "CORP-001"
    name = "Demo Corporation"
    level = "CORPORATION"
} | ConvertTo-Json

$corp = Invoke-RestMethod -Method Post -Uri "$hr_url/organization-units" `
    -Headers $headers -Body $corp_body
$corp_id = $corp.id
Write-Output "✓ Created CORPORATION: $($corp.name) (id=$corp_id)"

Start-Sleep -Milliseconds 500

# Level 2: TOTAL_COMPANY
$tc_body = @{
    code = "TC-001"
    name = "Total Company 1"
    level = "TOTAL_COMPANY"
    parentId = $corp_id
} | ConvertTo-Json

$tc = Invoke-RestMethod -Method Post -Uri "$hr_url/organization-units" `
    -Headers $headers -Body $tc_body
$tc_id = $tc.id
Write-Output "✓ Created TOTAL_COMPANY: $($tc.name) (id=$tc_id)"

Start-Sleep -Milliseconds 500

# Level 3: MEMBER_COMPANY 1
$mc1_body = @{
    code = "MC-001"
    name = "Member Company 1"
    level = "MEMBER_COMPANY"
    parentId = $tc_id
} | ConvertTo-Json

$mc1 = Invoke-RestMethod -Method Post -Uri "$hr_url/organization-units" `
    -Headers $headers -Body $mc1_body
$mc1_id = $mc1.id
Write-Output "✓ Created MEMBER_COMPANY: $($mc1.name) (id=$mc1_id)"

Start-Sleep -Milliseconds 500

# Level 3: MEMBER_COMPANY 2
$mc2_body = @{
    code = "MC-002"
    name = "Member Company 2"
    level = "MEMBER_COMPANY"
    parentId = $tc_id
} | ConvertTo-Json

$mc2 = Invoke-RestMethod -Method Post -Uri "$hr_url/organization-units" `
    -Headers $headers -Body $mc2_body
$mc2_id = $mc2.id
Write-Output "✓ Created MEMBER_COMPANY: $($mc2.name) (id=$mc2_id)"

# ============================================================
# Step 4: Seed Departments
# ============================================================
Write-Output "[STEP 4] Creating Departments..."

# IT Department
$it_dept_body = @{
    code = "IT-001"
    name = "Information Technology"
    organizationUnitId = $mc1_id
} | ConvertTo-Json

$it_dept = Invoke-RestMethod -Method Post -Uri "$hr_url/departments" `
    -Headers $headers -Body $it_dept_body
$it_dept_id = $it_dept.id
Write-Output "✓ Created Department: $($it_dept.name) (id=$it_dept_id)"

Start-Sleep -Milliseconds 500

# HR Department
$hr_dept_body = @{
    code = "HR-001"
    name = "Human Resources"
    organizationUnitId = $mc1_id
} | ConvertTo-Json

$hr_dept = Invoke-RestMethod -Method Post -Uri "$hr_url/departments" `
    -Headers $headers -Body $hr_dept_body
$hr_dept_id = $hr_dept.id
Write-Output "✓ Created Department: $($hr_dept.name) (id=$hr_dept_id)"

Start-Sleep -Milliseconds 500

# Finance Department
$fin_dept_body = @{
    code = "FIN-001"
    name = "Finance"
    organizationUnitId = $mc2_id
} | ConvertTo-Json

$fin_dept = Invoke-RestMethod -Method Post -Uri "$hr_url/departments" `
    -Headers $headers -Body $fin_dept_body
$fin_dept_id = $fin_dept.id
Write-Output "✓ Created Department: $($fin_dept.name) (id=$fin_dept_id)"

Start-Sleep -Milliseconds 500

# Sales Department
$sales_dept_body = @{
    code = "SALES-001"
    name = "Sales"
    organizationUnitId = $mc2_id
} | ConvertTo-Json

$sales_dept = Invoke-RestMethod -Method Post -Uri "$hr_url/departments" `
    -Headers $headers -Body $sales_dept_body
$sales_dept_id = $sales_dept.id
Write-Output "✓ Created Department: $($sales_dept.name) (id=$sales_dept_id)"

# ============================================================
# Step 5: Seed Employees
# ============================================================
Write-Output "[STEP 5] Creating Employees..."

# Employee 1
$emp1_body = @{
    name = "John Doe"
    position = "IT Team Lead"
    departmentId = $it_dept_id
} | ConvertTo-Json

$emp1 = Invoke-RestMethod -Method Post -Uri "$hr_url/employees" `
    -Headers $headers -Body $emp1_body
Write-Output "✓ Created Employee: $($emp1.name) - $($emp1.position)"

Start-Sleep -Milliseconds 500

# Employee 2
$emp2_body = @{
    name = "Jane Smith"
    position = "Junior Developer"
    departmentId = $it_dept_id
} | ConvertTo-Json

$emp2 = Invoke-RestMethod -Method Post -Uri "$hr_url/employees" `
    -Headers $headers -Body $emp2_body
Write-Output "✓ Created Employee: $($emp2.name) - $($emp2.position)"

Start-Sleep -Milliseconds 500

# Employee 3
$emp3_body = @{
    name = "Mike Johnson"
    position = "HR Manager"
    departmentId = $hr_dept_id
} | ConvertTo-Json

$emp3 = Invoke-RestMethod -Method Post -Uri "$hr_url/employees" `
    -Headers $headers -Body $emp3_body
Write-Output "✓ Created Employee: $($emp3.name) - $($emp3.position)"

Start-Sleep -Milliseconds 500

# Employee 4
$emp4_body = @{
    name = "Sarah Williams"
    position = "Finance Officer"
    departmentId = $fin_dept_id
} | ConvertTo-Json

$emp4 = Invoke-RestMethod -Method Post -Uri "$hr_url/employees" `
    -Headers $headers -Body $emp4_body
Write-Output "✓ Created Employee: $($emp4.name) - $($emp4.position)"

Start-Sleep -Milliseconds 500

# Employee 5
$emp5_body = @{
    name = "Robert Brown"
    position = "Sales Executive"
    departmentId = $sales_dept_id
} | ConvertTo-Json

$emp5 = Invoke-RestMethod -Method Post -Uri "$hr_url/employees" `
    -Headers $headers -Body $emp5_body
Write-Output "✓ Created Employee: $($emp5.name) - $($emp5.position)"

# ============================================================
# Step 6: Verify Data
# ============================================================
Write-Output "[STEP 6] Verifying data..."

$orgs = Invoke-RestMethod -Method Get -Uri "$hr_url/organization-units" -Headers $headers
$depts = Invoke-RestMethod -Method Get -Uri "$hr_url/departments" -Headers $headers
$emps = Invoke-RestMethod -Method Get -Uri "$hr_url/employees" -Headers $headers

Write-Output "✓ Total Organizations: $($orgs.Count)"
Write-Output "✓ Total Departments: $($depts.Count)"
Write-Output "✓ Total Employees: $($emps.Count)"

Write-Output ""
Write-Output "==============================================="
Write-Output "✓ SEED COMPLETE!"
Write-Output "==============================================="
Write-Output ""
Write-Output "Admin User Credentials:"
Write-Output "  Username: $admin_username"
Write-Output "  Password: $admin_password"
Write-Output "  Email: $admin_email"
Write-Output ""
Write-Output "UI Access: http://localhost:3000"
Write-Output "- Login with admin account above"
Write-Output "- Go to 'Tổ chức' to see the organization hierarchy"
Write-Output "- Go to 'Phòng ban' to see departments"
Write-Output "- Go to 'Nhân viên' to see employees"
Write-Output ""
