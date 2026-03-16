package com.microservice.apigateway.filter.global;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.microservice.apigateway.dto.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.cloud.gateway.route.Route;
import org.springframework.cloud.gateway.support.ServerWebExchangeUtils;
import org.springframework.core.Ordered;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.Arrays;

/**
 * Kiểm tra Role của user từ header X-Auth-Roles (do JwtAuthFilter gắn vào).
 * Route nào cần role cụ thể thì thêm metadata: allowed-roles: ROLE_ADMIN trong application.yaml.
 * Nếu route không có allowed-roles → mọi user đã đăng nhập đều được vào.
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class RbacFilter implements GlobalFilter, Ordered {

    private final ObjectMapper objectMapper;

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        Route route = exchange.getAttribute(ServerWebExchangeUtils.GATEWAY_ROUTE_ATTR);
        if (route == null) return chain.filter(exchange);

        String allowedRoles = String.valueOf(
                route.getMetadata().getOrDefault("allowed-roles", "")
        );

        // Route không yêu cầu role cụ thể → đi tiếp
        if (allowedRoles.isBlank()) return chain.filter(exchange);

        String userRoles = exchange.getRequest().getHeaders().getFirst("X-Auth-Roles");

        if (userRoles == null || userRoles.isBlank()) {
            log.warn("[RBAC] No roles found for path: {}", exchange.getRequest().getPath());
            return onError(exchange, "Access denied: authentication required", HttpStatus.UNAUTHORIZED);
        }

        boolean hasRole = Arrays.stream(allowedRoles.split(","))
                .map(String::trim)
                .anyMatch(userRoles::contains);

        if (!hasRole) {
            log.warn("[RBAC] Denied: user roles='{}' insufficient for path='{}', required='{}'",
                    userRoles, exchange.getRequest().getPath(), allowedRoles);
            return onError(exchange, "Access denied: insufficient permissions", HttpStatus.FORBIDDEN);
        }

        return chain.filter(exchange);
    }

    private Mono<Void> onError(ServerWebExchange exchange, String message, HttpStatus status) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(status);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);

        ApiResponse<Object> errorResponse = ApiResponse.builder()
                .status(status.value())
                .message(message)
                .data(null)
                .timestamp(LocalDateTime.now())
                .build();

        return response.writeWith(Mono.fromCallable(() -> {
            byte[] bytes = objectMapper.writeValueAsBytes(errorResponse);
            return response.bufferFactory().wrap(bytes);
        }));
    }

    @Override
    public int getOrder() {
        return 1; // Sau JwtAuthFilter(0), X-Auth-Roles đã được gắn vào
    }
}
