# Module M05 - Caching Layer (Redis)

## Overview

Redis caching layer implemented for Task, Project, and HR microservices to reduce database load and improve response times.

## Architecture

```
┌─────────────────────────────────────────────────┐
│  API Clients                                    │
└─────────────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────────────┐
│  Task/Project/HR Services (with @Cacheable)    │
└─────────────────────────────────────────────────┘
           ↓
    ┌─────────────────────────────────────────┐
    │ Cache Layer (L1: In-Memory, L2: Redis)  │
    │ ├─ Caffeine (local, fast)              │
    │ └─ Redis (distributed, persistent)     │
    └─────────────────────────────────────────┘
           ↓
    ┌─────────────────────────────────────────┐
    │ Database (MySQL)                        │
    │ Only hit on cache miss                  │
    └─────────────────────────────────────────┘
```

## Cache Strategies Implemented

### Task Service (port 8083)

**Cache Keys:**
- `tasks:all` - All tasks (10 min TTL)
- `task:{id}` - Task by ID (10 min TTL)
- `tasksByProject:{projectId}` - Tasks for project (10 min TTL)
- `tasksByAssignee:{assigneeId}` - Tasks for assignee (10 min TTL)
- `tasksByStatus:{status}` - Tasks by status (10 min TTL)

**Cache Eviction:**
- POST /api/tasks → Evict: tasks:all, tasksByProject, tasksByAssignee, tasksByStatus
- PUT /api/tasks/{id} → Evict: All task caches
- DELETE /api/tasks/{id} → Evict: All task caches

### Project Service (port 8084)

**Cache Keys:**
- `projects:all` - All projects (10 min TTL)
- `project:{id}` - Project by ID (10 min TTL)
- `projectsByStatus:{status}` - Projects by status (10 min TTL)
- `projectsByLead:{leadId}` - Projects by lead (10 min TTL)

**Cache Eviction:**
- POST /api/projects → Evict: projects:all, projectsByStatus, projectsByLead
- PUT /api/projects/{id} → Evict: All project caches
- DELETE /api/projects/{id} → Evict: All project caches

### HR Service (port 8082)

**Cache Keys:**
- `employees:all` - All employees (15 min TTL)
- `employee:{id}` - Employee by ID (15 min TTL)
- `departments:all` - All departments (15 min TTL)
- `organizations:all` - All organizations (15 min TTL)

**Cache Eviction:**
- Create/Update/Delete operations on any entity

## Configuration

### Redis Connection Pool (All Services)

```yaml
spring:
  redis:
    host: localhost
    port: 6379
    timeout: 60000
    jedis:
      pool:
        max-active: 8
        max-idle: 8
        min-idle: 0
        max-wait: -1ms
```

**Connection Pool Settings:**
- Max Active: 8 connections (max concurrent connections)
- Max Idle: 8 connections (reusable idle connections)
- Min Idle: 0 connections (minimum to maintain)
- Max Wait: -1ms (infinite wait for available connection)
- Timeout: 60 seconds (connection timeout)

### Cache Configuration

```java
@Configuration
@EnableCaching
public class CacheConfig {
    
    @Bean
    public CacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        RedisCacheConfiguration config = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(10))  // TTL: 10 minutes
                .serializeKeysWith(StringRedisSerializer)
                .serializeValuesWith(StringRedisSerializer)
                .disableCachingNullValues();  // Don't cache null values
        
        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(config)
                .build();
    }
}
```

## Dependencies Added

All services updated with:
- `spring-boot-starter-data-redis` - Spring Redis integration
- `jedis` - Redis Java client
- `caffeine` - Optional L1 in-memory cache

## Service Layer Implementation

Each service has a dedicated service class with caching annotations:

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class TaskService {
    
    private final TaskRepository taskRepository;
    
    @Cacheable(value = "tasks", key = "'all'")
    public List<Task> getAllTasks() {
        log.info("[TASK-SERVICE] Cache MISS: fetching all tasks from DB");
        return taskRepository.findAll();
    }
    
    @Cacheable(value = "task", key = "#id")
    public Optional<Task> getTaskById(Long id) {
        log.info("[TASK-SERVICE] Cache MISS: fetching task {} from DB", id);
        return taskRepository.findById(id);
    }
    
    @CacheEvict(value = {"tasks", "tasksByProject", "tasksByAssignee"}, allEntries = true)
    public Task createTask(Task task) {
        log.info("[TASK-SERVICE] Creating task - evicting all caches");
        return taskRepository.save(task);
    }
}
```

## Logging

Cache hits/misses are logged at INFO level:

```
[TASK-SERVICE] Cache MISS: fetching all tasks from DB
[TASK-SERVICE] Cache MISS: fetching task 1 from DB
[PROJECT-SERVICE] Creating project - evicting all caches
```

First request hits database (cache MISS), subsequent requests served from cache until TTL expires or cache is evicted.

## Performance Metrics

### Expected Improvements

**Before Caching (DB Hit):**
- Query 1000 tasks: ~200ms (DB latency + serialization)

**After Caching (Cache Hit):**
- Query 1000 tasks (cached): ~5-10ms (Redis latency + serialization)
- **Improvement**: 20-40x faster response

**Typical Scenario:**
- 90% cache hits → Average response time reduced 18-36x
- 10% cache misses → Refresh data on updates

### Memory Usage

- Each cached list: ~100KB (for 1000 records)
- Redis default memory: 256MB (configurable)
- Can cache ~2500 lists of 1000 items

## Testing Cache Behavior

### Test 1: Cache Hit (Same Query)

```bash
# First request - Cache MISS
time curl http://localhost:8083/api/tasks
# Output: ~200ms

# Second request - Cache HIT (within 10 minutes)
time curl http://localhost:8083/api/tasks
# Output: ~5ms (40x faster)
```

### Test 2: Cache Eviction

```bash
# Create new task (evicts all task caches)
curl -X POST http://localhost:8083/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"New task","status":"OPEN"}'

# Next query rebuilds cache from DB
time curl http://localhost:8083/api/tasks
# Output: ~200ms (cache MISS, rebuilt)
```

### Test 3: Cache TTL Expiration

```bash
# Query at t=0 (cache HIT)
curl http://localhost:8083/api/tasks  # 5ms

# Wait 10 minutes...

# Query at t=10 mins (cache MISS - TTL expired)
curl http://localhost:8083/api/tasks  # 200ms
```

## Monitoring

### Redis Commands

```bash
# Connect to Redis
redis-cli

# Check memory usage
INFO memory
# Output: used_memory_human:2.5M, maxmemory:256m

# List all keys
KEYS *
# Output: tasks:all, task:1, task:2, ...

# Check specific cache
GET tasks:all
# Output: JSON array of cached tasks

# Clear specific cache
DEL tasks:all
# Output: 1

# Clear all caches
FLUSHDB
# Output: OK
```

### Docker Monitoring

```bash
# Check Redis container stats
docker stats redis

# View Redis logs
docker logs redis -f

# Monitor Redis real-time
docker exec -it redis redis-cli MONITOR
```

## Troubleshooting

### Cache Not Working

**Symptom**: All queries take ~200ms (always DB hit)

**Solution**:
```bash
# 1. Verify Redis is running
docker ps | grep redis

# 2. Check Redis connection
curl -i http://localhost:8083/api/tasks
# Should show X-Cache-* headers in production build

# 3. Verify Spring Cache is enabled
# Check logs for: "Started CacheConfig"

# 4. Verify cache configuration
docker exec -it redis redis-cli
> INFO stats
```

### Cache Out of Memory

**Symptom**: Redis returns: OOM command not allowed when used memory > 'maxmemory'

**Solution**:
```bash
# 1. Increase Redis maxmemory
# In docker-compose.yml or redis.conf:
command: redis-server --maxmemory 512mb --maxmemory-policy allkeys-lru

# 2. Or clear unused caches
docker exec -it redis redis-cli FLUSHDB

# 3. Or implement cache size limits per service
```

### Stale Data

**Symptom**: Task is updated but old data still served

**Solution**:
```bash
# 1. Ensure @CacheEvict is on update/delete methods
# 2. Verify allEntries=true for broad eviction
# 3. Check Redis for stale keys:
docker exec -it redis redis-cli GET task:1

# 4. Manual cache clear:
docker exec -it redis redis-cli DEL task:1
```

## Production Configuration

### Recommended Settings

```yaml
spring:
  redis:
    host: redis.production.local  # External Redis instance
    port: 6379
    password: ${REDIS_PASSWORD}   # Use environment variables
    timeout: 120000               # Higher timeout for production
    jedis:
      pool:
        max-active: 32            # More connections for high traffic
        max-idle: 16
        min-idle: 8
        max-wait: 5000
```

### Monitoring in Production

- **Prometheus** metrics for cache hit/miss ratio
- **Grafana** dashboards for cache efficiency
- **CloudWatch** alarms for memory usage > 80%
- **Redis Sentinel** for high availability

## Next Steps

1. Load test with caching enabled
2. Monitor cache hit ratio (target: > 80%)
3. Tune TTL based on data freshness requirements
4. Add distributed caching for multi-instance deployments
5. Implement cache warming on service startup

---

*Module M05: Redis Caching Implementation Complete*
*Cache strategies active for Task, Project, and HR services*
