package com.microservice.apigateway.filter.global;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.microservice.apigateway.dto.response.ApiResponse;
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


@Component
@Slf4j
@RequiredArgsConstructor
public class IpBlacklistFilter implements GlobalFilter, Ordered {

    private final ReactiveStringRedisTemplate reactiveRedisTemplate;
    private final ObjectMapper objectMapper;
    private static final String BLACKLIST_PREFIX = "blacklist:ip:";

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String ip = getClientIp(exchange);
        String fullKey = BLACKLIST_PREFIX + ip;

        return reactiveRedisTemplate.getExpire(fullKey)
                .defaultIfEmpty(java.time.Duration.ZERO) // Nếu không thấy key, coi như duration = 0
                .flatMap(duration -> {
                    if (duration != null && !duration.isNegative() && !duration.isZero()) {
                        long secondsLeft = duration.getSeconds();
                        log.warn("[SECURITY] IP {} đang bị chặn. Còn lại: {} giây", ip, secondsLeft);
                        return responseForbidden(exchange, ip, secondsLeft);
                    }
                    // IP sạch
                    return chain.filter(exchange);
                })
                .onErrorResume(e -> {
                    // Nếu Redis có sập, vẫn cho người dùng vào (Fail-safe)
                    log.error("Lỗi kết nối Redis trong BlacklistFilter: {}", e.getMessage());
                    return chain.filter(exchange);
                });
    }

    private String getClientIp(ServerWebExchange exchange) {
        String xf = exchange.getRequest().getHeaders().getFirst("X-Forwarded-For");
        if (xf != null && !xf.isBlank()) {
            return xf.split(",")[0].trim();
        }
        if (exchange.getRequest().getRemoteAddress() != null) {
            return exchange.getRequest().getRemoteAddress().getAddress().getHostAddress();
        }
        return "unknown";
    }

    private Mono<Void> responseForbidden(ServerWebExchange exchange, String ip, long secondsLeft) {
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
                return response.bufferFactory().wrap(objectMapper.writeValueAsBytes(apiResponse));
            } catch (Exception e) {
                return response.bufferFactory().wrap(new byte[0]);
            }
        }));
    }

    @Override
    public int getOrder() {
        return -100;
    }
}