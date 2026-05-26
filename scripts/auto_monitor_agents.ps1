Param()

# Auto-monitor agent notifications placed into .notifications/ as JSON files.
# When a notification file with { "taskId": "...", "status": "completed" } is dropped
# the script updates .todo_state.json, appends a short entry to TODO_LOG.md, and echoes progress.

Set-StrictMode -Version Latest

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
# project root (one level up from scripts)
$projectRoot = Join-Path $root ".." | Resolve-Path | Select-Object -ExpandProperty Path

$notificationsDir = Join-Path $projectRoot ".notifications"
if (-not (Test-Path $notificationsDir)) {
    New-Item -ItemType Directory -Path $notificationsDir | Out-Null
}

$todoFile = Join-Path $projectRoot ".todo_state.json"
if (-not (Test-Path $todoFile)) {
    $initial = @{
        "DEDUCTION-001" = "in-progress"
        "EMPLOYEE-001"  = "in-progress"
        "PAYROLL-001"   = "not-started"
        "PAYROLL-002"   = "not-started"
        "COMPLIANCE-001"= "not-started"
    }
    $initial | ConvertTo-Json -Depth 3 | Out-File -FilePath $todoFile -Encoding utf8
}

$logFile = Join-Path $projectRoot "TODO_LOG.md"
if (-not (Test-Path $logFile)) { "# TODO Log`n" | Out-File $logFile -Encoding utf8 }

Write-Host "Watching notifications in: $notificationsDir" -ForegroundColor Cyan

function Update-TodoFromNotification {
    param($path)
    try {
        $json = Get-Content -Raw -Path $path | ConvertFrom-Json
    } catch {
        Write-Warning ("Failed to parse JSON in {0}: {1}" -f $path, $_)
        return
    }

    if (-not $json.taskId) { Write-Warning "Notification has no taskId: $path"; return }
    $taskId = $json.taskId
    $status = if ($json.status) { $json.status } else { "unknown" }

    $todo = Get-Content -Raw -Path $todoFile | ConvertFrom-Json
    if ($todo.PSObject.Properties.Name -notcontains $taskId) {
        # add new entry if unknown
        $todo | Add-Member -NotePropertyName $taskId -NotePropertyValue $status -Force
    } else {
        $todo.$taskId = $status
    }

    $todo | ConvertTo-Json -Depth 4 | Out-File -FilePath $todoFile -Encoding utf8

    $now = (Get-Date).ToString('s')
    $line = "- [$now] $taskId -> $status"
    Add-Content -Path $logFile -Value $line

    Write-Host "Updated $taskId => $status" -ForegroundColor Green

    # If completed, append a short note to the runbook
    if ($status -eq 'completed') {
        $runbook = Join-Path $root ".." "RUNBOOK-MODULE-M06-MESSAGING.md"
        if (Test-Path $runbook) {
            $note = "- [$now] Agent reported completion: $taskId`n"
            Add-Content -Path $runbook -Value $note
            Write-Host "Appended completion note to runbook." -ForegroundColor Yellow
        }
    }

    # optional: remove processed notification file
    try { Remove-Item -Path $path -Force -ErrorAction SilentlyContinue } catch {}
}

$fsw = New-Object System.IO.FileSystemWatcher
$fsw.Path = $notificationsDir
$fsw.Filter = "*.json"
$fsw.EnableRaisingEvents = $true
$fsw.IncludeSubdirectories = $false

$created = Register-ObjectEvent -InputObject $fsw -EventName Created -Action {
    $path = $Event.SourceEventArgs.FullPath
    Start-Sleep -Milliseconds 200
    Update-TodoFromNotification -path $path
}

try {
    Write-Host "Press Ctrl+C to stop watcher." -ForegroundColor Cyan
    while ($true) { Start-Sleep -Seconds 1 }
} finally {
    Unregister-Event -SourceIdentifier $created.Name -ErrorAction SilentlyContinue
    $fsw.Dispose()
}
