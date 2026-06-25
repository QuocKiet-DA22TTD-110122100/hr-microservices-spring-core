package com.hrservice.auth.iam.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Objects;

@Service
public class LoginAttemptService {

    private static final String ATTEMPT_KEY_PREFIX = "auth:login:attempts:";
    private static final String BLOCK_KEY_PREFIX = "auth:login:blocked:";

    private final StringRedisTemplate redisTemplate;
    private final int maxFailures;
    private final Duration lockDuration;

    public LoginAttemptService(
        StringRedisTemplate redisTemplate,
        @Value("${auth.login-attempt.max-failures:5}") int maxFailures,
        @Value("${auth.login-attempt.lock-minutes:30}") long lockMinutes
    ) {
        this.redisTemplate = redisTemplate;
        this.maxFailures = maxFailures;
        this.lockDuration = Duration.ofMinutes(lockMinutes);
    }

    public boolean recordFailure(String username) {
        String normalizedUsername = normalize(username);
        if (normalizedUsername == null || isBlocked(normalizedUsername)) {
            return false;
        }

        String attemptKey = Objects.requireNonNull(attemptKey(normalizedUsername), "attemptKey must not be null");
        Duration lockTtl = Objects.requireNonNull(lockDuration, "lockDuration must not be null");
        Long attempts = redisTemplate.opsForValue().increment(attemptKey);

        if (attempts == null) {
            return false;
        }

        if (attempts == 1L) {
            redisTemplate.expire(attemptKey, lockTtl);
        }

        if (attempts >= maxFailures) {
            redisTemplate.opsForValue().set(Objects.requireNonNull(blockKey(normalizedUsername), "blockKey must not be null"), "1", lockTtl);
            redisTemplate.delete(attemptKey);
            return true;
        }

        return false;
    }

    public boolean isBlocked(String username) {
        String normalizedUsername = normalize(username);
        if (normalizedUsername == null) {
            return false;
        }

        Boolean exists = redisTemplate.hasKey(Objects.requireNonNull(blockKey(normalizedUsername), "blockKey must not be null"));
        return Boolean.TRUE.equals(exists);
    }

    public void resetAttempts(String username) {
        String normalizedUsername = normalize(username);
        if (normalizedUsername == null) {
            return;
        }

        redisTemplate.delete(Objects.requireNonNull(attemptKey(normalizedUsername), "attemptKey must not be null"));
        redisTemplate.delete(Objects.requireNonNull(blockKey(normalizedUsername), "blockKey must not be null"));
    }

    private String attemptKey(String username) {
        return ATTEMPT_KEY_PREFIX + username;
    }

    private String blockKey(String username) {
        return BLOCK_KEY_PREFIX + username;
    }

    private String normalize(String username) {
        if (username == null) {
            return null;
        }

        String normalized = username.trim();
        return normalized.isEmpty() ? null : normalized;
    }
}
