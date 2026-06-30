<#
Start the minimal demo stack, wait for service health, and apply seed data.

Usage:
  .\scripts\run-minimal-demo.ps1
  .\scripts\run-minimal-demo.ps1 -Build
  .\scripts\run-minimal-demo.ps1 -SkipSeed
#>

param(
    [switch]$Build,
    [switch]$SkipSeed,
    [int]$TimeoutSeconds = 900
)

$ErrorActionPreference = 'Stop'

function Wait-HttpOk {
    param(
        [Parameter(Mandatory = $true)][string]$Name,
        [Parameter(Mandatory = $true)][string]$Url,
        [int]$TimeoutSeconds = 300
    )

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        try {
            $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 10
            if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 300) {
                Write-Host "[OK] $Name -> $Url"
                return
            }
        } catch {
            Start-Sleep -Seconds 5
        }
    }

    throw "Timeout waiting for $Name at $Url"
}

function Invoke-Seed {
    Write-Host "[SEED] Copying SQL seed files into database containers"
    docker cp docker/seed/minimal-auth-seed.sql minimal-auth-postgres:/tmp/minimal-auth-seed.sql
    docker cp docker/seed/minimal-hr-seed.sql minimal-hr-mysql:/tmp/minimal-hr-seed.sql
    docker cp docker/seed/minimal-business-seed.sql minimal-business-mysql:/tmp/minimal-business-seed.sql

    Write-Host "[SEED] Applying Auth seed"
    docker exec minimal-auth-postgres sh -c 'psql -U $POSTGRES_USER -d $POSTGRES_DB -f /tmp/minimal-auth-seed.sql'

    Write-Host "[SEED] Applying HR seed"
    docker exec minimal-hr-mysql sh -c 'mysql -uroot -p$MYSQL_ROOT_PASSWORD < /tmp/minimal-hr-seed.sql'

    Write-Host "[SEED] Applying Project/Task seed"
    docker exec minimal-business-mysql sh -c 'mysql -uroot -p$MYSQL_ROOT_PASSWORD < /tmp/minimal-business-seed.sql'
}

$composeArgs = @('-f', 'compose.minimal.yml', 'up', '-d', '--wait', '--wait-timeout', $TimeoutSeconds.ToString())
if ($Build) {
    $composeArgs = @('-f', 'compose.minimal.yml', 'up', '-d', '--build', '--wait', '--wait-timeout', $TimeoutSeconds.ToString())
}

Write-Host "[START] docker compose $($composeArgs -join ' ')"
docker compose @composeArgs
if ($LASTEXITCODE -ne 0) {
    throw "docker compose failed with exit code $LASTEXITCODE. Check Docker Desktop/engine access before retrying."
}

Write-Host "[WAIT] Checking minimal demo endpoints"
Wait-HttpOk -Name 'KMS' -Url 'http://localhost:8083/actuator/health' -TimeoutSeconds $TimeoutSeconds
Wait-HttpOk -Name 'Auth' -Url 'http://localhost:8086/actuator/health' -TimeoutSeconds $TimeoutSeconds
Wait-HttpOk -Name 'HR' -Url 'http://localhost:8082/actuator/health' -TimeoutSeconds $TimeoutSeconds
Wait-HttpOk -Name 'Project' -Url 'http://localhost:8084/actuator/health' -TimeoutSeconds $TimeoutSeconds
Wait-HttpOk -Name 'Task' -Url 'http://localhost:8087/actuator/health' -TimeoutSeconds $TimeoutSeconds
Wait-HttpOk -Name 'Gateway' -Url 'http://localhost:8080/actuator/health' -TimeoutSeconds $TimeoutSeconds

if (-not $SkipSeed) {
    Invoke-Seed
}

Write-Host ""
Write-Host "[DONE] Minimal demo stack is ready."
Write-Host "Frontend:       cd frontend; npm run dev -- --host 127.0.0.1 --port 5173"
Write-Host "Gateway:        http://localhost:8080"
Write-Host "Payroll page:   http://127.0.0.1:5173/payroll"
Write-Host ""
Write-Host "Demo accounts use the same seeded password as existing demo users:"
Write-Host "  admin"
Write-Host "  hr.manager"
Write-Host "  payroll.officer"
Write-Host "  manager"
Write-Host "  employee"
