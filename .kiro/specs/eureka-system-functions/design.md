# Technical Design Document

## Overview

Hệ thống Eureka Server Cluster là một service registry và discovery system được thiết kế để hỗ trợ kiến trúc microservices với khả năng high availability và fault tolerance. Hệ thống bao gồm 3 Eureka server instances hoạt động trong chế độ cluster, cung cấp các chức năng đăng ký service, khám phá service, health monitoring, và đồng bộ hóa dữ liệu.

### Key Design Principles

- **High Availability**: Cluster với 3 nodes đảm bảo hệ thống hoạt động ngay cả khi 1 node fail
- **Eventual Consistency**: Dữ liệu được đồng bộ giữa các nodes với eventual consistency model
- **Self-Healing**: Tự động phát hiện và xử lý các node failures
- **Scalability**: Thiết kế cho phép mở rộng số lượng nodes trong tương lai
- **Security**: Tích hợp authentication và authorization mechanisms

## Architecture

### System Architecture

```mermaid
graph TB
    subgraph "Eureka Cluster"
        E1[Eureka Server 1<br/>Port: 8761]
        E2[Eureka Server 2<br/>Port: 8762]
        E3[Eureka Server 3<br/>Port: 8763]
    end
    
    subgraph "Load Balancer"
        LB[HAProxy/Nginx<br/>Port: 8760]
    end
    
    subgraph "Microservices"
        MS1[User Service]
        MS2[Order Service]
        MS3[Payment Service]
        MS4[Notification Service]
    end
    
    subgraph "Client Applications"
        C1[Web App]
        C2[Mobile App]
        C3[Admin Dashboard]
    end
    
    LB --> E1
    LB --> E2
    LB --> E3
    
    E1 <--> E2
    E2 <--> E3
    E3 <--> E1
    
    MS1 --> LB
    MS2 --> LB
    MS3 --> LB
    MS4 --> LB
    
    C1 --> LB
    C2 --> LB
    C3 --> LB
```

### Network Architecture

```mermaid
graph LR
    subgraph "DMZ Network"
        LB[Load Balancer<br/>10.0.1.10]
    end
    
    subgraph "Application Network"
        E1[Eureka-1<br/>10.0.2.11]
        E2[Eureka-2<br/>10.0.2.12]
        E3[Eureka-3<br/>10.0.2.13]
    end
    
    subgraph "Service Network"
        MS[Microservices<br/>10.0.3.x]
    end
    
    LB --> E1
    LB --> E2
    LB --> E3
    MS --> LB
```

### Deployment Architecture

- **Environment**: Docker containers trên Kubernetes cluster
- **Resource Requirements**: 
  - CPU: 2 cores per Eureka instance
  - Memory: 4GB RAM per instance
  - Storage: 20GB persistent volume per instance
- **Network**: Internal cluster network với external load balancer

## Components and Interfaces

### Core Components

#### 1. Eureka Server Core
```java
@SpringBootApplication
@EnableEurekaServer
public class EurekaServerApplication {
    public static void main(String[] args) {
        SpringApplication.run(EurekaServerApplication.class, args);
    }
}
```

**Responsibilities:**
- Service registration và deregistration
- Service discovery API endpoints
- Health monitoring và instance management
- Peer replication coordination

#### 2. Service Registry
```java
public interface ServiceRegistry {
    void register(InstanceInfo instance);
    void deregister(String appName, String instanceId);
    List<InstanceInfo> getInstances(String appName);
    InstanceInfo getInstance(String appName, String instanceId);
    void updateStatus(String appName, String instanceId, InstanceStatus status);
}
```

**Responsibilities:**
- Lưu trữ thông tin service instances
- Quản lý instance lifecycle
- Cung cấp query interface cho service discovery

#### 3. Peer Replication Manager
```java
public interface PeerReplicationManager {
    void replicateInstanceActionsToPeers(Action action, String appName, 
                                       String instanceId, InstanceInfo instance);
    void syncUp();
    void updatePeerEurekaNodes(List<String> peerUrls);
}
```

**Responsibilities:**
- Đồng bộ dữ liệu giữa các Eureka nodes
- Xử lý replication failures và retry logic
- Maintain peer node connectivity

#### 4. Health Check Manager
```java
public interface HealthCheckManager {
    void scheduleHealthCheck(InstanceInfo instance);
    void cancelHealthCheck(String instanceId);
    HealthStatus checkHealth(InstanceInfo instance);
    void processHeartbeat(String appName, String instanceId);
}
```

**Responsibilities:**
- Thực hiện health checks cho registered instances
- Xử lý heartbeat từ service instances
- Cập nhật instance status dựa trên health check results

### REST API Interfaces

#### Service Registration Endpoints

```http
POST /eureka/apps/{appName}
Content-Type: application/json

{
  "instance": {
    "instanceId": "user-service-001",
    "app": "USER-SERVICE",
    "ipAddr": "10.0.3.15",
    "port": {
      "$": 8080,
      "@enabled": true
    },
    "securePort": {
      "$": 8443,
      "@enabled": true
    },
    "healthCheckUrl": "http://10.0.3.15:8080/health",
    "statusPageUrl": "http://10.0.3.15:8080/info",
    "homePageUrl": "http://10.0.3.15:8080/",
    "status": "UP",
    "metadata": {
      "zone": "us-east-1a",
      "version": "1.0.0",
      "weight": "100"
    }
  }
}
```

#### Service Discovery Endpoints

```http
GET /eureka/apps
Accept: application/json

Response:
{
  "applications": {
    "versions__delta": "1",
    "apps__hashcode": "UP_2_",
    "application": [
      {
        "name": "USER-SERVICE",
        "instance": [
          {
            "instanceId": "user-service-001",
            "app": "USER-SERVICE",
            "ipAddr": "10.0.3.15",
            "port": {"$": 8080, "@enabled": true},
            "status": "UP",
            "metadata": {
              "zone": "us-east-1a",
              "version": "1.0.0"
            }
          }
        ]
      }
    ]
  }
}
```

#### Health Check Endpoints

```http
PUT /eureka/apps/{appName}/{instanceId}
Content-Type: application/json

{
  "status": "UP"
}
```

### Configuration Interfaces

#### Eureka Server Configuration
```yaml
# application.yml
server:
  port: 8761

eureka:
  instance:
    hostname: eureka-server-1
    prefer-ip-address: true
    lease-renewal-interval-in-seconds: 30
    lease-expiration-duration-in-seconds: 90
  
  server:
    enable-self-preservation: true
    eviction-interval-timer-in-ms: 60000
    renewal-percent-threshold: 0.85
    peer-eureka-nodes-update-interval-ms: 600000
    
  client:
    register-with-eureka: true
    fetch-registry: true
    service-url:
      defaultZone: http://eureka-server-2:8762/eureka/,http://eureka-server-3:8763/eureka/
```

## Data Models

### Instance Information Model

```java
public class InstanceInfo {
    private String instanceId;
    private String appName;
    private String ipAddr;
    private int port;
    private int securePort;
    private String homePageUrl;
    private String statusPageUrl;
    private String healthCheckUrl;
    private InstanceStatus status;
    private Map<String, String> metadata;
    private LeaseInfo leaseInfo;
    private DataCenterInfo dataCenterInfo;
    
    // Constructors, getters, setters
}

public enum InstanceStatus {
    UP, DOWN, STARTING, OUT_OF_SERVICE, UNKNOWN
}
```

### Lease Information Model

```java
public class LeaseInfo {
    private int renewalIntervalInSecs = 30;
    private int durationInSecs = 90;
    private long registrationTimestamp;
    private long lastRenewalTimestamp;
    private long evictionTimestamp;
    private long serviceUpTimestamp;
    
    // Constructors, getters, setters
}
```

### Application Model

```java
public class Application {
    private String name;
    private Set<InstanceInfo> instances;
    private Map<String, InstanceInfo> instancesMap;
    
    public void addInstance(InstanceInfo instance) {
        instances.add(instance);
        instancesMap.put(instance.getInstanceId(), instance);
    }
    
    public void removeInstance(InstanceInfo instance) {
        instances.remove(instance);
        instancesMap.remove(instance.getInstanceId());
    }
    
    public List<InstanceInfo> getInstancesAsIsFromEureka() {
        return new ArrayList<>(instances);
    }
}
```

### Registry Model

```java
public class Registry {
    private final ConcurrentHashMap<String, Map<String, Lease<InstanceInfo>>> registry;
    private final CircularQueue<Pair<Long, String>> recentRegisteredQueue;
    private final CircularQueue<Pair<Long, String>> recentCanceledQueue;
    
    public void register(InstanceInfo instance, int leaseDuration, boolean isReplication) {
        // Implementation
    }
    
    public boolean cancel(String appName, String instanceId, boolean isReplication) {
        // Implementation
    }
    
    public boolean renew(String appName, String instanceId, boolean isReplication) {
        // Implementation
    }
}
```

### Peer Node Model

```java
public class PeerEurekaNode {
    private String serviceUrl;
    private String name;
    private HttpReplicationClient replicationClient;
    private long lastSuccessfulHeartbeatTimestamp;
    private volatile boolean isReplicationAllowed = true;
    
    public void heartbeat(String appName, String instanceId, 
                         InstanceInfo instance, InstanceStatus overriddenStatus) {
        // Implementation
    }
    
    public void register(InstanceInfo instance) throws Throwable {
        // Implementation
    }
    
    public void cancel(String appName, String instanceId) throws Throwable {
        // Implementation
    }
}
```

## Implementation Details

### Service Registration Implementation

#### Registration Flow
```mermaid
sequenceDiagram
    participant MS as Microservice
    participant LB as Load Balancer
    participant E1 as Eureka Server 1
    participant E2 as Eureka Server 2
    participant E3 as Eureka Server 3
    
    MS->>LB: POST /eureka/apps/USER-SERVICE
    LB->>E1: Forward registration request
    E1->>E1: Validate instance data
    E1->>E1: Store in local registry
    E1->>E2: Replicate registration
    E1->>E3: Replicate registration
    E2->>E1: ACK replication
    E3->>E1: ACK replication
    E1->>LB: HTTP 204 No Content
    LB->>MS: Registration successful
```

#### Registration Validation Logic
```java
@Component
public class RegistrationValidator {
    
    public ValidationResult validate(InstanceInfo instance) {
        ValidationResult result = new ValidationResult();
        
        // Validate required fields
        if (StringUtils.isEmpty(instance.getAppName())) {
            result.addError("Application name is required");
        }
        
        if (StringUtils.isEmpty(instance.getInstanceId())) {
            result.addError("Instance ID is required");
        }
        
        if (StringUtils.isEmpty(instance.getIpAddr())) {
            result.addError("IP address is required");
        }
        
        // Validate IP address format
        if (!isValidIpAddress(instance.getIpAddr())) {
            result.addError("Invalid IP address format");
        }
        
        // Validate port range
        if (instance.getPort() < 1 || instance.getPort() > 65535) {
            result.addError("Port must be between 1 and 65535");
        }
        
        // Validate URLs if provided
        if (instance.getHealthCheckUrl() != null && 
            !isValidUrl(instance.getHealthCheckUrl())) {
            result.addError("Invalid health check URL format");
        }
        
        return result;
    }
    
    private boolean isValidIpAddress(String ip) {
        return InetAddressValidator.getInstance().isValidInet4Address(ip);
    }
    
    private boolean isValidUrl(String url) {
        try {
            new URL(url);
            return true;
        } catch (MalformedURLException e) {
            return false;
        }
    }
}
```

### Service Discovery Implementation

#### Discovery Cache Strategy
```java
@Component
public class ResponseCacheImpl implements ResponseCache {
    
    private final ConcurrentMap<Key, Value> readOnlyCacheMap;
    private final LoadingCache<Key, Value> readWriteCacheMap;
    private final Timer timer;
    
    public ResponseCacheImpl(EurekaServerConfig serverConfig, 
                           ServerCodecs serverCodecs, 
                           AbstractInstanceRegistry registry) {
        
        this.readOnlyCacheMap = new ConcurrentHashMap<>();
        
        this.readWriteCacheMap = CacheBuilder.newBuilder()
            .initialCapacity(serverConfig.getInitialCapacityOfResponseCache())
            .expireAfterWrite(serverConfig.getResponseCacheAutoExpirationInSeconds(), 
                            TimeUnit.SECONDS)
            .removalListener(this::handleCacheRemoval)
            .build(new CacheLoader<Key, Value>() {
                @Override
                public Value load(Key key) throws Exception {
                    return generatePayload(key);
                }
            });
        
        // Schedule cache update task
        this.timer = new Timer("Eureka-CacheFillTimer", true);
        if (shouldUseReadOnlyResponseCache) {
            timer.schedule(getCacheUpdateTask(), 
                         serverConfig.getResponseCacheUpdateIntervalMs(),
                         serverConfig.getResponseCacheUpdateIntervalMs());
        }
    }
    
    @Override
    public String get(Key key) {
        Value payload = getValue(key, shouldUseReadOnlyResponseCache);
        if (payload == null || payload.getPayload().equals(EMPTY_PAYLOAD)) {
            return null;
        } else {
            return payload.getPayload();
        }
    }
    
    private Value getValue(Key key, boolean useReadOnlyCache) {
        Value payload = null;
        try {
            if (useReadOnlyCache) {
                payload = readOnlyCacheMap.get(key);
                if (payload != null) {
                    return payload;
                }
            }
            
            payload = readWriteCacheMap.get(key);
            if (useReadOnlyCache && payload != null) {
                readOnlyCacheMap.put(key, payload);
            }
        } catch (Throwable t) {
            logger.error("Cannot get value for key: {}", key, t);
        }
        return payload;
    }
}
```

### Health Monitoring Implementation

#### Heartbeat Processing
```java
@Component
public class HeartbeatProcessor {
    
    private final AbstractInstanceRegistry registry;
    private final EurekaServerConfig serverConfig;
    
    @Scheduled(fixedDelayString = "${eureka.server.eviction-interval-timer-in-ms:60000}")
    public void evict() {
        evict(0l);
    }
    
    public void evict(long additionalLeaseMs) {
        logger.debug("Running the evict task");
        
        if (!isLeaseExpirationEnabled()) {
            logger.debug("DS: lease expiration is currently disabled.");
            return;
        }
        
        List<Lease<InstanceInfo>> expiredLeases = new ArrayList<>();
        for (Entry<String, Map<String, Lease<InstanceInfo>>> groupEntry : registry.entrySet()) {
            Map<String, Lease<InstanceInfo>> leaseMap = groupEntry.getValue();
            if (leaseMap != null) {
                for (Entry<String, Lease<InstanceInfo>> leaseEntry : leaseMap.entrySet()) {
                    Lease<InstanceInfo> lease = leaseEntry.getValue();
                    if (lease.isExpired(additionalLeaseMs) && lease.getHolder() != null) {
                        expiredLeases.add(lease);
                    }
                }
            }
        }
        
        // To compensate for GC pauses or drifting local time, we need to use current registry size as a base for
        // triggering self-preservation. Without that we would wipe out full registry.
        int registrySize = (int) getLocalRegistrySize();
        int registrySizeThreshold = (int) (registrySize * serverConfig.getRenewalPercentThreshold());
        int evictionLimit = registrySize - registrySizeThreshold;
        
        int toEvict = Math.min(expiredLeases.size(), evictionLimit);
        if (toEvict > 0) {
            logger.info("Evicting {} items (registry size={}, registry threshold={})",
                       toEvict, registrySize, registrySizeThreshold);
            
            Random random = new Random(System.currentTimeMillis());
            for (int i = 0; i < toEvict; i++) {
                // Pick a random item (Knuth shuffle algorithm)
                int next = i + random.nextInt(expiredLeases.size() - i);
                Collections.swap(expiredLeases, i, next);
                Lease<InstanceInfo> lease = expiredLeases.get(i);
                
                String appName = lease.getHolder().getAppName();
                String id = lease.getHolder().getId();
                EXPIRED.increment();
                logger.warn("DS: Registry: expired lease for {}/{}", appName, id);
                internalCancel(appName, id, false);
            }
        }
    }
    
    public boolean renew(String appName, String id, boolean isReplication) {
        RENEW.increment(isReplication);
        Map<String, Lease<InstanceInfo>> gMap = registry.get(appName);
        Lease<InstanceInfo> leaseToRenew = null;
        if (gMap != null) {
            leaseToRenew = gMap.get(id);
        }
        if (leaseToRenew == null) {
            RENEW_NOT_FOUND.increment(isReplication);
            logger.warn("DS: Registry: lease doesn't exist, registering resource: {} - {}", appName, id);
            return false;
        } else {
            InstanceInfo instanceInfo = leaseToRenew.getHolder();
            if (instanceInfo != null) {
                // touchASGCache(instanceInfo.getASGName());
                InstanceStatus overriddenInstanceStatus = this.getOverriddenInstanceStatus(
                        instanceInfo, leaseToRenew, isReplication);
                if (overriddenInstanceStatus == InstanceStatus.UNKNOWN) {
                    logger.info("Instance status UNKNOWN possibly due to deleted override for instance {}"
                               + "; re-register required", instanceInfo.getId());
                    RENEW_NOT_FOUND.increment(isReplication);
                    return false;
                }
                if (!instanceInfo.getStatus().equals(overriddenInstanceStatus)) {
                    logger.info(
                            "The instance status {} is different from overridden instance status {} for instance {}. "
                                    + "Hence setting the status to overridden status", instanceInfo.getStatus().name(),
                                    overriddenInstanceStatus.name(),
                                    instanceInfo.getId());
                    instanceInfo.setStatus(overriddenInstanceStatus);
                }
            }
            renewsLastMin.increment();
            leaseToRenew.renew();
            return true;
        }
    }
}
```

### Peer Replication Implementation

#### Replication Strategy
```java
@Component
public class PeerAwareInstanceRegistryImpl extends AbstractInstanceRegistry {
    
    private final PeerEurekaNodes peerEurekaNodes;
    private final ReplicationClient replicationClient;
    
    @Override
    public void register(InstanceInfo instance, int leaseDuration, boolean isReplication) {
        try {
            read.lock();
            super.register(instance, leaseDuration, isReplication);
        } finally {
            read.unlock();
        }
        replicateToPeers(Action.Register, instance.getAppName(), instance.getId(), instance, null, isReplication);
    }
    
    @Override
    public boolean cancel(String appName, String id, boolean isReplication) {
        boolean result;
        try {
            read.lock();
            result = super.cancel(appName, id, isReplication);
        } finally {
            read.unlock();
        }
        replicateToPeers(Action.Cancel, appName, id, null, null, isReplication);
        return result;
    }
    
    private void replicateToPeers(Action action, String appName, String id,
                                 InstanceInfo instance, InstanceStatus newStatus,
                                 boolean isReplication) {
        Stopwatch tracer = action.getTimer().start();
        try {
            if (isReplication) {
                numberOfReplicationsLastMin.increment();
            }
            
            if (peerEurekaNodes == Collections.EMPTY_LIST || isReplication) {
                return;
            }
            
            for (final PeerEurekaNode node : peerEurekaNodes.getPeerEurekaNodes()) {
                if (peerEurekaNodes.isThisMyUrl(node.getServiceUrl())) {
                    continue;
                }
                replicateInstanceActionsToPeers(action, appName, id, instance, newStatus, node);
            }
        } finally {
            tracer.stop();
        }
    }
    
    private void replicateInstanceActionsToPeers(Action action, String appName,
                                               String id, InstanceInfo instance,
                                               InstanceStatus newStatus,
                                               PeerEurekaNode node) {
        try {
            InstanceInfo instanceCopy = instance;
            if (instanceCopy != null) {
                instanceCopy = new InstanceInfo(instance);
            }
            
            switch (action) {
                case Cancel:
                    node.cancel(appName, id);
                    break;
                case Heartbeat:
                    InstanceStatus overriddenStatus = overriddenInstanceStatusMap.get(id);
                    infoFromRegistry = getInstanceByAppAndId(appName, id, false);
                    node.heartbeat(appName, id, infoFromRegistry, overriddenStatus, false);
                    break;
                case Register:
                    node.register(instanceCopy);
                    break;
                case StatusUpdate:
                    node.statusUpdate(appName, id, newStatus, instanceCopy);
                    break;
                case DeleteStatusOverride:
                    node.deleteStatusOverride(appName, id, instanceCopy);
                    break;
            }
        } catch (Throwable t) {
            logger.error("Cannot replicate information to {} for action {}", node.getServiceUrl(), action, t);
        }
    }
}
```

### Self-Preservation Mode Implementation

```java
@Component
public class SelfPreservationModeManager {
    
    private final EurekaServerConfig serverConfig;
    private final MeasuredRate renewsLastMin;
    private volatile boolean isSelfPreservationModeEnabled;
    
    @Scheduled(fixedDelayString = "${eureka.server.renewal-threshold-update-interval-ms:900000}")
    public void updateRenewalThreshold() {
        try {
            Applications apps = eurekaClient.getApplications();
            int count = 0;
            for (Application app : apps.getRegisteredApplications()) {
                for (InstanceInfo instance : app.getInstances()) {
                    if (this.isRegisterable(instance)) {
                        ++count;
                    }
                }
            }
            synchronized (lock) {
                if ((count) > (serverConfig.getRenewalPercentThreshold() * numberOfRenewsPerMinThreshold)
                        || (!this.isSelfPreservationModeEnabled())) {
                    this.expectedNumberOfClientsSendingRenews = count;
                    updateRenewsPerMinThreshold();
                }
            }
            logger.info("Current renewal threshold is : {}", numberOfRenewsPerMinThreshold);
        } catch (Throwable e) {
            logger.error("Cannot update renewal threshold", e);
        }
    }
    
    public boolean isSelfPreservationModeEnabled() {
        return serverConfig.shouldEnableSelfPreservation() && isSelfPreservationModeEnabled;
    }
    
    public boolean isLeaseExpirationEnabled() {
        if (!isSelfPreservationModeEnabled()) {
            logger.debug("DS: lease expiration is currently disabled.");
            return false;
        }
        return numberOfRenewsPerMinThreshold > 0 && getNumOfRenewsInLastMin() > numberOfRenewsPerMinThreshold;
    }
    
    private void updateRenewsPerMinThreshold() {
        this.numberOfRenewsPerMinThreshold = (int) (this.expectedNumberOfClientsSendingRenews
                * (60.0 / serverConfig.getExpectedClientRenewalIntervalSeconds())
                * serverConfig.getRenewalPercentThreshold());
    }
    
    public int getNumOfRenewsInLastMin() {
        return renewsLastMin.getCount();
    }
    
    @EventListener
    public void handleSelfPreservationModeChange(SelfPreservationModeChangeEvent event) {
        this.isSelfPreservationModeEnabled = event.isEnabled();
        if (event.isEnabled()) {
            logger.warn("EMERGENCY! EUREKA MAY BE INCORRECTLY CLAIMING INSTANCES ARE UP "
                       + "WHEN THEY'RE NOT. RENEWALS ARE LESSER THAN THRESHOLD AND HENCE THE "
                       + "INSTANCES ARE NOT BEING EXPIRED JUST TO BE SAFE.");
        } else {
            logger.info("Self preservation mode is disabled. Instances will be expired.");
        }
    }
}
```

### Configuration Management Implementation

#### Dynamic Configuration
```java
@Configuration
@ConfigurationProperties(prefix = "eureka.server")
@RefreshScope
public class EurekaServerConfigBean implements EurekaServerConfig {
    
    private boolean enableSelfPreservation = true;
    private double renewalPercentThreshold = 0.85;
    private int renewalThresholdUpdateIntervalMs = 15 * 60 * 1000;
    private int peerEurekaNodesUpdateIntervalMs = 10 * 60 * 1000;
    private int numberOfReplicationRetries = 5;
    private int peerNodeConnectTimeoutMs = 200;
    private int peerNodeReadTimeoutMs = 200;
    private int peerNodeTotalConnections = 1000;
    private int peerNodeTotalConnectionsPerHost = 500;
    private int peerNodeConnectionIdleTimeoutSeconds = 30;
    private long retentionTimeInMSInDeltaQueue = 3 * 60 * 1000;
    private long deltaRetentionTimerIntervalInMs = 30 * 1000;
    private long evictionIntervalTimerInMs = 60 * 1000;
    private boolean useReadOnlyResponseCache = true;
    private int responseCacheAutoExpirationInSeconds = 180;
    private int responseCacheUpdateIntervalMs = 30 * 1000;
    private boolean disableDelta = false;
    private long maxIdleTimeInMinutesAgeInQueue = 30;
    private int batchSize = 500;
    private long waitTimeInMsWhenSyncEmpty = 5 * 60 * 1000;
    private int maxElementsInStatusReplicationPool = 10000;
    private int maxElementsInPeerReplicationPool = 10000;
    private int maxThreadsForStatusReplication = 1;
    private int maxThreadsForPeerReplication = 20;
    private int minThreadsForStatusReplication = 1;
    private int minThreadsForPeerReplication = 5;
    
    // Getters and setters for all properties
    
    @PostConstruct
    public void validateConfiguration() {
        if (renewalPercentThreshold < 0 || renewalPercentThreshold > 1) {
            throw new IllegalArgumentException("Renewal percent threshold must be between 0 and 1");
        }
        
        if (evictionIntervalTimerInMs < 1000) {
            throw new IllegalArgumentException("Eviction interval must be at least 1000ms");
        }
        
        if (peerNodeConnectTimeoutMs < 100) {
            throw new IllegalArgumentException("Peer node connect timeout must be at least 100ms");
        }
    }
}
```

### Security Implementation

#### Authentication Configuration
```java
@Configuration
@EnableWebSecurity
public class EurekaSecurityConfig extends WebSecurityConfigurerAdapter {
    
    @Value("${eureka.security.enabled:false}")
    private boolean securityEnabled;
    
    @Value("${eureka.security.username:admin}")
    private String username;
    
    @Value("${eureka.security.password:admin}")
    private String password;
    
    @Override
    protected void configure(HttpSecurity http) throws Exception {
        if (securityEnabled) {
            http.sessionManagement().sessionCreationPolicy(SessionCreationPolicy.NEVER)
                .and()
                .httpBasic()
                .and()
                .authorizeRequests()
                .antMatchers("/actuator/health", "/actuator/info").permitAll()
                .anyRequest().authenticated()
                .and()
                .csrf().disable();
        } else {
            http.csrf().disable()
                .authorizeRequests().anyRequest().permitAll();
        }
    }
    
    @Override
    protected void configure(AuthenticationManagerBuilder auth) throws Exception {
        if (securityEnabled) {
            auth.inMemoryAuthentication()
                .withUser(username)
                .password(passwordEncoder().encode(password))
                .roles("ADMIN");
        }
    }
    
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
```

#### IP Whitelist Filter
```java
@Component
@Order(1)
public class IpWhitelistFilter implements Filter {
    
    @Value("${eureka.security.ip-whitelist:}")
    private String[] allowedIps;
    
    @Value("${eureka.security.ip-whitelist.enabled:false}")
    private boolean ipWhitelistEnabled;
    
    @Override
    public void doFilter(ServletRequest request, ServletResponse response, 
                        FilterChain chain) throws IOException, ServletException {
        
        if (!ipWhitelistEnabled) {
            chain.doFilter(request, response);
            return;
        }
        
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;
        
        String clientIp = getClientIpAddress(httpRequest);
        
        if (!isIpAllowed(clientIp)) {
            logger.warn("Access denied for IP: {}", clientIp);
            httpResponse.setStatus(HttpStatus.FORBIDDEN.value());
            httpResponse.getWriter().write("Access denied");
            return;
        }
        
        chain.doFilter(request, response);
    }
    
    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        
        return request.getRemoteAddr();
    }
    
    private boolean isIpAllowed(String clientIp) {
        if (allowedIps == null || allowedIps.length == 0) {
            return true; // If no whitelist configured, allow all
        }
        
        for (String allowedIp : allowedIps) {
            if (allowedIp.equals(clientIp) || isIpInRange(clientIp, allowedIp)) {
                return true;
            }
        }
        return false;
    }
    
    private boolean isIpInRange(String clientIp, String allowedRange) {
        try {
            if (allowedRange.contains("/")) {
                // CIDR notation
                SubnetUtils subnet = new SubnetUtils(allowedRange);
                return subnet.getInfo().isInRange(clientIp);
            }
        } catch (Exception e) {
            logger.error("Error checking IP range: {}", allowedRange, e);
        }
        return false;
    }
}
```

### Monitoring and Metrics Implementation

#### Custom Metrics
```java
@Component
public class EurekaMetrics {
    
    private final MeterRegistry meterRegistry;
    private final Counter registrationCounter;
    private final Counter deregistrationCounter;
    private final Counter heartbeatCounter;
    private final Gauge instancesGauge;
    private final Timer replicationTimer;
    
    public EurekaMetrics(MeterRegistry meterRegistry, AbstractInstanceRegistry registry) {
        this.meterRegistry = meterRegistry;
        
        this.registrationCounter = Counter.builder("eureka.registrations")
            .description("Number of service registrations")
            .register(meterRegistry);
            
        this.deregistrationCounter = Counter.builder("eureka.deregistrations")
            .description("Number of service deregistrations")
            .register(meterRegistry);
            
        this.heartbeatCounter = Counter.builder("eureka.heartbeats")
            .description("Number of heartbeats received")
            .register(meterRegistry);
            
        this.instancesGauge = Gauge.builder("eureka.instances.total")
            .description("Total number of registered instances")
            .register(meterRegistry, registry, this::getTotalInstances);
            
        this.replicationTimer = Timer.builder("eureka.replication.duration")
            .description("Time taken for peer replication")
            .register(meterRegistry);
    }
    
    public void incrementRegistrations() {
        registrationCounter.increment();
    }
    
    public void incrementDeregistrations() {
        deregistrationCounter.increment();
    }
    
    public void incrementHeartbeats() {
        heartbeatCounter.increment();
    }
    
    public Timer.Sample startReplicationTimer() {
        return Timer.start(meterRegistry);
    }
    
    private double getTotalInstances(AbstractInstanceRegistry registry) {
        return registry.getNumOfRenewsInLastMin();
    }
}
```

#### Health Check Endpoint
```java
@Component
public class EurekaHealthIndicator implements HealthIndicator {
    
    private final PeerEurekaNodes peerEurekaNodes;
    private final AbstractInstanceRegistry registry;
    private final EurekaServerConfig serverConfig;
    
    @Override
    public Health health() {
        Health.Builder builder = new Health.Builder();
        
        try {
            // Check if this instance is up
            builder.up();
            
            // Add basic info
            builder.withDetail("status", "UP");
            builder.withDetail("registered-instances", registry.getNumOfRenewsInLastMin());
            builder.withDetail("self-preservation-mode", 
                             serverConfig.shouldEnableSelfPreservation());
            
            // Check peer connectivity
            Map<String, String> peerStatus = new HashMap<>();
            for (PeerEurekaNode peer : peerEurekaNodes.getPeerEurekaNodes()) {
                try {
                    // Simple connectivity check
                    boolean isReachable = checkPeerConnectivity(peer);
                    peerStatus.put(peer.getServiceUrl(), isReachable ? "UP" : "DOWN");
                } catch (Exception e) {
                    peerStatus.put(peer.getServiceUrl(), "ERROR: " + e.getMessage());
                }
            }
            builder.withDetail("peers", peerStatus);
            
            // Check registry health
            long lastRenewalTime = getLastRenewalTime();
            long timeSinceLastRenewal = System.currentTimeMillis() - lastRenewalTime;
            
            if (timeSinceLastRenewal > 300000) { // 5 minutes
                builder.withDetail("warning", "No renewals received in last 5 minutes");
            }
            
            builder.withDetail("last-renewal", new Date(lastRenewalTime));
            
        } catch (Exception e) {
            builder.down().withException(e);
        }
        
        return builder.build();
    }
    
    private boolean checkPeerConnectivity(PeerEurekaNode peer) {
        // Implementation to check peer connectivity
        return true; // Simplified for example
    }
    
    private long getLastRenewalTime() {
        // Implementation to get last renewal time
        return System.currentTimeMillis(); // Simplified for example
    }
}
```

### Data Persistence Implementation

#### Registry Backup Manager
```java
@Component
public class RegistryBackupManager {
    
    private final ObjectMapper objectMapper;
    private final EurekaServerConfig serverConfig;
    private final AbstractInstanceRegistry registry;
    
    @Value("${eureka.server.backup.enabled:true}")
    private boolean backupEnabled;
    
    @Value("${eureka.server.backup.directory:/var/eureka/backup}")
    private String backupDirectory;
    
    @Value("${eureka.server.backup.retention-days:7}")
    private int retentionDays;
    
    @Scheduled(fixedDelayString = "${eureka.server.backup.interval-ms:300000}") // 5 minutes
    public void backupRegistry() {
        if (!backupEnabled) {
            return;
        }
        
        try {
            Applications applications = registry.getApplications();
            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss"));
            String filename = String.format("eureka-registry-%s.json", timestamp);
            Path backupPath = Paths.get(backupDirectory, filename);
            
            // Ensure backup directory exists
            Files.createDirectories(backupPath.getParent());
            
            // Write registry data to file
            objectMapper.writeValue(backupPath.toFile(), applications);
            
            logger.info("Registry backup created: {}", backupPath);
            
            // Clean up old backups
            cleanupOldBackups();
            
        } catch (Exception e) {
            logger.error("Failed to backup registry", e);
        }
    }
    
    public boolean restoreRegistry() {
        if (!backupEnabled) {
            return false;
        }
        
        try {
            Path backupDir = Paths.get(backupDirectory);
            if (!Files.exists(backupDir)) {
                logger.warn("Backup directory does not exist: {}", backupDirectory);
                return false;
            }
            
            // Find the most recent backup file
            Optional<Path> latestBackup = Files.list(backupDir)
                .filter(path -> path.getFileName().toString().startsWith("eureka-registry-"))
                .filter(path -> path.getFileName().toString().endsWith(".json"))
                .max(Comparator.comparing(path -> path.getFileName().toString()));
            
            if (!latestBackup.isPresent()) {
                logger.warn("No backup files found in: {}", backupDirectory);
                return false;
            }
            
            Applications applications = objectMapper.readValue(
                latestBackup.get().toFile(), Applications.class);
            
            // Restore applications to registry
            for (Application application : applications.getRegisteredApplications()) {
                for (InstanceInfo instance : application.getInstances()) {
                    registry.register(instance, 
                                    instance.getLeaseInfo().getDurationInSecs(), 
                                    false);
                }
            }
            
            logger.info("Registry restored from backup: {}", latestBackup.get());
            return true;
            
        } catch (Exception e) {
            logger.error("Failed to restore registry from backup", e);
            return false;
        }
    }
    
    private void cleanupOldBackups() {
        try {
            Path backupDir = Paths.get(backupDirectory);
            LocalDateTime cutoffDate = LocalDateTime.now().minusDays(retentionDays);
            
            Files.list(backupDir)
                .filter(path -> path.getFileName().toString().startsWith("eureka-registry-"))
                .filter(path -> {
                    try {
                        BasicFileAttributes attrs = Files.readAttributes(path, BasicFileAttributes.class);
                        LocalDateTime fileTime = LocalDateTime.ofInstant(
                            attrs.creationTime().toInstant(), ZoneId.systemDefault());
                        return fileTime.isBefore(cutoffDate);
                    } catch (IOException e) {
                        logger.warn("Could not read file attributes for: {}", path);
                        return false;
                    }
                })
                .forEach(path -> {
                    try {
                        Files.delete(path);
                        logger.debug("Deleted old backup file: {}", path);
                    } catch (IOException e) {
                        logger.warn("Could not delete old backup file: {}", path, e);
                    }
                });
                
        } catch (Exception e) {
            logger.error("Error during backup cleanup", e);
        }
    }
}
```
## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Based on the prework analysis, I identified several areas where properties can be consolidated to eliminate redundancy:

**Property Reflection:**
- Properties 1.1 and 1.4 can be combined into a comprehensive registration property that covers both local storage and peer replication
- Properties 3.2 and 3.5 both deal with heartbeat timeout behavior and can be combined
- Properties 4.1, 4.4, and 4.5 all relate to peer replication and can be consolidated
- Properties 5.1 and 5.5 are complementary (entering/exiting self-preservation) and can be combined
- Properties 6.1, 6.3, and 6.5 all relate to metadata handling and can be consolidated
- Properties 7.2, 7.3, and 7.5 all relate to security enforcement and can be combined
- Properties 8.2, 8.3, and 8.5 all relate to metrics tracking and can be consolidated
- Properties 9.2, 9.3, and 9.5 all relate to configuration handling and can be combined
- Properties 10.1, 10.4, and 10.5 all relate to backup management and can be consolidated

### Property 1: Service Registration Round Trip

*For any* valid service instance, registering it with any Eureka server should result in the instance being stored in the local registry and replicated to all peer servers, with successful registration returning HTTP 204.

**Validates: Requirements 1.1, 1.3, 1.4**

### Property 2: Registration Validation

*For any* registration request, the Eureka server should accept valid instance data and reject invalid data with HTTP 400 and detailed error messages.

**Validates: Requirements 1.2, 1.5**

### Property 3: Service Discovery Filtering

*For any* service discovery request, the Eureka server should return only healthy instances that match the specified filtering criteria (status, zone, etc.).

**Validates: Requirements 2.1, 2.4**

### Property 4: Service Discovery Metadata Completeness

*For any* service instance returned by discovery, all required metadata (IP, port, health check URL, custom metadata) should be included in the response.

**Validates: Requirements 2.5, 6.1, 6.3**

### Property 5: Delta Changes Consistency

*For any* registry changes, the delta endpoint should return only the changes that occurred since the last request, maintaining consistency with the full registry.

**Validates: Requirements 2.3**

### Property 6: Heartbeat Timeout Handling

*For any* service instance that stops sending heartbeats, the Eureka server should mark it as DOWN after 90 seconds and automatically remove it from the registry.

**Validates: Requirements 3.2, 3.5**

### Property 7: Health Check Status Updates

*For any* service instance with configured health checks, failed health checks should result in the instance status being updated to OUT_OF_SERVICE.

**Validates: Requirements 3.3, 3.4**

### Property 8: Peer Replication Consistency

*For any* registry change on one Eureka server, the change should be replicated to all peer servers, with retry logic handling temporary failures and preventing infinite loops.

**Validates: Requirements 4.1, 4.2, 4.3, 4.5**

### Property 9: Startup Synchronization

*For any* Eureka server starting up, it should sync its registry with peer servers to obtain the latest state before accepting client requests.

**Validates: Requirements 4.4**

### Property 10: Self-Preservation Mode Transitions

*For any* Eureka server, when heartbeat renewal rates drop below 85% threshold, it should enter self-preservation mode and log warnings; when rates return to normal, it should exit the mode.

**Validates: Requirements 5.1, 5.3, 5.5**

### Property 11: Self-Preservation Behavior

*For any* Eureka server in self-preservation mode, it should not evict instances due to missed heartbeats but should continue accepting new registrations.

**Validates: Requirements 5.2, 5.4**

### Property 12: Zone-Aware Load Balancing

*For any* service discovery request with zone filtering, instances should be grouped by availability zone and maintain consistent ordering across requests.

**Validates: Requirements 6.2, 6.4, 6.5**

### Property 13: Security Enforcement

*For any* Eureka server with security enabled, it should validate SSL certificates for peer communication, enforce IP whitelists for registrations, and reject unauthenticated requests with HTTP 401.

**Validates: Requirements 7.2, 7.3, 7.5**

### Property 14: Authentication Failure Logging

*For any* authentication failure, the Eureka server should log the failure with sufficient detail for security monitoring.

**Validates: Requirements 7.4**

### Property 15: Metrics Tracking Accuracy

*For any* Eureka server operation, relevant metrics (instance counts, replication success/failure rates, performance metrics) should be accurately tracked and exposed.

**Validates: Requirements 8.2, 8.3, 8.5**

### Property 16: Dynamic Configuration Reload

*For any* configuration change, the Eureka server should be able to reload the configuration without restart while maintaining service availability.

**Validates: Requirements 9.1**

### Property 17: Configuration Validation and Defaults

*For any* Eureka server startup, invalid configuration should be detected and logged with errors, while missing configuration should use appropriate default values.

**Validates: Requirements 9.2, 9.3, 9.5**

### Property 18: Environment Profile Support

*For any* environment-specific configuration profile, the Eureka server should load the correct configuration based on the active profile.

**Validates: Requirements 9.4**

### Property 19: Registry Backup and Recovery

*For any* Eureka server, registry data should be periodically backed up to disk, and on startup, the server should restore from backup if available and then sync with peers.

**Validates: Requirements 10.1, 10.2, 10.3**

### Property 20: Backup Management

*For any* backup operation, the Eureka server should handle corrupted backup files gracefully and maintain retention policies to manage disk space.

**Validates: Requirements 10.4, 10.5**

## Error Handling

### Error Categories

#### 1. Client Errors (4xx)
- **400 Bad Request**: Invalid registration data, malformed JSON, missing required fields
- **401 Unauthorized**: Authentication required but not provided or invalid credentials
- **403 Forbidden**: IP not in whitelist, insufficient permissions
- **404 Not Found**: Service or instance not found in registry
- **409 Conflict**: Instance ID already exists with different metadata

#### 2. Server Errors (5xx)
- **500 Internal Server Error**: Unexpected server errors, database failures
- **503 Service Unavailable**: Server in maintenance mode or overloaded
- **504 Gateway Timeout**: Peer replication timeout

### Error Response Format
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Invalid instance data",
  "details": {
    "field": "ipAddr",
    "reason": "Invalid IP address format",
    "provided": "invalid-ip",
    "expected": "Valid IPv4 address"
  },
  "path": "/eureka/apps/USER-SERVICE"
}
```

### Error Handling Strategies

#### Registration Errors
```java
@ExceptionHandler(RegistrationValidationException.class)
public ResponseEntity<ErrorResponse> handleRegistrationValidation(
    RegistrationValidationException ex) {
    
    ErrorResponse error = ErrorResponse.builder()
        .timestamp(Instant.now())
        .status(HttpStatus.BAD_REQUEST.value())
        .error("Registration Validation Failed")
        .message(ex.getMessage())
        .details(ex.getValidationErrors())
        .path(getCurrentPath())
        .build();
        
    logger.warn("Registration validation failed: {}", ex.getMessage());
    return ResponseEntity.badRequest().body(error);
}
```

#### Peer Replication Errors
```java
@Component
public class ReplicationErrorHandler {
    
    private final RetryTemplate retryTemplate;
    
    public void handleReplicationError(PeerEurekaNode peer, Exception error) {
        if (error instanceof ConnectException) {
            // Peer is down, mark as unavailable and schedule retry
            peer.markAsUnavailable();
            scheduleRetry(peer);
        } else if (error instanceof SocketTimeoutException) {
            // Timeout, retry with exponential backoff
            retryWithBackoff(peer);
        } else {
            // Other errors, log and continue
            logger.error("Replication error to peer {}: {}", 
                        peer.getServiceUrl(), error.getMessage());
        }
    }
    
    private void scheduleRetry(PeerEurekaNode peer) {
        retryTemplate.execute(context -> {
            peer.heartbeat("HEARTBEAT", "test", null, null, false);
            peer.markAsAvailable();
            return null;
        });
    }
}
```

#### Self-Preservation Error Handling
```java
@Component
public class SelfPreservationErrorHandler {
    
    public void handleLowRenewalRate(double currentRate, double threshold) {
        if (currentRate < threshold) {
            logger.warn("EMERGENCY! EUREKA MAY BE INCORRECTLY CLAIMING INSTANCES ARE UP " +
                       "WHEN THEY'RE NOT. RENEWALS ARE LESSER THAN THRESHOLD ({} < {}) " +
                       "AND HENCE THE INSTANCES ARE NOT BEING EXPIRED JUST TO BE SAFE.",
                       currentRate, threshold);
            
            // Send alert to monitoring system
            alertingService.sendAlert(AlertLevel.CRITICAL, 
                "Eureka entered self-preservation mode", 
                Map.of("currentRate", currentRate, "threshold", threshold));
        }
    }
}
```

## Testing Strategy

### Dual Testing Approach

The testing strategy employs both unit testing and property-based testing to ensure comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, and error conditions
- **Property tests**: Verify universal properties across all inputs
- Together they provide comprehensive coverage where unit tests catch concrete bugs and property tests verify general correctness

### Property-Based Testing Configuration

We will use **QuickCheck for Java (junit-quickcheck)** as our property-based testing library. Each property test will:

- Run a minimum of 100 iterations per test
- Use randomized input generation
- Reference the corresponding design document property
- Tag format: **Feature: eureka-system-functions, Property {number}: {property_text}**

### Test Implementation Examples

#### Property Test Example
```java
@RunWith(JUnitQuickCheck.class)
public class ServiceRegistrationPropertyTest {
    
    @Property(trials = 100)
    public void serviceRegistrationRoundTrip(
        @From(InstanceInfoGenerator.class) InstanceInfo instance) {
        
        // Feature: eureka-system-functions, Property 1: Service Registration Round Trip
        
        // Register instance
        ResponseEntity<Void> response = eurekaServer.register(instance);
        
        // Verify local storage
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        assertThat(registry.getInstance(instance.getAppName(), instance.getId()))
            .isNotNull()
            .isEqualTo(instance);
            
        // Verify peer replication
        for (PeerEurekaNode peer : peers) {
            assertThat(peer.getRegistry().getInstance(instance.getAppName(), instance.getId()))
                .isNotNull()
                .isEqualTo(instance);
        }
    }
    
    @Property(trials = 100)
    public void registrationValidation(
        @From(InvalidInstanceGenerator.class) InstanceInfo invalidInstance) {
        
        // Feature: eureka-system-functions, Property 2: Registration Validation
        
        ResponseEntity<ErrorResponse> response = eurekaServer.register(invalidInstance);
        
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody().getMessage()).isNotEmpty();
        assertThat(response.getBody().getDetails()).isNotEmpty();
    }
}
```

#### Unit Test Example
```java
@SpringBootTest
@TestPropertySource(properties = {
    "eureka.server.enable-self-preservation=true",
    "eureka.server.renewal-percent-threshold=0.85"
})
public class EurekaServerIntegrationTest {
    
    @Test
    public void shouldProvideHealthEndpoint() {
        // Test specific endpoint availability
        ResponseEntity<Map> response = restTemplate.getForEntity(
            "/actuator/health", Map.class);
            
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).containsKey("status");
    }
    
    @Test
    public void shouldSupportBasicAuthentication() {
        // Test authentication when enabled
        restTemplate.getRestTemplate().getInterceptors().add(
            new BasicAuthenticationInterceptor("admin", "admin"));
            
        ResponseEntity<String> response = restTemplate.getForEntity(
            "/eureka/apps", String.class);
            
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }
    
    @Test
    public void shouldHandleCorruptedBackupFiles() {
        // Test edge case for corrupted backup
        Path backupFile = createCorruptedBackupFile();
        
        boolean restored = backupManager.restoreRegistry();
        
        assertThat(restored).isFalse();
        assertThat(logCaptor.getLogs()).contains("Failed to restore registry from backup");
    }
}
```

#### Test Data Generators
```java
public class InstanceInfoGenerator extends Generator<InstanceInfo> {
    
    @Override
    public InstanceInfo generate(SourceOfRandomness random, GenerationStatus status) {
        return InstanceInfo.Builder.newBuilder()
            .setAppName(generateAppName(random))
            .setInstanceId(generateInstanceId(random))
            .setIPAddr(generateValidIpAddress(random))
            .setPort(random.nextInt(1024, 65535))
            .setSecurePort(random.nextInt(1024, 65535))
            .setStatus(generateInstanceStatus(random))
            .setMetadata(generateMetadata(random))
            .build();
    }
    
    private String generateValidIpAddress(SourceOfRandomness random) {
        return String.format("%d.%d.%d.%d",
            random.nextInt(1, 255),
            random.nextInt(0, 255),
            random.nextInt(0, 255),
            random.nextInt(1, 255));
    }
}

public class InvalidInstanceGenerator extends Generator<InstanceInfo> {
    
    @Override
    public InstanceInfo generate(SourceOfRandomness random, GenerationStatus status) {
        // Generate intentionally invalid instances for validation testing
        return InstanceInfo.Builder.newBuilder()
            .setAppName(random.nextBoolean() ? null : "")  // Invalid app name
            .setInstanceId(random.nextBoolean() ? null : "")  // Invalid instance ID
            .setIPAddr(generateInvalidIpAddress(random))  // Invalid IP
            .setPort(random.nextInt(-1000, 0))  // Invalid port
            .build();
    }
}
```

### Test Coverage Requirements

- **Unit Test Coverage**: Minimum 80% line coverage
- **Property Test Coverage**: All 20 correctness properties must have corresponding property tests
- **Integration Test Coverage**: End-to-end scenarios covering all major workflows
- **Performance Test Coverage**: Load testing for high-throughput scenarios
- **Security Test Coverage**: Authentication, authorization, and security vulnerability testing

### Continuous Integration

```yaml
# .github/workflows/test.yml
name: Eureka System Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      eureka-1:
        image: eureka-server:latest
        ports:
          - 8761:8761
      eureka-2:
        image: eureka-server:latest
        ports:
          - 8762:8762
      eureka-3:
        image: eureka-server:latest
        ports:
          - 8763:8763
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Set up JDK 11
        uses: actions/setup-java@v2
        with:
          java-version: '11'
          
      - name: Run Unit Tests
        run: ./gradlew test
        
      - name: Run Property Tests
        run: ./gradlew propertyTest
        
      - name: Run Integration Tests
        run: ./gradlew integrationTest
        
      - name: Generate Coverage Report
        run: ./gradlew jacocoTestReport
        
      - name: Upload Coverage
        uses: codecov/codecov-action@v1
```
## Configuration Examples

### Complete Eureka Server Configuration

#### application.yml (Eureka Server 1)
```yaml
server:
  port: 8761

spring:
  application:
    name: eureka-server
  profiles:
    active: peer1
  security:
    user:
      name: admin
      password: ${EUREKA_PASSWORD:admin123}

eureka:
  instance:
    hostname: eureka-server-1
    prefer-ip-address: true
    ip-address: 10.0.2.11
    non-secure-port: 8761
    secure-port: 8443
    lease-renewal-interval-in-seconds: 30
    lease-expiration-duration-in-seconds: 90
    instance-id: ${spring.application.name}:${server.port}
    metadata-map:
      zone: us-east-1a
      cluster-id: eureka-cluster-1
      
  server:
    enable-self-preservation: true
    eviction-interval-timer-in-ms: 60000
    renewal-percent-threshold: 0.85
    renewal-threshold-update-interval-ms: 900000
    peer-eureka-nodes-update-interval-ms: 600000
    number-of-replication-retries: 5
    peer-node-connect-timeout-ms: 200
    peer-node-read-timeout-ms: 200
    peer-node-total-connections: 1000
    peer-node-total-connections-per-host: 500
    peer-node-connection-idle-timeout-seconds: 30
    retention-time-in-m-s-in-delta-queue: 180000
    delta-retention-timer-interval-in-ms: 30000
    use-read-only-response-cache: true
    response-cache-auto-expiration-in-seconds: 180
    response-cache-update-interval-ms: 30000
    disable-delta: false
    max-idle-time-in-minutes-age-in-queue: 30
    batch-size: 500
    wait-time-in-ms-when-sync-empty: 300000
    max-elements-in-status-replication-pool: 10000
    max-elements-in-peer-replication-pool: 10000
    max-threads-for-status-replication: 1
    max-threads-for-peer-replication: 20
    min-threads-for-status-replication: 1
    min-threads-for-peer-replication: 5
    
  client:
    register-with-eureka: true
    fetch-registry: true
    registry-fetch-interval-seconds: 30
    instance-info-replication-interval-seconds: 30
    initial-instance-info-replication-interval-seconds: 40
    eureka-service-url-poll-interval-seconds: 300
    eureka-server-read-timeout-seconds: 8
    eureka-server-connect-timeout-seconds: 5
    eureka-server-total-connections: 200
    eureka-server-total-connections-per-host: 50
    eureka-connection-idle-timeout-seconds: 30
    service-url:
      defaultZone: http://admin:${EUREKA_PASSWORD:admin123}@eureka-server-2:8762/eureka/,http://admin:${EUREKA_PASSWORD:admin123}@eureka-server-3:8763/eureka/

# Security Configuration
security:
  enabled: true
  ip-whitelist:
    enabled: true
    allowed-ips:
      - 10.0.0.0/8
      - 172.16.0.0/12
      - 192.168.0.0/16

# Backup Configuration
backup:
  enabled: true
  directory: /var/eureka/backup
  interval-ms: 300000
  retention-days: 7

# Monitoring Configuration
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
  endpoint:
    health:
      show-details: always
  metrics:
    export:
      prometheus:
        enabled: true

# Logging Configuration
logging:
  level:
    com.netflix.eureka: INFO
    com.netflix.discovery: INFO
    org.springframework.cloud.netflix.eureka: INFO
  pattern:
    console: "%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n"
    file: "%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n"
  file:
    name: /var/log/eureka/eureka-server.log
    max-size: 100MB
    max-history: 30
```

#### application-peer2.yml (Eureka Server 2)
```yaml
server:
  port: 8762

eureka:
  instance:
    hostname: eureka-server-2
    ip-address: 10.0.2.12
    non-secure-port: 8762
    instance-id: ${spring.application.name}:${server.port}
    
  client:
    service-url:
      defaultZone: http://admin:${EUREKA_PASSWORD:admin123}@eureka-server-1:8761/eureka/,http://admin:${EUREKA_PASSWORD:admin123}@eureka-server-3:8763/eureka/
```

#### application-peer3.yml (Eureka Server 3)
```yaml
server:
  port: 8763

eureka:
  instance:
    hostname: eureka-server-3
    ip-address: 10.0.2.13
    non-secure-port: 8763
    instance-id: ${spring.application.name}:${server.port}
    
  client:
    service-url:
      defaultZone: http://admin:${EUREKA_PASSWORD:admin123}@eureka-server-1:8761/eureka/,http://admin:${EUREKA_PASSWORD:admin123}@eureka-server-2:8762/eureka/
```

### Docker Configuration

#### Dockerfile
```dockerfile
FROM openjdk:11-jre-slim

LABEL maintainer="DevOps Team <devops@company.com>"
LABEL version="1.0.0"
LABEL description="Eureka Server for Service Discovery"

# Create eureka user
RUN groupadd -r eureka && useradd -r -g eureka eureka

# Create directories
RUN mkdir -p /app /var/eureka/backup /var/log/eureka && \
    chown -R eureka:eureka /app /var/eureka /var/log/eureka

# Copy application
COPY target/eureka-server-*.jar /app/eureka-server.jar
COPY docker/entrypoint.sh /app/entrypoint.sh

RUN chmod +x /app/entrypoint.sh && \
    chown eureka:eureka /app/eureka-server.jar /app/entrypoint.sh

# Switch to eureka user
USER eureka

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8761/actuator/health || exit 1

# Expose ports
EXPOSE 8761 8762 8763

# Set working directory
WORKDIR /app

# Entry point
ENTRYPOINT ["./entrypoint.sh"]
```

#### docker-compose.yml
```yaml
version: '3.8'

services:
  eureka-server-1:
    build: .
    container_name: eureka-server-1
    hostname: eureka-server-1
    ports:
      - "8761:8761"
    environment:
      - SPRING_PROFILES_ACTIVE=peer1
      - EUREKA_PASSWORD=secure123
      - JAVA_OPTS=-Xmx2g -Xms1g
    volumes:
      - eureka1-backup:/var/eureka/backup
      - eureka1-logs:/var/log/eureka
    networks:
      - eureka-network
    restart: unless-stopped
    depends_on:
      - eureka-server-2
      - eureka-server-3
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8761/actuator/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s

  eureka-server-2:
    build: .
    container_name: eureka-server-2
    hostname: eureka-server-2
    ports:
      - "8762:8762"
    environment:
      - SPRING_PROFILES_ACTIVE=peer2
      - EUREKA_PASSWORD=secure123
      - JAVA_OPTS=-Xmx2g -Xms1g
    volumes:
      - eureka2-backup:/var/eureka/backup
      - eureka2-logs:/var/log/eureka
    networks:
      - eureka-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8762/actuator/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s

  eureka-server-3:
    build: .
    container_name: eureka-server-3
    hostname: eureka-server-3
    ports:
      - "8763:8763"
    environment:
      - SPRING_PROFILES_ACTIVE=peer3
      - EUREKA_PASSWORD=secure123
      - JAVA_OPTS=-Xmx2g -Xms1g
    volumes:
      - eureka3-backup:/var/eureka/backup
      - eureka3-logs:/var/log/eureka
    networks:
      - eureka-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8763/actuator/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s

  haproxy:
    image: haproxy:2.4
    container_name: eureka-loadbalancer
    ports:
      - "8760:8760"
      - "8404:8404"  # HAProxy stats
    volumes:
      - ./haproxy/haproxy.cfg:/usr/local/etc/haproxy/haproxy.cfg:ro
    networks:
      - eureka-network
    restart: unless-stopped
    depends_on:
      - eureka-server-1
      - eureka-server-2
      - eureka-server-3

volumes:
  eureka1-backup:
  eureka1-logs:
  eureka2-backup:
  eureka2-logs:
  eureka3-backup:
  eureka3-logs:

networks:
  eureka-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
```

### Kubernetes Configuration

#### eureka-configmap.yaml
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: eureka-config
  namespace: eureka-system
data:
  application.yml: |
    server:
      port: 8761
    spring:
      application:
        name: eureka-server
    eureka:
      server:
        enable-self-preservation: true
        eviction-interval-timer-in-ms: 60000
        renewal-percent-threshold: 0.85
      instance:
        prefer-ip-address: true
        lease-renewal-interval-in-seconds: 30
        lease-expiration-duration-in-seconds: 90
      client:
        register-with-eureka: true
        fetch-registry: true
        service-url:
          defaultZone: http://eureka-server-1:8761/eureka/,http://eureka-server-2:8762/eureka/,http://eureka-server-3:8763/eureka/
    management:
      endpoints:
        web:
          exposure:
            include: health,info,metrics
```

#### eureka-deployment.yaml
```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: eureka-server
  namespace: eureka-system
spec:
  serviceName: eureka-server
  replicas: 3
  selector:
    matchLabels:
      app: eureka-server
  template:
    metadata:
      labels:
        app: eureka-server
    spec:
      containers:
      - name: eureka-server
        image: eureka-server:1.0.0
        ports:
        - containerPort: 8761
          name: http
        env:
        - name: SPRING_PROFILES_ACTIVE
          value: "kubernetes"
        - name: EUREKA_INSTANCE_HOSTNAME
          valueFrom:
            fieldRef:
              fieldPath: metadata.name
        - name: EUREKA_PASSWORD
          valueFrom:
            secretKeyRef:
              name: eureka-secret
              key: password
        volumeMounts:
        - name: config-volume
          mountPath: /app/config
        - name: backup-volume
          mountPath: /var/eureka/backup
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /actuator/health
            port: 8761
          initialDelaySeconds: 60
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /actuator/health
            port: 8761
          initialDelaySeconds: 30
          periodSeconds: 10
      volumes:
      - name: config-volume
        configMap:
          name: eureka-config
  volumeClaimTemplates:
  - metadata:
      name: backup-volume
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 20Gi
```

#### eureka-service.yaml
```yaml
apiVersion: v1
kind: Service
metadata:
  name: eureka-server
  namespace: eureka-system
spec:
  selector:
    app: eureka-server
  ports:
  - name: http
    port: 8761
    targetPort: 8761
  clusterIP: None  # Headless service for StatefulSet

---
apiVersion: v1
kind: Service
metadata:
  name: eureka-loadbalancer
  namespace: eureka-system
spec:
  selector:
    app: eureka-server
  ports:
  - name: http
    port: 8760
    targetPort: 8761
  type: LoadBalancer
```

### HAProxy Configuration

#### haproxy.cfg
```
global
    daemon
    log stdout local0
    chroot /var/lib/haproxy
    stats socket /run/haproxy/admin.sock mode 660 level admin
    stats timeout 30s
    user haproxy
    group haproxy

defaults
    mode http
    log global
    option httplog
    option dontlognull
    option log-health-checks
    option forwardfor
    option http-server-close
    timeout connect 5000
    timeout client 50000
    timeout server 50000
    errorfile 400 /etc/haproxy/errors/400.http
    errorfile 403 /etc/haproxy/errors/403.http
    errorfile 408 /etc/haproxy/errors/408.http
    errorfile 500 /etc/haproxy/errors/500.http
    errorfile 502 /etc/haproxy/errors/502.http
    errorfile 503 /etc/haproxy/errors/503.http
    errorfile 504 /etc/haproxy/errors/504.http

frontend eureka_frontend
    bind *:8760
    default_backend eureka_servers

backend eureka_servers
    balance roundrobin
    option httpchk GET /actuator/health
    http-check expect status 200
    server eureka1 eureka-server-1:8761 check inter 30s fall 3 rise 2
    server eureka2 eureka-server-2:8762 check inter 30s fall 3 rise 2
    server eureka3 eureka-server-3:8763 check inter 30s fall 3 rise 2

frontend stats
    bind *:8404
    stats enable
    stats uri /stats
    stats refresh 30s
    stats admin if TRUE
```

### Client Configuration Example

#### Microservice Client Configuration
```yaml
# application.yml for microservice
spring:
  application:
    name: user-service

eureka:
  client:
    service-url:
      defaultZone: http://admin:secure123@eureka-loadbalancer:8760/eureka/
    register-with-eureka: true
    fetch-registry: true
    registry-fetch-interval-seconds: 30
    instance-info-replication-interval-seconds: 30
    
  instance:
    prefer-ip-address: true
    lease-renewal-interval-in-seconds: 30
    lease-expiration-duration-in-seconds: 90
    health-check-url-path: /actuator/health
    status-page-url-path: /actuator/info
    home-page-url-path: /
    metadata-map:
      zone: us-east-1a
      version: 1.0.0
      weight: 100
      management.port: ${management.server.port:8081}
```

### Monitoring and Alerting Configuration

#### Prometheus Configuration
```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'eureka-servers'
    static_configs:
      - targets: ['eureka-server-1:8761', 'eureka-server-2:8762', 'eureka-server-3:8763']
    metrics_path: /actuator/prometheus
    scrape_interval: 30s
    
  - job_name: 'haproxy'
    static_configs:
      - targets: ['haproxy:8404']
    metrics_path: /stats/prometheus
```

#### Grafana Dashboard Configuration
```json
{
  "dashboard": {
    "title": "Eureka Cluster Monitoring",
    "panels": [
      {
        "title": "Registered Instances",
        "type": "stat",
        "targets": [
          {
            "expr": "sum(eureka_instances_total)",
            "legendFormat": "Total Instances"
          }
        ]
      },
      {
        "title": "Heartbeat Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(eureka_heartbeats_total[5m])",
            "legendFormat": "Heartbeats/sec"
          }
        ]
      },
      {
        "title": "Self-Preservation Mode",
        "type": "stat",
        "targets": [
          {
            "expr": "eureka_self_preservation_mode",
            "legendFormat": "Self-Preservation"
          }
        ]
      }
    ]
  }
}
```

This comprehensive technical design provides all the necessary implementation details, configuration examples, and deployment specifications for the Eureka system functions. The design addresses all 10 requirements with detailed code examples, configuration files, and operational procedures.