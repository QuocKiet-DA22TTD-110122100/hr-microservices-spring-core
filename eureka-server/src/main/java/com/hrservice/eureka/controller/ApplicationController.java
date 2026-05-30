package com.hrservice.eureka.controller;

import com.hrservice.eureka.validation.RegistrationValidator;
import com.hrservice.eureka.Domain.model.InstanceInfo;
import com.hrservice.eureka.Domain.model.InstanceStatus;
import com.hrservice.eureka.exception.ResourceNotFoundException;
import com.hrservice.eureka.infrastructure.peer.PeerClient;
import com.hrservice.eureka.service.RegistryService;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.Optional;

/**
 * REST API Controller for service registration operations.
 * 
 * This controller handles service instance registration, heartbeat renewal,
 * and deregistration operations as defined in the Eureka REST API specification.
 * 
 * Validates: Requirements 1.1, 1.3, 1.5
 */
@RestController
@RequestMapping("/eureka/apps")
public class ApplicationController {
    
    private static final Logger logger = LoggerFactory.getLogger(ApplicationController.class);
    
    // Added by qodo: replication header constant
    private static final String REPLICATION_HEADER = "X-Replication";
    
    private final RegistryService serviceRegistry;
    private final RegistrationValidator registrationValidator;
    private final PeerClient peerClient; // Added by qodo: peer replication client
    
    public ApplicationController(RegistryService serviceRegistry, 
    RegistrationValidator registrationValidator,
    PeerClient peerClient) { // Added by qodo
    this.serviceRegistry = serviceRegistry;
    this.registrationValidator = registrationValidator;
    this.peerClient = peerClient; // Added by qodo
    }
    
    /**
     * Registers a new service instance.
     * 
     * POST /eureka/apps/{appName}
     * 
     * @param appName the application name
     * @param instanceWrapper wrapper containing the instance information
     * @return HTTP 204 No Content on success
     */
    @PostMapping("/{appName}")
    public ResponseEntity<?> registerInstance(
            @PathVariable String appName,
            @RequestHeader HttpHeaders headers, // Added by qodo: to read replication header
            @Valid @RequestBody InstanceWrapper instanceWrapper) {
        
        logger.info("Đã nhận được yêu cầu đăng ký: {}", appName);
        
        InstanceInfo instance = instanceWrapper.getInstance();
        
        // Ensure app name consistency
        if (instance.getAppName() == null || instance.getAppName().isEmpty()) {
            instance.setAppName(appName.toUpperCase());
        } else if (!appName.equalsIgnoreCase(instance.getAppName()) ) {
            throw new IllegalArgumentException("Ten ung dung trong URL khong khop voi du lieu instance. URL app name: " + appName + ", Instance app name: " + instance.getAppName());
        }
        
        // Validate instance data
        RegistrationValidator.ValidationResult validationResult = 
            registrationValidator.validate(instance);
        
        if (!validationResult.isValid()) {
            logger.warn("Xac thuc dang ky that bai cho {}/{}: {}", 
                       appName, instance.getInstanceId(), validationResult.getErrorMessage());
            // Throw a generic message that tests expect while keeping detailed info in logs
            throw new IllegalArgumentException("Registration validation failed");
        }
        
        // Added by qodo: detect replication to avoid loops
        boolean isReplication = Optional.ofNullable(headers.getFirst(REPLICATION_HEADER))
        .map(v -> v.equalsIgnoreCase("true")).orElse(false);
        
        // Register the instance with replication flag
        serviceRegistry.register(instance, instance.getLeaseInfo().getDurationInSecs(), isReplication);
        
        logger.info("Dang ky instance thanh cong {}/{}", appName, instance.getInstanceId());
        
        // Added by qodo: replicate to peers when this is not a replication request
        if (!isReplication) {
            try {
                // Use PeerClient to propagate to peers
                peerClient.replicateRegister(appName, new InstanceWrapper(instance));
            } catch (Exception ex) {
                logger.warn("Dong bo peer (REGISTER) that bai cho {}/{}: {}", appName, instance.getInstanceId(), ex.getMessage());
            }
        }
        
        return ResponseEntity.noContent().build();
    }
    
    /**
     * Sends heartbeat to renew instance lease.
     * 
     * PUT /eureka/apps/{appName}/{instanceId}
     * 
     * @param appName the application name
     * @param instanceId the instance ID
     * @param status optional status parameter
     * @param lastDirtyTimestamp optional last dirty timestamp
     * @return HTTP 200 OK on success
     */
    @PutMapping("/{appName}/{instanceId}")
    public ResponseEntity<?> sendHeartbeat(
            @PathVariable String appName,
            @PathVariable String instanceId,
            @RequestHeader HttpHeaders headers, // Added by qodo
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "lastDirtyTimestamp", required = false) String lastDirtyTimestamp) {
        
        logger.debug("Nhan heartbeat cho {}/{}", appName, instanceId);
        
        // Check if instance exists
        if (!serviceRegistry.hasInstance(appName, instanceId)) {
            logger.warn("Nhan heartbeat cho instance khong ton tai {}/{}", appName, instanceId);
            throw new ResourceNotFoundException("Khong tim thay instance " + instanceId + " cho ung dung " + appName);
        }
        
        // Added by qodo: detect replication flag
        boolean isReplication = Optional.ofNullable(headers.getFirst(REPLICATION_HEADER))
                .map(v -> v.equalsIgnoreCase("true")).orElse(false);
        
        // Renew the lease with replication flag
        boolean renewed = serviceRegistry.renew(appName, instanceId, isReplication);
        
        if (!renewed) {
            logger.warn("Gia han lease that bai cho {}/{}", appName, instanceId);
            throw new ResourceNotFoundException("Gia han lease that bai cho instance " + instanceId + " cua ung dung " + appName);
        }
        
        // Update status if provided
        if (status != null && !status.isEmpty()) {
            try {
                InstanceStatus newStatus = InstanceStatus.valueOf(status.toUpperCase());
                boolean updated = serviceRegistry.updateStatus(appName, instanceId, newStatus, 
                                                             lastDirtyTimestamp, isReplication);
                if (!updated) {
                    logger.warn("Cap nhat trang thai that bai cho {}/{} sang {}", appName, instanceId, status);
                }
            } catch (IllegalArgumentException e) {
                logger.warn("Gia tri status khong hop le: {}", status);
                throw e;
            }
        }
        
        logger.debug("Xu ly heartbeat thanh cong cho {}/{}", appName, instanceId);

        // Added by qodo: replicate to peers when not replication request
        if (!isReplication) {
            try {
                peerClient.replicateRenew(appName, instanceId, status, lastDirtyTimestamp);
            } catch (Exception ex) {
                logger.warn("Dong bo peer (RENEW) that bai cho {}/{}: {}", appName, instanceId, ex.getMessage());
            }
        }
        return ResponseEntity.ok().build();
    }
    
    /**
     * Deregisters a service instance.
     * 
     * DELETE /eureka/apps/{appName}/{instanceId}
     * 
     * @param appName the application name
     * @param instanceId the instance ID
     * @return HTTP 200 OK on success
     */
    @DeleteMapping("/{appName}/{instanceId}")
    public ResponseEntity<?> deregisterInstance(
            @PathVariable String appName,
            @PathVariable String instanceId,
            @RequestHeader HttpHeaders headers) { // Added by qodo
        
        logger.info("Đã nhận được yêu cầu hủy đăng ký cho {}/{}", appName, instanceId);
        
        // Check if instance exists
        if (!serviceRegistry.hasInstance(appName, instanceId)) {
            logger.warn("Yêu cầu hủy đăng ký cho instance không tồn tại {}/{}", appName, instanceId);
            throw new ResourceNotFoundException("Khong tim thay instance " + instanceId + " cho ung dung " + appName);
        }
        
        // Added by qodo: detect replication flag
        boolean isReplication = Optional.ofNullable(headers.getFirst(REPLICATION_HEADER))
                .map(v -> v.equalsIgnoreCase("true")).orElse(false);
        
        // Deregister the instance with replication flag
        boolean deregistered = serviceRegistry.deregister(appName, instanceId, isReplication);
        
        if (!deregistered) {
            logger.warn("lỗi khi hủy đăng ký instance {}/{}", appName, instanceId);
            throw new IllegalStateException("Huy dang ky that bai cho instance " + instanceId + " cua ung dung " + appName);
        }
        
        logger.info("thành công hủy đăng ký {}/{}", appName, instanceId);

        // Added by qodo: replicate to peers when not replication request
        if (!isReplication) {
            try {
                peerClient.replicateDeregister(appName, instanceId);
            } catch (Exception ex) {
                logger.warn("Dong bo peer (DEREGISTER) that bai cho {}/{}: {}", appName, instanceId, ex.getMessage());
            }
        }
        return ResponseEntity.ok().build();
    }
    

    
    /**
     * Wrapper class for instance registration requests.
     * This matches the expected JSON structure from Eureka clients.
     */
    public static class InstanceWrapper {
        private InstanceInfo instance;
        
        public InstanceWrapper() {}
        
        public InstanceWrapper(InstanceInfo instance) {
            this.instance = instance;
        }
        
        public InstanceInfo getInstance() {
            return instance;
        }
        
        public void setInstance(InstanceInfo instance) {
            this.instance = instance;
        }
    }
}