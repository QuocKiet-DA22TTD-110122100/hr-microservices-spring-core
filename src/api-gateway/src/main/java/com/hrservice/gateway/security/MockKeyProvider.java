package com.hrservice.gateway.security;

import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.Map;

@Component
@Primary // Ưu tiên dùng bản Mock này thay vì KmsKeyProvider
public class MockKeyProvider implements KeyProvider {

    private static final Map<String, String> MOCK_KEYS = new HashMap<>();

    static {
        // Khai báo các cặp AccessKey - SecretKey để test
        MOCK_KEYS.put("client-app-001", "secret-key-12345");
        MOCK_KEYS.put("mobile-app-99", "another-secret-67890");
    }

    @Override
    public Mono<String> getSecretKey(String accessKeyId) {
        // Trả về Key từ Map thay vì gọi KMS
        String secret = MOCK_KEYS.get(accessKeyId);
        return secret != null ? Mono.just(secret) : Mono.empty();
    }
}