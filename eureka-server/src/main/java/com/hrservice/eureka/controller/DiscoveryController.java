package com.hrservice.eureka.controller;

import com.hrservice.eureka.Domain.model.Application;
import com.hrservice.eureka.Domain.model.InstanceInfo;
import com.hrservice.eureka.Domain.model.InstanceStatus;
import com.hrservice.eureka.exception.ResourceNotFoundException;
import com.hrservice.eureka.service.RegistryService;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

/**
 * REST API controller for discovery operations.
 */
@RestController
@RequestMapping("/eureka/apps")
public class DiscoveryController {
    
    private static final Logger logger = LoggerFactory.getLogger(DiscoveryController.class);
    
    private final RegistryService serviceRegistry;
    
    // Simple delta tracking; production should use a more complete strategy.
    private volatile long lastDeltaGeneration = System.currentTimeMillis();
    private final Map<String, Long> instanceLastModified = new HashMap<>();
    
    public DiscoveryController(RegistryService serviceRegistry) {
        this.serviceRegistry = serviceRegistry;
    }
    
    /**
     * Returns all registered applications and their instances.
     */
    @GetMapping
    public ResponseEntity<ApplicationsResponse> getAllApplications(
            @RequestParam(value = "regions", required = false) String regions) {
        
        logger.debug("Received request to get all applications with regions filter: {}", regions);
        
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
            
            ApplicationsResponse response = new ApplicationsResponse(
                applications,
                1L,
                generateHashCode(applications)
            );
            
            logger.debug("Tra ve {} ung dung voi tong {} instance", 
                        applications.size(), 
                        applications.stream().mapToInt(Application::size).sum());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("lỗi khi lấy tất cả ứng dụng : {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
    * Returns one application and its instances.
     */
    @GetMapping("/{appName}")
    public ResponseEntity<ApplicationResponse> getApplication(@PathVariable String appName) {
        
        logger.debug("nhận yêu cầu cho ứng dụng: {}", appName);
        
        if (!serviceRegistry.hasApplication(appName) || serviceRegistry.getInstances(appName).isEmpty()) {
            logger.debug("ứng dụng không tìm thấy: {}", appName);
            throw new ResourceNotFoundException("Ung dung " + appName + " khong tim thay hoac khong co instance nao dang hoat dong");
        }
        
        List<InstanceInfo> instances = serviceRegistry.getInstances(appName);
        
        Application application = new Application(appName);
        application.setInstances(instances);
        
        ApplicationResponse response = new ApplicationResponse(application);
        
        logger.debug("Tra ve ung dung {} voi {} instance", appName, instances.size());
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Returns application delta changes since the previous request.
     */
    @GetMapping("/delta")
    public ResponseEntity<ApplicationsResponse> getApplicationsDelta() {
        
        logger.debug("nhận yêu cầu delta cho tất cả các ứng dụng");
        
        try {
            // This returns a simplified delta view.
            List<String> applicationNames = serviceRegistry.getApplicationNames();
            List<Application> deltaApplications = new ArrayList<>();
            
            long currentTime = System.currentTimeMillis();
            long deltaThreshold = currentTime - 30000;
            
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
            
            ApplicationsResponse response = new ApplicationsResponse(
                deltaApplications,
                ++lastDeltaGeneration,
                generateHashCode(deltaApplications)
            );
            
            logger.debug("Tra ve delta voi {} ung dung va tong {} instance", 
                        deltaApplications.size(),
                        deltaApplications.stream().mapToInt(Application::size).sum());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Loi khi lay delta ung dung: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Returns one instance by application name and instance id.
     */
    @GetMapping("/{appName}/{instanceId}")
    public ResponseEntity<InstanceResponse> getInstance(
            @PathVariable String appName,
            @PathVariable String instanceId) {
        
        logger.debug("Nhan yeu cau lay instance {}/{}", appName, instanceId);
        
        InstanceInfo instance = serviceRegistry.getInstance(appName, instanceId);
        
        if (instance == null) {
            logger.debug("Khong tim thay instance: {}/{}", appName, instanceId);
            throw new ResourceNotFoundException("Khong tim thay instance " + instanceId + " cho ung dung " + appName);
        }
        
        InstanceResponse response = new InstanceResponse(instance);
        
        logger.debug("Tra ve instance {}/{}", appName, instanceId);
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Returns applications filtered by instance status.
     */
    @GetMapping(params = "status")
    public ResponseEntity<ApplicationsResponse> getApplicationsByStatus(
            @RequestParam("status") String status) {
        
        logger.debug("Nhan yeu cau lay ung dung theo trang thai: {}", status);
        
        InstanceStatus instanceStatus;
        try {
            instanceStatus = InstanceStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            logger.warn("Tham so status khong hop le: {}", status);
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
        
        ApplicationsResponse response = new ApplicationsResponse(
            filteredApplications,
            1L,
            generateHashCode(filteredApplications)
        );
        
        logger.debug("Tra ve {} ung dung voi trang thai {} gom tong {} instance", 
                    filteredApplications.size(), status,
                    filteredApplications.stream().mapToInt(Application::size).sum());
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Checks whether an instance has changed after the given threshold.
     */
    private boolean isInstanceModifiedSince(InstanceInfo instance, long threshold) {
        String key = instance.getAppName() + ":" + instance.getInstanceId();
        Long lastModified = instanceLastModified.get(key);
        
        if (lastModified == null) {
            // Treat new instances as modified.
            instanceLastModified.put(key, System.currentTimeMillis());
            return true;
        }
        
        return lastModified > threshold;
    }
    
    /**
     * Generates a simple hash for the application list.
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
     * Wrapper response for all applications.
     */
    public record ApplicationsResponse(List<Application> applications, Long versionsDelta, String appsHashcode) {
    }

    /**
     * Wrapper response for one application.
     */
    public record ApplicationResponse(Application application) {
    }

    /**
     * Wrapper response for one instance.
     */
    public record InstanceResponse(InstanceInfo instance) {
    }
}