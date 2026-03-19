package com.microservice.apigateway.security;

import reactor.core.publisher.Mono;

public interface KeyProvider {
    Mono<String> getSecretKey(String accessKeyId);
}