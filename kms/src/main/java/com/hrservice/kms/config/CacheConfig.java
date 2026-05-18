package com.hrservice.kms.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;

import java.time.Duration;
import io.micrometer.core.instrument.MeterRegistry;
import java.util.Set;

@Configuration
@EnableCaching
@SuppressWarnings("null")
public class CacheConfig {

    public static final String JWK_BY_KID_CACHE = "kms:jwkByKid";
    public static final String JWKS_ALL_CACHE = "kms:jwksAll";

    @Bean
    public CaffeineCacheManager l1CacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager(JWK_BY_KID_CACHE, JWKS_ALL_CACHE);
        cacheManager.setCaffeine(Caffeine.newBuilder()
                .initialCapacity(50)
                .maximumSize(1000)
                .expireAfterWrite(Duration.ofMinutes(5)));
        return cacheManager;
    }

    @Bean
    public RedisCacheManager l2CacheManager(RedisConnectionFactory redisConnectionFactory) {
        RedisCacheConfiguration defaults = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(30))
                .disableCachingNullValues()
                .serializeValuesWith(
                        RedisSerializationContext.SerializationPair.fromSerializer(new GenericJackson2JsonRedisSerializer())
                );

        return RedisCacheManager.builder(redisConnectionFactory)
                .cacheDefaults(defaults)
                .withCacheConfiguration(JWK_BY_KID_CACHE, defaults.entryTtl(Duration.ofMinutes(10)))
                .withCacheConfiguration(JWKS_ALL_CACHE, defaults.entryTtl(Duration.ofMinutes(3)))
                .build();
    }

    @Bean
    @Primary
    public CacheManager cacheManager(CaffeineCacheManager l1CacheManager, RedisCacheManager l2CacheManager, MeterRegistry meterRegistry) {
        return new TwoLevelCacheManager(
                l1CacheManager,
                l2CacheManager,
                Set.of(JWK_BY_KID_CACHE, JWKS_ALL_CACHE),
                meterRegistry
        );
    }
}
