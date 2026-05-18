package com.hrservice.eureka.controller;

import com.sting.example.eureka_server.EurekaServerApplication;
import com.hrservice.eureka.Domain.model.InstanceInfo;
import com.hrservice.eureka.Domain.model.InstanceStatus;
import com.hrservice.eureka.Domain.model.LeaseInfo;
import com.hrservice.eureka.config.TestSecurityConfig;
import com.hrservice.eureka.service.RegistryService;

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

    private static final String TEST_INSTANCE_ID_1 = "test-instance-1";
    private static final String TEST_INSTANCE_ID_2 = "test-instance-2";
    private static final String TEST_APP = "TEST-APP";
    private static final String ANOTHER_APP = "ANOTHER-APP";
    
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
            .setInstanceId(TEST_INSTANCE_ID_1)
            .setAppName(TEST_APP)
            .setIPAddr("192.168.1.100")
            .setPort(8080)
            .setStatus(InstanceStatus.UP)
            .setLeaseInfo(new LeaseInfo())
            .build();
        
        testInstance2 = InstanceInfo.newBuilder()
            .setInstanceId(TEST_INSTANCE_ID_2)
            .setAppName(TEST_APP)
            .setIPAddr("192.168.1.101")
            .setPort(8080)
            .setStatus(InstanceStatus.DOWN)
            .setLeaseInfo(new LeaseInfo())
            .build();
        
        applicationNames = Arrays.asList(TEST_APP, ANOTHER_APP);
    }
    
    @Test
    void getAllApplicationsSuccess() throws Exception {
        // Given
        when(serviceRegistry.getApplicationNames()).thenReturn(applicationNames);
        when(serviceRegistry.getInstances(TEST_APP)).thenReturn(Arrays.asList(testInstance1, testInstance2));
        when(serviceRegistry.getInstances(ANOTHER_APP)).thenReturn(Collections.emptyList());
        
        // When & Then
        mockMvc.perform(get("/eureka/apps"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.applications").isArray())
                .andExpect(jsonPath("$.applications[0].name").value(TEST_APP))
                .andExpect(jsonPath("$.applications[0].instances").isArray())
                .andExpect(jsonPath("$.applications[0].instances[0].instanceId").value(TEST_INSTANCE_ID_1))
                .andExpect(jsonPath("$.versionsDelta").exists())
                .andExpect(jsonPath("$.appsHashcode").exists());
    }
    
    @Test
    void getApplicationSuccess() throws Exception {
        // Given
        when(serviceRegistry.hasApplication(TEST_APP)).thenReturn(true);
        when(serviceRegistry.getInstances(TEST_APP)).thenReturn(Arrays.asList(testInstance1, testInstance2));
        
        // When & Then
        mockMvc.perform(get("/eureka/apps/" + TEST_APP))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.application.name").value(TEST_APP))
                .andExpect(jsonPath("$.application.instances").isArray())
                .andExpect(jsonPath("$.application.instances[0].instanceId").value(TEST_INSTANCE_ID_1))
                .andExpect(jsonPath("$.application.instances[1].instanceId").value(TEST_INSTANCE_ID_2));
    }
    
    @Test
    void getInstanceSuccess() throws Exception {
        // Given
        when(serviceRegistry.getInstance(TEST_APP, TEST_INSTANCE_ID_1)).thenReturn(testInstance1);
        
        // When & Then
        mockMvc.perform(get("/eureka/apps/" + TEST_APP + "/" + TEST_INSTANCE_ID_1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.instance.instanceId").value(TEST_INSTANCE_ID_1))
                .andExpect(jsonPath("$.instance.appName").value(TEST_APP))
                .andExpect(jsonPath("$.instance.ipAddr").value("192.168.1.100"));
    }
    
    @Test
    void getApplicationsDeltaSuccess() throws Exception {
        // Given
        when(serviceRegistry.getApplicationNames()).thenReturn(Arrays.asList(TEST_APP));
        when(serviceRegistry.getInstances(TEST_APP)).thenReturn(Arrays.asList(testInstance1));
        
        // When & Then
        mockMvc.perform(get("/eureka/apps/delta"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.applications").isArray())
                .andExpect(jsonPath("$.versionsDelta").exists())
                .andExpect(jsonPath("$.appsHashcode").exists());
    }
}