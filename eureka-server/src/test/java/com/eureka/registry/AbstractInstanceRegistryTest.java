package com.eureka.registry;

import com.eureka.model.InstanceInfo;
import com.eureka.model.InstanceStatus;
import com.eureka.model.LeaseInfo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for AbstractInstanceRegistry.
 */
class AbstractInstanceRegistryTest {
    
    private AbstractInstanceRegistry registry;
    
    @BeforeEach
    void setUp() {
        registry = new TestableAbstractInstanceRegistry();
    }
    
    @Test
    void testRegisterInstance() {
        // Given
        InstanceInfo instance = createTestInstance("test-app", "test-instance-1", "192.168.1.1", 8080);
        
        // When
        registry.register(instance, 90, false);
        
        // Then
        assertEquals(1, registry.getInstanceCount());
        assertEquals(1, registry.getInstanceCount("test-app"));
        assertTrue(registry.hasApplication("test-app"));
        assertTrue(registry.hasInstance("test-app", "test-instance-1"));
        
        InstanceInfo retrieved = registry.getInstance("test-app", "test-instance-1");
        assertNotNull(retrieved);
        assertEquals("test-instance-1", retrieved.getInstanceId());
        assertEquals("test-app", retrieved.getAppName());
    }
    
    @Test
    void testDeregisterInstance() {
        // Given
        InstanceInfo instance = createTestInstance("test-app", "test-instance-1", "192.168.1.1", 8080);
        registry.register(instance, 90, false);
        
        // When
        boolean result = registry.deregister("test-app", "test-instance-1", false);
        
        // Then
        assertTrue(result);
        assertEquals(0, registry.getInstanceCount());
        assertFalse(registry.hasInstance("test-app", "test-instance-1"));
        assertNull(registry.getInstance("test-app", "test-instance-1"));
    }
    
    @Test
    void testRenewInstance() {
        // Given
        InstanceInfo instance = createTestInstance("test-app", "test-instance-1", "192.168.1.1", 8080);
        registry.register(instance, 90, false);
        
        // When
        boolean result = registry.renew("test-app", "test-instance-1", false);
        
        // Then
        assertTrue(result);
    }
    
    @Test
    void testRenewNonExistentInstance() {
        // When
        boolean result = registry.renew("non-existent-app", "non-existent-instance", false);
        
        // Then
        assertFalse(result);
    }
    
    @Test
    void testUpdateInstanceStatus() {
        // Given
        InstanceInfo instance = createTestInstance("test-app", "test-instance-1", "192.168.1.1", 8080);
        registry.register(instance, 90, false);
        
        // When
        boolean result = registry.updateStatus("test-app", "test-instance-1", InstanceStatus.DOWN, null, false);
        
        // Then
        assertTrue(result);
        InstanceInfo retrieved = registry.getInstance("test-app", "test-instance-1");
        assertEquals(InstanceStatus.DOWN, retrieved.getStatus());
    }
    
    @Test
    void testGetInstances() {
        // Given
        InstanceInfo instance1 = createTestInstance("test-app", "test-instance-1", "192.168.1.1", 8080);
        InstanceInfo instance2 = createTestInstance("test-app", "test-instance-2", "192.168.1.2", 8080);
        registry.register(instance1, 90, false);
        registry.register(instance2, 90, false);
        
        // When
        List<InstanceInfo> instances = registry.getInstances("test-app");
        
        // Then
        assertEquals(2, instances.size());
        assertTrue(instances.stream().anyMatch(i -> "test-instance-1".equals(i.getInstanceId())));
        assertTrue(instances.stream().anyMatch(i -> "test-instance-2".equals(i.getInstanceId())));
    }
    
    @Test
    void testGetAllInstances() {
        // Given
        InstanceInfo instance1 = createTestInstance("app1", "instance1", "192.168.1.1", 8080);
        InstanceInfo instance2 = createTestInstance("app2", "instance2", "192.168.1.2", 8080);
        registry.register(instance1, 90, false);
        registry.register(instance2, 90, false);
        
        // When
        List<InstanceInfo> allInstances = registry.getAllInstances();
        
        // Then
        assertEquals(2, allInstances.size());
    }
    
    @Test
    void testGetApplicationNames() {
        // Given
        InstanceInfo instance1 = createTestInstance("app1", "instance1", "192.168.1.1", 8080);
        InstanceInfo instance2 = createTestInstance("app2", "instance2", "192.168.1.2", 8080);
        registry.register(instance1, 90, false);
        registry.register(instance2, 90, false);
        
        // When
        List<String> appNames = registry.getApplicationNames();
        
        // Then
        assertEquals(2, appNames.size());
        assertTrue(appNames.contains("app1"));
        assertTrue(appNames.contains("app2"));
    }
    
    private InstanceInfo createTestInstance(String appName, String instanceId, String ipAddr, int port) {
        return InstanceInfo.newBuilder()
                .setAppName(appName)
                .setInstanceId(instanceId)
                .setIPAddr(ipAddr)
                .setPort(port)
                .setStatus(InstanceStatus.UP)
                .setLeaseInfo(new LeaseInfo())
                .build();
    }
    
    /**
     * Testable implementation of AbstractInstanceRegistry for unit testing.
     */
    private static class TestableAbstractInstanceRegistry extends AbstractInstanceRegistry {
        
        @Override
        protected InstanceStatus getOverriddenInstanceStatus(InstanceInfo instanceInfo, 
                                                            Lease<InstanceInfo> existingLease, 
                                                            boolean isReplication) {
            // For testing, just return the original status without any override
            return instanceInfo.getStatus();
        }
    }
}