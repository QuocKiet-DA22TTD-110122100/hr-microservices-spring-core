@echo off
echo === Starting Eureka Cluster ===

echo Checking if Docker images exist...
docker images eureka-server | findstr eureka-server >nul
if %errorlevel% neq 0 (
    echo Eureka Server image not found. Building...
    call build-all.bat
    if %errorlevel% neq 0 (
        echo Build failed. Exiting.
        pause
        exit /b 1
    )
) else (
    echo Docker images found.
)

echo Starting Eureka Cluster with Gateway...
docker-compose -f eureka-cluster-compose.yml up -d

echo Waiting for services to start...
timeout /t 30

echo Checking service status...
docker-compose -f eureka-cluster-compose.yml ps

echo.
echo === Eureka Cluster Started ===
echo Gateway URL: http://eureka:123456@localhost:8760
echo HAProxy Stats: http://admin:admin123@localhost:8404
echo.
echo Peer URLs:
echo   Peer1: http://eureka:123456@localhost:8761
echo   Peer2: http://eureka:123456@localhost:8762
echo   Peer3: http://eureka:123456@localhost:8763
echo.
echo Demo Service: http://localhost:8080
echo.
echo Run 'test-peer-sync.bat' to test peer synchronization
pause