package com.eureka.controller;

import com.eureka.Domain.model.Application;
import com.eureka.Domain.model.InstanceInfo;
import com.eureka.Domain.model.InstanceStatus;
import com.eureka.exception.ResourceNotFoundException;
import com.eureka.service.RegistryService;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

/**
 * REST API Controller for service discovery operations.
 * 
 * This controller handles service discovery requests, providing information
 * about registered service instances and applications.
 * 
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4
 */
@RestController
@RequestMapping("/eureka/apps")
public class DiscoveryController {
    
    private static final Logger logger = LoggerFactory.getLogger(DiscoveryController.class);
    
    private final RegistryService serviceRegistry;
    
    // Simple delta tracking - in production this would be more sophisticated
    private volatile long lastDeltaGeneration = System.currentTimeMillis();
    private final Map<String, Long> instanceLastModified = new HashMap<>();
    
    public DiscoveryController(RegistryService serviceRegistry) {
        this.serviceRegistry = serviceRegistry;
    }
    
    /**
     * Gets all registered applications and their instances.
     * 
     * GET /eureka/apps
     * 
     * @param regions optional regions filter (not implemented in this version)
     * @return applications response containing all registered applications
     */
    @GetMapping
    public ResponseEntity<ApplicationsResponse> getAllApplications(
            @RequestParam(value = "regions", required = false) String regions) {
        
        logger.debug("Received request for all applications");
        
        try {
            List<String> applicationNames = serviceRegistry.getApplicationNames();
            List<Application> applications = new ArrayList<>();
            
            for (String appName : applicationNames) {
                List<InstanceInfo> instances = serviceRegistry.getInstances(appName);
                if (!instances.isEmpty()) {
                    Application application = new Application(appName);
                    application.setInstances(instances);
                    applications.add(application);
                }
            }
            
            ApplicationsResponse response = new ApplicationsResponse();
            response.setApplications(applications);
            response.setVersionsDelta(1L);
            response.setAppsHashcode(generateHashCode(applications));
            
            logger.debug("Returning {} applications with {} total instances", 
                        applications.size(), 
                        applications.stream().mapToInt(Application::size).sum());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error retrieving all applications: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Gets a specific application and its instances.
     * 
     * GET /eureka/apps/{appName}
     * 
     * @param appName the application name
     * @return application response containing the requested application
     */
    @GetMapping("/{appName}")
    public ResponseEntity<ApplicationResponse> getApplication(@PathVariable String appName) {
        
        logger.debug("Received request for application: {}", appName);
        
        if (!serviceRegistry.hasApplication(appName) || serviceRegistry.getInstances(appName).isEmpty()) {
            logger.debug("Application not found or no instances: {}", appName);
            throw new ResourceNotFoundException("Application " + appName + " not found or no instances");
        }
        
        List<InstanceInfo> instances = serviceRegistry.getInstances(appName);
        
        Application application = new Application(appName);
        application.setInstances(instances);
        
        ApplicationResponse response = new ApplicationResponse();
        response.setApplication(application);
        
        logger.debug("Returning application {} with {} instances", appName, instances.size());
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Gets delta changes since last request.
     * 
     * GET /eureka/apps/delta
     * 
     * @return applications delta response containing recent changes
     */
    @GetMapping("/delta")
    public ResponseEntity<ApplicationsResponse> getApplicationsDelta() {
        
        logger.debug("Received request for applications delta");
        
        try {
            // For this implementation, we'll return a simplified delta
            // In a production system, this would track actual changes
            List<String> applicationNames = serviceRegistry.getApplicationNames();
            List<Application> deltaApplications = new ArrayList<>();
            
            long currentTime = System.currentTimeMillis();
            long deltaThreshold = currentTime - 30000; // 30 seconds threshold
            
            for (String appName : applicationNames) {
                List<InstanceInfo> instances = serviceRegistry.getInstances(appName);
                List<InstanceInfo> deltaInstances = instances.stream()
                    .filter(instance -> isInstanceModifiedSince(instance, deltaThreshold))
                    .collect(Collectors.toList());
                
                if (!deltaInstances.isEmpty()) {
                    Application deltaApplication = new Application(appName);
                    deltaApplication.setInstances(deltaInstances);
                    deltaApplications.add(deltaApplication);
                }
            }
            
            ApplicationsResponse response = new ApplicationsResponse();
            response.setApplications(deltaApplications);
            response.setVersionsDelta(++lastDeltaGeneration);
            response.setAppsHashcode(generateHashCode(deltaApplications));
            
            logger.debug("Returning delta with {} applications and {} total instances", 
                        deltaApplications.size(),
                        deltaApplications.stream().mapToInt(Application::size).sum());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error retrieving applications delta: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Gets a specific instance from an application.
     * 
     * GET /eureka/apps/{appName}/{instanceId}
     * 
     * @param appName the application name
     * @param instanceId the instance ID
     * @return instance response containing the requested instance
     */
    @GetMapping("/{appName}/{instanceId}")
    public ResponseEntity<InstanceResponse> getInstance(
            @PathVariable String appName,
            @PathVariable String instanceId) {
        
        logger.debug("Received request for instance {}/{}", appName, instanceId);
        
        InstanceInfo instance = serviceRegistry.getInstance(appName, instanceId);
        
        if (instance == null) {
            logger.debug("Instance not found: {}/{}", appName, instanceId);
            throw new ResourceNotFoundException("Instance " + instanceId + " not found for application " + appName);
        }
        
        InstanceResponse response = new InstanceResponse();
        response.setInstance(instance);
        
        logger.debug("Returning instance {}/{}", appName, instanceId);
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Gets instances filtered by status.
     * 
     * GET /eureka/apps?status={status}
     * 
     * @param status the instance status to filter by
     * @return applications response containing instances with the specified status
     */
    @GetMapping(params = "status")
    public ResponseEntity<ApplicationsResponse> getApplicationsByStatus(
            @RequestParam("status") String status) {
        
        logger.debug("Received request for applications with status: {}", status);
        
        InstanceStatus instanceStatus;
        try {
            instanceStatus = InstanceStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid status parameter: {}", status);
            throw e;
        }
        
        List<String> applicationNames = serviceRegistry.getApplicationNames();
        List<Application> filteredApplications = new ArrayList<>();
        
        for (String appName : applicationNames) {
            List<InstanceInfo> instances = serviceRegistry.getInstances(appName);
            List<InstanceInfo> filteredInstances = instances.stream()
                .filter(instance -> instance.getStatus() == instanceStatus)
                .collect(Collectors.toList());
            
            if (!filteredInstances.isEmpty()) {
                Application application = new Application(appName);
                application.setInstances(filteredInstances);
                filteredApplications.add(application);
            }
        }
        
        ApplicationsResponse response = new ApplicationsResponse();
        response.setApplications(filteredApplications);
        response.setVersionsDelta(1L);
        response.setAppsHashcode(generateHashCode(filteredApplications));
        
        logger.debug("Returning {} applications with status {} containing {} total instances", 
                    filteredApplications.size(), status,
                    filteredApplications.stream().mapToInt(Application::size).sum());
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Simple check to determine if an instance has been modified since a threshold.
     * In a production system, this would use proper change tracking.
     */
    private boolean isInstanceModifiedSince(InstanceInfo instance, long threshold) {
        String key = instance.getAppName() + ":" + instance.getInstanceId();
        Long lastModified = instanceLastModified.get(key);
        
        if (lastModified == null) {
            // New instance, consider it modified
            instanceLastModified.put(key, System.currentTimeMillis());
            return true;
        }
        
        return lastModified > threshold;
    }
    
    /**
     * Generates a simple hash code for the applications list.
     * In a production system, this would be more sophisticated.
     */
    private String generateHashCode(List<Application> applications) {
        StringBuilder sb = new StringBuilder();
        for (Application app : applications) {
            sb.append(app.getName()).append("_");
            for (InstanceInfo instance : app.getInstances()) {
                sb.append(instance.getStatus().name()).append("_");
            }
        }
        return "UP_" + applications.size() + "_";
    }
    
    /**
     * Response wrapper for all applications.
     */
    public static class ApplicationsResponse {
        private List<Application> applications = new ArrayList<>();
        private Long versionsDelta;
        private String appsHashcode;
        
        public List<Application> getApplications() {
            return applications;
        }
        
        public void setApplications(List<Application> applications) {
            this.applications = applications;
        }
        
        public Long getVersionsDelta() {
            return versionsDelta;
        }
        
        public void setVersionsDelta(Long versionsDelta) {
            this.versionsDelta = versionsDelta;
        }
        
        public String getAppsHashcode() {
            return appsHashcode;
        }
        
        public void setAppsHashcode(String appsHashcode) {
            this.appsHashcode = appsHashcode;
        }
    }
    
    /**
     * Response wrapper for a single application.
     */
    public static class ApplicationResponse {
        private Application application;
        
        public Application getApplication() {
            return application;
        }
        
        public void setApplication(Application application) {
            this.application = application;
        }
    }
    
    /**
     * instance response wrapper for a single instance.
     */
    public static class InstanceResponse {
        private InstanceInfo instance;
        
        public InstanceInfo getInstance() {
            return instance;
        }
        
        public void setInstance(InstanceInfo instance) {
            this.instance = instance;
        }
    }
}