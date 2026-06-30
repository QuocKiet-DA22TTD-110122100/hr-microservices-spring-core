package com.hrservice.eureka.Domain.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.HashMap;
import java.util.Map;

/**
 * Represents data center information for a service instance.
 * 
 * This class contains information about the data center or cloud
 * environment where the service instance is running.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class DataCenterInfo {
    
    private DataCenterName name = DataCenterName.MyOwn;
    private Map<String, String> metadata = new HashMap<>();
    
    // Constructors
    public DataCenterInfo() {}
    
    public DataCenterInfo(DataCenterName name) {
        this.name = name;
    }
    
    // Getters and Setters
    public DataCenterName getName() {
        return name;
    }
    
    public void setName(DataCenterName name) {
        this.name = name;
    }
    
    public Map<String, String> getMetadata() {
        return metadata;
    }
    
    public void setMetadata(Map<String, String> metadata) {
        this.metadata = metadata;
    }
    
    // Utility methods
    public void addMetadata(String key, String value) {
        this.metadata.put(key, value);
    }
    
    public String getMetadata(String key) {
        return this.metadata.get(key);
    }
    
    /**
     * Enumeration of supported data center types.
     */
    public enum DataCenterName {
        /**
         * Netflix's own data center.
         */
        Netflix,
        
        /**
         * Amazon Web Services.
         */
        Amazon,
        
        /**
         * Custom or on-premises data center.
         */
        MyOwn
    }
    
    @Override
    public String toString() {
        return "DataCenterInfo{" +
                "name=" + name +
                ", metadata=" + metadata +
                '}';
    }
}