@echo off
echo ========================================================
echo HR Microservices - MINIMAL Test Setup
echo ========================================================
echo.

REM Clean
docker-compose -f microservices-compose.yml down -v

REM Start core only
docker-compose -f microservices-compose.yml up eureka-peer1 redis api-gateway mock-iam-service -d --build

timeout /t 60 /nobreak >nul

echo.
echo MINIMAL setup ready:
echo - Eureka: http://localhost:8761
echo - Gateway: http://localhost:8080
echo - Register: curl -X POST http://localhost:8080/iam/user/register ...
echo.
docker-compose -f microservices-compose.yml ps
echo.
pause

