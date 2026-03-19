package com.eureka.infrastructure.peer;

// Added by qodo: Peer replication client for Eureka peers

import com.eureka.controller.ApplicationController.InstanceWrapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestTemplate;

import java.net.URI;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class PeerClient {

    private static final Logger logger = LoggerFactory.getLogger(PeerClient.class);
    public static final String REPLICATION_HEADER = "X-Replication"; // must align with controller

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${eureka.client.service-url.defaultZone:}")
    private String defaultZone;

    @Value("${server.port:0}")
    private int serverPort;

    @Value("${eureka.instance.hostname:}")
    private String hostname;

    public void replicateRegister(String appName, InstanceWrapper body) {
        for (String base : getPeerBases()) {
            try {
                String url = base + "/apps/" + appName;
                HttpHeaders headers = replicationHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);
                HttpEntity<InstanceWrapper> entity = new HttpEntity<>(body, headers);
                @SuppressWarnings({"null", "unused"})
                var response = restTemplate.exchange(URI.create(url), HttpMethod.POST, entity, String.class);
                logger.debug("Replicated REGISTER to {} for app {}", url, appName);
            } catch (Exception ex) {
                logger.warn("REGISTER replicate failed to peer for app {}: {}", appName, ex.getMessage());
            }
        }
    }

    public void replicateRenew(String appName, String instanceId, @Nullable String status, @Nullable String lastDirtyTimestamp) {
        for (String base : getPeerBases()) {
            try {
                StringBuilder sb = new StringBuilder(base).append("/apps/")
                        .append(appName).append('/')
                        .append(instanceId);
                List<String> q = new ArrayList<>();
                if (StringUtils.hasText(status)) q.add("status=" + status);
                if (StringUtils.hasText(lastDirtyTimestamp)) q.add("lastDirtyTimestamp=" + lastDirtyTimestamp);
                if (!q.isEmpty()) sb.append('?').append(String.join("&", q));
                String url = sb.toString();

                HttpHeaders headers = replicationHeaders();
                @SuppressWarnings({"null", "unused"})
                HttpEntity<Void> entity = new HttpEntity<>(headers);
                @SuppressWarnings({"null", "unused"})
                var response = restTemplate.exchange(URI.create(url), HttpMethod.PUT, entity, String.class);
                logger.debug("Replicated RENEW to {} for {}/{}", url, appName, instanceId);
            } catch (Exception ex) {
                logger.warn("RENEW replicate failed to peer for {}/{}: {}", appName, instanceId, ex.getMessage());
            }
        }
    }

    public void replicateDeregister(String appName, String instanceId) {
        for (String base : getPeerBases()) {
            try {
                String url = base + "/apps/" + appName + "/" + instanceId;
                HttpHeaders headers = replicationHeaders();
                @SuppressWarnings({"null", "unused"})
                HttpEntity<Void> entity = new HttpEntity<>(headers);
                @SuppressWarnings({"null", "unused"})
                var unused = restTemplate.exchange(URI.create(url), HttpMethod.DELETE, entity, String.class);
                logger.debug("Replicated DEREGISTER to {} for {}/{}", url, appName, instanceId);
            } catch (Exception ex) {
                logger.warn("DEREGISTER replicate failed to peer for {}/{}: {}", appName, instanceId, ex.getMessage());
            }
        }
    }

    private HttpHeaders replicationHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.add(REPLICATION_HEADER, "true");
        return headers;
    }

    private List<String> getPeerBases() {
        // defaultZone forms: "http://user:pass@eureka-peer2:8762/eureka/,http://.../eureka/"
        if (!StringUtils.hasText(defaultZone)) return List.of();
        String mePort = ":" + serverPort + "/"; // e.g., :8761/
        return Arrays.stream(defaultZone.split(","))
                .map(String::trim)
                .filter(StringUtils::hasText)
                .map(u -> u.endsWith("/") ? u.substring(0, u.length() - 1) : u)
                .filter(u -> !isSelf(u, mePort))
                .map(u -> u.endsWith("/eureka") ? u : (u + "/eureka"))
                .collect(Collectors.toList());
    }

    private boolean isSelf(String url, String mePortSuffix) {
        try {
            // Rough checks: by port or by hostname match
            if (serverPort > 0 && url.contains(mePortSuffix)) return true;
            if (StringUtils.hasText(hostname) && url.contains(hostname)) return true;
        } catch (Exception ignore) {
        }
        return false;
    }
}
