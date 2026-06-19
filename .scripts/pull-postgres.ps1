$image = 'postgres:16-alpine'
$tries = 6
for ($i = 1; $i -le $tries; $i++) {
    Write-Host "Attempting to pull $image ($i/$tries)"
    try {
        docker pull $image
        Write-Host "Pulled $image successfully"
        exit 0
    } catch {
        Write-Host "Pull failed: $($_.Exception.Message)"
        Start-Sleep -Seconds 3
    }
}
Write-Host "Failed to pull $image after $tries attempts"
exit 1
