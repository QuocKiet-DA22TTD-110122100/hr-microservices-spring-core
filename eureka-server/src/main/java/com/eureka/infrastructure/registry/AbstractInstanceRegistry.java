package com.eureka.infrastructure.registry;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import com.eureka.Domain.model.InstanceInfo;
import com.eureka.Domain.model.InstanceStatus;
import com.eureka.service.RegistryService;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantReadWriteLock;

/**
 * Implementation cơ bản của ServiceRegistry interface.
 * 
 * Class này cung cấp core registry functionality bao gồm:
 * - Thread-safe operations để quản lý service instances
 * - Lease management với automatic expiration
 * - Registry operations cơ bản (register, deregister, renew)
 * - Query operations để service discovery
 * 
 * Kiến trúc dữ liệu:
 * registry: Map<AppName, Map<InstanceId, Lease<InstanceInfo>>>
 * 
 * Ví dụ:
 * {
 *   "USER-SERVICE": {
 *     "user-001": Lease{holder: InstanceInfo{...}, expiration: ...},
 *     "user-002": Lease{holder: InstanceInfo{...}, expiration: ...}
 *   },
 *   "ORDER-SERVICE": {
 *     "order-001": Lease{holder: InstanceInfo{...}, expiration: ...}
 *   }
 * }
 */
@Component
public abstract class AbstractInstanceRegistry implements RegistryService {
    
    private static final Logger logger = LoggerFactory.getLogger(AbstractInstanceRegistry.class);
    
    /**
     * Registry chính - lưu trữ tất cả service instances.
     * 
     * Cấu trúc: AppName -> InstanceId -> Lease<InstanceInfo>
     * 
     * Sử dụng ConcurrentHashMap để:
     * - Thread-safe cho concurrent access
     * - Performance cao cho read operations
     * - Atomic operations cho put/remove
     */
    protected final ConcurrentHashMap<String, Map<String, Lease<InstanceInfo>>> registry = new ConcurrentHashMap<>();
    
    /**
     * Read-Write lock để đảm bảo consistency.
     * 
     * Tại sao cần lock khi đã có ConcurrentHashMap?
     * - ConcurrentHashMap chỉ thread-safe cho single operations
     * - Cần lock cho compound operations (read-then-write)
     * - Đảm bảo consistency khi có multiple operations liên tiếp
     * 
     * Read lock: Cho phép multiple readers đồng thời
     * Write lock: Exclusive, chỉ 1 writer tại một thời điểm
     */
    protected final ReentrantReadWriteLock readWriteLock = new ReentrantReadWriteLock();
    protected final Lock read = readWriteLock.readLock();
    protected final Lock write = readWriteLock.writeLock();
    
    /**
     * Đăng ký một service instance mới.
     * 
     * Quy trình xử lý:
     * 1. Acquire read lock (cho phép concurrent registrations)
     * 2. Lấy hoặc tạo map cho application
     * 3. Kiểm tra existing lease và so sánh timestamp
     * 4. Tạo lease mới với duration được chỉ định
     * 5. Lưu vào registry
     * 6. Log thành công
     * 
     * @param instance thông tin instance cần đăng ký
     * @param leaseDuration thời hạn lease (giây)
     * @param isReplication true nếu đây là replication từ peer server
     */
    @Override
    public void register(InstanceInfo instance, int leaseDuration, boolean isReplication) {
        try {
            read.lock(); // Sử dụng read lock vì có thể có nhiều registrations đồng thời
            
            String appName = instance.getAppName();
            String instanceId = instance.getInstanceId();
            
            logger.info("Đăng ký instance {} cho application {} (replication: {})", 
                       instanceId, appName, isReplication);
            
            // Bước 1: Lấy hoặc tạo map cho application
            Map<String, Lease<InstanceInfo>> gMap = registry.get(appName);
            if (gMap == null) {
                // Tạo map mới cho application này
                final ConcurrentHashMap<String, Lease<InstanceInfo>> gNewMap = new ConcurrentHashMap<>();
                gMap = registry.putIfAbsent(appName, gNewMap);
                if (gMap == null) {
                    gMap = gNewMap; // Sử dụng map vừa tạo
                }
            }
            
            // Bước 2: Kiểm tra existing lease
            Lease<InstanceInfo> existingLease = gMap.get(instanceId);
            if (existingLease != null && existingLease.getHolder() != null) {
                // So sánh timestamp để tránh overwrite data mới bằng data cũ
                Long existingLastDirtyTimestamp = existingLease.getHolder().getLeaseInfo().getLastRenewalTimestamp();
                Long registrationLastDirtyTimestamp = instance.getLeaseInfo().getLastRenewalTimestamp();
                
                if (existingLastDirtyTimestamp > registrationLastDirtyTimestamp) {
                    logger.warn("Existing lease mới hơn registration cho instance {} - bỏ qua", instanceId);
                    return;
                }
            }
            
            // Bước 3: Tạo lease mới
            Lease<InstanceInfo> lease = new Lease<>(instance, leaseDuration);
            if (existingLease != null) {
                // Giữ lại serviceUpTimestamp từ lease cũ
                lease.setServiceUpTimestamp(existingLease.getServiceUpTimestamp());
            }
            
            // Bước 4: Lưu vào registry
            gMap.put(instanceId, lease);
            
            logger.info("Đăng ký thành công instance {} cho application {}", instanceId, appName);
            
        } finally {
            read.unlock();
        }
    }
    /**
     * Hủy đăng ký một service instance.
     * 
     * Quy trình xử lý:
     * 1. Acquire read lock
     * 2. Tìm application map
     * 3. Xóa instance khỏi map
     * 4. Cancel lease (đánh dấu eviction timestamp)
     * 5. Log kết quả
     * 
     * @param appName tên application
     * @param instanceId ID của instance
     * @param isReplication true nếu đây là replication từ peer
     * @return true nếu xóa thành công, false nếu không tìm thấy
     */
    @Override
    public boolean deregister(String appName, String instanceId, boolean isReplication) {
        try {
            read.lock();
            
            logger.info("Hủy đăng ký instance {} từ application {} (replication: {})", 
                       instanceId, appName, isReplication);
            
            // Tìm application map
            Map<String, Lease<InstanceInfo>> gMap = registry.get(appName);
            if (gMap != null) {
                // Xóa instance khỏi map
                Lease<InstanceInfo> lease = gMap.remove(instanceId);
                if (lease != null) {
                    // Cancel lease - đánh dấu thời điểm eviction
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
     * Gia hạn lease cho một instance (xử lý heartbeat).
     * 
     * Đây là method quan trọng nhất - được gọi mỗi 30 giây bởi mỗi instance.
     * 
     * Quy trình xử lý:
     * 1. Tìm lease của instance
     * 2. Kiểm tra instance status có hợp lệ không
     * 3. Cập nhật status nếu cần
     * 4. Renew lease (cập nhật lastRenewalTimestamp)
     * 5. Log và trả về kết quả
     * 
     * @param appName tên application
     * @param instanceId ID của instance
     * @param isReplication true nếu đây là replication từ peer
     * @return true nếu renew thành công, false nếu instance không tồn tại
     */
    @Override
    public boolean renew(String appName, String instanceId, boolean isReplication) {
        // Tìm lease của instance
        Map<String, Lease<InstanceInfo>> gMap = registry.get(appName);// Lấy map của application
        Lease<InstanceInfo> leaseToRenew = null;// Lấy lease của instance từ map
        
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
                // Kiểm tra instance status có cho phép renewal không
                InstanceStatus overriddenInstanceStatus = getOverriddenInstanceStatus(instanceInfo, leaseToRenew, isReplication);
                if (overriddenInstanceStatus == InstanceStatus.UNKNOWN) {
                    logger.info("Instance status UNKNOWN cho instance {} - cần re-register", instanceInfo.getId());
                    return false;
                }
                
                // Cập nhật status nếu khác với overridden status
                if (!instanceInfo.getStatus().equals(overriddenInstanceStatus)) {
                    logger.info("Cập nhật instance status từ {} thành {} cho instance {}", 
                               instanceInfo.getStatus().name(), overriddenInstanceStatus.name(), instanceInfo.getId());
                    instanceInfo.setStatus(overriddenInstanceStatus);
                }
            }
            
            // Gia hạn lease - cập nhật lastRenewalTimestamp
            leaseToRenew.renew();
            logger.debug("Gia hạn lease thành công cho instance {} trong application {}", instanceId, appName);
            return true;
        }
    }
    
    /**
     * Cập nhật status của một instance.
     * 
     * @param appName tên application
     * @param instanceId ID của instance
     * @param newStatus status mới
     * @param lastDirtyTimestamp timestamp của lần cập nhật cuối
     * @param isReplication true nếu đây là replication từ peer
     * @return true nếu cập nhật thành công
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
                        // Cập nhật status
                        instance.setStatus(newStatus);
                        
                        // Cập nhật timestamp nếu được cung cấp
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
    
    // Query Operations - Các phương thức truy vấn cho Service Discovery
    
    /**
     * Lấy tất cả instances của một application.
     * 
     * Method này được gọi bởi clients để service discovery.
     * Chỉ trả về instances đang sống (không expired).
     * 
     * @param appName tên application
     * @return danh sách instances của application
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
     * Lấy một instance cụ thể theo appName và instanceId.
     * 
     * @param appName tên application
     * @param instanceId ID của instance
     * @return instance info hoặc null nếu không tìm thấy
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
     * Lấy tất cả instances trong toàn bộ registry.
     * 
     * Sử dụng cho admin operations và monitoring.
     * 
     * @return danh sách tất cả instances
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
     * Lấy danh sách tên tất cả applications đã đăng ký.
     * 
     * @return danh sách tên applications
     */
    @Override
    public List<String> getApplicationNames() {
        return new ArrayList<>(registry.keySet());
    }
    
    /**
     * Đếm tổng số instances trong registry.
     * 
     * @return tổng số instances
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
     * Đếm số instances của một application cụ thể.
     * 
     * @param appName tên application
     * @return số instances của application
     */
    @Override
    public int getInstanceCount(String appName) {
        Map<String, Lease<InstanceInfo>> gMap = registry.get(appName);
        return gMap != null ? gMap.size() : 0;
    }
    
    /**
     * Kiểm tra application có instances hay không.
     * 
     * @param appName tên application
     * @return true nếu application có instances
     */
    @Override
    public boolean hasApplication(String appName) {
        Map<String, Lease<InstanceInfo>> gMap = registry.get(appName);
        return gMap != null && !gMap.isEmpty();
    }
    
    /**
     * Kiểm tra instance cụ thể có tồn tại hay không.
     * 
     * @param appName tên application
     * @param instanceId ID của instance
     * @return true nếu instance tồn tại
     */
    @Override
    public boolean hasInstance(String appName, String instanceId) {
        Map<String, Lease<InstanceInfo>> gMap = registry.get(appName);
        if (gMap != null) {
            return gMap.containsKey(instanceId);
        }
        return false;
    }
    
    // Abstract methods - Các method cần implement bởi subclass
    
    /**
     * Xác định instance status được override (có thể khác với status gốc).
     * 
     * Method này cho phép subclass override status của instance dựa trên:
     * - Health check results
     * - Administrative actions (OUT_OF_SERVICE)
     * - Load balancer feedback
     * 
     * @param instanceInfo thông tin instance
     * @param existingLease lease hiện tại
     * @param isReplication true nếu đây là replication từ peer
     * @return status được override, hoặc status gốc nếu không override
     */
    protected abstract InstanceStatus getOverriddenInstanceStatus(InstanceInfo instanceInfo, 
                                                                 Lease<InstanceInfo> existingLease, 
                                                                 boolean isReplication);
    
    // Utility methods - Các phương thức tiện ích
    
    /**
     * Lấy tất cả leases trong registry (bao gồm cả expired).
     * 
     * Sử dụng cho:
     * - Administrative operations
     * - Debugging và monitoring
     * - Backup và recovery
     * 
     * @return map chứa tất cả leases
     */
    protected Map<String, Map<String, Lease<InstanceInfo>>> getAllLeases() {
        return new HashMap<>(registry);
    }
    
    /**
     * Lấy leases của một application cụ thể.
     * 
     * @param appName tên application
     * @return map chứa leases của application, hoặc empty map nếu không tìm thấy
     */
    protected Map<String, Lease<InstanceInfo>> getApplicationLeases(String appName) {
        Map<String, Lease<InstanceInfo>> gMap = registry.get(appName);
        return gMap != null ? new HashMap<>(gMap) : new HashMap<>();
    }
    
    /**
     * Xóa tất cả expired leases.
     * 
     * Method này được gọi định kỳ để cleanup registry.
     * Chỉ xóa khi không trong self-preservation mode.
     * 
     * @return số lượng leases đã bị xóa
     */
    public int evictExpiredLeases() {
        int evictedCount = 0;
        
        try {
            write.lock(); // Cần write lock vì sẽ modify registry
            
            logger.debug("Bắt đầu evict expired leases");
            
            // Duyệt qua tất cả applications
            Iterator<Map.Entry<String, Map<String, Lease<InstanceInfo>>>> appIterator = registry.entrySet().iterator();
            
            while (appIterator.hasNext()) {
                Map.Entry<String, Map<String, Lease<InstanceInfo>>> appEntry = appIterator.next();
                String appName = appEntry.getKey();
                Map<String, Lease<InstanceInfo>> instanceMap = appEntry.getValue();
                
                // Duyệt qua tất cả instances của application
                Iterator<Map.Entry<String, Lease<InstanceInfo>>> instanceIterator = instanceMap.entrySet().iterator();
                
                while (instanceIterator.hasNext()) {
                    Map.Entry<String, Lease<InstanceInfo>> instanceEntry = instanceIterator.next();
                    String instanceId = instanceEntry.getKey();
                    Lease<InstanceInfo> lease = instanceEntry.getValue();
                    
                    // Kiểm tra lease đã expired chưa
                    if (lease.isExpired()) {
                        logger.info("Evicting expired lease cho instance {} trong application {}", instanceId, appName);
                        
                        // Đánh dấu eviction timestamp
                        lease.cancel();
                        
                        // Xóa khỏi registry
                        instanceIterator.remove();
                        evictedCount++;
                    }
                }
                
                // Xóa application nếu không còn instances
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
            
            // Duyệt qua tất cả instances để tính thống kê
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
     * Inner class đại diện cho một lease.
     * 
     * Lease quản lý lifecycle của một instance trong registry:
     * - Thời gian đăng ký
     * - Thời gian renewal cuối cùng  
     * - Thời gian eviction
     * - Logic kiểm tra expiration
     */
    public static class Lease<T> {
        
        // Đối tượng được lease (thường là InstanceInfo)
        private T holder;
        
        // Thời gian đăng ký lease (milliseconds)
        private long registrationTimestamp;
        
        // Thời gian renewal cuối cùng (milliseconds)
        private long lastRenewalTimestamp;
        
        // Thời hạn lease (milliseconds)
        private long duration;
        
        // Thời gian eviction (milliseconds) - 0 nếu chưa bị evict
        private long evictionTimestamp;
        
        // Thời gian service bắt đầu UP (milliseconds)
        private long serviceUpTimestamp;
        
        /**
         * Constructor tạo lease mới.
         * 
         * @param r đối tượng được lease
         * @param durationInSecs thời hạn lease (giây)
         */
        public Lease(T r, int durationInSecs) {
            this.holder = r;
            this.registrationTimestamp = System.currentTimeMillis();
            this.lastRenewalTimestamp = registrationTimestamp;
            this.duration = durationInSecs * 1000L; // Convert to milliseconds
            this.evictionTimestamp = 0;
            this.serviceUpTimestamp = registrationTimestamp;
        }
        
        /**
         * Gia hạn lease bằng cách cập nhật timestamp renewal.
         * 
         * Đây là method được gọi khi nhận heartbeat từ instance.
         */
        public void renew() {
            this.lastRenewalTimestamp = System.currentTimeMillis();
        }
        
        /**
         * Cancel lease - đánh dấu thời điểm eviction.
         * 
         * Được gọi khi instance bị xóa khỏi registry.
         */
        public void cancel() {
            if (evictionTimestamp <= 0) {
                this.evictionTimestamp = System.currentTimeMillis();
            }
        }
        
        /**
         * Kiểm tra lease đã hết hạn chưa.
         * 
         * @return true nếu lease đã hết hạn
         */
        public boolean isExpired() {
            return isExpired(0);
        }
        
        /**
         * Kiểm tra lease đã hết hạn chưa với thời gian bổ sung.
         * 
         * @param additionalLeaseMs thời gian bổ sung (milliseconds)
         * @return true nếu lease đã hết hạn
         */
        public boolean isExpired(long additionalLeaseMs) {
            long currentTime = System.currentTimeMillis();
            return currentTime > (lastRenewalTimestamp + duration + additionalLeaseMs);
        }
        
        // Getters and Setters
        
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