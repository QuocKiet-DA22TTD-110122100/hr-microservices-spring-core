package com.microservice.apigateway.filter;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Component
@Slf4j
@RequiredArgsConstructor
public class CustomRateLimitFilter implements GlobalFilter, Ordered {

    private final ReactiveRedisTemplate<String, String> reactiveRedisTemplate;
    private final ObjectMapper objectMapper;

    private static final int RATE_LIMIT = 1;
    private static final Duration WINDOW_SIZE = Duration.ofSeconds(1);

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String ip = getClientIp(exchange);
        String key = "rate_limit:" + ip;

        // Log để debug IP detection
        log.info("[RATE_LIMIT] Detected client IP: {} for path: {}", 
                ip, exchange.getRequest().getPath().value());

        return reactiveRedisTemplate.opsForValue()
                .increment(key)
                .flatMap(count -> {
                    if (count == 1) {
                        // Lần đầu tiên trong window, set TTL
                        return reactiveRedisTemplate.expire(key, WINDOW_SIZE)
                                .then(chain.filter(exchange));
                    } else if (count > RATE_LIMIT) {
                        // Vượt rate limit
                        log.warn("[RATE_LIMIT] IP {} exceeded rate limit: {}/{}", ip, count, RATE_LIMIT);
                        return rateLimitExceeded(exchange, ip, count);
                    } else {
                        // Trong giới hạn
                        return chain.filter(exchange);
                    }
                });
    }

    private String getClientIp(ServerWebExchange exchange) {
        // 1. Kiểm tra X-Forwarded-For (từ proxy/load balancer)
        String xForwardedFor = exchange.getRequest().getHeaders().getFirst("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            // Lấy IP đầu tiên (IP gốc của client)
            String clientIp = xForwardedFor.split(",")[0].trim();
            log.debug("[IP_DETECTION] X-Forwarded-For: {} -> Client IP: {}", xForwardedFor, clientIp);
            return clientIp;
        }

        // 2. Kiểm tra CF-Connecting-IP (từ Cloudflare)
        String cfConnectingIp = exchange.getRequest().getHeaders().getFirst("CF-Connecting-IP");
        if (cfConnectingIp != null && !cfConnectingIp.isEmpty()) {
            log.debug("[IP_DETECTION] CF-Connecting-IP: {}", cfConnectingIp);
            return cfConnectingIp;
        }

        // 3. Kiểm tra X-Real-IP (từ Nginx)
        String xRealIp = exchange.getRequest().getHeaders().getFirst("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            log.debug("[IP_DETECTION] X-Real-IP: {}", xRealIp);
            return xRealIp;
        }

        // 3. Kiểm tra X-Forwarded-Host
        String xForwardedHost = exchange.getRequest().getHeaders().getFirst("X-Forwarded-Host");
        if (xForwardedHost != null && !xForwardedHost.isEmpty()) {
            log.debug("[IP_DETECTION] X-Forwarded-Host: {}", xForwardedHost);
            return xForwardedHost;
        }

        // 4. Kiểm tra Forwarded header (RFC 7239)
        String forwarded = exchange.getRequest().getHeaders().getFirst("Forwarded");
        if (forwarded != null && !forwarded.isEmpty()) {
            // Parse: for=192.0.2.60;proto=http;by=203.0.113.43
            String[] parts = forwarded.split(";");
            for (String part : parts) {
                if (part.trim().startsWith("for=")) {
                    String forValue = part.trim().substring(4);
                    // Remove quotes if present
                    forValue = forValue.replaceAll("\"", "");
                    log.debug("[IP_DETECTION] Forwarded for: {}", forValue);
                    return forValue;
                }
            }
        }

        // 5. Fallback: Remote Address (có thể là proxy IP)
        String remoteIp = exchange.getRequest().getRemoteAddress() != null
            ? exchange.getRequest().getRemoteAddress().getAddress().getHostAddress()
            : "unknown";
        log.debug("[IP_DETECTION] Remote Address (fallback): {}", remoteIp);
        return remoteIp;
    }

    private Mono<Void> rateLimitExceeded(ServerWebExchange exchange, String ip, Long currentCount) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(HttpStatus.TOO_MANY_REQUESTS);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);
        response.getHeaders().add("Retry-After", "1");

        Map<String, Object> errorBody = new HashMap<>();
        errorBody.put("timestamp", LocalDateTime.now().toString());
        errorBody.put("status", 429);
        errorBody.put("error", "Too Many Requests");
        errorBody.put("message", "Bạn đang gửi request quá nhanh. Giới hạn: " + RATE_LIMIT + " request/giây");
        errorBody.put("path", exchange.getRequest().getPath().value());
        errorBody.put("ip", ip);
        errorBody.put("currentRequests", currentCount);
        errorBody.put("retryAfter", "1 second");

        return response.writeWith(Mono.fromSupplier(() -> {
            try {
                byte[] bytes = objectMapper.writeValueAsBytes(errorBody);
                return response.bufferFactory().wrap(bytes);
            } catch (Exception e) {
                log.error("Error writing rate limit response", e);
                return response.bufferFactory().wrap("{\"error\":\"Rate limit exceeded\"}".getBytes());
            }
        }));
    }

    @Override
    public int getOrder() {
        return -5; // Chạy sau IP Blacklist (-10) nhưng trước các filter khác
    }
}