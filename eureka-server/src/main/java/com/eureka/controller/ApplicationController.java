package com.eureka.controller;

import com.eureka.model.InstanceInfo;
import com.eureka.model.InstanceStatus;
import com.eureka.registry.ServiceRegistry;
import com.eureka.validation.RegistrationValidator;
import com.eureka.peer.PeerClient; // Added by qodo: import peer replication client
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.HashMap;
import java.util.Map;
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
    
    private final ServiceRegistry serviceRegistry;
    private final RegistrationValidator registrationValidator;
    private final PeerClient peerClient; // Added by qodo: peer replication client
    
    @Autowired
    public ApplicationController(ServiceRegistry serviceRegistry, 
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
     * @return HTTP 204 No Content on success, HTTP 400 Bad Request on validation failure
     */
    @PostMapping("/{appName}")
    public ResponseEntity<?> registerInstance(
            @PathVariable String appName,
            @RequestHeader HttpHeaders headers, // Added by qodo: to read replication header
            @Valid @RequestBody InstanceWrapper instanceWrapper) {
        
        logger.info("Received registration request for application: {}", appName);
        
        try {
            InstanceInfo instance = instanceWrapper.getInstance();
            
            // Ensure app name consistency
            if (instance.getAppName() == null || instance.getAppName().isEmpty()) {
                instance.setAppName(appName.toUpperCase());
            } else if (!appName.equalsIgnoreCase(instance.getAppName())) {
                return createErrorResponse(HttpStatus.BAD_REQUEST, 
                    "Application name in URL does not match instance data",
                    "URL app name: " + appName + ", Instance app name: " + instance.getAppName());
            }
            
            // Validate instance data
            RegistrationValidator.ValidationResult validationResult = 
                registrationValidator.validate(instance);
            
            if (!validationResult.isValid()) {
                logger.warn("Registration validation failed for {}/{}: {}", 
                           appName, instance.getInstanceId(), validationResult.getErrorMessage());
                return createErrorResponse(HttpStatus.BAD_REQUEST,
                    "Registration validation failed",
                    validationResult.getErrors());
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
            
        } catch (Exception e) {
            logger.error("Error registering instance for application {}: {}", appName, e.getMessage(), e);
            return createErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR,
                "Internal server error during registration",
                e.getMessage());
        }
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
     * @return HTTP 200 OK on success, HTTP 404 Not Found if instance doesn't exist
     */
    @PutMapping("/{appName}/{instanceId}")
    public ResponseEntity<?> sendHeartbeat(
            @PathVariable String appName,
            @PathVariable String instanceId,
            @RequestHeader HttpHeaders headers, // Added by qodo
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "lastDirtyTimestamp", required = false) String lastDirtyTimestamp) {
        
        logger.debug("Received heartbeat for {}/{}", appName, instanceId);
        
        try {
            // Check if instance exists
            if (!serviceRegistry.hasInstance(appName, instanceId)) {
                logger.warn("Heartbeat received for non-existent instance {}/{}", appName, instanceId);
                return createErrorResponse(HttpStatus.NOT_FOUND,
                    "Instance not found",
                    "Instance " + instanceId + " not found for application " + appName);
            }
            
            // Added by qodo: detect replication flag
            boolean isReplication = Optional.ofNullable(headers.getFirst(REPLICATION_HEADER))
                    .map(v -> v.equalsIgnoreCase("true")).orElse(false);
            
            // Renew the lease with replication flag
            boolean renewed = serviceRegistry.renew(appName, instanceId, isReplication);
            
            if (!renewed) {
                logger.warn("Failed to renew lease for {}/{}", appName, instanceId);
                return createErrorResponse(HttpStatus.NOT_FOUND,
                    "Failed to renew lease",
                    "Instance " + instanceId + " lease renewal failed for application " + appName);
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
                    return createErrorResponse(HttpStatus.BAD_REQUEST,
                        "Invalid status value",
                        "Status must be one of: UP, DOWN, STARTING, OUT_OF_SERVICE, UNKNOWN");
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
            
        } catch (Exception e) {
            logger.error("Error processing heartbeat for {}/{}: {}", appName, instanceId, e.getMessage(), e);
            return createErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR,
                "Internal server error during heartbeat processing",
                e.getMessage());
        }
    }
    
    /**
     * Deregisters a service instance.
     * 
     * DELETE /eureka/apps/{appName}/{instanceId}
     * 
     * @param appName the application name
     * @param instanceId the instance ID
     * @return HTTP 200 OK on success, HTTP 404 Not Found if instance doesn't exist
     */
    @DeleteMapping("/{appName}/{instanceId}")
    public ResponseEntity<?> deregisterInstance(
            @PathVariable String appName,
            @PathVariable String instanceId,
            @RequestHeader HttpHeaders headers) { // Added by qodo
        
        logger.info("Received deregistration request for {}/{}", appName, instanceId);
        
        try {
            // Check if instance exists
            if (!serviceRegistry.hasInstance(appName, instanceId)) {
                logger.warn("Deregistration requested for non-existent instance {}/{}", appName, instanceId);
                return createErrorResponse(HttpStatus.NOT_FOUND,
                    "Instance not found",
                    "Instance " + instanceId + " not found for application " + appName);
            }
            
            // Added by qodo: detect replication flag
            boolean isReplication = Optional.ofNullable(headers.getFirst(REPLICATION_HEADER))
                    .map(v -> v.equalsIgnoreCase("true")).orElse(false);
            
            // Deregister the instance with replication flag
            boolean deregistered = serviceRegistry.deregister(appName, instanceId, isReplication);
            
            if (!deregistered) {
                logger.warn("Failed to deregister instance {}/{}", appName, instanceId);
                return createErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Failed to deregister instance",
                    "Instance " + instanceId + " deregistration failed for application " + appName);
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
            
        } catch (Exception e) {
            logger.error("Error deregistering instance {}/{}: {}", appName, instanceId, e.getMessage(), e);
            return createErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR,
                "Internal server error during deregistration",
                e.getMessage());
        }
    }
    
    /**
     * Creates a standardized error response.
     */
    private ResponseEntity<Map<String, Object>> createErrorResponse(HttpStatus status, String message, Object details) {
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("timestamp", System.currentTimeMillis());
        errorResponse.put("status", status.value());
        errorResponse.put("error", status.getReasonPhrase());
        errorResponse.put("message", message);
        errorResponse.put("details", details);
        
        return ResponseEntity.status(status).body(errorResponse);
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