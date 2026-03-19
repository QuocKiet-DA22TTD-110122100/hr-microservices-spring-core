package com.microservice.apigateway.filter.global;

import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.List;

/**
 * Xóa các header nội bộ từ request của client trước khi xử lý.
 * Ngăn client giả mạo danh tính bằng cách tự thêm X-Auth-User, X-Auth-Roles, v.v.
 * Phải chạy trước tất cả filter khác (order = -200).
 */
@Component
@Slf4j
public class HeaderSanitizationFilter implements GlobalFilter, Ordered {

    // Danh sách header nội bộ mà chỉ gateway được phép gắn vào
    private static final List<String> INTERNAL_HEADERS = List.of(
            "X-Auth-User",
            "X-Auth-Roles",
            "X-Internal-Secret"
    );

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest.Builder requestBuilder = exchange.getRequest().mutate();

        for (String header : INTERNAL_HEADERS) {
            if (exchange.getRequest().getHeaders().containsKey(header)) {
                log.warn("[SECURITY] Stripped spoofed internal header '{}' from client IP: {}",
                        header,
                        exchange.getRequest().getRemoteAddress() != null
                                ? exchange.getRequest().getRemoteAddress().getAddress().getHostAddress()
                                : "unknown");
                requestBuilder.header(header); // truyền không có value = xóa header
            }
        }

        return chain.filter(exchange.mutate().request(requestBuilder.build()).build());
    }

    @Override
    public int getOrder() {
        return -200; // Chạy trước tất cả: IP Blacklist(-100), Rate Limit(-5), HMAC(-1), JWT(0)
    }
}
