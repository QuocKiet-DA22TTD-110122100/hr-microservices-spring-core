package com.eureka.controller;

import com.sting.example.eureka_server.EurekaServerApplication;
import com.eureka.Domain.model.InstanceInfo;
import com.eureka.Domain.model.InstanceStatus;
import com.eureka.Domain.model.LeaseInfo;
import com.eureka.config.TestSecurityConfig;
import com.eureka.service.RegistryService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Unit tests for DiscoveryController.
 */
@WebMvcTest(controllers = DiscoveryController.class)
@Import({DiscoveryController.class, TestSecurityConfig.class})
@ContextConfiguration(classes = EurekaServerApplication.class)
class DiscoveryControllerTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @MockitoBean
    private RegistryService serviceRegistry;
    
    private InstanceInfo testInstance1;
    private InstanceInfo testInstance2;
    private List<String> applicationNames;
    
    @BeforeEach
    void setUp() {
        testInstance1 = InstanceInfo.newBuilder()
            .setInstanceId("test-instance-1")
            .setAppName("TEST-APP")
            .setIPAddr("192.168.1.100")
            .setPort(8080)
            .setStatus(InstanceStatus.UP)
            .setLeaseInfo(new LeaseInfo())
            .build();
        
        testInstance2 = InstanceInfo.newBuilder()
            .setInstanceId("test-instance-2")
            .setAppName("TEST-APP")
            .setIPAddr("192.168.1.101")
            .setPort(8080)
            .setStatus(InstanceStatus.DOWN)
            .setLeaseInfo(new LeaseInfo())
            .build();
        
        applicationNames = Arrays.asList("TEST-APP", "ANOTHER-APP");
    }
    
    @Test
    void getAllApplications_Success() throws Exception {
        // Given
        when(serviceRegistry.getApplicationNames()).thenReturn(applicationNames);
        when(serviceRegistry.getInstances("TEST-APP")).thenReturn(Arrays.asList(testInstance1, testInstance2));
        when(serviceRegistry.getInstances("ANOTHER-APP")).thenReturn(Collections.emptyList());
        
        // When & Then
        mockMvc.perform(get("/eureka/apps"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.applications").isArray())
                .andExpect(jsonPath("$.applications[0].name").value("TEST-APP"))
                .andExpect(jsonPath("$.applications[0].instances").isArray())
                .andExpect(jsonPath("$.applications[0].instances[0].instanceId").value("test-instance-1"))
                .andExpect(jsonPath("$.versionsDelta").exists())
                .andExpect(jsonPath("$.appsHashcode").exists());
    }
    
    @Test
    void getApplication_Success() throws Exception {
        // Given
        when(serviceRegistry.hasApplication("TEST-APP")).thenReturn(true);
        when(serviceRegistry.getInstances("TEST-APP")).thenReturn(Arrays.asList(testInstance1, testInstance2));
        
        // When & Then
        mockMvc.perform(get("/eureka/apps/TEST-APP"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.application.name").value("TEST-APP"))
                .andExpect(jsonPath("$.application.instances").isArray())
                .andExpect(jsonPath("$.application.instances[0].instanceId").value("test-instance-1"))
                .andExpect(jsonPath("$.application.instances[1].instanceId").value("test-instance-2"));
    }
    
    @Test
    void getInstance_Success() throws Exception {
        // Given
        when(serviceRegistry.getInstance("TEST-APP", "test-instance-1")).thenReturn(testInstance1);
        
        // When & Then
        mockMvc.perform(get("/eureka/apps/TEST-APP/test-instance-1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.instance.instanceId").value("test-instance-1"))
                .andExpect(jsonPath("$.instance.appName").value("TEST-APP"))
                .andExpect(jsonPath("$.instance.ipAddr").value("192.168.1.100"));
    }
    
    @Test
    void getApplicationsDelta_Success() throws Exception {
        // Given
        when(serviceRegistry.getApplicationNames()).thenReturn(Arrays.asList("TEST-APP"));
        when(serviceRegistry.getInstances("TEST-APP")).thenReturn(Arrays.asList(testInstance1));
        
        // When & Then
        mockMvc.perform(get("/eureka/apps/delta"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.applications").isArray())
                .andExpect(jsonPath("$.versionsDelta").exists())
                .andExpect(jsonPath("$.appsHashcode").exists());
    }
}