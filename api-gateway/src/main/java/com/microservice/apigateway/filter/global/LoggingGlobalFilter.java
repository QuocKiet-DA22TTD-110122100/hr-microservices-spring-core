package com.microservice.apigateway.filter.global;

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

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        long startTime = System.currentTimeMillis();
        String path = exchange.getRequest().getPath().value();
        String method = exchange.getRequest().getMethod().name();
        String ip = exchange.getRequest().getRemoteAddress() != null
            ? exchange.getRequest().getRemoteAddress().getAddress().getHostAddress()
            : "unknown";

        // 1. Log Request khi vừa đến
        log.info("[GATEWAY] Incoming Request: IP={}, Method={}, Path={}", ip, method, path);

        return chain.filter(exchange).then(Mono.fromRunnable(() -> {
            // 2. Log Response khi quay ngược lại
            Long duration = System.currentTimeMillis() - startTime;
            int statusCode = exchange.getResponse().getStatusCode() != null
                    ? exchange.getResponse().getStatusCode().value()
                    : 500;

            log.info("[GATEWAY] Outgoing Response: Path={}, Status={}, Duration={}ms",
                    path, statusCode, duration);
        }));
    }
}