@echo off
echo === Stopping Eureka Cluster ===

echo Stopping all services...
docker-compose -f eureka-cluster-compose.yml down

echo Removing volumes (optional - comment out to keep data)...
docker volume rm eureka-cluster_eureka1-data 2>nul
docker volume rm eureka-cluster_eureka2-data 2>nul
docker volume rm eureka-cluster_eureka3-data 2>nul

echo Cleaning up unused Docker resources...
docker system prune -f

echo.
echo === Eureka Cluster Stopped ===
pause