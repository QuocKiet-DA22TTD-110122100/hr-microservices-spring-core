# HR Microservices Deployment Guide - 8GB RAM Optimization & VM Setup

## 🎯 Mục tiêu
Chạy full microservices stack (Eureka x3, Gateway, Auth, HR, KMS, Frontend, Observability) trên máy **8GB RAM** hoặc VM.

**Vấn đề gốc**: 10+ Java services (512MB heap mỗi) + DBs → OOM khi `docker compose up`.

**Giải pháp**:
1. **Low-RAM Mode** (Host 8GB): Resource limits + staged startup.
2. **VM Mode** (Khuyến nghị): Ubuntu VM 12-16GB RAM chạy full.

---

## 1. Low-RAM Mode (Host trực tiếp)

### Bước 1: Clean Docker
```bash
docker system prune -a --volumes -f
docker volume prune -f
docker builder prune -a -f
```

### Bước 2: Tạo `.env` (root project)
```env
# Profiles: core (no observability), full
COMPOSE_PROFILES=core
JAVA_OPTS_EUREKA=-Xmx256m
JAVA_OPTS_GATEWAY=-Xmx384m
JAVA_OPTS_SERVICE=-Xmx384m
REDIS_PASSWORD=change_me
MYSQL_ROOT_PASSWORD=change_me
MYSQL_DATABASE=hrdb
HR_DB_USERNAME=hruser
HR_DB_PASSWORD=hrpass
POSTGRES_DB=authdb
POSTGRES_USER=authuser
POSTGRES_PASSWORD=authpass
JWT_SECRET=mysecret
INTERNAL_SECRET=myinternal
EUREKA_USERNAME=user
EUREKA_PASSWORD=pass
EUREKA_PEER1_PORT=8761
EUREKA_PEER2_PORT=8762
EUREKA_PEER3_PORT=8763
```

### Bước 3: Staged Startup
```bash
# 1. Eureka cluster (1.5GB total)
docker compose -f eureka-compose.yml up -d --scale eureka-peer2=0 --scale eureka-peer3=0  # Only peer1

# 2. Core services (~4GB total)
docker compose -f microservices-compose.yml --profile core up -d --build

# Check: docker stats (RAM <7GB?)
docker stats

# 3. Optional: Full + observability (~7GB)
docker compose --profile full -f microservices-compose.yml up -d grafana prometheus zipkin

# Ports:
# Frontend: http://localhost:3000
# Gateway: http://localhost:8080
# Eureka: http://localhost:8760
# Grafana: http://localhost:3001/admin (admin/admin)
```

### Resource Targets (sau khi apply limits):
| Service | RAM Limit | Heap |
|---------|-----------|------|
| Eureka (x1-3) | 512MB | 256m |
| Gateway | 768MB | 384m |
| Auth+Postgres | 1.5GB | 384m |
| HR+MySQL | 1.5GB | 384m |
| Others | 256-512MB | - |

---

## 2. VM Mode (Khuyến nghị - Full Performance)

### Option A: Local VM (VirtualBox/VMware - Free)
1. **Download Ubuntu 22.04 LTS ISO**: ubuntu.com
2. **Tạo VM**:
   | Setting | Value |
   |---------|-------|
   | RAM | 12-16GB |
   | CPU | 4-6 cores |
   | Disk | 50GB dynamic |
   | Network | Bridged |
3. **Trong VM**:
   ```bash
   sudo apt update && sudo apt install docker.io docker-compose git maven openjdk-21-jdk unzip
   sudo usermod -aG docker $USER && newgrp docker
   git clone https://github.com/your-repo/hr-microservices-spring-core.git
   cd hr-microservices-spring-core
   cp .env.example .env  # Edit secrets
   docker compose -f eureka-compose.yml up -d
   docker compose -f microservices-compose.yml up -d --build
   ```

### Option B: Cloud VM (~$20/tháng)
| Provider | Instance | RAM | Cost | Setup |
|----------|----------|-----|------|-------|
| AWS | t3.large | 8GB | $0.08/hr | EC2 + Docker |
| GCP | e2-standard-4 | 16GB | $0.13/hr | Compute Engine |
| DigitalOcean | Premium Intel 4GB | 4GB+ | $24/mo | Droplet + Docker |

**Cloud Quickstart** (GCP example):
```bash
gcloud compute instances create hr-dev-vm \
  --image-family=ubuntu-2204-lts --image-project=ubuntu-os-cloud \
  --machine-type=e2-standard-4 --zone=us-central1-a
gcloud compute ssh hr-dev-vm  # Then Docker setup as above
```

---

## 3. Monitoring & Troubleshooting

### Commands hữu ích:
```bash
# Live stats
docker stats

# Logs service cụ thể
docker compose logs -f api-gateway

# Restart single service
docker compose restart auth-service

# Scale down Eureka (save RAM)
docker compose -f microservices-compose.yml up -d --scale eureka-peer1=1 --scale eureka-peer2=0 --scale eureka-peer3=0

# Health check
curl http://localhost:8080/actuator/health
```

### OOM Fixes:
1. `docker logs <container>` check Java OOM.
2. Giảm JAVA_OPTS trong `.env`.
3. `--memory=512m` manual: `docker compose run --memory=512m api-gateway up`.

### Performance Tips:
- Disable tests: Maven `-DskipTests`.
- Build once: `docker compose build --no-cache`, then `up`.
- Swap file host: 8GB+ swap nếu cần (không khuyến khích).

---

## 4. Next Steps (Sau khi chạy ổn)
- Test Postman collections: `post-man/`
- Grafana dashboards: http://localhost:3001
- Scale production: Kubernetes/Helm.

**Liên hệ nếu cần hỗ trợ thêm!**
