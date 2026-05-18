package com.hrservice.gateway.security;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Component
public class SecurityL1Cache {

    private final Cache<String, Boolean> blacklistL1;

    public SecurityL1Cache(
            @Value("${app.security.token-blacklist.l1.max-size:10000}") long maxSize,
            @Value("${app.security.token-blacklist.l1.ttl-seconds:30}") long ttlSeconds
    ) {
        this.blacklistL1 = Caffeine.newBuilder()
                .maximumSize(maxSize)
                .expireAfterWrite(Duration.ofSeconds(ttlSeconds))
                .build();
    }

    public Boolean isBlacklisted(String tokenId) {
        return blacklistL1.getIfPresent(tokenId);
    }

    public void put(String tokenId) {
        blacklistL1.put(tokenId, true);
    }
}
