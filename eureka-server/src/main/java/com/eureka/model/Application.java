package com.eureka.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;

/**
 * Đại diện cho một ứng dụng/service với tất cả các instances của nó.
 * 
 * Class này quản lý tất cả instances của một service cụ thể đã đăng ký với Eureka,
 * cung cấp các operations thread-safe để thêm, xóa và truy vấn instances.
 * 
 * Ví dụ: Application "USER-SERVICE" có thể chứa:
 * - user-001 (192.168.1.10:8080)
 * - user-002 (192.168.1.11:8080) 
 * - user-003 (192.168.1.12:8080)
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class Application {
    
    // Tên của application/service (ví dụ: "USER-SERVICE", "ORDER-SERVICE")
    private String name;
    
    // Set chứa tất cả instances - dùng CopyOnWriteArraySet để thread-safe
    // CopyOnWriteArraySet: Tối ưu cho read-heavy workload (nhiều đọc, ít ghi)
    private final Set<InstanceInfo> instances = new CopyOnWriteArraySet<>();
    
    // Map để truy cập nhanh instance theo instanceId
    // ConcurrentHashMap: Thread-safe, performance cao cho concurrent access
    private final Map<String, InstanceInfo> instancesMap = new ConcurrentHashMap<>();
    
    // Constructors
    public Application() {}
    
    public Application(String name) {
        this.name = name;
    }
    
    // Getters and Setters
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    /**
     * Lấy tất cả instances dưới dạng list.
     * 
     * @return danh sách tất cả instances (copy để tránh modification)
     */
    public List<InstanceInfo> getInstances() {
        return new ArrayList<>(instances);
    }
    
    /**
     * Lấy instances như cách Eureka lưu trữ (để tương thích).
     * 
     * @return danh sách instances như được lưu trong Eureka
     */
    public List<InstanceInfo> getInstancesAsIsFromEureka() {
        return getInstances();
    }
    
    /**
     * Thiết lập danh sách instances cho application này.
     * 
     * @param instances danh sách instances cần thiết lập
     */
    public void setInstances(List<InstanceInfo> instances) {
        // Xóa tất cả instances hiện tại
        this.instances.clear();
        this.instancesMap.clear();
        
        // Thêm từng instance mới
        if (instances != null) {
            for (InstanceInfo instance : instances) {
                addInstance(instance);
            }
        }
    }
    
    // Instance management methods
    
    /**
     * Thêm một instance vào application này.
     * 
     * Quy trình xử lý:
     * 1. Kiểm tra instance không null
     * 2. Thêm vào Set instances (tự động deduplicate)
     * 3. Thêm vào Map để truy cập nhanh theo instanceId
     * 
     * @param instance instance cần thêm
     */
    public void addInstance(InstanceInfo instance) {
        if (instance != null) {
            // Thêm vào Set - CopyOnWriteArraySet tự động handle thread-safety
            instances.add(instance);
            
            // Thêm vào Map để lookup nhanh - ConcurrentHashMap thread-safe
            instancesMap.put(instance.getInstanceId(), instance);
        }
    }
    
    /**
     * Xóa một instance khỏi application.
     * 
     * Quy trình xử lý:
     * 1. Xóa khỏi Set instances
     * 2. Xóa khỏi Map instancesMap
     * 3. Trả về true nếu thành công
     * 
     * @param instance instance cần xóa
     * @return true nếu instance được xóa thành công, false nếu không tìm thấy
     */
    public boolean removeInstance(InstanceInfo instance) {
        if (instance != null) {
            // Xóa khỏi Set
            boolean removed = instances.remove(instance);
            
            // Xóa khỏi Map
            instancesMap.remove(instance.getInstanceId());
            
            return removed;
        }
        return false;
    }
    
    /**
     * Xóa instance theo instanceId.
     * 
     * @param instanceId ID của instance cần xóa
     * @return instance đã bị xóa, hoặc null nếu không tìm thấy
     */
    public InstanceInfo removeInstance(String instanceId) {
        // Tìm và xóa khỏi Map trước
        InstanceInfo instance = instancesMap.remove(instanceId);
        
        if (instance != null) {
            // Xóa khỏi Set
            instances.remove(instance);
        }
        
        return instance;
    }
    
    /**
     * Lấy instance theo instanceId.
     * 
     * Sử dụng Map để truy cập O(1) thay vì duyệt Set O(n).
     * 
     * @param instanceId ID của instance
     * @return instance tương ứng, hoặc null nếu không tìm thấy
     */
    public InstanceInfo getByInstanceId(String instanceId) {
        return instancesMap.get(instanceId);
    }
    
    /**
     * Lấy số lượng instances trong application.
     * 
     * @return số lượng instances
     */
    public int size() {
        return instances.size();
    }
    
    /**
     * Kiểm tra application có instances hay không.
     * 
     * @return true nếu không có instances, false nếu có
     */
    public boolean isEmpty() {
        return instances.isEmpty();
    }
    
    // Query methods - Các phương thức truy vấn nâng cao
    
    /**
     * Lấy instances theo trạng thái cụ thể.
     * 
     * Sử dụng Stream API để filter hiệu quả.
     * 
     * @param status trạng thái cần lọc (UP, DOWN, OUT_OF_SERVICE, etc.)
     * @return danh sách instances có trạng thái tương ứng
     */
    public List<InstanceInfo> getInstancesByStatus(InstanceStatus status) {
        return instances.stream()
                .filter(instance -> instance.getStatus() == status)
                .collect(ArrayList::new, ArrayList::add, ArrayList::addAll);
    }
    
    /**
     * Lấy instances đang sẵn sàng phục vụ traffic (trạng thái UP).
     * 
     * Đây là method quan trọng nhất cho service discovery.
     * Client chỉ quan tâm đến instances UP.
     * 
     * @return danh sách instances có trạng thái UP
     */
    public List<InstanceInfo> getAvailableInstances() {
        return getInstancesByStatus(InstanceStatus.UP);
    }
    
    /**
     * Lấy instances theo metadata cụ thể.
     * 
     * Ví dụ: Lấy instances trong zone "us-east-1a"
     * getInstancesByMetadata("zone", "us-east-1a")
     * 
     * @param metadataKey key của metadata cần tìm
     * @param metadataValue value của metadata cần match
     * @return danh sách instances có metadata tương ứng
     */
    public List<InstanceInfo> getInstancesByMetadata(String metadataKey, String metadataValue) {
        return instances.stream()
                .filter(instance -> {
                    String value = instance.getMetadata().get(metadataKey);
                    return Objects.equals(value, metadataValue);
                })
                .collect(ArrayList::new, ArrayList::add, ArrayList::addAll);
    }
    
    /**
     * Lấy instances trong availability zone cụ thể.
     * 
     * Đây là shortcut cho getInstancesByMetadata("zone", zone).
     * Zone-aware load balancing là pattern quan trọng trong cloud.
     * 
     * @param zone availability zone cần tìm
     * @return danh sách instances trong zone đó
     */
    public List<InstanceInfo> getInstancesByZone(String zone) {
        return getInstancesByMetadata("zone", zone);
    }
    
    /**
     * Lấy danh sách instances đã được shuffle (xáo trộn) cho load balancing.
     * 
     * Mục đích: Tránh tất cả clients đều gọi instance đầu tiên.
     * Random distribution giúp cân bằng tải tốt hơn.
     * 
     * @return danh sách instances đã được xáo trộn
     */
    public List<InstanceInfo> getShuffledInstances() {
        List<InstanceInfo> shuffled = getInstances();
        Collections.shuffle(shuffled);
        return shuffled;
    }
    
    /**
     * Lấy danh sách instances UP đã được shuffle.
     * 
     * Kết hợp 2 yêu cầu:
     * 1. Chỉ lấy instances sẵn sàng (UP)
     * 2. Shuffle để load balancing
     * 
     * @return danh sách instances UP đã xáo trộn
     */
    public List<InstanceInfo> getShuffledAvailableInstances() {
        List<InstanceInfo> available = getAvailableInstances();
        Collections.shuffle(available);
        return available;
    }
    
    /**
     * Kiểm tra có instance nào đang UP không.
     * 
     * Dùng để quick check xem service có available không
     * mà không cần lấy full list.
     * 
     * @return true nếu có ít nhất 1 instance UP
     */
    public boolean hasAvailableInstances() {
        return instances.stream()
                .anyMatch(instance -> instance.getStatus() == InstanceStatus.UP);
    }
    
    /**
     * Đếm số instances theo trạng thái.
     * 
     * Hữu ích cho monitoring và health check.
     * 
     * @param status trạng thái cần đếm
     * @return số lượng instances có trạng thái đó
     */
    public long countInstancesByStatus(InstanceStatus status) {
        return instances.stream()
                .filter(instance -> instance.getStatus() == status)
                .count();
    }
    
    /**
     * Lấy thống kê trạng thái của tất cả instances.
     * 
     * Trả về Map: InstanceStatus -> Count
     * Ví dụ: {UP=3, DOWN=1, OUT_OF_SERVICE=0}
     * 
     * @return map chứa thống kê trạng thái
     */
    public Map<InstanceStatus, Long> getStatusStatistics() {
        Map<InstanceStatus, Long> stats = new HashMap<>();
        
        // Khởi tạo tất cả status với count = 0
        for (InstanceStatus status : InstanceStatus.values()) {
            stats.put(status, 0L);
        }
        
        // Đếm thực tế
        for (InstanceInfo instance : instances) {
            InstanceStatus status = instance.getStatus();
            stats.put(status, stats.get(status) + 1);
        }
        
        return stats;
    }
    
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Application that = (Application) o;
        return Objects.equals(name, that.name);
    }
    
    @Override
    public int hashCode() {
        return Objects.hash(name);
    }
    
    @Override
    public String toString() {
        return "Application{" +
                "name='" + name + '\'' +
                ", instanceCount=" + instances.size() +
                '}';
    }
}