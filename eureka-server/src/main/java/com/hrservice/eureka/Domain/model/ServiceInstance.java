package com.hrservice.eureka.Domain.model;

import java.time.Instant;
import java.time.Duration;

/**
 * Represents a service instance in the Eureka registry.
 * 
 * This is a simplified version of InstanceInfo that uses java.time.Instant
 * for timestamp handling and includes basic lease management functionality.
 */
public class ServiceInstance {
    private String instanceId;
    private String serviceName;
    private String host;
    private int port;
    private Instant lastHeartbeat;
    private Instant registrationTime;
    private InstanceStatus status;

    /**
     * Enumeration representing the status of a service instance.
     */
    public enum InstanceStatus {
        UP, DOWN, OUT_OF_SERVICE, UNKNOWN
    }

    /**
     * Default constructor required for serialization/deserialization.
     */
    public ServiceInstance() {
        this.lastHeartbeat = Instant.now();
        this.registrationTime = Instant.now();
        this.status = InstanceStatus.UP;
    }

    /**
     * Creates a new ServiceInstance with the given ID and service name.
     * 
     * @param instanceId unique identifier for this instance
     * @param serviceName name of the service
     */
    public ServiceInstance(String instanceId, String serviceName) {
        this.instanceId = instanceId;
        this.serviceName = serviceName;
        this.lastHeartbeat = Instant.now();
        this.registrationTime = Instant.now();
        this.status = InstanceStatus.UP;
    }

    // Getters and Setters
    public String getInstanceId() { return instanceId; }
    public void setInstanceId(String instanceId) { this.instanceId = instanceId; }
    
    public String getServiceName() { return serviceName; }
    public void setServiceName(String serviceName) { this.serviceName = serviceName; }
    
    public String getHost() { return host; }
    public void setHost(String host) { this.host = host; }
    
    public int getPort() { return port; }
    public void setPort(int port) { this.port = port; }
    
    public Instant getLastHeartbeat() { return lastHeartbeat; }
    public void setLastHeartbeat(Instant lastHeartbeat) { this.lastHeartbeat = lastHeartbeat; }
    
    public Instant getRegistrationTime() { return registrationTime; }
    public void setRegistrationTime(Instant registrationTime) { this.registrationTime = registrationTime; }
    
    public InstanceStatus getStatus() { return status; }
    public void setStatus(InstanceStatus status) { this.status = status; }

    /**
     * Updates the heartbeat timestamp and sets status to UP.
     */
    public void updateHeartbeat() {
        this.lastHeartbeat = Instant.now();
        this.status = InstanceStatus.UP;
    }

    /**
     * Checks if the instance lease has expired.
     * 
     * @param leaseDuration the duration of the lease
     * @return true if the lease has expired, false otherwise
     */
    public boolean isExpired(Duration leaseDuration) {
        return Duration.between(lastHeartbeat, Instant.now()).compareTo(leaseDuration) > 0;
    }

    /**
     * Checks if the instance is available for traffic.
     * 
     * @return true if the instance is UP, false otherwise
     */
    public boolean isAvailable() {
        return this.status == InstanceStatus.UP;
    }

    /**
     * Gets the age of the last heartbeat in milliseconds.
     * 
     * @return time since last heartbeat in milliseconds
     */
    public long getTimeSinceLastHeartbeatMs() {
        return Duration.between(lastHeartbeat, Instant.now()).toMillis();
    }

    /**
     * Gets the age of the registration in milliseconds.
     * 
     * @return time since registration in milliseconds
     */
    public long getRegistrationAgeMs() {
        return Duration.between(registrationTime, Instant.now()).toMillis();
    }
    
    @Override
    public String toString() {
        return "ServiceInstance{" +
                "instanceId='" + instanceId + '\'' +
                ", serviceName='" + serviceName + '\'' +
                ", host='" + host + '\'' +
                ", port=" + port +
                ", status=" + status +
                '}';
    }
}

