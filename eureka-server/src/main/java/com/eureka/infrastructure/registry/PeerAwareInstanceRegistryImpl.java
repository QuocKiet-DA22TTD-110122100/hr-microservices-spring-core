package com.eureka.infrastructure.registry;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import com.eureka.Domain.model.InstanceInfo;
import com.eureka.Domain.model.InstanceStatus;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * Concrete implementation của AbstractInstanceRegistry.
 * 
 * Class này cung cấp implementation đầy đủ của Eureka registry với:
 * - Thread-safe operations
 * - Automatic eviction của expired instances
 * - Health monitoring và statistics
 * - Support cho peer replication (sẽ được extend sau)
 * 
 * Đây là core registry component được sử dụng bởi Eureka Server.
 */
@Component
public class PeerAwareInstanceRegistryImpl extends AbstractInstanceRegistry {
    
    private static final Logger logger = LoggerFactory.getLogger(PeerAwareInstanceRegistryImpl.class);
    
    // Scheduled executor cho background tasks
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(2);
    
    // Configuration properties
    private static final int EVICTION_INTERVAL_SECONDS = 60;
    private static final int STATISTICS_LOG_INTERVAL_SECONDS = 300;
    
    /**
     * Khởi tạo scheduled tasks sau khi bean được tạo.
     */
    @PostConstruct
    public void init() {
        logger.info("Khởi tạo PeerAwareInstanceRegistryImpl với automatic eviction");
        
        // Schedule eviction task chạy mỗi 60 giây
        scheduler.scheduleWithFixedDelay(this::runEvictionTask, 
                                       EVICTION_INTERVAL_SECONDS, 
                                       EVICTION_INTERVAL_SECONDS, 
                                       TimeUnit.SECONDS);
        
        // Schedule statistics logging mỗi 5 phút
        scheduler.scheduleWithFixedDelay(this::logRegistryStatistics, 
                                       STATISTICS_LOG_INTERVAL_SECONDS, 
                                       STATISTICS_LOG_INTERVAL_SECONDS, 
                                       TimeUnit.SECONDS);
        
        logger.info("PeerAwareInstanceRegistryImpl đã được khởi tạo thành công");
    }
    
    /**
     * Implementation của abstract method từ AbstractInstanceRegistry.
     * 
     * Xác định instance status được override dựa trên:
     * - Health check results từ external health checkers
     * - Administrative overrides (OUT_OF_SERVICE cho maintenance)
     * - Load balancer feedback
     * - Circuit breaker status
     * 
     * Trong implementation cơ bản này, chúng ta không override status.
     * Subclass có thể override method này để implement custom logic.
     * 
     * @param instanceInfo thông tin instance
     * @param existingLease lease hiện tại
     * @param isReplication true nếu đây là replication từ peer
     * @return status được override, hoặc status gốc nếu không override
     */
    @Override
    protected InstanceStatus getOverriddenInstanceStatus(InstanceInfo instanceInfo, 
                                                        Lease<InstanceInfo> existingLease, 
                                                        boolean isReplication) {
        
        // Trong implementation cơ bản, không override status
        // Trả về status gốc từ instance
        InstanceStatus originalStatus = instanceInfo.getStatus();
        
        logger.debug("Kiểm tra override status cho instance {} - status gốc: {}", 
                    instanceInfo.getInstanceId(), originalStatus);
        
        // TODO: Implement custom override logic nếu cần:
        // 1. Kiểm tra health check results
        // 2. Kiểm tra administrative overrides
        // 3. Kiểm tra load balancer feedback
        // 4. Kiểm tra circuit breaker status
        
        // Ví dụ logic có thể implement:
        /*
        if (isMaintenanceMode(instanceInfo)) {
            logger.info("Instance {} đang trong maintenance mode - override status thành OUT_OF_SERVICE", 
                       instanceInfo.getInstanceId());
            return InstanceStatus.OUT_OF_SERVICE;
        }
        
        if (isHealthCheckFailing(instanceInfo)) {
            logger.warn("Health check failing cho instance {} - override status thành DOWN", 
                       instanceInfo.getInstanceId());
            return InstanceStatus.DOWN;
        }
        */
        
        return originalStatus;
    }
    
    /**
     * Task chạy eviction định kỳ.
     * 
     * Được gọi bởi scheduler mỗi 60 giây để:
     * - Xóa expired instances
     * - Cleanup registry
     * - Log kết quả eviction
     */
    private void runEvictionTask() {
        try {
            logger.debug("Bắt đầu eviction task định kỳ");
            
            int evictedCount = evictExpiredLeases();
            
            if (evictedCount > 0) {
                logger.info("Eviction task hoàn thành - đã xóa {} expired instances", evictedCount);
            } else {
                logger.debug("Eviction task hoàn thành - không có expired instances");
            }
            
        } catch (Exception e) {
            logger.error("Lỗi trong eviction task", e);
        }
    }
    
    /**
     * Task log statistics định kỳ.
     * 
     * Được gọi bởi scheduler mỗi 5 phút để log thông tin registry.
     */
    private void logRegistryStatistics() {
        try {
            var stats = getRegistryStatistics();
            
            logger.info("=== Registry Statistics ===");
            logger.info("Total Applications: {}", stats.get("totalApplications"));
            logger.info("Total Instances: {}", stats.get("totalInstances"));
            logger.info("Expired Leases: {}", stats.get("expiredLeases"));
            logger.info("Status Counts: {}", stats.get("statusCounts"));
            logger.info("===========================");
            
        } catch (Exception e) {
            logger.error("Lỗi khi log registry statistics", e);
        }
    }
    
    /**
     * Shutdown scheduler khi bean bị destroy.
     */
    @PreDestroy
    public void shutdown() {
        logger.info("Shutting down PeerAwareInstanceRegistryImpl");
        
        scheduler.shutdown();
        try {
            if (!scheduler.awaitTermination(10, TimeUnit.SECONDS)) {
                logger.warn("Scheduler không shutdown trong 10 giây - force shutdown");
                scheduler.shutdownNow();
            }
        } catch (InterruptedException e) {
            logger.warn("Bị interrupt khi chờ scheduler shutdown");
            scheduler.shutdownNow();
            Thread.currentThread().interrupt();
        }
        
        logger.info("PeerAwareInstanceRegistryImpl đã shutdown thành công");
    }
    
    // Additional utility methods
    
    /**
     * Kiểm tra registry có healthy không.
     * 
     * @return true nếu registry healthy
     */
    public boolean isRegistryHealthy() {
        var stats = getRegistryStatistics();
        int totalInstances = (Integer) stats.get("totalInstances");
        int expiredLeases = (Integer) stats.get("expiredLeases");
        
        if (totalInstances == 0) {
            return true; // Empty registry is considered healthy
        }
        
        // Coi là unhealthy nếu > 50% instances expired
        double expiredRatio = (double) expiredLeases / totalInstances;
        return expiredRatio <= 0.5;
    }
    
    /**
     * Lấy health status string.
     * 
     * @return health status ("HEALTHY", "DEGRADED", "UNHEALTHY")
     */
    public String getHealthStatus() {
        var stats = getRegistryStatistics();
        int totalInstances = (Integer) stats.get("totalInstances");
        int expiredLeases = (Integer) stats.get("expiredLeases");
        
        if (totalInstances == 0) {
            return "NO_INSTANCES";
        }
        
        double expiredRatio = (double) expiredLeases / totalInstances;
        
        if (expiredRatio <= 0.1) {
            return "HEALTHY";
        } else if (expiredRatio <= 0.3) {
            return "DEGRADED";
        } else {
            return "UNHEALTHY";
        }
    }
    
    /**
     * Force cleanup toàn bộ registry (chỉ dùng cho testing).
     */
    public void clearRegistry() {
        logger.warn("FORCE CLEARING toàn bộ registry - chỉ nên dùng cho testing!");
        
        try {
            write.lock();
            registry.clear();
            logger.info("Registry đã được clear");
        } finally {
            write.unlock();
        }
    }
}