$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

$excludeDirNames = @(
    '.git',
    'target',
    'node_modules',
    '.idea',
    '.vscode',
    'logs',
    'test-reports'
)

$excludeFiles = @(
    'certs\eureka.pem',
    'scripts\scan-secrets.ps1'
)

$patterns = @(
    'eureka:123456',
    'redis123',
    'root123',
    'postgres\s*[:=]\s*postgres',
    'your-very-secure-secret-key',
    'microservices-jwt-secret-key',
    'AKIA[0-9A-Z]{16}',
    '(?i)BEGIN\s+(RSA|EC|DSA|OPENSSH)?\s*PRIVATE\s+KEY'
)

function ShouldExclude([string]$relativePath) {
    $normalized = $relativePath -replace '/', '\\'

    if ($excludeFiles -contains $normalized) {
        return $true
    }

    $name = [System.IO.Path]::GetFileName($normalized)
    if ($name -eq '.env' -or $name -eq '.env.example') {
        return $true
    }

    $segments = $normalized.Split('\\')
    foreach ($segment in $segments) {
        if ($excludeDirNames -contains $segment) {
            return $true
        }
    }

    return $false
}

$files = Get-ChildItem -Recurse -File | Where-Object {
    $relative = $_.FullName.Substring($repoRoot.Length + 1)
    return -not (ShouldExclude -relativePath $relative)
}

$matches = New-Object System.Collections.Generic.List[string]

foreach ($file in $files) {
    $relative = $file.FullName.Substring($repoRoot.Length + 1)

    $content = Get-Content -LiteralPath $file.FullName -Raw -ErrorAction SilentlyContinue
    if ($null -eq $content) {
        continue
    }

    foreach ($pattern in $patterns) {
        if ([regex]::IsMatch($content, $pattern)) {
            $matches.Add("$relative -> pattern: $pattern")
        }
    }
}

if ($matches.Count -gt 0) {
    Write-Host 'Secret scan failed. Potential hard-coded secrets found:' -ForegroundColor Red
    $matches | Sort-Object -Unique | ForEach-Object { Write-Host " - $_" }
    Write-Host 'Fix these values or move them to environment variables before commit.' -ForegroundColor Yellow
    exit 1
}

Write-Host 'Secret scan passed.' -ForegroundColor Green
exit 0
