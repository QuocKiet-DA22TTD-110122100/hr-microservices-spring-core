package com.hrservice.task.config;

import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;

import java.util.Objects;

@Configuration
@EnableCaching
// Đây là lớp cấu hình cache cho Task Service, sử dụng Redis làm cache provider. Nó định nghĩa một bean CacheManager để quản lý cache trong ứng dụng, cho phép lưu trữ và truy xuất dữ liệu nhanh chóng từ Redis, giúp cải thiện hiệu suất của các truy vấn thường xuyên và giảm tải cho cơ sở dữ liệu.
public class CacheConfig {

    @Bean
    public CacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        return RedisCacheManager.create(Objects.requireNonNull(connectionFactory, "connectionFactory must not be null"));
    }
}
