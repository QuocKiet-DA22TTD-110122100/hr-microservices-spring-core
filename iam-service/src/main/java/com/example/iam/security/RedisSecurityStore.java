package com.example.iam.security;

import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataAccessException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Component
@RequiredArgsConstructor
public class RedisSecurityStore {

    private final StringRedisTemplate redisTemplate;

    private final Map<String, LocalCounter> fallback = new ConcurrentHashMap<>();

    public long increment(String key, Duration ttl) {
        try {
            Long value = redisTemplate.opsForValue().increment(key);
            if (value != null && value == 1L) {
                redisTemplate.expire(key, ttl);
            }
            return value == null ? 0L : value;
        } catch (DataAccessException ex) {
            return fallbackIncrement(key, ttl);
        }
    }

    public boolean exists(String key) {
        try {
            Boolean exists = redisTemplate.hasKey(key);
            return Boolean.TRUE.equals(exists);
        } catch (DataAccessException ex) {
            LocalCounter local = fallback.get(key);
            if (local == null) {
                return false;
            }
            if (local.isExpired()) {
                fallback.remove(key);
                return false;
            }
            return true;
        }
    }

    public void put(String key, String value, Duration ttl) {
        try {
            redisTemplate.opsForValue().set(key, value, ttl);
        } catch (DataAccessException ex) {
            LocalCounter local = new LocalCounter();
            local.value.set(1);
            local.expiresAt = System.currentTimeMillis() + ttl.toMillis();
            fallback.put(key, local);
        }
    }

    public void delete(String key) {
        try {
            redisTemplate.delete(key);
        } catch (DataAccessException ex) {
            fallback.remove(key);
        }
    }

    private long fallbackIncrement(String key, Duration ttl) {
        LocalCounter local = fallback.compute(key, (k, old) -> {
            if (old == null || old.isExpired()) {
                LocalCounter next = new LocalCounter();
                next.expiresAt = System.currentTimeMillis() + ttl.toMillis();
                next.value.set(1);
                return next;
            }
            old.value.incrementAndGet();
            return old;
        });
        return local.value.get();
    }

    private static class LocalCounter {
        private final AtomicInteger value = new AtomicInteger(0);
        private long expiresAt;

        private boolean isExpired() {
            return System.currentTimeMillis() > expiresAt;
        }
    }
}
