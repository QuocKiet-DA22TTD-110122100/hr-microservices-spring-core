package com.hrservice.eureka.service;

import com.hrservice.eureka.Domain.model.InstanceInfo;
import com.hrservice.eureka.controller.ApplicationController;
import java.util.List;
import java.util.function.Consumer;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class ReplicationService {

        private static final Logger logger = LoggerFactory.getLogger(ReplicationService.class);

        private final ReplicationExecutor executor;
        private final PeerClient peerClient;

        @Value("${eureka.peers:}")
        private List<String> peerUrls;

        public ReplicationService(ReplicationExecutor executor,
                                  @Qualifier("serviceReplicationPeerClient") PeerClient peerClient) {
            this.executor = executor;
            this.peerClient = peerClient;
        }

        private void replicate(String action,
                       String appName,
                       String instanceId,
                       Consumer<String> task) {

            if (peerUrls == null || peerUrls.isEmpty()) {
                logger.debug("No peers configured");
                return;
            }

                peerUrls.forEach(peerUrl ->
                    executor.execute(
                        peerUrl,
                        action,
                        appName,
                        instanceId,
                        () -> task.accept(peerUrl)
                    )
                );
        }

        // ================= BUSINESS =================

        @Async
        public void register(String appName, InstanceInfo instance) {

            var wrapper = new ApplicationController.InstanceWrapper(instance);

            replicate("REGISTER", appName, instance.getInstanceId(),
                    peerUrl -> peerClient.replicateRegister(peerUrl, appName, wrapper));
        }

        @Async
        public void renew(String appName, String instanceId, String status, String ts) {

            replicate("RENEW", appName, instanceId,
                    peerUrl -> peerClient.replicateRenew(peerUrl, appName, instanceId, status, ts));
        }

        @Async
        public void deregister(String appName, String instanceId) {

            replicate("DEREGISTER", appName, instanceId,
                    peerUrl -> peerClient.replicateDeregister(peerUrl, appName, instanceId));
        }
    }
