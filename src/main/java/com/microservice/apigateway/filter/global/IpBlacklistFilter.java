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

import java.net.InetAddress;


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
        if(ip == null){
            return chain.filter(exchange);
        }
        String fullKey = BLACKLIST_PREFIX + ip;

        return reactiveRedisTemplate.getExpire(fullKey)
                .defaultIfEmpty(java.time.Duration.ZERO) // Nếu không thấy key, coi như duration = 0
                .flatMap(duration -> {
                    if (duration.getSeconds() > 0) {
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

        // 1. Check X-Forwarded-For
        String xForwardedFor = exchange.getRequest()
                .getHeaders()
                .getFirst("X-Forwarded-For");

        if (xForwardedFor != null && !xForwardedFor.isBlank()) {

            // Có thể chứa nhiều IP: client, proxy1, proxy2
            String ip = xForwardedFor.split(",")[0].trim();

            return normalizeIp(ip);
        }

        // 2. Check X-Real-IP
        String realIp = exchange.getRequest()
                .getHeaders()
                .getFirst("X-Real-IP");

        if (realIp != null && !realIp.isBlank()) {

            return normalizeIp(realIp.trim());
        }

        // 3. Fallback remote address
        if (exchange.getRequest().getRemoteAddress() != null) {

            String ip = exchange.getRequest()
                    .getRemoteAddress()
                    .getAddress()
                    .getHostAddress();

            return normalizeIp(ip);
        }

        return "unknown";
    }


    private String normalizeIp(String ip) {

        try {

            InetAddress inetAddress = InetAddress.getByName(ip);

            return inetAddress.getHostAddress();

        } catch (Exception e) {

            return ip;
        }
    }

    private Mono<Void> responseForbidden(ServerWebExchange exchange, String ip, long secondsLeft) {
        ServerHttpResponse response = exchange.getResponse();

        response.setStatusCode(HttpStatus.FORBIDDEN);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);

        long minutes = secondsLeft / 60;
        long seconds = secondsLeft % 60;

        String timeLeft = minutes + "phút" + seconds + "giây";

        ApiResponse<Object> apiResponse = ApiResponse.builder()
                .status(HttpStatus.FORBIDDEN.value())
                .message("IP của bạn đã bị tạm khóa. Vui lòng thử lại sau: " + timeLeft)
                .build();

        try{
            byte[] body = objectMapper.writeValueAsBytes(apiResponse);
            return  response.writeWith(
                    Mono.just(response.bufferFactory().wrap(body))
            );
        }catch (Exception e) {
            return response.setComplete();
        }
    }

    @Override
    public int getOrder() {
        return -100;
    }
}