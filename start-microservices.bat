@echo off
echo === Starting Complete Microservices Ecosystem ===

echo.
echo [1/3] Building all services...
echo Building Eureka Server...
cd eureka-server
.\mvnw.cmd clean package -DskipTests
if %errorlevel% neq 0 (
    echo [ERROR] Eureka Server build failed
    cd ..
    pause
    exit /b 1
)
cd ..

echo Building API Gateway...
cd api-gateway
.\mvnw.cmd clean package -DskipTests
if %errorlevel% neq 0 (
    echo [ERROR] API Gateway build failed
    cd ..
    pause
    exit /b 1
)
cd ..

echo Building KMS Service...
cd kms
.\mvnw.cmd clean package -DskipTests
if %errorlevel% neq 0 (
    echo [ERROR] KMS Service build failed
    cd ..
    pause
    exit /b 1
)
cd ..

echo Building Demo Service...
cd demo-service
.\mvnw.cmd clean package -DskipTests
if %errorlevel% neq 0 (
    echo [ERROR] Demo Service build failed
    cd ..
    pause
    exit /b 1
)
cd ..

echo.
echo [2/3] Building Docker images...
docker-compose -f microservices-compose.yml build

echo.
echo [3/3] Starting all services...
docker-compose -f microservices-compose.yml up -d

echo.
echo Waiting for services to start...
timeout /t 60

echo.
echo Checking service status...
docker-compose -f microservices-compose.yml ps

echo.
echo === Microservices Ecosystem Started ===
echo.
echo === Service URLs ===
echo Redis:           redis://localhost:6379 (password: redis123)
echo Eureka Peer1:    http://eureka:123456@localhost:8761
echo Eureka Peer2:    http://eureka:123456@localhost:8762
echo Eureka Peer3:    http://eureka:123456@localhost:8763
echo API Gateway:     http://localhost:8080
echo KMS Service:     http://localhost:8083
echo Demo Service:    http://localhost:8084
echo.
echo === Gateway Routes ===
echo Eureka Dashboard: http://localhost:8080/eureka/
echo Demo Service:     http://localhost:8080/demo/
echo KMS Service:      http://localhost:8080/kms/
echo.
echo === Health Checks ===
echo API Gateway:      http://localhost:8080/actuator/health
echo KMS Service:      http://localhost:8083/actuator/health
echo Demo Service:     http://localhost:8084/actuator/health
echo.
echo Run 'test-microservices.bat' to test service discovery and routing
pause