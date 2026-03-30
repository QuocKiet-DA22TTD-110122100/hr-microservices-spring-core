package com.eureka.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class ReplicationExecutor {

    private static final Logger logger = LoggerFactory.getLogger(ReplicationExecutor.class);

    public void execute(String peerUrl,
                        String action,
                        String appName,
                        String instanceId,
                        Runnable task) {

        int maxRetry = 3;

        for (int i = 1; i <= maxRetry; i++) {
            try {
                long start = System.currentTimeMillis();

                task.run();

                long time = System.currentTimeMillis() - start;

                logger.debug("[{}] SUCCESS -> {} ({} ms, attempt {})",
                        action, peerUrl, time, i);

                return;

            } catch (Exception ex) {

                logger.warn("[{}] FAIL {} -> {} for {}/{}: {}",
                        action, i, peerUrl, appName, instanceId, ex.getMessage());

                if (i == maxRetry) {
                    logger.error("[{}] FINAL FAIL -> {}", action, peerUrl);
                }

                sleep(100L * i);
            }
        }
    }

    private void sleep(long ms) {
        try {
            Thread.sleep(ms);
        } catch (InterruptedException ignored) {
            Thread.currentThread().interrupt();
        }
    }
}
