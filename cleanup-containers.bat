@echo off
echo ===== Cleaning up existing containers =====

REM Stop and remove existing containers that might conflict
echo Stopping existing containers...
docker stop redis-server eureka-peer1 eureka-peer2 eureka-peer3 api-gateway mock-iam-service kms-service demo-service 2>nul

echo Removing existing containers...
docker rm redis-server eureka-peer1 eureka-peer2 eureka-peer3 api-gateway mock-iam-service kms-service demo-service 2>nul

echo Cleaning up unused networks and volumes...
docker network prune -f
docker volume prune -f

echo ===== Cleanup completed =====
echo You can now run: docker-compose -f microservices-compose.yml up --build
pause