@echo off
REM FIX: Script để fix container conflicts và start services

echo ========================================
echo Fixing Container Conflicts and Starting Services
echo ========================================

echo.
echo 1. Stopping and removing existing containers...
docker stop redis-server api-gateway eureka-peer1 eureka-peer2 eureka-peer3 kms-service demo-service mock-iam-service 2>nul
docker rm redis-server api-gateway eureka-peer1 eureka-peer2 eureka-peer3 kms-service demo-service mock-iam-service 2>nul

echo.
echo 2. Cleaning up Docker system...
docker system prune -f

echo.
echo 3. Building and starting services...
docker-compose -f microservices-compose.yml up --build -d

echo.
echo 4. Waiting for services to start (45 seconds)...
timeout /t 45 /nobreak

echo.
echo 5. Checking service health...
echo.
echo API Gateway:
curl -s http://localhost:8080/actuator/health || echo "API Gateway not ready yet"

echo.
echo.
echo Mock IAM Service:
curl -s http://localhost:8081/actuator/health || echo "Mock IAM Service not ready yet"

echo.
echo.
echo Demo Service:
curl -s http://localhost:8084/actuator/health || echo "Demo Service not ready yet"

echo.
echo ========================================
echo Services started! Now you can:
echo 1. Run Postman collection tests
echo 2. Test manually with test-auth-register-fix.bat
echo ========================================
pause