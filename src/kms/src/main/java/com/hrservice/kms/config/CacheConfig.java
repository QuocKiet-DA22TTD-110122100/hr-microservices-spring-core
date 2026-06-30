package com.hrservice.kms.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

@Configuration
@EnableCaching
public class CacheConfig {

    public static final String JWK_BY_KID_CACHE = "kms:jwkByKid";
    public static final String JWKS_ALL_CACHE    = "kms:jwksAll";

    // KMS keys are entirely in-memory — Caffeine L1 is sufficient.
    // Redis L2 was causing 30s+ slowdowns on cache miss due to Redis connection timeouts.
    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager mgr = new CaffeineCacheManager(JWK_BY_KID_CACHE, JWKS_ALL_CACHE);
        mgr.setCaffeine(Caffeine.newBuilder()
                .initialCapacity(10)
                .maximumSize(100)
                .expireAfterWrite(Duration.ofMinutes(10)));
        return mgr;
    }
}
