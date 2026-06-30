package com.hrservice.eureka.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.hrservice.eureka.Domain.model.InstanceInfo;
import com.hrservice.eureka.Domain.model.ServiceInstance;

import jakarta.annotation.PostConstruct;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * Enhanced Registry Service with advanced features.
 * 
 * This service provides a simplified but powerful registry implementation
 * with automatic lease management, eviction, and health monitoring.
 */
@Service
public class EnhancedRegistryService {

    private static final Logger log = LoggerFactory.getLogger(EnhancedRegistryService.class);

    private final Map<String, ServiceInstance> registry = new ConcurrentHashMap<>();

    @Value("${registry.lease.duration:30000}")
    private long leaseDurationMs;

    @Value("${registry.eviction.interval:60000}")
    private long evictionIntervalMs;

    @Value("${registry.renew.threshold:0.8}")
    private double renewThreshold;

    private Duration leaseDuration;

    @PostConstruct
    public void init() {
        this.leaseDuration = Duration.ofMillis(leaseDurationMs);
        log.info("Enhanced Registry Service initialized with lease duration: {} ms", leaseDurationMs);
    }

    /**
     * 1. Register a new service instance
     */
    public ServiceInstance register(String instanceId, String serviceName, String host, int port) {
        if (registry.containsKey(instanceId)) {
            log.warn("Instance {} already exists, renewing lease instead of registering", instanceId);// nếu instance đã tồn tại, chỉ cần gia hạn lease
            return renewLease(instanceId);
        }

        ServiceInstance instance = new ServiceInstance(instanceId, serviceName);
        instance.setHost(host);
        instance.setPort(port);
        
        registry.put(instanceId, instance);
        log.info("Registered new instance: {} - {}:{}", instanceId, host, port); // log thông tin đăng ký mới
        return instance;
    }

    /**
     * Register with InstanceInfo
     */
    public ServiceInstance register(InstanceInfo instanceInfo) {
        String instanceId = instanceInfo.getInstanceId();
        String serviceName = instanceInfo.getAppName();
        String host = instanceInfo.getIpAddr();
        int port = instanceInfo.getPort();
        
        return register(instanceId, serviceName, host, port);
    }

    /**
     * 2. Renew lease (heartbeat)
     */
    public ServiceInstance renewLease(String instanceId) {
        ServiceInstance instance = registry.get(instanceId);
        if (instance == null) {
            log.error("Instance {} not found for renewal", instanceId);
            throw new IllegalArgumentException("Instance not found: " + instanceId); // ném lỗi nếu không tìm thấy instance để gia hạn
        }

        instance.updateHeartbeat();
        log.debug("Lease renewed for instance: {}", instanceId);
        return instance;
    }

    /**
     * 3. Deregister actively
     */
    public ServiceInstance deregister(String instanceId) {
        ServiceInstance removed = registry.remove(instanceId);
        if (removed != null) {
            log.info("Deregistered instance: {}", instanceId); // log thông tin khi instance được hủy đăng ký
        } else {
            log.warn("Attempted to deregister non-existent instance: {}", instanceId);  // log cảnh báo nếu cố gắng hủy đăng ký một instance không tồn tại
        }
        return removed;
    }

    /**
     * 4. Check if a specific instance has expired
     */
    public boolean isInstanceExpired(String instanceId) {
        ServiceInstance instance = registry.get(instanceId);
        if (instance == null) {
            return true; // Non-existent is considered expired
        }
        return instance.isExpired(leaseDuration);
    }

    /**
     * 5. Get all active instances
     */
    public List<ServiceInstance> getActiveInstances() {
        return registry.values().stream()
                .filter(instance -> !instance.isExpired(leaseDuration))
                .collect(Collectors.toList());
    }

    /**
     * 6. Get instances by service name
     */
    public List<ServiceInstance> getInstancesByServiceName(String serviceName) {
        return registry.values().stream()
                .filter(instance -> serviceName.equals(instance.getServiceName()))
                .filter(instance -> !instance.isExpired(leaseDuration))
                .collect(Collectors.toList());
    }

    /**
     * 7. Check registry health
     */
    public RegistryHealth getRegistryHealth() {
        long totalInstances = registry.size();
        long expiredInstances = registry.values().stream()
                .filter(instance -> instance.isExpired(leaseDuration))
                .count();
        long activeInstances = totalInstances - expiredInstances;

        return RegistryHealth.builder()
                .totalInstances(totalInstances)
                .activeInstances(activeInstances)
                .expiredInstances(expiredInstances)
                .leaseDurationMs(leaseDurationMs)
                .healthStatus(activeInstances > 0 ? "UP" : "DOWN")
                .build();
    }

    /**
     * 8. Automatic eviction - runs periodically
     */
    public void evictExpiredInstances() {
        int beforeCount = registry.size();
        log.info("Starting eviction process. Current instances: {}", beforeCount);

        int expiredCount = 0;
        var iterator = registry.entrySet().iterator();
        
        while (iterator.hasNext()) {
            var entry = iterator.next();
            ServiceInstance instance = entry.getValue();
            
            if (instance.isExpired(leaseDuration)) {
                log.info("Evicting expired instance: {} (service: {})", 
                        instance.getInstanceId(), instance.getServiceName());
                iterator.remove();
                expiredCount++;
            }
        }

        // Warn if eviction rate is too high
        if (beforeCount > 0 && (double) expiredCount / beforeCount > renewThreshold) {
            log.warn("High eviction rate detected: {}% instances evicted", 
                    (expiredCount * 100 / beforeCount));
        }

        log.info("Eviction completed. Removed: {}, Remaining: {}", expiredCount, registry.size());
    }

    /**
     * 9. Force eviction - remove all expired instances
     */
    public int forceEviction() {
        int beforeCount = registry.size();
        registry.entrySet().removeIf(entry -> entry.getValue().isExpired(leaseDuration));
        int removedCount = beforeCount - registry.size();
        log.info("Force eviction removed {} instances", removedCount);
        return removedCount;
    }

    /**
     * 10. Get registry statistics
     */
    public RegistryStats getStats() {
        Map<String, Long> instancesPerService = registry.values().stream()
                .collect(Collectors.groupingBy(
                    ServiceInstance::getServiceName, 
                    Collectors.counting()
                ));

        return RegistryStats.builder()
                .totalInstances(registry.size())
                .instancesPerService(instancesPerService)
                .oldestInstance(registry.values().stream()
                        .min((a, b) -> a.getRegistrationTime().compareTo(b.getRegistrationTime()))
                        .orElse(null))
                .newestInstance(registry.values().stream()
                        .max((a, b) -> a.getRegistrationTime().compareTo(b.getRegistrationTime()))
                        .orElse(null))
                .build();
    }

    /**
     * Get instance by ID
     */
    public ServiceInstance getInstance(String instanceId) {
        return registry.get(instanceId);
    }

    /**
     * Get all registered instances
     */
    public List<ServiceInstance> getAllInstances() {
        return List.copyOf(registry.values());
    }

    /**
     * Get instance count
     */
    public int getInstanceCount() {
        return registry.size();
    }

    /**
     * Check if instance exists
     */
    public boolean hasInstance(String instanceId) {
        return registry.containsKey(instanceId);
    }

    /**
     * Clear all instances (for testing)
     */
    public void clear() {
        registry.clear();
        log.info("Registry cleared");
    }

    /**
     * Helper class for registry health information.
     */
    public static class RegistryHealth {
        private long totalInstances;
        private long activeInstances;
        private long expiredInstances;
        private long leaseDurationMs;
        private String healthStatus;
        
        public RegistryHealth(long totalInstances, long activeInstances, long expiredInstances, 
                            long leaseDurationMs, String healthStatus) {
            this.totalInstances = totalInstances;
            this.activeInstances = activeInstances;
            this.expiredInstances = expiredInstances;
            this.leaseDurationMs = leaseDurationMs;
            this.healthStatus = healthStatus;
        }
        
        public static Builder builder() {
            return new Builder();
        }
        
        public static class Builder {
            private long totalInstances;
            private long activeInstances;
            private long expiredInstances;
            private long leaseDurationMs;
            private String healthStatus;
            
            public Builder totalInstances(long totalInstances) {
                this.totalInstances = totalInstances;
                return this;
            }
            
            public Builder activeInstances(long activeInstances) {
                this.activeInstances = activeInstances;
                return this;
            }
            
            public Builder expiredInstances(long expiredInstances) {
                this.expiredInstances = expiredInstances;
                return this;
            }
            
            public Builder leaseDurationMs(long leaseDurationMs) {
                this.leaseDurationMs = leaseDurationMs;
                return this;
            }
            
            public Builder healthStatus(String healthStatus) {
                this.healthStatus = healthStatus;
                return this;
            }
            
            public RegistryHealth build() {
                return new RegistryHealth(totalInstances, activeInstances, expiredInstances, leaseDurationMs, healthStatus);
            }
        }
        
        // Getters
        public long getTotalInstances() { return totalInstances; }
        public long getActiveInstances() { return activeInstances; }
        public long getExpiredInstances() { return expiredInstances; }
        public long getLeaseDurationMs() { return leaseDurationMs; }
        public String getHealthStatus() { return healthStatus; }
    }

    /**
     * Helper class for registry statistics.
     */
    public static class RegistryStats {
        private long totalInstances;
        private Map<String, Long> instancesPerService;
        private ServiceInstance oldestInstance;
        private ServiceInstance newestInstance;
        
        public RegistryStats(long totalInstances, Map<String, Long> instancesPerService,
                           ServiceInstance oldestInstance, ServiceInstance newestInstance) {
            this.totalInstances = totalInstances;
            this.instancesPerService = instancesPerService;
            this.oldestInstance = oldestInstance;
            this.newestInstance = newestInstance;
        }
        
        public static Builder builder() {
            return new Builder();
        }
        
        public static class Builder {
            private long totalInstances;
            private Map<String, Long> instancesPerService;
            private ServiceInstance oldestInstance;
            private ServiceInstance newestInstance;
            
            public Builder totalInstances(long totalInstances) {
                this.totalInstances = totalInstances;
                return this;
            }
            
            public Builder instancesPerService(Map<String, Long> instancesPerService) {
                this.instancesPerService = instancesPerService;
                return this;
            }
            
            public Builder oldestInstance(ServiceInstance oldestInstance) {
                this.oldestInstance = oldestInstance;
                return this;
            }
            
            public Builder newestInstance(ServiceInstance newestInstance) {
                this.newestInstance = newestInstance;
                return this;
            }
            
            public RegistryStats build() {
                return new RegistryStats(totalInstances, instancesPerService, oldestInstance, newestInstance);
            }
        }
        
        // Getters
        public long getTotalInstances() { return totalInstances; }
        public Map<String, Long> getInstancesPerService() { return instancesPerService; }
        public ServiceInstance getOldestInstance() { return oldestInstance; }
        public ServiceInstance getNewestInstance() { return newestInstance; }
    }
}

