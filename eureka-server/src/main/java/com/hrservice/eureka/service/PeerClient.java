package com.hrservice.eureka.service;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Objects;

@Component("serviceReplicationPeerClient")
public class PeerClient {

    @Value("${eureka.peer.apps-path:/apps/}")
    private String appsPath;

    private final RestTemplate restTemplate;

    public PeerClient() {
        this.restTemplate = new RestTemplate();
    }

    public void replicateRegister(String baseUrl, String appName, Object body) {
        String url = baseUrl + getAppsPath() + appName;
        HttpHeaders headers = jsonHeaders();
        execute(url, HttpMethod.POST, new HttpEntity<>(body, headers));
    }

    public void replicateRenew(String baseUrl,
                               String appName,
                               String instanceId,
                               String status,
                               String ts) {

        String url = baseUrl + getAppsPath() + appName + "/" + instanceId
                        + "?status=" + status + "&lastDirtyTimestamp=" + ts;
        execute(url, HttpMethod.PUT, emptyEntity());
    }

    public void replicateDeregister(String baseUrl,
                                    String appName,
                                    String instanceId) {

        String url = baseUrl + getAppsPath() + appName + "/" + instanceId;
        execute(url, HttpMethod.DELETE, emptyEntity());
    }

    private String getAppsPath() {
        if (appsPath == null || appsPath.isBlank()) {
            return "/apps/";
        }
        return appsPath.endsWith("/") ? appsPath : appsPath + "/";
    }

    private void execute(String url, HttpMethod method, HttpEntity<?> entity) {
        String safeUrl = Objects.requireNonNull(url, "url must not be null");
        HttpMethod safeMethod = Objects.requireNonNull(method, "method must not be null");
        HttpEntity<?> safeEntity = Objects.requireNonNull(entity, "entity must not be null");
        restTemplate.exchange(safeUrl, safeMethod, safeEntity, String.class);
    }

    private HttpHeaders jsonHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        return headers;
    }

    private HttpEntity<Void> emptyEntity() {
        return new HttpEntity<>(new HttpHeaders());
    }
}
