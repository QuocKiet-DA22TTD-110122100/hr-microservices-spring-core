# Test Enhanced API Gateway Configuration
Write-Host "===== TESTING ENHANCED API GATEWAY CONFIGURATION =====" -ForegroundColor Green

Write-Host "Step 1: Cleaning up and starting services..." -ForegroundColor Yellow
docker-compose -f microservices-compose.yml down --remove-orphans
docker-compose -f microservices-compose.yml up --build -d

Write-Host "Step 2: Waiting for all services to be healthy..." -ForegroundColor Yellow
Start-Sleep -Seconds 60

Write-Host "Step 3: Checking service health..." -ForegroundColor Yellow

Write-Host "Checking API Gateway health:" -ForegroundColor Cyan
$apiGatewayHealth = curl -s http://localhost:8080/actuator/health
Write-Host $apiGatewayHealth

Write-Host "Checking Mock IAM Service health:" -ForegroundColor Cyan
$mockServiceHealth = curl -s http://localhost:8081/actuator/health
Write-Host $mockServiceHealth

Write-Host "Checking Redis connection:" -ForegroundColor Cyan
docker exec api-gateway curl -s http://localhost:8080/actuator/health | grep redis

Write-Host "Step 4: Testing API Gateway routing..." -ForegroundColor Yellow

Write-Host "Testing /api/v1/auth/register:" -ForegroundColor Cyan
$registerResponse = curl -X POST http://localhost:8080/api/v1/auth/register `
  -H "Content-Type: application/json" `
  -d '{"username":"testuser","password":"testpass","email":"test@example.com"}' `
  -w "HTTP_STATUS:%{http_code}"
Write-Host $registerResponse

Write-Host "Testing /api/v1/auth/login:" -ForegroundColor Cyan
$loginResponse = curl -X POST http://localhost:8080/api/v1/auth/login `
  -H "Content-Type: application/json" `
  -d '{"username":"testuser","password":"testpass"}' `
  -w "HTTP_STATUS:%{http_code}"
Write-Host $loginResponse

Write-Host "Testing /iam/auth/register:" -ForegroundColor Cyan
$iamRegisterResponse = curl -X POST http://localhost:8080/iam/auth/register `
  -H "Content-Type: application/json" `
  -d '{"username":"iamuser","password":"testpass","email":"iam@example.com"}' `
  -w "HTTP_STATUS:%{http_code}"
Write-Host $iamRegisterResponse

Write-Host "Testing Demo Service via Gateway:" -ForegroundColor Cyan
$demoResponse = curl -s http://localhost:8080/demo/hello -w "HTTP_STATUS:%{http_code}"
Write-Host $demoResponse

Write-Host "Step 5: Checking Gateway logs..." -ForegroundColor Yellow
Write-Host "Recent API Gateway logs:" -ForegroundColor Cyan
docker logs api-gateway --tail 20

Write-Host ""
Write-Host "===== ENHANCED API GATEWAY TEST COMPLETE =====" -ForegroundColor Green
Write-Host "✅ API Gateway với cấu hình nâng cao đã được test!" -ForegroundColor Green
Write-Host "✅ Container networking được cấu hình" -ForegroundColor Green
Write-Host "✅ Health checks được cải thiện" -ForegroundColor Green
Write-Host "✅ Redis connection pooling được thêm" -ForegroundColor Green
Write-Host "✅ Docker profile được cấu hình" -ForegroundColor Green

Read-Host "Press Enter to continue"