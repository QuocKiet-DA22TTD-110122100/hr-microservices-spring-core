package com.microservice.apigateway.client;

import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;
import com.microservice.apigateway.util.HmacUtils;

public class HmacClientTest {
    public static void main(String[] args) {
        String url = "http://localhost:8080/iam/register";
        String secret = "your_internal_secret";
        String apiKey = "client-app-001";

        // 1. Chuẩn bị dữ liệu
        String timestamp = String.valueOf(System.currentTimeMillis() / 1000);
        String nonce = "co-dinh-mot-ma-nonce-de-test";
        String method = "POST";
        String path = "/iam/register";

        // 2. Tính toán HMAC
        String dataToSign = HmacUtils.buildCanonicalString(method, path, timestamp, nonce, "");
        String signature = HmacUtils.generateSignature(dataToSign, secret);

        // 3. Thiết lập Header
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Access-Key-Id", apiKey);
        headers.set("X-Timestamp", timestamp);
        headers.set("X-Nonce", nonce);
        headers.set("X-Signature", signature);

        HttpEntity<String> entity = new HttpEntity<>(headers);
        RestTemplate restTemplate = new RestTemplate();

        // 4. Gửi Request
        try {
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);
            System.out.println("Status: " + response.getStatusCode());
            System.out.println("Body: " + response.getBody());
        } catch (Exception e) {
            System.err.println("Lỗi: " + e.getMessage());
        }
    }
}