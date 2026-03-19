package com.eureka.validation;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.eureka.Domain.model.InstanceInfo;
import com.eureka.Domain.model.InstanceStatus;
import com.eureka.Domain.model.LeaseInfo;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for RegistrationValidator.
 */
class RegistrationValidatorTest {
    
    private RegistrationValidator validator;
    
    @BeforeEach
    void setUp() {
        validator = new RegistrationValidator();
    }
    
    @Test
    void testValidInstance() {
        // Given
        InstanceInfo instance = createValidInstance();
        
        // When
        RegistrationValidator.ValidationResult result = validator.validate(instance);
        
        // Then
        assertTrue(result.isValid());
        assertFalse(result.hasErrors());
        assertTrue(result.getErrors().isEmpty());
    }
    
    @Test
    void testNullInstance() {
        // When
        RegistrationValidator.ValidationResult result = validator.validate(null);
        
        // Then
        assertFalse(result.isValid());
        assertTrue(result.hasErrors());
        assertEquals(1, result.getErrors().size());
        assertEquals("Instance information is required", result.getErrors().get(0));
    }
    
    @Test
    void testMissingRequiredFields() {
        // Given
        InstanceInfo instance = new InstanceInfo();
        
        // When
        RegistrationValidator.ValidationResult result = validator.validate(instance);
        
        // Then
        assertFalse(result.isValid());
        assertTrue(result.hasErrors());
        assertTrue(result.getErrors().contains("Application name is required"));
        assertTrue(result.getErrors().contains("Instance ID is required"));
        assertTrue(result.getErrors().contains("IP address is required"));
    }
    
    @Test
    void testInvalidIpAddress() {
        // Given
        InstanceInfo instance = createValidInstance();
        instance.setIpAddr("invalid-ip");
        
        // When
        RegistrationValidator.ValidationResult result = validator.validate(instance);
        
        // Then
        assertFalse(result.isValid());
        assertTrue(result.getErrors().stream()
                .anyMatch(error -> error.contains("Invalid IP address format")));
    }
    
    @Test
    void testInvalidPortRange() {
        // Given
        InstanceInfo instance = createValidInstance();
        instance.setPort(70000); // Invalid port > 65535
        
        // When
        RegistrationValidator.ValidationResult result = validator.validate(instance);
        
        // Then
        assertFalse(result.isValid());
        assertTrue(result.getErrors().stream()
                .anyMatch(error -> error.contains("Port must be between 1 and 65535")));
    }
    
    @Test
    void testInvalidApplicationName() {
        // Given
        InstanceInfo instance = createValidInstance();
        instance.setAppName("invalid@app#name"); // Contains invalid characters
        
        // When
        RegistrationValidator.ValidationResult result = validator.validate(instance);
        
        // Then
        assertFalse(result.isValid());
        assertTrue(result.getErrors().stream()
                .anyMatch(error -> error.contains("Application name must contain only alphanumeric characters")));
    }
    
    @Test
    void testInvalidUrl() {
        // Given
        InstanceInfo instance = createValidInstance();
        instance.setHealthCheckUrl("not-a-valid-url");
        
        // When
        RegistrationValidator.ValidationResult result = validator.validate(instance);
        
        // Then
        assertFalse(result.isValid());
        assertTrue(result.getErrors().stream()
                .anyMatch(error -> error.contains("Invalid health check URL format")));
    }
    
    @Test
    void testValidationResultErrorMessage() {
        // Given
        InstanceInfo instance = new InstanceInfo();
        
        // When
        RegistrationValidator.ValidationResult result = validator.validate(instance);
        
        // Then
        assertNotNull(result.getErrorMessage());
        assertTrue(result.getErrorMessage().contains("Application name is required")); 
    }
    
    @Test
    void testValidIpv6Address() {
        // Given
        InstanceInfo instance = createValidInstance();
        instance.setIpAddr("2001:0db8:85a3:0000:0000:8a2e:0370:7334");
        
        // When
        RegistrationValidator.ValidationResult result = validator.validate(instance);
        
        // Then
        assertTrue(result.isValid());
    }
    
    @Test
    void testValidApplicationNameWithHyphensAndUnderscores() {
        // Given
        InstanceInfo instance = createValidInstance();
        instance.setAppName("my-app_service");
        
        // When
        RegistrationValidator.ValidationResult result = validator.validate(instance);
        
        // Then
        assertTrue(result.isValid());
    }
    
    private InstanceInfo createValidInstance() {
        return InstanceInfo.newBuilder()
                .setAppName("test-app")
                .setInstanceId("test-instance-1")
                .setIPAddr("192.168.1.1")
                .setPort(8080)
                .setStatus(InstanceStatus.UP)
                .setLeaseInfo(new LeaseInfo())
                .setHealthCheckUrl("http://192.168.1.1:8080/health")
                .build();
    }
}