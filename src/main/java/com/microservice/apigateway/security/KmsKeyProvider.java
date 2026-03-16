package com.microservice.apigateway.security;

import com.microservice.apigateway.security.KeyProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import java.time.Duration;

@Component
public class KmsKeyProvider implements KeyProvider {

    @Autowired
    private ReactiveStringRedisTemplate redisTemplate;

    @Autowired
    private WebClient.Builder webClientBuilder;

    private static final String REDIS_PREFIX = "kms:key:";

    @Override
    public Mono<String> getSecretKey(String accessKeyId) {
        String redisKey = REDIS_PREFIX + accessKeyId;

        return redisTemplate.opsForValue().get(redisKey)
                .switchIfEmpty(
                        webClientBuilder.build().get()
                                .uri("http://kms-service/api/kms/secret/{id}", accessKeyId)
                                .retrieve()
                                .bodyToMono(String.class)
                                .flatMap(secret ->
                                        redisTemplate.opsForValue().set(redisKey, secret, Duration.ofMinutes(10))
                                                .thenReturn(secret)
                                )
                                .onErrorResume(ex -> {
                                    // KMS service unavailable → fallback to empty (MockKeyProvider sẽ handle)
                                    return Mono.empty();
                                })
                );
    }
}