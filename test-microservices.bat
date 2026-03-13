@echo off
echo ========================================
echo Testing Microservices Ecosystem
echo ========================================

echo.
echo 1. Building all services...
call build-all.bat
if %ERRORLEVEL% neq 0 (
    echo Build failed!
    exit /b 1
)

echo.
echo 2. Starting Docker Compose services...
docker-compose -f microservices-compose.yml up -d

echo.
echo 3. Waiting for services to start...
timeout /t 60 /nobreak

echo.
echo 4. Testing service health...
echo Testing Eureka Peer 1:
curl -s http://eureka:123456@localhost:8761/actuator/health

echo.
echo Testing Eureka Peer 2:
curl -s http://eureka:123456@localhost:8762/actuator/health

echo.
echo Testing Eureka Peer 3:
curl -s http://eureka:123456@localhost:8763/actuator/health

echo.
echo Testing API Gateway:
curl -s http://localhost:8080/actuator/health

echo.
echo Testing KMS Service:
curl -s http://localhost:8083/actuator/health

echo.
echo Testing Demo Service:
curl -s http://localhost:8084/actuator/health

echo.
echo 5. Testing Gateway Routes...
echo Testing /eureka/ route:
curl -s -o nul -w "HTTP Status: %%{http_code}\n" http://localhost:8080/eureka/

echo Testing /demo/ route:
curl -s -o nul -w "HTTP Status: %%{http_code}\n" http://localhost:8080/demo/

echo Testing /kms/ route:
curl -s -o nul -w "HTTP Status: %%{http_code}\n" http://localhost:8080/kms/

echo.
echo 6. Checking Eureka service registry...
echo Services registered in Eureka:
curl -s http://eureka:123456@localhost:8761/eureka/apps | findstr "application"

echo.
echo ========================================
echo Test completed!
echo ========================================
echo.
echo Access points:
echo - Eureka Dashboard: http://localhost:8080/eureka/
echo - Demo Service: http://localhost:8080/demo/
echo - KMS Service: http://localhost:8080/kms/
echo - HAProxy Stats: http://localhost:8404/
echo.