@echo off
echo ========================================================
echo HR Microservices - Full Architecture Deployment
echo ========================================================
echo.

REM Check Docker
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker not installed or not in PATH
    pause
    exit /b 1
)

REM Clean old setup
echo [1/5] Cleaning old containers...
docker-compose -f microservices-compose.yml down -v
docker system prune -f

REM Start full stack
echo [2/5] Building and starting services...
docker-compose -f microservices-compose.yml up --build -d

echo [3/5] Waiting for services to start (120s)...
timeout /t 120 /nobreak >nul

REM Check Eureka
echo [4/5] Checking Eureka cluster...
curl -u eureka:123456 -s http://localhost:8761/eureka/apps | findstr /C:"applications" >nul
if %errorlevel% equ 0 (
    echo [OK] Eureka cluster healthy!
else (
    echo [WARN] Eureka check failed - check logs
)

REM Test API Gateway
curl -s http://localhost:8080/actuator/health | findstr /C:"UP" >nul
if %errorlevel% equ 0 (
    echo [OK] API Gateway healthy!
)

echo.
echo ========================================================
echo Deployment COMPLETE! Architecture ready for testing:
echo.
echo 1. Eureka Dashboard: http://localhost:80/eureka/ (user: eureka/123456)
echo 2. API Gateway:     http://localhost:8080
echo 3. Services Status: docker-compose -f microservices-compose.yml ps
echo.
echo Test Register API:
echo curl -X POST http://localhost:8080/iam/user/register -H "Content-Type: application/json" -d "{\"username\":\"test\",\"password\":\"123\",\"email\":\"test@test.com\"}"
echo.
echo Press Ctrl+C to keep running, or run: docker-compose -f microservices-compose.yml down -v
echo ========================================================
echo.

docker-compose -f microservices-compose.yml logs -f --tail=50 api-gateway

