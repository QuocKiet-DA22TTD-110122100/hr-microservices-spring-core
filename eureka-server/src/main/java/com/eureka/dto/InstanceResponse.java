package com.eureka.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for service instance response from Eureka server.
 * Used in GET /eureka/apps/{appName}/{instanceId} and registration responses.
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class InstanceResponse {

    /**
     * Registration/discovery action result.
     */
    private String action;  // "REGISTERED", "DELETED", "RENEWED"

    /**
     * Response message.
     */
    private String message;

    /**
     * Instance status.
     */
    private String status;

    /**
     * Serialized instance information (as JSON map for flexibility).
     * Later can be ServiceInstance if import added.
     */
    private Object instance;  // ServiceInstance or Map<String, Object>
}

