package com.hrservice.gateway.client;

import com.hrservice.gateway.util.HmacUtils;
import java.util.Objects;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

@SuppressWarnings({"java:S2187", "null"})
@Slf4j
public class HmacClientTest {
    public static void main(String[] args) {
        String url = "http://localhost:8080/iam/register";
        String secret = "your_internal_secret";
        String apiKey = "client-app-001";

        String timestamp = String.valueOf(System.currentTimeMillis() / 1000);
        String nonce = "co-dinh-mot-ma-nonce-de-test";
        String method = "POST";
        String path = "/iam/register";

        String dataToSign = HmacUtils.buildCanonicalString(method, path, timestamp, nonce, "");
        String signature = HmacUtils.generateSignature(dataToSign, secret);

        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Access-Key-Id", apiKey);
        headers.set("X-Timestamp", timestamp);
        headers.set("X-Nonce", nonce);
        headers.set("X-Signature", signature);

        HttpEntity<String> entity = new HttpEntity<>(headers);
        RestTemplate restTemplate = new RestTemplate();

        try {
            HttpMethod httpMethod = Objects.requireNonNull(HttpMethod.POST, "httpMethod must not be null");
            ResponseEntity<String> response = restTemplate.exchange(url, httpMethod, entity, String.class);
            log.info("HMAC client response status={}, body={}", response.getStatusCode(), response.getBody());
        } catch (RestClientException ex) {
            log.warn("HMAC client request failed: {}", ex.getMessage());
        }
    }
}
