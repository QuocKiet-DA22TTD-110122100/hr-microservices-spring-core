package com.hrservice.eureka.validation;

import org.apache.commons.validator.routines.InetAddressValidator;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import com.hrservice.eureka.Domain.model.InstanceInfo;

import java.net.MalformedURLException;
import java.util.ArrayList;
import java.util.List;

/**
 * Validator for service instance registration data.
 * 
 * This class validates instance information to ensure all required
 * fields are present and properly formatted before registration.
 */
@Component
public class RegistrationValidator {
    
    /**
     * Validates instance information for registration.
     * 
     * @param instance the instance to validate
     * @return validation result containing any errors found
     */
    public ValidationResult validate(InstanceInfo instance) {
        ValidationResult result = new ValidationResult();
        
        if (instance == null) {
            result.addError("Instance information is required");
            return result;
        }
        
        // Validate required fields
        validateRequiredFields(instance, result);
        
        // Validate field formats
        validateFieldFormats(instance, result);
        
        // Validate port ranges
        validatePorts(instance, result);
        
        // Validate URLs if provided
        validateUrls(instance, result);
        
        return result;
    }
    
    private void validateRequiredFields(InstanceInfo instance, ValidationResult result) {
        if (!StringUtils.hasText(instance.getAppName())) {
            result.addError("Application name is required");
        }
        
        if (!StringUtils.hasText(instance.getInstanceId())) {
            result.addError("Instance ID is required");
        }
        
        if (!StringUtils.hasText(instance.getIpAddr())) {
            result.addError("IP address is required");
        }
        
        if (instance.getStatus() == null) {
            result.addError("Instance status is required");
        }
        
        if (instance.getLeaseInfo() == null) {
            result.addError("Lease information is required");
        }
    }
    
    private void validateFieldFormats(InstanceInfo instance, ValidationResult result) {
        // Validate IP address format
        if (StringUtils.hasText(instance.getIpAddr()) && 
            !isValidIpAddress(instance.getIpAddr())) {
            result.addError("Invalid IP address format: " + instance.getIpAddr());
        }
        
        // Validate application name format (alphanumeric, hyphens, underscores)
        if (StringUtils.hasText(instance.getAppName()) && 
            !instance.getAppName().matches("^[a-zA-Z0-9_-]+$")) {
            result.addError("Application name must contain only alphanumeric characters, hyphens, and underscores");
        }
        
        // Validate instance ID format
        if (StringUtils.hasText(instance.getInstanceId()) && 
            instance.getInstanceId().length() > 255) {
            result.addError("Instance ID must not exceed 255 characters");
        }
    }
    
    private void validatePorts(InstanceInfo instance, ValidationResult result) {
        // Validate port range
        if (instance.getPort() < 1 || instance.getPort() > 65535) {
            result.addError("Port must be between 1 and 65535, got: " + instance.getPort());
        }
        
        // Validate secure port range if specified
        if (instance.getSecurePort() > 0 && 
            (instance.getSecurePort() < 1 || instance.getSecurePort() > 65535)) {
            result.addError("Secure port must be between 1 and 65535, got: " + instance.getSecurePort());
        }
    }
    
    private void validateUrls(InstanceInfo instance, ValidationResult result) {
        // Validate health check URL if provided
        if (StringUtils.hasText(instance.getHealthCheckUrl()) && 
            !isValidUrl(instance.getHealthCheckUrl())) {
            result.addError("Invalid health check URL format: " + instance.getHealthCheckUrl());
        }
        
        // Validate status page URL if provided
        if (StringUtils.hasText(instance.getStatusPageUrl()) && 
            !isValidUrl(instance.getStatusPageUrl())) {
            result.addError("Invalid status page URL format: " + instance.getStatusPageUrl());
        }
        
        // Validate home page URL if provided
        if (StringUtils.hasText(instance.getHomePageUrl()) && 
            !isValidUrl(instance.getHomePageUrl())) {
            result.addError("Invalid home page URL format: " + instance.getHomePageUrl());
        }
        
        // Validate secure health check URL if provided
        if (StringUtils.hasText(instance.getSecureHealthCheckUrl()) && 
            !isValidUrl(instance.getSecureHealthCheckUrl())) {
            result.addError("Invalid secure health check URL format: " + instance.getSecureHealthCheckUrl());
        }
    }
    
    private boolean isValidIpAddress(String ip) {
        return InetAddressValidator.getInstance().isValidInet4Address(ip) ||
               InetAddressValidator.getInstance().isValidInet6Address(ip);
    }
    
    private boolean isValidUrl(String url) {
        try {
            new java.net.URI(url).toURL();
            return true;
        } catch (MalformedURLException | java.net.URISyntaxException e) {
            return false;
        }
    }
    
    /**
     * Validation result containing any errors found during validation.
     */
    public static class ValidationResult {
        private final List<String> errors = new ArrayList<>();
        
        public void addError(String error) {
            errors.add(error);
        }
        
        public List<String> getErrors() {
            return new ArrayList<>(errors);
        }
        
        public boolean hasErrors() {
            return !errors.isEmpty();
        }
        
        public boolean isValid() {
            return errors.isEmpty();
        }
        
        public String getErrorMessage() {
            if (errors.isEmpty()) {
                return null;
            }
            return String.join("; ", errors);
        }
        
        @Override
        public String toString() {
            return "ValidationResult{" +
                    "valid=" + isValid() +
                    ", errors=" + errors +
                    '}';
        }
    }
}