Write-Host 'Waiting for Docker daemon (up to 90s)...'
$n = 0
while ($n -lt 30) {
    try {
        docker info > $null
        Write-Host 'Docker daemon is available'
        exit 0
    } catch {
        Start-Sleep -Seconds 3
        $n++
    }
}
Write-Host 'Timed out waiting for Docker'
exit 1
