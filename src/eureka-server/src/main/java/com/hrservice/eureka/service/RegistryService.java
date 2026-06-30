package com.hrservice.eureka.service;

import java.util.List;

import com.hrservice.eureka.Domain.model.InstanceInfo;
import com.hrservice.eureka.Domain.model.InstanceStatus;

public interface RegistryService {
    
    /**
     * Registers a new service instance with the registry.
     * 
     * @param instance the instance information to register
     * @param leaseDuration the lease duration in seconds
     * @param isReplication true if this is a replication from another Eureka server
     */
    void register(InstanceInfo instance, int leaseDuration, boolean isReplication);
    
    /**
     * Registers a new service instance with default lease duration.
     * 
     * @param instance the instance information to register
     */
    default void register(InstanceInfo instance) {
        register(instance, instance.getLeaseInfo().getDurationInSecs(), false);
    }
    
    /**
     * Deregisters a service instance from the registry.
     * 
     * @param appName the application name
     * @param instanceId the instance ID
     * @param isReplication true if this is a replication from another Eureka server
     * @return true if the instance was successfully deregistered, false otherwise
     */
    boolean deregister(String appName, String instanceId, boolean isReplication);
    
    /**
     * Deregisters a service instance from the registry.
     * 
     * @param appName the application name
     * @param instanceId the instance ID
     * @return true if the instance was successfully deregistered, false otherwise
     */
    default boolean deregister(String appName, String instanceId) {
        return deregister(appName, instanceId, false);
    }
    
    /**
     * Renews the lease for a service instance.
     * 
     * @param appName the application name
     * @param instanceId the instance ID
     * @param isReplication true if this is a replication from another Eureka server
     * @return true if the lease was successfully renewed, false otherwise
     */
    boolean renew(String appName, String instanceId, boolean isReplication);
    
    /**
     * Renews the lease for a service instance.
     * 
     * @param appName the application name
     * @param instanceId the instance ID
     * @return true if the lease was successfully renewed, false otherwise
     */
    default boolean renew(String appName, String instanceId) {
        return renew(appName, instanceId, false);
    }
    
    /**
     * Updates the status of a service instance.
     * 
     * @param appName the application name
     * @param instanceId the instance ID
     * @param newStatus the new status
     * @param lastDirtyTimestamp the timestamp when the status was last updated
     * @param isReplication true if this is a replication from another Eureka server
     * @return true if the status was successfully updated, false otherwise
     */
    boolean updateStatus(String appName, String instanceId, InstanceStatus newStatus, 
                        String lastDirtyTimestamp, boolean isReplication);
    
    /**
     * Updates the status of a service instance.
     * 
     * @param appName the application name
     * @param instanceId the instance ID
     * @param newStatus the new status
     * @return true if the status was successfully updated, false otherwise
     */
    default boolean updateStatus(String appName, String instanceId, InstanceStatus newStatus) {
        return updateStatus(appName, instanceId, newStatus, null, false);
    }
    
    /**
     * Gets all instances for a specific application.
     * 
     * @param appName the application name
     * @return list of instances for the application, empty list if none found
     */
    List<InstanceInfo> getInstances(String appName);
    
    /**
     * Gets a specific instance by application name and instance ID.
     * 
     * @param appName the application name
     * @param instanceId the instance ID
     * @return the instance information, or null if not found
     */
    InstanceInfo getInstance(String appName, String instanceId);
    
    /**
     * Gets all instances across all applications.
     * 
     * @return list of all registered instances
     */
    List<InstanceInfo> getAllInstances();
    
    /**
     * Gets all application names currently registered.
     * 
     * @return list of application names
     */
    List<String> getApplicationNames();
    
    /**
     * Gets the total number of registered instances.
     * 
     * @return the total count of instances
     */
    int getInstanceCount();
    
    /**
     * Gets the number of instances for a specific application.
     * 
     * @param appName the application name
     * @return the count of instances for the application
     */
    int getInstanceCount(String appName);
    
    /**
     * Checks if an application has any registered instances.
     * 
     * @param appName the application name
     * @return true if the application has instances, false otherwise
     */
    boolean hasApplication(String appName);
    
    /**
     * Checks if a specific instance is registered.
     * 
     * @param appName the application name
     * @param instanceId the instance ID
     * @return true if the instance is registered, false otherwise
     */
    boolean hasInstance(String appName, String instanceId);
}