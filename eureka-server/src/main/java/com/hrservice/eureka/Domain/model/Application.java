package com.hrservice.eureka.Domain.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;

/**
 * Represents one application and its instances.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class Application {
    
    private String name;

    private final Set<InstanceInfo> instances = new CopyOnWriteArraySet<>();

    private final Map<String, InstanceInfo> instancesMap = new ConcurrentHashMap<>();

    public Application() {}
    
    public Application(String name) {
        this.name = name;
    }
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    /**
     * Returns all instances as a list.
     */
    public List<InstanceInfo> getInstances() {
        return new ArrayList<>(instances);
    }
    
    /**
     * Returns instances in Eureka-compatible form.
     */
    public List<InstanceInfo> getInstancesAsIsFromEureka() {
        return getInstances();
    }
    
    /**
     * Replaces the current instance list.
     */
    public void setInstances(List<InstanceInfo> instances) {
        this.instances.clear();
        this.instancesMap.clear();
        
        if (instances != null) {
            for (InstanceInfo instance : instances) {
                addInstance(instance);
            }
        }
    }
    
    /**
     * Adds one instance to this application.
     */
    public void addInstance(InstanceInfo instance) {
        if (instance != null) {
            instances.add(instance);

            instancesMap.put(instance.getInstanceId(), instance);
        }
    }
    
    /**
     * Removes one instance from this application.
     */
    public boolean removeInstance(InstanceInfo instance) {
        if (instance != null) {
            boolean removed = instances.remove(instance);

            instancesMap.remove(instance.getInstanceId());

            return removed;
        }
        return false;
    }
    
    /**
     * Removes one instance by id.
     */
    public InstanceInfo removeInstance(String instanceId) {
        InstanceInfo instance = instancesMap.remove(instanceId);
        
        if (instance != null) {
            instances.remove(instance);
        }
        
        return instance;
    }
    
    /**
     * Returns one instance by id.
     */
    public InstanceInfo getByInstanceId(String instanceId) {
        return instancesMap.get(instanceId);
    }
    
    /**
     * Returns the number of instances.
     */
    public int size() {
        return instances.size();
    }
    
    /**
     * Returns whether the application has any instances.
     */
    public boolean isEmpty() {
        return instances.isEmpty();
    }
    
    // Query methods
    
    /**
     * Returns instances filtered by status.
     */
    public List<InstanceInfo> getInstancesByStatus(InstanceStatus status) {
        return instances.stream()
                .filter(instance -> instance.getStatus() == status)
                .collect(ArrayList::new, ArrayList::add, ArrayList::addAll);
    }
    
    /**
     * Returns only UP instances.
     */
    public List<InstanceInfo> getAvailableInstances() {
        return getInstancesByStatus(InstanceStatus.UP);
    }
    
    /**
     * Returns instances matching the given metadata.
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
     * Returns instances for one availability zone.
     */
    public List<InstanceInfo> getInstancesByZone(String zone) {
        return getInstancesByMetadata("zone", zone);
    }
    
    /**
     * Returns shuffled instances for load balancing.
     */
    public List<InstanceInfo> getShuffledInstances() {
        List<InstanceInfo> shuffled = getInstances();
        Collections.shuffle(shuffled);
        return shuffled;
    }
    
    /**
     * Returns shuffled UP instances.
     */
    public List<InstanceInfo> getShuffledAvailableInstances() {
        List<InstanceInfo> available = getAvailableInstances();
        Collections.shuffle(available);
        return available;
    }
    
    /**
     * Returns whether any instance is UP.
     */
    public boolean hasAvailableInstances() {
        return instances.stream()
                .anyMatch(instance -> instance.getStatus() == InstanceStatus.UP);
    }
    
    /**
     * Counts instances by status.
     */
    public long countInstancesByStatus(InstanceStatus status) {
        return instances.stream()
                .filter(instance -> instance.getStatus() == status)
                .count();
    }
    
    /**
     * Returns status statistics for all instances.
     */
    public Map<InstanceStatus, Long> getStatusStatistics() {
        Map<InstanceStatus, Long> stats = new HashMap<>();
        
        for (InstanceStatus status : InstanceStatus.values()) {
            stats.put(status, 0L);
        }
        
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