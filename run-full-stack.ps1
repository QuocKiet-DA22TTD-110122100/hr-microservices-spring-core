<#
PowerShell helper: bring up full stack using layered compose files.
Usage:
  .\run-full-stack.ps1            # start stack (no rebuild)
  .\run-full-stack.ps1 -Build    # start stack and rebuild images
  .\run-full-stack.ps1 -Down     # stop and remove containers
#>
param(
    [switch]$Build,
    [switch]$Down
)

function Start-ComposeStage {
    param(
        [Parameter(Mandatory = $true)][string]$StageName,
        [Parameter(Mandatory = $true)][string[]]$ComposeFiles,
        [switch]$BuildImages
    )

    $composeArgs = @()
    foreach ($file in $ComposeFiles) {
        $composeArgs += @('-f', $file)
    }

    Write-Host "Starting $StageName using: $($ComposeFiles -join ', ')"
    if ($BuildImages) {
        docker compose @composeArgs up -d --build --wait --wait-timeout 600
    }
    else {
        docker compose @composeArgs up -d --wait --wait-timeout 600
    }

    if ($LASTEXITCODE -ne 0) {
        throw "Failed to start $StageName"
    }
}

$stages = @(
    @{ Name = 'infra'; Files = @('compose.infra.yml') },
    @{ Name = 'messaging'; Files = @('compose.messaging.yml') },
    @{ Name = 'iam'; Files = @('compose.iam.yml') },
    @{ Name = 'hr'; Files = @('compose.hr.yml') },
    @{ Name = 'business'; Files = @('compose.business.yml') },
    @{ Name = 'edge'; Files = @('compose.edge.yml') }
)

$allComposeFiles = @()
foreach ($stage in $stages) {
    $allComposeFiles += $stage.Files
}
$allComposeArgs = @()
foreach ($file in $allComposeFiles) {
    $allComposeArgs += @('-f', $file)
}

if ($Down) {
    Write-Host "Stopping and removing containers (using layered compose files)"
    docker compose @allComposeArgs down --remove-orphans
    exit 0
}

if ($Build) {
    Write-Host "Starting full stack with rebuild (this may take a while)"
} else {
    Write-Host "Starting full stack (no rebuild)"
}

foreach ($stage in $stages) {
    Start-ComposeStage -StageName $stage.Name -ComposeFiles $stage.Files -BuildImages:$Build
}

Write-Host "Tailing logs (recent 200 lines). Use Ctrl+C to stop."
docker compose @allComposeArgs logs --tail=200

Write-Host "To follow live logs: docker compose @allComposeArgs logs -f --tail=200"
