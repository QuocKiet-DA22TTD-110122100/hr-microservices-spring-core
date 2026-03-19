package com.eureka.controller;

import com.eureka.validation.RegistrationValidator;
import com.eureka.Domain.model.InstanceInfo;
import com.eureka.Domain.model.InstanceStatus;
import com.eureka.exception.ResourceNotFoundException;
import com.eureka.infrastructure.peer.PeerClient;
import com.eureka.service.RegistryService;

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
        
        logger.info("Received registration request for application: {}", appName);
        
        InstanceInfo instance = instanceWrapper.getInstance();
        
        // Ensure app name consistency
        if (instance.getAppName() == null || instance.getAppName().isEmpty()) {
            instance.setAppName(appName.toUpperCase());
        } else if (!appName.equalsIgnoreCase(instance.getAppName()) ) {
            throw new IllegalArgumentException("Application name in URL does not match instance data. URL app name: " + appName + ", Instance app name: " + instance.getAppName());
        }
        
        // Validate instance data
        RegistrationValidator.ValidationResult validationResult = 
            registrationValidator.validate(instance);
        
        if (!validationResult.isValid()) {
            logger.warn("Registration validation failed for {}/{}: {}", 
                       appName, instance.getInstanceId(), validationResult.getErrorMessage());
            throw new IllegalArgumentException("Registration validation failed: " + validationResult.getErrorMessage());
        }
        
        // Added by qodo: detect replication to avoid loops
        boolean isReplication = Optional.ofNullable(headers.getFirst(REPLICATION_HEADER))
        .map(v -> v.equalsIgnoreCase("true")).orElse(false);
        
        // Register the instance with replication flag
        serviceRegistry.register(instance, instance.getLeaseInfo().getDurationInSecs(), isReplication);
        
        logger.info("Successfully registered instance {}/{}", appName, instance.getInstanceId());
        
        // Added by qodo: replicate to peers when this is not a replication request
        if (!isReplication) {
            try {
                // Use PeerClient to propagate to peers
                peerClient.replicateRegister(appName, new InstanceWrapper(instance));
            } catch (Exception ex) {
                logger.warn("Peer replication (REGISTER) failed for {}/{}: {}", appName, instance.getInstanceId(), ex.getMessage());
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
        
        logger.debug("Received heartbeat for {}/{}", appName, instanceId);
        
        // Check if instance exists
        if (!serviceRegistry.hasInstance(appName, instanceId)) {
            logger.warn("Heartbeat received for non-existent instance {}/{}", appName, instanceId);
            throw new ResourceNotFoundException("Instance " + instanceId + " not found for application " + appName);
        }
        
        // Added by qodo: detect replication flag
        boolean isReplication = Optional.ofNullable(headers.getFirst(REPLICATION_HEADER))
                .map(v -> v.equalsIgnoreCase("true")).orElse(false);
        
        // Renew the lease with replication flag
        boolean renewed = serviceRegistry.renew(appName, instanceId, isReplication);
        
        if (!renewed) {
            logger.warn("Failed to renew lease for {}/{}", appName, instanceId);
            throw new ResourceNotFoundException("Instance " + instanceId + " lease renewal failed for application " + appName);
        }
        
        // Update status if provided
        if (status != null && !status.isEmpty()) {
            try {
                InstanceStatus newStatus = InstanceStatus.valueOf(status.toUpperCase());
                boolean updated = serviceRegistry.updateStatus(appName, instanceId, newStatus, 
                                                             lastDirtyTimestamp, isReplication);
                if (!updated) {
                    logger.warn("Failed to update status for {}/{} to {}", appName, instanceId, status);
                }
            } catch (IllegalArgumentException e) {
                logger.warn("Invalid status value provided: {}", status);
                throw e;
            }
        }
        
        logger.debug("Successfully processed heartbeat for {}/{}", appName, instanceId);

        // Added by qodo: replicate to peers when not replication request
        if (!isReplication) {
            try {
                peerClient.replicateRenew(appName, instanceId, status, lastDirtyTimestamp);
            } catch (Exception ex) {
                logger.warn("Peer replication (RENEW) failed for {}/{}: {}", appName, instanceId, ex.getMessage());
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
        
        logger.info("Received deregistration request for {}/{}", appName, instanceId);
        
        // Check if instance exists
        if (!serviceRegistry.hasInstance(appName, instanceId)) {
            logger.warn("Deregistration requested for non-existent instance {}/{}", appName, instanceId);
            throw new ResourceNotFoundException("Instance " + instanceId + " not found for application " + appName);
        }
        
        // Added by qodo: detect replication flag
        boolean isReplication = Optional.ofNullable(headers.getFirst(REPLICATION_HEADER))
                .map(v -> v.equalsIgnoreCase("true")).orElse(false);
        
        // Deregister the instance with replication flag
        boolean deregistered = serviceRegistry.deregister(appName, instanceId, isReplication);
        
        if (!deregistered) {
            logger.warn("Failed to deregister instance {}/{}", appName, instanceId);
            throw new IllegalStateException("Instance " + instanceId + " deregistration failed for application " + appName);
        }
        
        logger.info("Successfully deregistered instance {}/{}", appName, instanceId);

        // Added by qodo: replicate to peers when not replication request
        if (!isReplication) {
            try {
                peerClient.replicateDeregister(appName, instanceId);
            } catch (Exception ex) {
                logger.warn("Peer replication (DEREGISTER) failed for {}/{}: {}", appName, instanceId, ex.getMessage());
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