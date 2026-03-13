package com.eureka.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * Đại diện cho thông tin lease (hợp đồng thuê) của một service instance.
 * 
 * Lease là cơ chế quan trọng trong Eureka để quản lý lifecycle của instances:
 * - Instance đăng ký → Tạo lease với thời hạn (thường 90 giây)
 * - Instance gửi heartbeat → Gia hạn lease
 * - Không có heartbeat → Lease hết hạn → Instance bị xóa
 * 
 * Đây là cơ chế "fail-fast" để phát hiện instances chết nhanh chóng.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class LeaseInfo {
    
    /**
     * Interval mặc định giữa các lần gửi heartbeat (30 giây).
     * 
     * Tại sao 30 giây?
     * - Đủ nhanh để phát hiện failure sớm
     * - Không quá nhanh gây overhead network
     * - Cân bằng giữa responsiveness và efficiency
     */
    public static final int DEFAULT_LEASE_RENEWAL_INTERVAL = 30;
    
    /**
     * Thời hạn lease mặc định (90 giây).
     * 
     * Tại sao 90 giây?
     * - 3 lần heartbeat interval (30s x 3 = 90s)
     * - Cho phép miss 2 heartbeats trước khi evict
     * - Tránh false positive do network hiccup tạm thời
     */
    public static final int DEFAULT_LEASE_DURATION = 90;
    
    // Interval giữa các lần renewal (giây)
    private int renewalIntervalInSecs = DEFAULT_LEASE_RENEWAL_INTERVAL;
    
    // Thời hạn lease (giây) - sau thời gian này mà không renew thì expired
    private int durationInSecs = DEFAULT_LEASE_DURATION;
    
    // Timestamp khi instance đăng ký lần đầu
    private long registrationTimestamp;
    
    // Timestamp của lần renewal cuối cùng
    private long lastRenewalTimestamp;
    
    // Timestamp khi instance bị evict (xóa khỏi registry)
    private long evictionTimestamp;
    
    // Timestamp khi service bắt đầu UP và sẵn sàng phục vụ
    private long serviceUpTimestamp;
    
    // Constructors
    
    /**
     * Constructor mặc định.
     * 
     * Khởi tạo tất cả timestamps với thời gian hiện tại.
     * Giả định instance vừa đăng ký và đang sống.
     */
    public LeaseInfo() {
        long currentTime = System.currentTimeMillis();
        this.registrationTimestamp = currentTime;
        this.lastRenewalTimestamp = currentTime;
        this.serviceUpTimestamp = currentTime;
    }
    
    /**
     * Constructor với custom renewal interval và duration.
     * 
     * @param renewalIntervalInSecs interval giữa các heartbeat (giây)
     * @param durationInSecs thời hạn lease (giây)
     */
    public LeaseInfo(int renewalIntervalInSecs, int durationInSecs) {
        this(); // Gọi constructor mặc định để set timestamps
        this.renewalIntervalInSecs = renewalIntervalInSecs;
        this.durationInSecs = durationInSecs;
    }
    
    // Getters and Setters với comment giải thích
    
    /**
     * Lấy interval giữa các lần renewal.
     * 
     * @return interval tính bằng giây
     */
    public int getRenewalIntervalInSecs() {
        return renewalIntervalInSecs;
    }
    
    /**
     * Thiết lập interval giữa các lần renewal.
     * 
     * @param renewalIntervalInSecs interval mới (giây)
     */
    public void setRenewalIntervalInSecs(int renewalIntervalInSecs) {
        this.renewalIntervalInSecs = renewalIntervalInSecs;
    }
    
    /**
     * Lấy thời hạn lease.
     * 
     * @return thời hạn tính bằng giây
     */
    public int getDurationInSecs() {
        return durationInSecs;
    }
    
    /**
     * Thiết lập thời hạn lease.
     * 
     * @param durationInSecs thời hạn mới (giây)
     */
    public void setDurationInSecs(int durationInSecs) {
        this.durationInSecs = durationInSecs;
    }
    
    /**
     * Lấy timestamp đăng ký.
     * 
     * @return timestamp (milliseconds since epoch)
     */
    public long getRegistrationTimestamp() {
        return registrationTimestamp;
    }
    
    /**
     * Thiết lập timestamp đăng ký.
     * 
     * @param registrationTimestamp timestamp mới
     */
    public void setRegistrationTimestamp(long registrationTimestamp) {
        this.registrationTimestamp = registrationTimestamp;
    }
    
    /**
     * Lấy timestamp renewal cuối cùng.
     * 
     * @return timestamp của heartbeat cuối
     */
    public long getLastRenewalTimestamp() {
        return lastRenewalTimestamp;
    }
    
    /**
     * Thiết lập timestamp renewal cuối cùng.
     * 
     * @param lastRenewalTimestamp timestamp mới
     */
    public void setLastRenewalTimestamp(long lastRenewalTimestamp) {
        this.lastRenewalTimestamp = lastRenewalTimestamp;
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
    
    // Utility methods - Các phương thức tiện ích quan trọng
    
    /**
     * Gia hạn lease bằng cách cập nhật timestamp renewal.
     * 
     * Đây là method được gọi khi nhận heartbeat từ instance.
     * Cập nhật lastRenewalTimestamp = hiện tại, có nghĩa là:
     * - Instance vẫn sống
     * - Lease được gia hạn thêm {durationInSecs} giây
     */
    public void renew() {
        this.lastRenewalTimestamp = System.currentTimeMillis();
    }
    
    /**
     * Kiểm tra lease đã hết hạn chưa (không có additional time).
     * 
     * @return true nếu lease đã hết hạn
     */
    public boolean isExpired() {
        return isExpired(0);
    }
    
    /**
     * Kiểm tra lease đã hết hạn chưa với thời gian bổ sung.
     * 
     * Công thức: currentTime > (lastRenewalTimestamp + durationInSecs*1000 + additionalLeaseMs)
     * 
     * Tại sao cần additionalLeaseMs?
     * - Để xử lý clock skew giữa các servers
     * - Để có grace period trong quá trình maintenance
     * - Để tránh race condition khi network lag
     * 
     * @param additionalLeaseMs thời gian bổ sung (milliseconds)
     * @return true nếu lease đã hết hạn
     */
    public boolean isExpired(long additionalLeaseMs) {
        long currentTime = System.currentTimeMillis();
        long leaseExpirationTime = lastRenewalTimestamp + (durationInSecs * 1000L) + additionalLeaseMs;
        return currentTime > leaseExpirationTime;
    }
    
    /**
     * Lấy thời gian còn lại trước khi lease hết hạn.
     * 
     * Hữu ích để:
     * - Monitoring và alerting
     * - Quyết định khi nào cần gửi heartbeat tiếp theo
     * - Debug lease expiration issues
     * 
     * @return thời gian còn lại (milliseconds), hoặc 0 nếu đã hết hạn
     */
    public long getTimeRemainingMs() {
        long currentTime = System.currentTimeMillis();
        long leaseExpirationTime = lastRenewalTimestamp + (durationInSecs * 1000L);
        long remaining = leaseExpirationTime - currentTime;
        return Math.max(0, remaining);
    }
    
    /**
     * Lấy thời gian từ lần renewal cuối cùng.
     * 
     * Hữu ích để:
     * - Monitoring health của instance
     * - Phát hiện instances có vấn đề (gửi heartbeat không đều)
     * - Debugging network issues
     * 
     * @return thời gian từ renewal cuối (milliseconds)
     */
    public long getTimeSinceLastRenewalMs() {
        return System.currentTimeMillis() - lastRenewalTimestamp;
    }
    
    /**
     * Lấy tuổi của registration (thời gian từ khi đăng ký).
     * 
     * @return thời gian từ khi đăng ký (milliseconds)
     */
    public long getRegistrationAgeMs() {
        return System.currentTimeMillis() - registrationTimestamp;
    }
    
    /**
     * Lấy uptime của service (thời gian từ khi UP).
     * 
     * @return thời gian service đã UP (milliseconds)
     */
    public long getServiceUptimeMs() {
        if (serviceUpTimestamp <= 0) {
            return 0;
        }
        return System.currentTimeMillis() - serviceUpTimestamp;
    }
    
    /**
     * Kiểm tra instance có đang trong grace period không.
     * 
     * Grace period = thời gian ngay sau khi đăng ký, trong đó
     * ta không evict instance ngay cả khi không có heartbeat.
     * 
     * Mục đích: Cho instance thời gian khởi động và ổn định.
     * 
     * @param gracePeriodMs thời gian grace period (milliseconds)
     * @return true nếu đang trong grace period
     */
    public boolean isInGracePeriod(long gracePeriodMs) {
        return getRegistrationAgeMs() < gracePeriodMs;
    }
    
    /**
     * Tính tỷ lệ renewal so với expected.
     * 
     * Ví dụ: Nếu expected 2 renewals/phút nhưng chỉ có 1.5 renewals/phút
     * thì tỷ lệ = 0.75 (75%)
     * 
     * @param windowMs cửa sổ thời gian để tính (milliseconds)
     * @return tỷ lệ renewal (0.0 - 1.0+)
     */
    public double getRenewalRate(long windowMs) {
        long timeSinceLastRenewal = getTimeSinceLastRenewalMs();
        if (timeSinceLastRenewal >= windowMs) {
            return 0.0; // Không có renewal trong window
        }
        
        // Tính expected renewals trong window
        double expectedRenewals = (double) windowMs / (renewalIntervalInSecs * 1000.0);
        
        // Tính actual renewals (simplified - trong thực tế cần track history)
        double actualRenewals = 1.0; // Ít nhất có 1 renewal gần đây
        
        return actualRenewals / expectedRenewals;
    }
    
    @Override
    public String toString() {
        return "LeaseInfo{" +
                "renewalIntervalInSecs=" + renewalIntervalInSecs +
                ", durationInSecs=" + durationInSecs +
                ", registrationTimestamp=" + registrationTimestamp +
                ", lastRenewalTimestamp=" + lastRenewalTimestamp +
                ", evictionTimestamp=" + evictionTimestamp +
                ", serviceUpTimestamp=" + serviceUpTimestamp +
                '}';
    }
}