package com.hrservice.eureka.dto;

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
    @NotBlank(message = "Bat buoc nhap instanceId")
    private String instanceId;

    /**
     * Application/service name.
     */
    @NotBlank(message = "Bat buoc nhap appName")
    private String appName;

    /**
     * Hostname of the instance.
     */
    @NotBlank(message = "Bat buoc nhap hostName")
    private String hostName;

    /**
     * HTTP port of the instance.
     */
    @NotNull
    @Min(value = 1, message = "Port phai nam trong khoang tu 1 den 65535")
    @Max(value = 65535, message = "Port phai nam trong khoang tu 1 den 65535")
    private Integer port;

    /**
     * Instance status: UP, DOWN, OUT_OF_SERVICE, UNKNOWN, STARTING.
     */
    @NotBlank(message = "Bat buoc nhap status")
    private String status;  // "UP", "DOWN", etc.

    /**
     * Lease duration in seconds (default 90s).
     */
    @NotNull
    @Positive(message = "leaseDurationSeconds phai la so duong")
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

