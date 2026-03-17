package com.eureka.controller;

import com.eureka.config.TestSecurityConfig;
import com.eureka.controller.ApplicationController.InstanceWrapper;
import com.eureka.model.InstanceInfo;
import com.eureka.model.InstanceStatus;
import com.eureka.model.LeaseInfo;
import com.eureka.registry.ServiceRegistry;
import com.eureka.validation.RegistrationValidator;
import com.sting.example.eureka_server.EurekaServerApplication;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Unit tests for ApplicationController.
 */
@WebMvcTest(controllers = ApplicationController.class)
@Import({ApplicationController.class, TestSecurityConfig.class})
@ContextConfiguration(classes = EurekaServerApplication.class)
class ApplicationControllerTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @MockBean
    private ServiceRegistry serviceRegistry;
    
    @MockBean
    private RegistrationValidator registrationValidator;
    
    private ObjectMapper objectMapper;
    private InstanceInfo testInstance;
    
    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        
        testInstance = InstanceInfo.newBuilder()
            .setInstanceId("test-instance-1")
            .setAppName("TEST-APP")
            .setIPAddr("192.168.1.100")
            .setPort(8080)
            .setStatus(InstanceStatus.UP)
            .setLeaseInfo(new LeaseInfo())
            .build();
    }
    
    @Test
    void registerInstance_Success() throws Exception {
        // Given
        RegistrationValidator.ValidationResult validResult = new RegistrationValidator.ValidationResult();
        when(registrationValidator.validate(any(InstanceInfo.class))).thenReturn(validResult);
        
        InstanceWrapper wrapper = new InstanceWrapper(testInstance);
        String requestBody = objectMapper.writeValueAsString(wrapper);
        
        // When & Then
        mockMvc.perform(post("/eureka/apps/TEST-APP")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
                .andExpect(status().isNoContent());
        
        verify(serviceRegistry).register(any(InstanceInfo.class));
    }
    
    @Test
    void registerInstance_ValidationFailure() throws Exception {
        // Given
        RegistrationValidator.ValidationResult invalidResult = new RegistrationValidator.ValidationResult();
        invalidResult.addError("IP address is required");
        when(registrationValidator.validate(any(InstanceInfo.class))).thenReturn(invalidResult);
        
        InstanceWrapper wrapper = new InstanceWrapper(testInstance);
        String requestBody = objectMapper.writeValueAsString(wrapper);
        
        // When & Then
        mockMvc.perform(post("/eureka/apps/TEST-APP")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Registration validation failed"));
        
        verify(serviceRegistry, never()).register(any(InstanceInfo.class));
    }
    
    @Test
    void sendHeartbeat_Success() throws Exception {
        // Given
        when(serviceRegistry.hasInstance("TEST-APP", "test-instance-1")).thenReturn(true);
        when(serviceRegistry.renew("TEST-APP", "test-instance-1")).thenReturn(true);
        
        // When & Then
        mockMvc.perform(put("/eureka/apps/TEST-APP/test-instance-1"))
                .andExpect(status().isOk());
        
        verify(serviceRegistry).renew("TEST-APP", "test-instance-1");
    }
    
    @Test
    void deregisterInstance_Success() throws Exception {
        // Given
        when(serviceRegistry.hasInstance("TEST-APP", "test-instance-1")).thenReturn(true);
        when(serviceRegistry.deregister("TEST-APP", "test-instance-1")).thenReturn(true);
        
        // When & Then
        mockMvc.perform(delete("/eureka/apps/TEST-APP/test-instance-1"))
                .andExpect(status().isOk());
        
        verify(serviceRegistry).deregister("TEST-APP", "test-instance-1");
    }
}