package com.hrservice.eureka.mapper;
import com.hrservice.eureka.Domain.model.InstanceInfo;
import com.hrservice.eureka.Domain.model.InstanceStatus;
import com.hrservice.eureka.Domain.model.LeaseInfo;
import com.hrservice.eureka.Domain.model.ServiceInstance;

/**
 * Converter class to transform ServiceInstance to InstanceInfo.
 * 
 * This class provides conversion from a simplified ServiceInstance model
 * to the full-featured InstanceInfo model used in the Eureka registry.
 */
public class ServiceInstanceConverter {

    /**
     * Converts a ServiceInstance to InstanceInfo.
     * 
     * @param serviceInstance the source ServiceInstance
     * @return InstanceInfo with all relevant data mapped
     */
    public static InstanceInfo toInstanceInfo(ServiceInstance serviceInstance) {
        if (serviceInstance == null) {
            return null;
        }

        InstanceInfo.Builder builder = InstanceInfo.newBuilder()
                .setInstanceId(serviceInstance.getInstanceId())
                .setAppName(serviceInstance.getServiceName())
                .setIPAddr(serviceInstance.getHost())
                .setPort(serviceInstance.getPort())
                .setStatus(mapStatus(serviceInstance.getStatus()));

        InstanceInfo instanceInfo = builder.build();

        // Create LeaseInfo from heartbeat timestamps
        LeaseInfo leaseInfo = instanceInfo.getLeaseInfo();
        if (serviceInstance.getRegistrationTime() != null) {
            leaseInfo.setRegistrationTimestamp(serviceInstance.getRegistrationTime().toEpochMilli());
        }
        if (serviceInstance.getLastHeartbeat() != null) {
            leaseInfo.setLastRenewalTimestamp(serviceInstance.getLastHeartbeat().toEpochMilli());
        }

        return instanceInfo;
    }

    /**
     * Converts InstanceInfo back to ServiceInstance.
     * 
     * @param instanceInfo the source InstanceInfo
     * @return ServiceInstance with mapped data
     */
    public static ServiceInstance toServiceInstance(InstanceInfo instanceInfo) {
        if (instanceInfo == null) {
            return null;
        }

        ServiceInstance serviceInstance = new ServiceInstance(
                instanceInfo.getInstanceId(),
                instanceInfo.getAppName()
        );
        serviceInstance.setHost(instanceInfo.getIpAddr());
        serviceInstance.setPort(instanceInfo.getPort());
        serviceInstance.setStatus(mapStatus(instanceInfo.getStatus()));

        // Convert timestamps
        LeaseInfo leaseInfo = instanceInfo.getLeaseInfo();
        if (leaseInfo != null) {
            if (leaseInfo.getRegistrationTimestamp() > 0) {
                serviceInstance.setRegistrationTime(
                    java.time.Instant.ofEpochMilli(leaseInfo.getRegistrationTimestamp())
                );
            }
            if (leaseInfo.getLastRenewalTimestamp() > 0) {
                serviceInstance.setLastHeartbeat(
                    java.time.Instant.ofEpochMilli(leaseInfo.getLastRenewalTimestamp())
                );
            }
        }

        return serviceInstance;
    }

    /**
     * Maps ServiceInstance.InstanceStatus to InstanceStatus.
     */
    private static InstanceStatus mapStatus(ServiceInstance.InstanceStatus status) {
        if (status == null) {
            return InstanceStatus.UNKNOWN;
        }
        switch (status) {
            case UP:
                return InstanceStatus.UP;
            case DOWN:
                return InstanceStatus.DOWN;
            case OUT_OF_SERVICE:
                return InstanceStatus.OUT_OF_SERVICE;
            case UNKNOWN:
            default:
                return InstanceStatus.UNKNOWN;
        }
    }

    /**
     * Maps InstanceStatus to ServiceInstance.InstanceStatus.
     */
    private static ServiceInstance.InstanceStatus mapStatus(InstanceStatus status) {
        if (status == null) {
            return ServiceInstance.InstanceStatus.UNKNOWN;
        }
        switch (status) {
            case UP:
                return ServiceInstance.InstanceStatus.UP;
            case DOWN:
                return ServiceInstance.InstanceStatus.DOWN;
            case OUT_OF_SERVICE:
                return ServiceInstance.InstanceStatus.OUT_OF_SERVICE;
            case STARTING:
                return ServiceInstance.InstanceStatus.UNKNOWN; // ServiceInstance doesn't have STARTING
            case UNKNOWN:
            default:
                return ServiceInstance.InstanceStatus.UNKNOWN;
        }
    }
}

