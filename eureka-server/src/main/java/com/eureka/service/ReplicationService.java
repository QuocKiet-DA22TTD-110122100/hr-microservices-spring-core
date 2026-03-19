package com.eureka.service;

import com.eureka.Domain.model.InstanceInfo;
import com.eureka.controller.ApplicationController;
import com.eureka.infrastructure.peer.PeerClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ReplicationService {

    private static final Logger logger = LoggerFactory.getLogger(ReplicationService.class);

    private final PeerClient peerClient;
    
    @Value("${eureka.peers:}")
    private List<String> peerUrls;

    public ReplicationService(PeerClient peerClient) {
        this.peerClient = peerClient;
    }

    /**
     * Replicates instance registration to peer Eureka servers asynchronously.
     */
    @Async
    public void replicateRegister(String appName, InstanceInfo instance) {
        logger.debug("Replicating REGISTER for {}/{} to peers", appName, instance.getInstanceId());
        if (peerUrls.isEmpty()) {
            logger.debug("No peers configured for replication");
            return;
        }
        peerUrls.forEach(peerUrl -> {
            try {
                peerClient.replicateRegister(appName, new ApplicationController.InstanceWrapper(instance));
                logger.debug("Replicated REGISTER to {}", peerUrl);
            } catch (Exception ex) {
                logger.warn("Replication REGISTER failed to {} for {}/{}: {}", peerUrl, appName, instance.getInstanceId(), ex.getMessage());
            }
        });
    }

    /**
     * Replicates heartbeat renewal to peers asynchronously.
     */
    @Async
    public void replicateRenew(String appName, String instanceId, String status, String lastDirtyTimestamp) {
        logger.debug("Replicating RENEW for {}/{}", appName, instanceId);
        if (peerUrls.isEmpty()) {
            return;
        }
        peerUrls.forEach(peerUrl -> {
            try {
                peerClient.replicateRenew(appName, instanceId, status, lastDirtyTimestamp);
                logger.debug("Replicated RENEW to {}", peerUrl);
            } catch (Exception ex) {
                logger.warn("Replication RENEW failed to {} for {}/{}: {}", peerUrl, appName, instanceId, ex.getMessage());
            }
        });
    }

    /**
     * Replicates deregistration to peers asynchronously.
     */
    @Async
    public void replicateDeregister(String appName, String instanceId) {
        logger.debug("Replicating DEREGISTER for {}/{}", appName, instanceId);
        if (peerUrls.isEmpty()) {
            return;
        }
        peerUrls.forEach(peerUrl -> {
            try {
                peerClient.replicateDeregister(appName, instanceId);
                logger.debug("Replicated DEREGISTER to {}", peerUrl);
            } catch (Exception ex) {
                logger.warn("Replication DEREGISTER failed to {} for {}/{}: {}", peerUrl, appName, instanceId, ex.getMessage());
            }
        });
    }
}
