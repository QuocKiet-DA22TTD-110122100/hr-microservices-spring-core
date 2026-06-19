package com.hrservice.gateway.filter;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

@Component
@Slf4j
@RequiredArgsConstructor
public class CustomRateLimitFilter implements GlobalFilter, Ordered {

    private final ReactiveRedisTemplate<String, String> reactiveRedisTemplate;
    private final ObjectMapper objectMapper;

    @Value("${app.rate-limit.login.limit:${APP_RATE_LIMIT_LOGIN_LIMIT:3}}")
    private int loginLimit;

    @Value("${app.rate-limit.login.window-seconds:${APP_RATE_LIMIT_LOGIN_WINDOW_SECONDS:5}}")
    private long loginWindowSeconds;

    private static final int REGISTER_LIMIT = 2;
    private static final Duration REGISTER_WINDOW = Duration.ofSeconds(10);

    private static final int VERIFY_LIMIT = 12;
    private static final Duration VERIFY_WINDOW = Duration.ofMinutes(1);

    private static final int WRITE_LIMIT = 20;
    private static final Duration WRITE_WINDOW = Duration.ofMinutes(1);

    private static final int READ_LIMIT = 60;
    private static final Duration READ_WINDOW = Duration.ofMinutes(1);

    private static final int DEFAULT_LIMIT = 30;
    private static final Duration DEFAULT_WINDOW = Duration.ofMinutes(1);

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String path = exchange.getRequest().getPath().value();
        if (shouldSkipLogging(path)) {
            return chain.filter(exchange);
        }

        RateLimitPolicy policy = resolvePolicy(exchange);
        String ip = getClientIp(exchange);
        String routeKey = policy.key();
        String key = "rate_limit:" + routeKey + ":" + ip;

        log.debug("[GW][RATE_LIMIT] policy={}, ip={}, method={}, path={}",
                policy.name(), ip, exchange.getRequest().getMethod(), exchange.getRequest().getPath().value());

        return reactiveRedisTemplate.opsForValue()
                .increment(key)
                .flatMap(count -> {
                    if (count == 1) {
                        return reactiveRedisTemplate.expire(key, Objects.requireNonNull(policy.window()))
                                .then(chain.filter(exchange));
                    } else if (count > policy.limit()) {
                        log.warn("[GW][RATE_LIMIT] policy={}, ip={}, result=throttled, currentRequests={}, limit={}",
                                policy.name(), ip, count, policy.limit());
                        return rateLimitExceeded(exchange, ip, count, policy);
                    } else {
                        return chain.filter(exchange);
                    }
                });
    }

    private String getClientIp(ServerWebExchange exchange) {
        String xForwardedFor = exchange.getRequest().getHeaders().getFirst("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            String clientIp = xForwardedFor.split(",")[0].trim();
            log.debug("[IP_DETECTION] X-Forwarded-For: {} -> Client IP: {}", xForwardedFor, clientIp);
            return clientIp;
        }

        String cfConnectingIp = exchange.getRequest().getHeaders().getFirst("CF-Connecting-IP");
        if (StringUtils.hasText(cfConnectingIp)) {
            log.debug("[IP_DETECTION] CF-Connecting-IP: {}", cfConnectingIp);
            return cfConnectingIp;
        }

        String xRealIp = exchange.getRequest().getHeaders().getFirst("X-Real-IP");
        if (StringUtils.hasText(xRealIp)) {
            log.debug("[IP_DETECTION] X-Real-IP: {}", xRealIp);
            return xRealIp;
        }

        String xForwardedHost = exchange.getRequest().getHeaders().getFirst("X-Forwarded-Host");
        if (StringUtils.hasText(xForwardedHost)) {
            log.debug("[IP_DETECTION] X-Forwarded-Host: {}", xForwardedHost);
            return xForwardedHost;
        }

        String forwarded = exchange.getRequest().getHeaders().getFirst("Forwarded");
        if (StringUtils.hasText(forwarded)) {
            String forwardedIp = extractForwardedIp(forwarded);
            if (forwardedIp != null) {
                log.debug("[IP_DETECTION] Forwarded for: {}", forwardedIp);
                return forwardedIp;
            }
        }

        String remoteIp;
        var remoteAddress = exchange.getRequest().getRemoteAddress();
        if (remoteAddress != null && remoteAddress.getAddress() != null) {
            remoteIp = remoteAddress.getAddress().getHostAddress();
        } else {
            remoteIp = "unknown";
        }
        log.debug("[IP_DETECTION] Remote Address (fallback): {}", remoteIp);
        return remoteIp;
    }

    private String extractForwardedIp(String forwarded) {
        String[] parts = forwarded.split(";");
        for (String part : parts) {
            String trimmedPart = part.trim();
            if (trimmedPart.startsWith("for=")) {
                return trimmedPart.substring(4).replace("\"", "");
            }
        }
        return null;
    }

    private RateLimitPolicy resolvePolicy(ServerWebExchange exchange) {
        String path = exchange.getRequest().getPath().value();
        String method = Optional.ofNullable(exchange.getRequest().getMethod())
            .map(org.springframework.http.HttpMethod::name)
                .orElse("GET");

        if ("/api/iam/login".equals(path) || "/api/xac-thuc/dang-nhap".equals(path) || "/api/xac-thuc/oauth2/token".equals(path)) {
            return new RateLimitPolicy("login", loginLimit, Duration.ofSeconds(loginWindowSeconds));
        }

        if (
            "/api/iam/register".equals(path)
                || "/api/iam/user/register".equals(path)
                || "/api/xac-thuc/dang-ky".equals(path)
                || "/api/xac-thuc/2fa/khoi-tao".equals(path)
                || "/api/xac-thuc/2fa/xac-nhan".equals(path)
                || "/api/xac-thuc/2fa/tat".equals(path)
        ) {
            return new RateLimitPolicy("register", REGISTER_LIMIT, REGISTER_WINDOW);
        }

        if ("/api/iam/verify".equals(path) || "/api/xac-thuc/kiem-tra".equals(path)) {
            return new RateLimitPolicy("verify", VERIFY_LIMIT, VERIFY_WINDOW);
        }

        if ("/api/iam/logout".equals(path) || "/api/xac-thuc/dang-xuat".equals(path)) {
            return new RateLimitPolicy("logout", VERIFY_LIMIT, VERIFY_WINDOW);
        }

        if ("GET".equals(method)) {
            return new RateLimitPolicy("read", READ_LIMIT, READ_WINDOW);
        }

        if ("POST".equals(method) || "PUT".equals(method) || "PATCH".equals(method) || "DELETE".equals(method)) {
            return new RateLimitPolicy("write", WRITE_LIMIT, WRITE_WINDOW);
        }

        return new RateLimitPolicy("default", DEFAULT_LIMIT, DEFAULT_WINDOW);
    }

    @SuppressWarnings("null")
    private Mono<Void> rateLimitExceeded(ServerWebExchange exchange, String ip, Long currentCount, RateLimitPolicy policy) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(HttpStatus.TOO_MANY_REQUESTS);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);
        response.getHeaders().add("Retry-After", String.valueOf(Math.max(1, policy.window().getSeconds())));

        Map<String, Object> errorBody = new HashMap<>();
        errorBody.put("timestamp", LocalDateTime.now().toString());
        errorBody.put("status", 429);
        errorBody.put("error", "Too Many Requests");
        errorBody.put("message", "Bạn đang gửi request quá nhanh. Giới hạn: " + policy.limit() + " request/" + policy.window().getSeconds() + "s cho " + policy.name());
        errorBody.put("path", exchange.getRequest().getPath().value());
        errorBody.put("ip", ip);
        errorBody.put("currentRequests", currentCount);
        errorBody.put("retryAfter", policy.window().toSeconds() + " seconds");
        errorBody.put("policy", policy.name());
        errorBody.put("limit", policy.limit());
        errorBody.put("windowSeconds", policy.window().toSeconds());

        return response.writeWith(Mono.just(response.bufferFactory().wrap(toErrorJson(errorBody))));
    }

    private byte[] toErrorJson(Map<String, Object> errorBody) {
            try {
                return objectMapper.writeValueAsBytes(errorBody);
            } catch (Exception e) {
                log.error("Error writing rate limit response", e);
                return "{\"error\":\"Rate limit exceeded\"}".getBytes();
            }
    }

    @Override
    public int getOrder() {
        return -5;
    }

    private record RateLimitPolicy(String name, int limit, Duration window) {
        private String key() {
            return name;
        }
    }

    private boolean shouldSkipLogging(String path) {
        return path != null && (path.startsWith("/actuator") || path.startsWith("/health") || path.startsWith("/metrics"));
    }
}
