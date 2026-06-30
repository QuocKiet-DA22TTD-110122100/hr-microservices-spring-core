package com.hrservice.eureka.controller;

import com.hrservice.eureka.Domain.model.InstanceInfo;
import com.hrservice.eureka.Domain.model.InstanceStatus;
import com.hrservice.eureka.Domain.model.LeaseInfo;
import com.hrservice.eureka.config.TestSecurityConfig;
import com.hrservice.eureka.controller.ApplicationController.InstanceWrapper;
import com.hrservice.eureka.service.RegistryService;
import com.hrservice.eureka.validation.RegistrationValidator;
import com.sting.example.eureka_server.EurekaServerApplication;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Objects;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Unit tests for ApplicationController.
 */
@WebMvcTest(controllers = ApplicationController.class)
@Import({ApplicationController.class, TestSecurityConfig.class, com.hrservice.eureka.exception.GlobalExceptionHandler.class})
@ContextConfiguration(classes = EurekaServerApplication.class)
class ApplicationControllerTest {

    private static final String TEST_INSTANCE_ID = "test-instance-1";
    private static final String TEST_APP = "TEST-APP";
    
    @Autowired
    private MockMvc mockMvc;
    
    @MockitoBean
    private RegistryService serviceRegistry;
    
    @MockitoBean
    private RegistrationValidator registrationValidator;
    
    @MockitoBean
    private com.hrservice.eureka.infrastructure.peer.PeerClient peerClient;
    
    private ObjectMapper objectMapper;
    private InstanceInfo testInstance;
    
    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        
        testInstance = InstanceInfo.newBuilder()
            .setInstanceId(TEST_INSTANCE_ID)
            .setAppName(TEST_APP)
            .setIPAddr("192.168.1.100")
            .setPort(8080)
            .setStatus(InstanceStatus.UP)
            .setLeaseInfo(new LeaseInfo())
            .build();
    }
    
    @Test
    void registerInstanceSuccess() throws Exception {
        // Given
        RegistrationValidator.ValidationResult validResult = new RegistrationValidator.ValidationResult();
        when(registrationValidator.validate(any(InstanceInfo.class))).thenReturn(validResult);
        
        InstanceWrapper wrapper = new InstanceWrapper(testInstance);
        String requestBody = objectMapper.writeValueAsString(wrapper);
        
        // When & Then
        mockMvc.perform(post("/eureka/apps/" + TEST_APP)
            .contentType(MediaType.APPLICATION_JSON_VALUE)
            .content(Objects.requireNonNull(requestBody)))
                .andExpect(status().isNoContent());
        
        verify(serviceRegistry).register(any(InstanceInfo.class), anyInt(), anyBoolean());
    }
    
    @Test
    void registerInstanceValidationFailure() throws Exception {
        // Given
        RegistrationValidator.ValidationResult invalidResult = new RegistrationValidator.ValidationResult();
        invalidResult.addError("IP address is required");
        when(registrationValidator.validate(any(InstanceInfo.class))).thenReturn(invalidResult);
        
        InstanceWrapper wrapper = new InstanceWrapper(testInstance);
        String requestBody = objectMapper.writeValueAsString(wrapper);
        
        // When & Then
        mockMvc.perform(post("/eureka/apps/" + TEST_APP)
            .contentType(MediaType.APPLICATION_JSON_VALUE)
            .content(Objects.requireNonNull(requestBody)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Registration validation failed"));
        
        verify(serviceRegistry, never()).register(any(InstanceInfo.class));
    }
    
    @Test
    void sendHeartbeatSuccess() throws Exception {
        // Given
        when(serviceRegistry.hasInstance(TEST_APP, TEST_INSTANCE_ID)).thenReturn(true);
        when(serviceRegistry.renew(eq(TEST_APP), eq(TEST_INSTANCE_ID), anyBoolean())).thenReturn(true);
        
        // When & Then
        mockMvc.perform(put("/eureka/apps/" + TEST_APP + "/" + TEST_INSTANCE_ID))
                .andExpect(status().isOk());
        
        verify(serviceRegistry).renew(eq(TEST_APP), eq(TEST_INSTANCE_ID), anyBoolean());
    }
    
    @Test
    void deregisterInstanceSuccess() throws Exception {
        // Given
        when(serviceRegistry.hasInstance(TEST_APP, TEST_INSTANCE_ID)).thenReturn(true);
        when(serviceRegistry.deregister(eq(TEST_APP), eq(TEST_INSTANCE_ID), anyBoolean())).thenReturn(true);
        
        // When & Then
        mockMvc.perform(delete("/eureka/apps/" + TEST_APP + "/" + TEST_INSTANCE_ID))
                .andExpect(status().isOk());
        
        verify(serviceRegistry).deregister(eq(TEST_APP), eq(TEST_INSTANCE_ID), anyBoolean());
    }
}