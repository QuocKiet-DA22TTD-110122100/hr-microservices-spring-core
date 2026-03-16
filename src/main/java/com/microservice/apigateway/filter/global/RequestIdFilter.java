package com.microservice.apigateway.filter.global;

import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * Tạo X-Request-ID duy nhất cho mỗi request để trace log xuyên suốt giữa các service.
 * Nếu client đã gửi X-Request-ID hợp lệ thì giữ nguyên, ngược lại tạo mới.
 */
@Component
@Slf4j
public class RequestIdFilter implements GlobalFilter, Ordered {

    public static final String REQUEST_ID_HEADER = "X-Request-ID";

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String requestId = exchange.getRequest().getHeaders().getFirst(REQUEST_ID_HEADER);

        if (requestId == null || requestId.isBlank()) {
            requestId = UUID.randomUUID().toString();
        }

        final String finalRequestId = requestId;

        ServerHttpRequest mutatedRequest = exchange.getRequest().mutate()
                .header(REQUEST_ID_HEADER, finalRequestId)
                .build();

        log.debug("[REQUEST-ID] {} {} => {}",
                exchange.getRequest().getMethod(),
                exchange.getRequest().getPath(),
                finalRequestId);

        exchange.getResponse().beforeCommit(() ->{
            exchange.getResponse().getHeaders().add(REQUEST_ID_HEADER, finalRequestId);
            return Mono.empty();
        });

        return chain.filter(exchange.mutate().request(mutatedRequest).build());
    }

    @Override
    public int getOrder() {
        return -150; // Sau HeaderSanitization(-200), trước IP Blacklist(-100)
    }
}
