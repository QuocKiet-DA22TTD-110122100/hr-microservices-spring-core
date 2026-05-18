package com.hrservice.eureka.infrastructure.registry;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import com.hrservice.eureka.Domain.model.InstanceInfo;
import com.hrservice.eureka.Domain.model.InstanceStatus;
import com.hrservice.eureka.service.RegistryService;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantReadWriteLock;

/**
 * Base implementation of the service registry.
 */
@Component
public abstract class AbstractInstanceRegistry implements RegistryService {
    
    private static final Logger logger = LoggerFactory.getLogger(AbstractInstanceRegistry.class);
    
    /**
     * Main registry store.
     */
    protected final ConcurrentHashMap<String, Map<String, Lease<InstanceInfo>>> registry = new ConcurrentHashMap<>();
    
    /**
     * Read-write lock for compound registry operations.
     */
    protected final ReentrantReadWriteLock readWriteLock = new ReentrantReadWriteLock();
    protected final Lock read = readWriteLock.readLock();
    protected final Lock write = readWriteLock.writeLock();
    
    /**
     * Registers a new service instance.
     */
    @Override
    public void register(InstanceInfo instance, int leaseDuration, boolean isReplication) {
        try {
            read.lock();
            
            String appName = instance.getAppName();
            String instanceId = instance.getInstanceId();
            
            logger.info("Đăng ký instance {} cho application {} (replication: {})", 
                       instanceId, appName, isReplication);
            
            Map<String, Lease<InstanceInfo>> gMap = registry.get(appName);
            if (gMap == null) {
                final ConcurrentHashMap<String, Lease<InstanceInfo>> gNewMap = new ConcurrentHashMap<>();
                gMap = registry.putIfAbsent(appName, gNewMap);
                if (gMap == null) {
                    gMap = gNewMap;
                }
            }
            
            Lease<InstanceInfo> existingLease = gMap.get(instanceId);
            if (existingLease != null && existingLease.getHolder() != null) {
                Long existingLastDirtyTimestamp = existingLease.getHolder().getLeaseInfo().getLastRenewalTimestamp();
                Long registrationLastDirtyTimestamp = instance.getLeaseInfo().getLastRenewalTimestamp();
                
                if (existingLastDirtyTimestamp > registrationLastDirtyTimestamp) {
                    logger.warn("Existing lease mới hơn registration cho instance {} - bỏ qua", instanceId);
                    return;
                }
            }
            
            Lease<InstanceInfo> lease = new Lease<>(instance, leaseDuration);
            if (existingLease != null) {
                lease.setServiceUpTimestamp(existingLease.getServiceUpTimestamp());
            }
            
            gMap.put(instanceId, lease);
            
            logger.info("Đăng ký thành công instance {} cho application {}", instanceId, appName);
            
        } finally {
            read.unlock();
        }
    }
    /**
     * Deregisters a service instance.
     */
    @Override
    public boolean deregister(String appName, String instanceId, boolean isReplication) {
        try {
            read.lock();
            
            logger.info("Hủy đăng ký instance {} từ application {} (replication: {})", 
                       instanceId, appName, isReplication);
            
            Map<String, Lease<InstanceInfo>> gMap = registry.get(appName);
            if (gMap != null) {
                Lease<InstanceInfo> lease = gMap.remove(instanceId);
                if (lease != null) {
                    lease.cancel();
                    logger.info("Hủy đăng ký thành công instance {} từ application {}", instanceId, appName);
                    return true;
                }
            }
            
            logger.warn("Không tìm thấy instance {} để hủy đăng ký trong application {}", instanceId, appName);
            return false;
            
        } finally {
            read.unlock();
        }
    }
    
    /**
     * Renews a lease for a service instance.
     */
    @Override
    public boolean renew(String appName, String instanceId, boolean isReplication) {
        Map<String, Lease<InstanceInfo>> gMap = registry.get(appName);
        Lease<InstanceInfo> leaseToRenew = null;
        
        if (gMap != null) {
            leaseToRenew = gMap.get(instanceId);
        }
        
        if (leaseToRenew == null) {
            logger.warn("Lease không tồn tại để renew: {} - {} (có thể instance chưa đăng ký)", 
                       appName, instanceId);
            return false;
        } else {
            InstanceInfo instanceInfo = leaseToRenew.getHolder();
            if (instanceInfo != null) {
                InstanceStatus overriddenInstanceStatus = getOverriddenInstanceStatus(instanceInfo, leaseToRenew, isReplication);
                if (overriddenInstanceStatus == InstanceStatus.UNKNOWN) {
                    logger.info("Instance status UNKNOWN cho instance {} - cần re-register", instanceInfo.getId());
                    return false;
                }
                
                if (!instanceInfo.getStatus().equals(overriddenInstanceStatus)) {
                    logger.info("Cập nhật instance status từ {} thành {} cho instance {}", 
                               instanceInfo.getStatus().name(), overriddenInstanceStatus.name(), instanceInfo.getId());
                    instanceInfo.setStatus(overriddenInstanceStatus);
                }
            }
            
            leaseToRenew.renew();
            logger.debug("Gia hạn lease thành công cho instance {} trong application {}", instanceId, appName);
            return true;
        }
    }
    
    /**
     * Updates the status of a service instance.
     */
    @Override
    public boolean updateStatus(String appName, String instanceId, InstanceStatus newStatus, 
                               String lastDirtyTimestamp, boolean isReplication) {
        try {
            read.lock();
            
            logger.info("Cập nhật status cho instance {} trong application {} thành {} (replication: {})", 
                       instanceId, appName, newStatus, isReplication);
            
            Map<String, Lease<InstanceInfo>> gMap = registry.get(appName);
            if (gMap != null) {
                Lease<InstanceInfo> lease = gMap.get(instanceId);
                if (lease != null) {
                    InstanceInfo instance = lease.getHolder();
                    if (instance != null) {
                        instance.setStatus(newStatus);
                        
                        if (lastDirtyTimestamp != null) {
                            try {
                                long timestamp = Long.parseLong(lastDirtyTimestamp);
                                instance.getLeaseInfo().setLastRenewalTimestamp(timestamp);
                            } catch (NumberFormatException e) {
                                logger.warn("Format lastDirtyTimestamp không hợp lệ: {}", lastDirtyTimestamp);
                            }
                        }
                        
                        logger.info("Cập nhật status thành công cho instance {} trong application {} thành {}", 
                                   instanceId, appName, newStatus);
                        return true;
                    }
                }
            }
            
            logger.warn("Không tìm thấy instance {} để cập nhật status trong application {}", instanceId, appName);
            return false;
            
        } finally {
            read.unlock();
        }
    }
    
    // Query operations for service discovery
    
    /**
     * Returns all active instances for an application.
     */
    @Override
    public List<InstanceInfo> getInstances(String appName) {
        Map<String, Lease<InstanceInfo>> gMap = registry.get(appName);
        if (gMap == null) {
            logger.debug("Không tìm thấy application {} trong registry", appName);
            return Collections.emptyList();
        }
        
        List<InstanceInfo> instances = new ArrayList<>();
        for (Lease<InstanceInfo> lease : gMap.values()) {
            if (lease.getHolder() != null && !lease.isExpired()) {
                instances.add(lease.getHolder());
            }
        }
        
        logger.debug("Tìm thấy {} instances cho application {}", instances.size(), appName);
        return instances;
    }
    
    /**
     * Returns one instance by application name and instance id.
     */
    @Override
    public InstanceInfo getInstance(String appName, String instanceId) {
        Map<String, Lease<InstanceInfo>> gMap = registry.get(appName);
        if (gMap != null) {
            Lease<InstanceInfo> lease = gMap.get(instanceId);
            if (lease != null && !lease.isExpired()) {
                return lease.getHolder();
            }
        }
        return null;
    }
    
    /**
     * Returns all active instances in the registry.
     */
    @Override
    public List<InstanceInfo> getAllInstances() {
        List<InstanceInfo> allInstances = new ArrayList<>();
        for (Map<String, Lease<InstanceInfo>> gMap : registry.values()) {
            for (Lease<InstanceInfo> lease : gMap.values()) {
                if (lease.getHolder() != null && !lease.isExpired()) {
                    allInstances.add(lease.getHolder());
                }
            }
        }
        return allInstances;
    }
    
    /**
     * Returns all registered application names.
     */
    @Override
    public List<String> getApplicationNames() {
        return new ArrayList<>(registry.keySet());
    }
    
    /**
     * Returns the total number of instances in the registry.
     */
    @Override
    public int getInstanceCount() {
        int count = 0;
        for (Map<String, Lease<InstanceInfo>> gMap : registry.values()) {
            count += gMap.size();
        }
        return count;
    }
    
    /**
     * Returns the number of instances for one application.
     */
    @Override
    public int getInstanceCount(String appName) {
        Map<String, Lease<InstanceInfo>> gMap = registry.get(appName);
        return gMap != null ? gMap.size() : 0;
    }
    
    /**
     * Returns whether the application has any instances.
     */
    @Override
    public boolean hasApplication(String appName) {
        Map<String, Lease<InstanceInfo>> gMap = registry.get(appName);
        return gMap != null && !gMap.isEmpty();
    }
    
    /**
     * Returns whether one instance exists.
     */
    @Override
    public boolean hasInstance(String appName, String instanceId) {
        Map<String, Lease<InstanceInfo>> gMap = registry.get(appName);
        if (gMap != null) {
            return gMap.containsKey(instanceId);
        }
        return false;
    }
    
    // Abstract methods implemented by subclasses
    
    /**
     * Resolves the effective status for an instance.
     */
    protected abstract InstanceStatus getOverriddenInstanceStatus(InstanceInfo instanceInfo, 
                                                                 Lease<InstanceInfo> existingLease, 
                                                                 boolean isReplication);
    
    // Utility methods
    
    /**
     * Returns all leases in the registry, including expired ones.
     */
    protected Map<String, Map<String, Lease<InstanceInfo>>> getAllLeases() {
        return new HashMap<>(registry);
    }
    
    /**
     * Returns the leases for one application.
     */
    protected Map<String, Lease<InstanceInfo>> getApplicationLeases(String appName) {
        Map<String, Lease<InstanceInfo>> gMap = registry.get(appName);
        return gMap != null ? new HashMap<>(gMap) : new HashMap<>();
    }
    
    /**
     * Removes expired leases from the registry.
     */
    public int evictExpiredLeases() {
        int evictedCount = 0;
        
        try {
            write.lock();
            
            logger.debug("Bắt đầu evict expired leases");
            
            Iterator<Map.Entry<String, Map<String, Lease<InstanceInfo>>>> appIterator = registry.entrySet().iterator();
            
            while (appIterator.hasNext()) {
                Map.Entry<String, Map<String, Lease<InstanceInfo>>> appEntry = appIterator.next();
                String appName = appEntry.getKey();
                Map<String, Lease<InstanceInfo>> instanceMap = appEntry.getValue();
                
                Iterator<Map.Entry<String, Lease<InstanceInfo>>> instanceIterator = instanceMap.entrySet().iterator();
                
                while (instanceIterator.hasNext()) {
                    Map.Entry<String, Lease<InstanceInfo>> instanceEntry = instanceIterator.next();
                    String instanceId = instanceEntry.getKey();
                    Lease<InstanceInfo> lease = instanceEntry.getValue();
                    
                    if (lease.isExpired()) {
                        logger.info("Evicting expired lease cho instance {} trong application {}", instanceId, appName);
                        
                        lease.cancel();
                        
                        instanceIterator.remove();
                        evictedCount++;
                    }
                }
                
                if (instanceMap.isEmpty()) {
                    logger.info("Xóa application {} vì không còn instances", appName);
                    appIterator.remove();
                }
            }
            
            if (evictedCount > 0) {
                logger.info("Đã evict {} expired leases", evictedCount);
            }
            
        } finally {
            write.unlock();
        }
        
        return evictedCount;
    }
    
    /**
     * Lấy thống kê registry.
     * 
     * @return map chứa các thống kê
     */
    public Map<String, Object> getRegistryStatistics() {
        Map<String, Object> stats = new HashMap<>();
        
        try {
            read.lock();
            
            int totalInstances = 0;
            int totalApplications = registry.size();
            int expiredLeases = 0;
            
            Map<InstanceStatus, Integer> statusCounts = new HashMap<>();
            for (InstanceStatus status : InstanceStatus.values()) {
                statusCounts.put(status, 0);
            }
            
            for (Map<String, Lease<InstanceInfo>> instanceMap : registry.values()) {
                for (Lease<InstanceInfo> lease : instanceMap.values()) {
                    totalInstances++;
                    
                    if (lease.isExpired()) {
                        expiredLeases++;
                    }
                    
                    if (lease.getHolder() != null) {
                        InstanceStatus status = lease.getHolder().getStatus();
                        statusCounts.put(status, statusCounts.get(status) + 1);
                    }
                }
            }
            
            stats.put("totalApplications", totalApplications);
            stats.put("totalInstances", totalInstances);
            stats.put("expiredLeases", expiredLeases);
            stats.put("statusCounts", statusCounts);
            
        } finally {
            read.unlock();
        }
        
        return stats;
    }
    
    /**
     * Inner class representing a lease.
     */
    public static class Lease<T> {
        
        private T holder;

        private long registrationTimestamp;

        private long lastRenewalTimestamp;

        private long duration;

        private long evictionTimestamp;

        private long serviceUpTimestamp;
        
        /**
         * Creates a new lease.
         */
        public Lease(T r, int durationInSecs) {
            this.holder = r;
            this.registrationTimestamp = System.currentTimeMillis();
            this.lastRenewalTimestamp = registrationTimestamp;
            this.duration = durationInSecs * 1000L;
            this.evictionTimestamp = 0;
            this.serviceUpTimestamp = registrationTimestamp;
        }
        
        /**
         * Renews the lease timestamp.
         */
        public void renew() {
            this.lastRenewalTimestamp = System.currentTimeMillis();
        }
        
        /**
         * Cancels the lease and marks eviction time.
         */
        public void cancel() {
            if (evictionTimestamp <= 0) {
                this.evictionTimestamp = System.currentTimeMillis();
            }
        }
        
        /**
         * Returns whether the lease is expired.
         */
        public boolean isExpired() {
            return isExpired(0);
        }
        
        /**
         * Returns whether the lease is expired with additional time.
         */
        public boolean isExpired(long additionalLeaseMs) {
            long currentTime = System.currentTimeMillis();
            return currentTime > (lastRenewalTimestamp + duration + additionalLeaseMs);
        }
        
        // Getters and setters
        
        public T getHolder() {
            return holder;
        }
        
        public void setHolder(T holder) {
            this.holder = holder;
        }
        
        public long getRegistrationTimestamp() {
            return registrationTimestamp;
        }
        
        public long getLastRenewalTimestamp() {
            return lastRenewalTimestamp;
        }
        
        public long getDuration() {
            return duration;
        }
        
        public long getEvictionTimestamp() {
            return evictionTimestamp;
        }
        
        public void setEvictionTimestamp(long evictionTimestamp) {
            this.evictionTimestamp = evictionTimestamp;
        }
        
        public long getServiceUpTimestamp() {
            return serviceUpTimestamp;
        }
        
        public void setServiceUpTimestamp(long serviceUpTimestamp) {
            this.serviceUpTimestamp = serviceUpTimestamp;
        }
        
        @Override
        public String toString() {
            return "Lease{" +
                    "holder=" + holder +
                    ", registrationTimestamp=" + registrationTimestamp +
                    ", lastRenewalTimestamp=" + lastRenewalTimestamp +
                    ", duration=" + duration +
                    ", evictionTimestamp=" + evictionTimestamp +
                    '}';
        }
    }
}