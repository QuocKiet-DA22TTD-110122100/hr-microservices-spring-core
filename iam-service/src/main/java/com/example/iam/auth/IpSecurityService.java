package com.example.iam.auth;

import com.example.iam.config.SecurityProperties;
import com.example.iam.exception.AuthException;
import com.example.iam.security.RedisSecurityStore;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
@RequiredArgsConstructor
public class IpSecurityService {

    private static final String PREFIX_FAIL = "auth:ip:fail:";
    private static final String PREFIX_LOCK = "auth:ip:lock:";
    private static final String PREFIX_RATE = "auth:ip:rate:";

    private final SecurityProperties properties;
    private final RedisSecurityStore store;

    public void checkRateLimit(String ipAddress) {
        String secondBucket = String.valueOf(System.currentTimeMillis() / 1000);
        String key = PREFIX_RATE + ipAddress + ":" + secondBucket;
        long count = store.increment(key, Duration.ofSeconds(2));
        if (count > properties.getLock().getIpRateLimitPerSecond()) {
            throw new AuthException(HttpStatus.TOO_MANY_REQUESTS, "Rate limit exceeded for IP");
        }
    }

    public void assertIpNotLocked(String ipAddress) {
        if (store.exists(PREFIX_LOCK + ipAddress)) {
            throw new AuthException(HttpStatus.TOO_MANY_REQUESTS, "IP is temporarily locked");
        }
    }

    public void onFailedAuth(String ipAddress) {
        String failKey = PREFIX_FAIL + ipAddress;
        long failed = store.increment(failKey, Duration.ofMinutes(properties.getLock().getIpLockMinutes()));
        if (failed >= properties.getLock().getIpMaxAttempts()) {
            String lockKey = PREFIX_LOCK + ipAddress;
            store.put(lockKey, "1", Duration.ofMinutes(properties.getLock().getIpLockMinutes()));
        }
    }

    public void onSuccessAuth(String ipAddress) {
        store.delete(PREFIX_FAIL + ipAddress);
    }
}
