package com.eureka.model;

/**
 * Enumeration representing the status of a service instance.
 * 
 * This enum defines the possible states that a service instance
 * can be in within the Eureka registry.
 */
public enum InstanceStatus {
    /**
     * Instance is up and ready to receive traffic.
     */
    UP,
    
    /**
     * Instance is down and should not receive traffic.
     */
    DOWN,
    
    /**
     * Instance is starting up and not yet ready to receive traffic.
     */
    STARTING,
    
    /**
     * Instance is temporarily out of service for maintenance or other reasons.
     */
    OUT_OF_SERVICE,
    
    /**
     * Instance status is unknown, typically used when status cannot be determined.
     */
    UNKNOWN;
    
    /**
     * Converts a string representation to InstanceStatus enum.
     * 
     * @param statusString the string representation of the status
     * @return the corresponding InstanceStatus enum value
     * @throws IllegalArgumentException if the string doesn't match any status
     */
    public static InstanceStatus fromString(String statusString) {
        if (statusString == null || statusString.trim().isEmpty()) {
            return UNKNOWN;
        }
        
        try {
            return valueOf(statusString.toUpperCase());
        } catch (IllegalArgumentException e) {
            return UNKNOWN;
        }
    }
    
    /**
     * Checks if the instance status indicates the instance is available for traffic.
     * 
     * @return true if the instance can receive traffic, false otherwise
     */
    public boolean isAvailable() {
        return this == UP;
    }
    
    /**
     * Checks if the instance status indicates the instance is healthy.
     * 
     * @return true if the instance is healthy, false otherwise
     */
    public boolean isHealthy() {
        return this == UP || this == STARTING;
    }
}