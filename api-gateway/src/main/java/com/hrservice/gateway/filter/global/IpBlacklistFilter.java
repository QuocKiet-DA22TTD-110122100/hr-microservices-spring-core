package com.hrservice.gateway.filter.global;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hrservice.gateway.dto.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.util.Objects;

@Component
@Slf4j
@RequiredArgsConstructor
@SuppressWarnings("null")
public class IpBlacklistFilter implements GlobalFilter, Ordered {

    private final ReactiveStringRedisTemplate reactiveRedisTemplate;
    private final ObjectMapper objectMapper;
    private static final String BLACKLIST_PREFIX = "blacklist:ip:";

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String path = exchange.getRequest().getPath().value();
        String method = exchange.getRequest().getMethod() != null ? exchange.getRequest().getMethod().name() : "UNKNOWN";
        String ip = getClientIp(exchange);
        String fullKey = BLACKLIST_PREFIX + ip;

        log.info("[GW][IP_BLOCK] method={}, path={}, detectedIp={}, redisKey={}", method, path, ip, fullKey);

        return reactiveRedisTemplate.getExpire(fullKey)
                .defaultIfEmpty(java.time.Duration.ZERO)
                .flatMap(duration -> {
                    if (duration != null && !duration.isNegative() && !duration.isZero()) {
                        long secondsLeft = duration.getSeconds();
                        log.warn("[GW][IP_BLOCK] method={}, path={}, detectedIp={}, redisKey={}, result=blocked, secondsLeft={}",
                                method, path, ip, fullKey, secondsLeft);
                        return responseForbidden(exchange, secondsLeft);
                    }
                    log.debug("[GW][IP_BLOCK] method={}, path={}, detectedIp={}, redisKey={}, result=allowed", method, path, ip, fullKey);
                    return chain.filter(exchange);
                })
                .onErrorResume(e -> {
                    // Fail open if Redis is unavailable.
                    log.error("[GW][IP_BLOCK] method={}, path={}, detectedIp={}, redisKey={}, result=redis_error, fallback=allow, reason={}",
                            method, path, ip, fullKey, e.getMessage());
                    return chain.filter(exchange);
                });
    }

    private String getClientIp(ServerWebExchange exchange) {
        String xf = exchange.getRequest().getHeaders().getFirst("X-Forwarded-For");
        if (xf != null && !xf.isBlank()) {
            return xf.split(",")[0].trim();
        }
        var remoteAddress = exchange.getRequest().getRemoteAddress();
        if (remoteAddress != null && remoteAddress.getAddress() != null) {
            return remoteAddress.getAddress().getHostAddress();
        }
        return "unknown";
    }

    private Mono<Void> responseForbidden(ServerWebExchange exchange, long secondsLeft) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(HttpStatus.FORBIDDEN);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);


        long minutes = secondsLeft / 60;
        long seconds = secondsLeft % 60;
        String timeLeft = String.format("%d phút %d giây", minutes, seconds);

        ApiResponse<Object> apiResponse = ApiResponse.builder()
                .status(HttpStatus.FORBIDDEN.value())
                .message("IP của bạn đã bị tạm khóa. Vui lòng thử lại sau: " + timeLeft)
                .build();

        return response.writeWith(Mono.fromSupplier(() -> {
            try {
                byte[] payload = Objects.requireNonNull(objectMapper.writeValueAsBytes(apiResponse), "payload must not be null");
                return response.bufferFactory().wrap(payload);
            } catch (Exception e) {
                log.error("Error writing error response", e);
                return response.bufferFactory().wrap("{}".getBytes(StandardCharsets.UTF_8));
            }
        }));
    }

    @Override
    public int getOrder() {
        return -100;
    }
}