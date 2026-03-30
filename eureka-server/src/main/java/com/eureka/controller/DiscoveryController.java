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
 * Controller REST API cho cac thao tac discovery service.
 * 
 * Controller nay xu ly cac yeu cau tim kiem service, cung cap thong tin
 * ve cac instance va ung dung da duoc dang ky.
 * 
 * Dap ung: Yeu cau 2.1, 2.2, 2.3, 2.4
 */
@RestController
@RequestMapping("/eureka/apps")
public class DiscoveryController {
    
    private static final Logger logger = LoggerFactory.getLogger(DiscoveryController.class);
    
    private final RegistryService serviceRegistry;
    
    // Theo doi delta don gian - ban production can co co che day du hon
    private volatile long lastDeltaGeneration = System.currentTimeMillis();
    private final Map<String, Long> instanceLastModified = new HashMap<>();
    
    public DiscoveryController(RegistryService serviceRegistry) {
        this.serviceRegistry = serviceRegistry;
    }
    
    /**
     * Lay tat ca ung dung da dang ky va cac instance tuong ung.
     * 
     * GET /eureka/apps
     * 
     * @param regions bo loc theo vung (chua ho tro o phien ban nay)
     * @return response chua toan bo ung dung da dang ky
     */
    @GetMapping
    public ResponseEntity<ApplicationsResponse> getAllApplications(
            @RequestParam(value = "regions", required = false) String regions) {
        
        logger.debug("Đã nhận được yêu cầu lấy tất cả ứng dụng với filter regions: {}", regions);
        
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
     * Lay mot ung dung cu the va danh sach instance cua no.
     * 
     * GET /eureka/apps/{appName}
     * 
     * @param appName ten ung dung
     * @return response chua ung dung duoc yeu cau
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
        
        ApplicationResponse response = new ApplicationResponse();
        response.setApplication(application);
        
        logger.debug("Tra ve ung dung {} voi {} instance", appName, instances.size());
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Lay cac thay doi delta ke tu lan yeu cau truoc.
     * 
     * GET /eureka/apps/delta
     * 
     * @return response delta chua cac thay doi gan nhat
     */
    @GetMapping("/delta")
    public ResponseEntity<ApplicationsResponse> getApplicationsDelta() {
        
        logger.debug("nhận yêu cầu delta cho tất cả các ứng dụng");
        
        try {
            // Ban hien tai tra ve delta rut gon
            // Trong production can theo doi thay doi thuc te
            List<String> applicationNames = serviceRegistry.getApplicationNames();
            List<Application> deltaApplications = new ArrayList<>();
            
            long currentTime = System.currentTimeMillis();
            long deltaThreshold = currentTime - 30000; // Nguong 30 giay
            
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
     * Lay mot instance cu the cua ung dung.
     * 
     * GET /eureka/apps/{appName}/{instanceId}
     * 
     * @param appName ten ung dung
     * @param instanceId ID instance
     * @return response chua instance duoc yeu cau
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
        
        InstanceResponse response = new InstanceResponse();
        response.setInstance(instance);
        
        logger.debug("Tra ve instance {}/{}", appName, instanceId);
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Lay cac instance duoc loc theo trang thai.
     * 
     * GET /eureka/apps?status={status}
     * 
     * @param status trang thai instance can loc
     * @return response chua cac instance theo trang thai duoc chi dinh
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
        
        ApplicationsResponse response = new ApplicationsResponse();
        response.setApplications(filteredApplications);
        response.setVersionsDelta(1L);
        response.setAppsHashcode(generateHashCode(filteredApplications));
        
        logger.debug("Tra ve {} ung dung voi trang thai {} gom tong {} instance", 
                    filteredApplications.size(), status,
                    filteredApplications.stream().mapToInt(Application::size).sum());
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Kiem tra don gian xem instance co thay doi sau moc thoi gian hay khong.
     * Trong production can su dung co che theo doi thay doi chuan.
     */
    private boolean isInstanceModifiedSince(InstanceInfo instance, long threshold) {
        String key = instance.getAppName() + ":" + instance.getInstanceId();
        Long lastModified = instanceLastModified.get(key);
        
        if (lastModified == null) {
            // Instance moi, xem nhu da thay doi
            instanceLastModified.put(key, System.currentTimeMillis());
            return true;
        }
        
        return lastModified > threshold;
    }
    
    /**
     * Tao hash code don gian cho danh sach ung dung.
     * Trong production can co cach tinh toan day du hon.
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
     * Wrapper response cho tat ca ung dung.
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
     * Wrapper response cho mot ung dung.
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
     * Wrapper response cho mot instance.
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