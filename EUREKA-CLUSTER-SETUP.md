# Eureka Cluster Setup và Testing Guide

## Tổng quan

Hệ thống Eureka Cluster bao gồm:
- **3 Eureka Server Peers** (ports: 8761, 8762, 8763)
- **HAProxy Gateway** (port: 8760) - Load balancer cho cluster
- **HAProxy Stats Dashboard** (port: 8404) - Monitoring interface
- **Demo Service** (port: 8080) - Test service để verify registration

## Kiến trúc

```
Client/Services
      ↓
HAProxy Gateway (8760)
      ↓
┌─────────────────────────────────┐
│  Eureka Cluster (Peer-to-Peer)  │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ │
│  │ Peer1   │ │ Peer2   │ │ Peer3   │ │
│  │ :8761   │ │ :8762   │ │ :8763   │ │
│  └─────────┘ └─────────┘ └─────────┘ │
└─────────────────────────────────┘
```

## Cách sử dụng

### 1. Khởi động Eureka Cluster

```bash
# Windows
start-eureka-cluster.bat

# Linux/Mac
docker-compose -f eureka-cluster-compose.yml up -d
```

### 2. Kiểm tra trạng thái cluster

**Eureka Dashboard:**
- Gateway: http://eureka:123456@localhost:8760
- Peer1: http://eureka:123456@localhost:8761  
- Peer2: http://eureka:123456@localhost:8762
- Peer3: http://eureka:123456@localhost:8763

**HAProxy Stats:**
- URL: http://admin:admin123@localhost:8404
- Monitor load balancing và health của các peers

**Health Checks:**
```bash
curl http://eureka:123456@localhost:8760/actuator/health
curl http://eureka:123456@localhost:8761/actuator/health
curl http://eureka:123456@localhost:8762/actuator/health
curl http://eureka:123456@localhost:8763/actuator/health
```

### 3. Test đồng bộ giữa các peers

```bash
# Windows
test-peer-sync.bat

# Linux/Mac
./test-peer-sync.sh
```

**Test script sẽ thực hiện:**
1. ✅ Kiểm tra health của tất cả services
2. ✅ Đăng ký test service qua Gateway
3. ✅ Verify service được replicate đến tất cả peers
4. ✅ Test heartbeat qua các peers khác nhau
5. ✅ Kiểm tra consistency của service discovery
6. ✅ Cleanup test data

### 4. Test manual registration

**Đăng ký service:**
```bash
curl -X POST http://eureka:123456@localhost:8760/eureka/apps/MY-SERVICE \
  -H "Content-Type: application/json" \
  -d '{
    "instance": {
      "instanceId": "my-service-001",
      "app": "MY-SERVICE",
      "ipAddr": "192.168.1.100",
      "port": {"$": 8080, "@enabled": true},
      "healthCheckUrl": "http://192.168.1.100:8080/health",
      "status": "UP",
      "metadata": {
        "zone": "us-east-1a",
        "version": "1.0.0"
      }
    }
  }'
```

**Kiểm tra service trên tất cả peers:**
```bash
curl http://eureka:123456@localhost:8761/eureka/apps/MY-SERVICE
curl http://eureka:123456@localhost:8762/eureka/apps/MY-SERVICE  
curl http://eureka:123456@localhost:8763/eureka/apps/MY-SERVICE
```

**Gửi heartbeat:**
```bash
curl -X PUT http://eureka:123456@localhost:8760/eureka/apps/MY-SERVICE/my-service-001
```

**Hủy đăng ký:**
```bash
curl -X DELETE http://eureka:123456@localhost:8760/eureka/apps/MY-SERVICE/my-service-001
```

### 5. Test failover scenarios

**Stop một peer để test failover:**
```bash
docker stop eureka-peer1
```

**Kiểm tra HAProxy stats để xem peer bị removed:**
- URL: http://admin:admin123@localhost:8404

**Services vẫn hoạt động qua Gateway:**
```bash
curl http://eureka:123456@localhost:8760/eureka/apps
```

**Restart peer:**
```bash
docker start eureka-peer1
```

### 6. Dừng cluster

```bash
# Windows  
stop-eureka-cluster.bat

# Linux/Mac
docker-compose -f eureka-cluster-compose.yml down
```

## Cấu hình

### HAProxy Configuration
- **Load Balancing**: Round-robin giữa 3 peers
- **Health Check**: GET /actuator/health mỗi 10s
- **Failover**: Tự động remove unhealthy peers
- **Stats**: Real-time monitoring dashboard

### Eureka Peer Configuration
- **Self-Preservation**: Enabled (85% threshold)
- **Heartbeat**: 30s interval, 90s expiration
- **Replication**: Automatic peer-to-peer sync
- **Security**: HTTP Basic Auth (eureka/123456)

### Docker Network
- **Network**: eureka-network (172.20.0.0/16)
- **DNS**: Container names resolve to IPs
- **Volumes**: Persistent data storage per peer

## Troubleshooting

### Peer không sync
1. Kiểm tra network connectivity giữa containers
2. Verify authentication credentials
3. Check logs: `docker logs eureka-peer1`

### Gateway không route
1. Kiểm tra HAProxy stats dashboard
2. Verify peer health checks
3. Check HAProxy logs: `docker logs eureka-gateway`

### Service registration fails
1. Verify JSON format của instance data
2. Check authentication credentials
3. Ensure required fields (instanceId, app, ipAddr, port)

## Monitoring

### Key Metrics
- **Registered Instances**: Số lượng services đăng ký
- **Peer Replication**: Success/failure rates
- **Heartbeat Renewals**: Rate và threshold
- **Self-Preservation**: Mode status

### Log Locations
```bash
# Container logs
docker logs eureka-peer1
docker logs eureka-peer2  
docker logs eureka-peer3
docker logs eureka-gateway

# Application logs inside containers
docker exec eureka-peer1 tail -f /app/logs/application.log
```

### Health Endpoints
- `/actuator/health` - Overall health status
- `/actuator/metrics` - Detailed metrics
- `/actuator/info` - Application information
- `/haproxy-stats` - Load balancer statistics

## Production Considerations

1. **Security**: Change default passwords
2. **SSL**: Enable HTTPS với proper certificates  
3. **Monitoring**: Integrate với Prometheus/Grafana
4. **Backup**: Regular registry data backups
5. **Scaling**: Add more peers nếu cần
6. **Network**: Use proper DNS names thay vì IPs
7. **Resources**: Monitor CPU/Memory usage
8. **Logs**: Centralized logging solution