package com.eureka.service;

import com.eureka.Domain.model.InstanceInfo;
import com.eureka.Domain.model.LeaseInfo;
import com.eureka.exception.ResourceNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
public class LeaseService {

    private static final Logger logger = LoggerFactory.getLogger(LeaseService.class);

    private final RegistryService registryService;

    public LeaseService(RegistryService registryService) {
        this.registryService = registryService;
    }

    /**
     * Renews the lease for an instance by updating lastRenewalTimestamp.
     * 
     * @param appName application name
     * @param instanceId instance ID
     * @return true if renewed successfully
     * @throws ResourceNotFoundException if instance not found
     */
    public boolean renewLease(String appName, String instanceId) {
        logger.debug("Renewing lease for {}/{}", appName, instanceId);
        InstanceInfo instance = registryService.getInstance(appName, instanceId);
        if (instance == null || instance.getLeaseInfo() == null) {
            logger.warn("Cannot renew lease: instance {}/{} not found", appName, instanceId);
            throw new ResourceNotFoundException("Instance " + instanceId + " not found for " + appName);
        }

        LeaseInfo lease = instance.getLeaseInfo();
        lease.setLastRenewalTimestamp(System.currentTimeMillis());
        instance.setLeaseInfo(lease);
        // Instance is already stored in registry by reference
        logger.debug("Lease renewed for {}/{}", appName, instanceId);
        return true;
    }

    /**
     * Checks if a lease is expired.
     */
    public boolean isLeaseExpired(String appName, String instanceId) {
        InstanceInfo instance = registryService.getInstance(appName, instanceId);
        if (instance == null || instance.getLeaseInfo() == null) {
            return true;
        }
        LeaseInfo lease = instance.getLeaseInfo();
        long expiryTime = lease.getLastRenewalTimestamp() + (lease.getDurationInSecs() * 1000L);
        return System.currentTimeMillis() > expiryTime;
    }

    /**
     * Evicts expired leases. Runs periodically.
     */
    @Scheduled(fixedDelay = 30000) // Every 30 seconds
    public void evictExpiredLeases() {
        logger.debug("Running lease eviction task");
        registryService.getApplicationNames().forEach(appName -> {
            registryService.getInstances(appName).forEach(instance -> {
                String instanceId = instance.getInstanceId();
                if (isLeaseExpired(appName, instanceId)) {
                    logger.info("Evicting expired lease for {}/{}", appName, instanceId);
                    registryService.deregister(appName, instanceId, false);
                }
            });
        });
    }
}
