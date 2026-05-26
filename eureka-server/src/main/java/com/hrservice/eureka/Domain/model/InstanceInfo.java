package com.hrservice.eureka.Domain.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

import java.util.HashMap;
import java.util.Map;
import java.util.Objects;

@JsonIgnoreProperties(ignoreUnknown = true)
public class InstanceInfo {
    
    @NotBlank(message = "Bat buoc nhap Instance ID")
    private String instanceId;
    
    @NotBlank(message = "Bat buoc nhap ten ung dung")
    private String appName;
    
    @NotBlank(message = "Bat buoc nhap dia chi IP")
    private String ipAddr;
    
    @Min(value = 1, message = "Port phai nam trong khoang tu 1 den 65535")
    @Max(value = 65535, message = "Port phai nam trong khoang tu 1 den 65535")
    private int port;
    
    @Min(value = 1, message = "Secure port phai nam trong khoang tu 1 den 65535")
    @Max(value = 65535, message = "Secure port phai nam trong khoang tu 1 den 65535")
    private int securePort;
    
    private String homePageUrl;
    private String statusPageUrl;
    private String healthCheckUrl;
    private String secureHealthCheckUrl;
    
    @NotNull(message = "Bat buoc nhap trang thai instance")
    private InstanceStatus status = InstanceStatus.UP;
    
    private Map<String, String> metadata = new HashMap<>();
    
    @NotNull(message = "Bat buoc nhap thong tin lease")
    private LeaseInfo leaseInfo = new LeaseInfo();
    
    private DataCenterInfo dataCenterInfo = new DataCenterInfo();
    
    // Constructors
    public InstanceInfo() {}
    
    public InstanceInfo(String instanceId, String appName, String ipAddr, int port) {
        this.instanceId = instanceId;
        this.appName = appName;
        this.ipAddr = ipAddr;
        this.port = port;
        this.securePort = port + 1000; // Default secure port
        this.leaseInfo = new LeaseInfo();
        this.dataCenterInfo = new DataCenterInfo();
    }
    
    // Builder pattern
    public static Builder newBuilder() {
        return new Builder();
    }
    
    public static class Builder {
        private InstanceInfo instance = new InstanceInfo();
        
        public Builder setInstanceId(String instanceId) {
            instance.instanceId = instanceId;
            return this;
        }
        
        public Builder setAppName(String appName) {
            instance.appName = appName;
            return this;
        }
        
        public Builder setIPAddr(String ipAddr) {
            instance.ipAddr = ipAddr;
            return this;
        }
        
        public Builder setPort(int port) {
            instance.port = port;
            return this;
        }
        
        public Builder setSecurePort(int securePort) {
            instance.securePort = securePort;
            return this;
        }
        
        public Builder setHomePageUrl(String homePageUrl) {
            instance.homePageUrl = homePageUrl;
            return this;
        }
        
        public Builder setStatusPageUrl(String statusPageUrl) {
            instance.statusPageUrl = statusPageUrl;
            return this;
        }
        
        public Builder setHealthCheckUrl(String healthCheckUrl) {
            instance.healthCheckUrl = healthCheckUrl;
            return this;
        }
        
        public Builder setSecureHealthCheckUrl(String secureHealthCheckUrl) {
            instance.secureHealthCheckUrl = secureHealthCheckUrl;
            return this;
        }
        
        public Builder setStatus(InstanceStatus status) {
            instance.status = status;
            return this;
        }
        
        public Builder setMetadata(Map<String, String> metadata) {
            instance.metadata = new HashMap<>(metadata);
            return this;
        }
        
        public Builder addMetadata(String key, String value) {
            instance.metadata.put(key, value);
            return this;
        }
        
        public Builder setLeaseInfo(LeaseInfo leaseInfo) {
            instance.leaseInfo = leaseInfo;
            return this;
        }
        
        public Builder setDataCenterInfo(DataCenterInfo dataCenterInfo) {
            instance.dataCenterInfo = dataCenterInfo;
            return this;
        }
        
        public InstanceInfo build() {
            // Set default URLs if not provided
            if (instance.homePageUrl == null && instance.ipAddr != null && instance.port > 0) {
                instance.homePageUrl = String.format("http://%s:%d/", instance.ipAddr, instance.port);
            }
            if (instance.statusPageUrl == null && instance.ipAddr != null && instance.port > 0) {
                instance.statusPageUrl = String.format("http://%s:%d/actuator/info", instance.ipAddr, instance.port);
            }
            if (instance.healthCheckUrl == null && instance.ipAddr != null && instance.port > 0) {
                instance.healthCheckUrl = String.format("http://%s:%d/actuator/health", instance.ipAddr, instance.port);
            }
            
            return instance;
        }
    }
    
    // Getters and Setters
    public String getInstanceId() { return instanceId; }
    public void setInstanceId(String instanceId) { this.instanceId = instanceId; }
    
    public String getAppName() { return appName; }
    public void setAppName(String appName) { this.appName = appName; }
    
    public String getIpAddr() { return ipAddr; }
    public void setIpAddr(String ipAddr) { this.ipAddr = ipAddr; }
    
    public int getPort() { return port; }
    public void setPort(int port) { this.port = port; }
    
    public int getSecurePort() { return securePort; }
    public void setSecurePort(int securePort) { this.securePort = securePort; }
    
    public String getHomePageUrl() { return homePageUrl; }
    public void setHomePageUrl(String homePageUrl) { this.homePageUrl = homePageUrl; }
    
    public String getStatusPageUrl() { return statusPageUrl; }
    public void setStatusPageUrl(String statusPageUrl) { this.statusPageUrl = statusPageUrl; }
    
    public String getHealthCheckUrl() { return healthCheckUrl; }
    public void setHealthCheckUrl(String healthCheckUrl) { this.healthCheckUrl = healthCheckUrl; }
    
    public String getSecureHealthCheckUrl() { return secureHealthCheckUrl; }
    public void setSecureHealthCheckUrl(String secureHealthCheckUrl) { this.secureHealthCheckUrl = secureHealthCheckUrl; }
    
    public InstanceStatus getStatus() { return status; }
    public void setStatus(InstanceStatus status) { this.status = status; }
    
    public Map<String, String> getMetadata() { return metadata; }
    public void setMetadata(Map<String, String> metadata) { this.metadata = metadata; }
    
    public LeaseInfo getLeaseInfo() { return leaseInfo; }
    public void setLeaseInfo(LeaseInfo leaseInfo) { this.leaseInfo = leaseInfo; }
    
    public DataCenterInfo getDataCenterInfo() { return dataCenterInfo; }
    public void setDataCenterInfo(DataCenterInfo dataCenterInfo) { this.dataCenterInfo = dataCenterInfo; }
    
    // Utility methods
    public String getId() {
        return instanceId;
    }
    
    /**
     * Sets the instance status with timestamp update.
     */
    public void setStatus(InstanceStatus status, long timestamp) {
        this.status = status;
        if (leaseInfo != null) {
            leaseInfo.setLastRenewalTimestamp(timestamp);
        }
    }
    
    public boolean isPortEnabled(PortType portType) {
        return portType == PortType.SECURE ? securePort > 0 : port > 0;
    }
    
    public int getPortByType(PortType portType) {
        return portType == PortType.SECURE ? securePort : port;
    }
    
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        InstanceInfo that = (InstanceInfo) o;
        return Objects.equals(instanceId, that.instanceId) &&
               Objects.equals(appName, that.appName);
    }
    
    @Override
    public int hashCode() {
        return Objects.hash(instanceId, appName);
    }
    
    @Override
    public String toString() {
        return "InstanceInfo{" +
                "instanceId='" + instanceId + '\'' +
                ", appName='" + appName + '\'' +
                ", ipAddr='" + ipAddr + '\'' +
                ", port=" + port +
                ", status=" + status +
                '}';
    }
    
    public enum PortType {
        SECURE, UNSECURE
    }
}