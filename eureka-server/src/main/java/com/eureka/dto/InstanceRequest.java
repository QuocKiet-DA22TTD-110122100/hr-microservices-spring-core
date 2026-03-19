package com.eureka.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * DTO for service instance registration requests to Eureka server.
 * Used in POST /eureka/apps/{appName} endpoint.
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class InstanceRequest {

    /**
     * Unique instance identifier (hostname:port or custom).
     */
    @NotBlank(message = "instanceId is required")
    private String instanceId;

    /**
     * Application/service name.
     */
    @NotBlank(message = "appName is required")
    private String appName;

    /**
     * Hostname of the instance.
     */
    @NotBlank(message = "hostName is required")
    private String hostName;

    /**
     * HTTP port of the instance.
     */
    @NotNull
    @Min(value = 1, message = "port must be between 1 and 65535")
    @Max(value = 65535, message = "port must be between 1 and 65535")
    private Integer port;

    /**
     * Instance status: UP, DOWN, OUT_OF_SERVICE, UNKNOWN, STARTING.
     */
    @NotBlank(message = "status is required")
    private String status;  // "UP", "DOWN", etc.

    /**
     * Lease duration in seconds (default 90s).
     */
    @NotNull
    @Positive(message = "leaseDurationSeconds must be positive")
    @Builder.Default
    private Integer leaseDurationSeconds = 90;

    /**
     * Metadata key-value pairs.
     */
    @Builder.Default
    private Map<String, String> metadata = Map.of();

    /**
     * Virtual IP address.
     */
    private String vipAddress;

    /**
     * Actual IP address.
     */
    private String ipAddr;

    /**
     * Homepage URL.
     */
    private String homePageUrl;

    /**
     * Status page URL.
     */
    private String statusPageUrl;

    /**
     * Health check URL.
     */
    private String healthCheckUrl;
}

