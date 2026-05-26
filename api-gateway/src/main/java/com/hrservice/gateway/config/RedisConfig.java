package com.hrservice.gateway.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.data.redis.connection.ReactiveRedisConnectionFactory;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.util.StringUtils;

import java.util.Objects;

@Configuration
@Slf4j
public class RedisConfig {

    @Value("${spring.data.redis.password:${REDIS_PASSWORD:}}")
    private String redisPassword;

    @Value("${spring.data.redis.host:${REDIS_HOST:127.0.0.1}}")
    private String redisHost;

    @Value("${spring.data.redis.port:${REDIS_PORT:6379}}")
    private int redisPort;

    @Bean
    @Primary
    public ReactiveRedisConnectionFactory reactiveRedisConnectionFactory() {

        RedisStandaloneConfiguration config = new RedisStandaloneConfiguration(
                Objects.requireNonNull(redisHost, "redisHost must not be null"),
                redisPort
        );
        if (StringUtils.hasText(redisPassword)) {
            config.setPassword(redisPassword);
        }

        log.info("Initializing Redis reactive connection factory: host={}, port={}", redisHost, redisPort);

        return new LettuceConnectionFactory(config);
    }
}