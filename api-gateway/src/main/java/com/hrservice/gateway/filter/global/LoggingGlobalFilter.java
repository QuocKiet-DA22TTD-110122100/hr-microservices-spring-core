package com.hrservice.gateway.filter.global;

import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;



@Component
@Slf4j
@Order(Ordered.LOWEST_PRECEDENCE)
public class LoggingGlobalFilter implements GlobalFilter {

    private static final String AUTH_USER_HEADER = "X-Auth-User";

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String path = exchange.getRequest().getPath().value();
        if (shouldSkipLogging(path)) {
            return chain.filter(exchange);
        }

        long startTime = System.currentTimeMillis();
        var httpMethod = exchange.getRequest().getMethod();
        String method = httpMethod != null ? httpMethod.name() : "UNKNOWN";
        String ip = getClientIp(exchange);
        String user = getAuthenticatedUser(exchange);

        log.info("[GW][REQ] ip={}, user={}, method={}, path={}", ip, user, method, path);

        return chain.filter(exchange).then(Mono.fromRunnable(() -> {
            long duration = System.currentTimeMillis() - startTime;
            var status = exchange.getResponse().getStatusCode();
            int statusCode = status != null
                ? status.value()
                    : 500;

            log.info("[GW][RES] ip={}, user={}, method={}, path={}, status={}, durationMs={}",
                    ip, user, method, path, statusCode, duration);
        }));
    }

    private boolean shouldSkipLogging(String path) {
        return path != null && (path.startsWith("/actuator") || path.startsWith("/health") || path.startsWith("/metrics"));
    }

    private String getAuthenticatedUser(ServerWebExchange exchange) {
        String user = exchange.getRequest().getHeaders().getFirst(AUTH_USER_HEADER);
        return user == null || user.isBlank() ? "anonymous" : user;
    }

    private String getClientIp(ServerWebExchange exchange) {
        String forwardedFor = exchange.getRequest().getHeaders().getFirst("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }

        var remoteAddress = exchange.getRequest().getRemoteAddress();
        if (remoteAddress != null && remoteAddress.getAddress() != null) {
            return remoteAddress.getAddress().getHostAddress();
        }
        return "unknown";
    }
}