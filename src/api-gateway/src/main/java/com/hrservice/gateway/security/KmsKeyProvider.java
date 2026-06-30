package com.hrservice.gateway.security;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.Objects;

@Component
@RequiredArgsConstructor
public class KmsKeyProvider implements KeyProvider {

        private final ReactiveStringRedisTemplate redisTemplate;
        private final WebClient.Builder webClientBuilder;

    private static final String REDIS_PREFIX = "kms:key:";

    @Override
    public Mono<String> getSecretKey(String accessKeyId) {
        String redisKey = REDIS_PREFIX + accessKeyId;

        return redisTemplate.opsForValue().get(redisKey)
                .switchIfEmpty(
                        // Gọi sang service IAM để lấy khóa nếu Redis trống
                        webClientBuilder.build().get()
                                .uri("http://iam-service/api/kms/secret/{id}", accessKeyId)
                                .retrieve()
                                .bodyToMono(String.class)
                                .flatMap(secret ->
                                        // Lưu lại vào Redis trong 10 phút để tối ưu hiệu năng
                                        redisTemplate.opsForValue().set(
                                                Objects.requireNonNull(redisKey, "redisKey must not be null"),
                                                Objects.requireNonNull(secret, "secret must not be null"),
                                                Objects.requireNonNull(Duration.ofMinutes(10), "ttl must not be null")
                                        )
                                                .thenReturn(secret)
                                )
                );
    }
}