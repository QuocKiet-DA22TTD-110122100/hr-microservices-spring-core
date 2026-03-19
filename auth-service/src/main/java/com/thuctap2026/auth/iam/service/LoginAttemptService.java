package com.thuctap2026.auth.iam.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

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

    public void recordFailure(String username) {
        String normalizedUsername = normalize(username);
        if (normalizedUsername == null || isBlocked(normalizedUsername)) {
            return;
        }

        String attemptKey = attemptKey(normalizedUsername);
        Long attempts = redisTemplate.opsForValue().increment(attemptKey);

        if (attempts == null) {
            return;
        }

        if (attempts == 1L) {
            redisTemplate.expire(attemptKey, lockDuration);
        }

        if (attempts >= maxFailures) {
            redisTemplate.opsForValue().set(blockKey(normalizedUsername), "1", lockDuration);
            redisTemplate.delete(attemptKey);
        }
    }

    public boolean isBlocked(String username) {
        String normalizedUsername = normalize(username);
        if (normalizedUsername == null) {
            return false;
        }

        Boolean exists = redisTemplate.hasKey(blockKey(normalizedUsername));
        return Boolean.TRUE.equals(exists);
    }

    public void resetAttempts(String username) {
        String normalizedUsername = normalize(username);
        if (normalizedUsername == null) {
            return;
        }

        redisTemplate.delete(attemptKey(normalizedUsername));
        redisTemplate.delete(blockKey(normalizedUsername));
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
