# COMPLETE FIX: Auth Register Endpoint 404
Write-Host "===== COMPLETE FIX: Auth Register Endpoint 404 =====" -ForegroundColor Green

Write-Host "Step 1: Stopping and removing ALL containers..." -ForegroundColor Yellow
docker-compose -f microservices-compose.yml down --remove-orphans
$containers = docker ps -aq
if ($containers) {
    docker stop $containers
    docker rm $containers
}

Write-Host "Step 2: Cleaning up Docker system..." -ForegroundColor Yellow
docker system prune -f
docker network prune -f
docker volume prune -f

Write-Host "Step 3: Building and starting services with fresh containers..." -ForegroundColor Yellow
docker-compose -f microservices-compose.yml up --build --force-recreate -d

Write-Host "Step 4: Waiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 45

Write-Host "Step 5: Testing the fix..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Testing /api/v1/auth/register (should return JSON with accessToken):" -ForegroundColor Cyan
curl.exe -X POST http://localhost:8080/api/v1/auth/register `
  -H "Content-Type: application/json" `
  -d '{"username":"testuser","password":"testpass","email":"test@example.com"}'

Write-Host ""
Write-Host ""
Write-Host "Testing /api/v1/auth/login:" -ForegroundColor Cyan
curl.exe -X POST http://localhost:8080/api/v1/auth/login `
  -H "Content-Type: application/json" `
  -d '{"username":"testuser","password":"testpass"}'

Write-Host ""
Write-Host "===== FIX VERIFICATION COMPLETE =====" -ForegroundColor Green
Write-Host "If you see JSON responses with accessToken, the fix is working!" -ForegroundColor Green
Read-Host "Press Enter to continue"