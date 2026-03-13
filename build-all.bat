@echo off
echo === Building All Components ===

echo.
echo [1/4] Building parent project...
.\mvnw.cmd clean compile -DskipTests
if %errorlevel% neq 0 (
    echo [ERROR] Parent project build failed
    pause
    exit /b 1
)

echo.
echo [2/4] Building Eureka Server...
cd eureka-server
.\mvnw.cmd clean package -DskipTests
if %errorlevel% neq 0 (
    echo [ERROR] Eureka Server build failed
    cd ..
    pause
    exit /b 1
)
cd ..

echo.
echo [3/4] Building Demo Service...
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
echo [4/4] Building Docker images...
echo Building Eureka Server image...
docker build -t eureka-server ./eureka-server
if %errorlevel% neq 0 (
    echo [ERROR] Eureka Server Docker build failed
    pause
    exit /b 1
)

echo Building Demo Service image...
docker build -t demo-service ./demo-service
if %errorlevel% neq 0 (
    echo [ERROR] Demo Service Docker build failed
    pause
    exit /b 1
)

echo.
echo === Build Completed Successfully ===
echo.
echo Docker images created:
docker images | findstr "eureka-server\|demo-service"
echo.
echo Ready to start cluster with: start-eureka-cluster.bat
pause