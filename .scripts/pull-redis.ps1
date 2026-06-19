$tries = 6
for ($i = 0; $i -lt $tries; $i++) {
    try {
        Write-Host "Attempting to pull redis:7-alpine (attempt $($i+1)/$tries)"
        docker pull redis:7-alpine
        Write-Host 'Pulled redis successfully'
        exit 0
    } catch {
        Write-Host "Pull failed: $($_.Exception.Message)"
        Start-Sleep -Seconds 3
    }
}
Write-Host 'Failed to pull redis after retries'
exit 1
