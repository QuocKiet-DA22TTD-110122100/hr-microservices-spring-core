$image = 'rabbitmq:3.13-management-alpine'
$tries = 6
for ($i = 0; $i -lt $tries; $i++) {
    try {
        Write-Host "Attempting to pull $image (attempt $($i+1)/$tries)"
        docker pull $image
        Write-Host "Pulled $image successfully"
        exit 0
    } catch {
        Write-Host "Pull failed: $($_.Exception.Message)"
        Start-Sleep -Seconds 3
    }
}
Write-Host "Failed to pull $image after retries"
exit 1
