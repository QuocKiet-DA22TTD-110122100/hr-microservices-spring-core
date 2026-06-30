package com.hrservice.gateway.security;

import reactor.core.publisher.Mono;

public interface KeyProvider {
    Mono<String> getSecretKey(String accessKeyId);
}