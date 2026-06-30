package com.hrservice.gateway.filter.global;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hrservice.gateway.dto.request.HmacHeaders;
import com.hrservice.gateway.dto.response.ApiResponse;
import com.hrservice.gateway.security.KeyProvider;
import com.hrservice.gateway.util.HmacUtils;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.cloud.gateway.route.Route;
import org.springframework.cloud.gateway.support.ServerWebExchangeUtils;
import org.springframework.core.Ordered;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.core.io.buffer.DefaultDataBufferFactory;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpRequestDecorator;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Component
@Slf4j
@RequiredArgsConstructor
@SuppressWarnings("null")
public class HmacSecurityFilter implements GlobalFilter, Ordered {

    private static final Duration NONCE_TTL = Duration.ofMinutes(5);
    private static final long MAX_CLOCK_SKEW_SECONDS = 300;

    private final ObjectMapper objectMapper;
    private final ReactiveStringRedisTemplate redisTemplate;
    private final KeyProvider keyProvider;

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        if (!shouldAuthenticate(exchange)) {
            return chain.filter(exchange);
        }

        ServerHttpRequest request = exchange.getRequest();
        HmacHeaders hmac = HmacHeaders.from(request);

        if (hmac.isInvalid()) {
            log.debug("HMAC headers are missing or invalid. Received header names: {}", request.getHeaders().keySet());
            return onError(exchange, "Missing security headers", HttpStatus.UNAUTHORIZED);
        }

        return validateNonce(hmac.nonce())
                .then(validateTimestamp(hmac.timestamp()))
                .then(resolveBodyAndVerify(exchange, hmac))
                .flatMap(chain::filter)
                .onErrorResume(ex -> onError(exchange, ex.getMessage(), HttpStatus.UNAUTHORIZED));
    }

    private Mono<ServerWebExchange> resolveBodyAndVerify(ServerWebExchange exchange, HmacHeaders hmac) {
        HttpMethod method = exchange.getRequest().getMethod();
        boolean hasBody = method != HttpMethod.GET && method != HttpMethod.DELETE;

        if (!hasBody) {
            return verifyHmacStep(exchange, hmac, "").thenReturn(exchange);
        }

        return DataBufferUtils.join(exchange.getRequest().getBody())
                .defaultIfEmpty(DefaultDataBufferFactory.sharedInstance.wrap(new byte[0]))
                .flatMap(dataBuffer -> {
                    byte[] bytes = new byte[dataBuffer.readableByteCount()];
                    dataBuffer.read(bytes);
                    DataBufferUtils.release(dataBuffer);

                    String bodyHash = HmacUtils.hashContent(bytes);
                    ServerHttpRequest decoratedRequest = decorateRequest(exchange, bytes);

                    return verifyHmacStep(exchange, hmac, bodyHash)
                            .thenReturn(exchange.mutate()
                                    .request(decoratedRequest)
                                    .build());
                });
    }

    @SuppressWarnings("null")
    private ServerHttpRequest decorateRequest(ServerWebExchange exchange, byte[] bytes) {
        return new ServerHttpRequestDecorator(exchange.getRequest()) {
            @Override
            @NonNull
            public HttpMethod getMethod() {
                return Objects.requireNonNullElse(exchange.getRequest().getMethod(), HttpMethod.GET);
            }

            @Override
            @NonNull
            public Flux<DataBuffer> getBody() {
                if (bytes.length == 0) {
                    return Flux.empty();
                }
                var factory = exchange.getResponse().bufferFactory();
                return Flux.just(factory.wrap(bytes));
            }

            @Override
            @NonNull
            public HttpHeaders getHeaders() {
                HttpHeaders httpHeaders = new HttpHeaders();
                httpHeaders.putAll(super.getHeaders());
                httpHeaders.setContentLength(bytes.length);
                httpHeaders.remove(HttpHeaders.TRANSFER_ENCODING);
                return httpHeaders;
            }
        };
    }

    private Mono<Void> verifyHmacStep(ServerWebExchange exchange, HmacHeaders hmac, String bodyHash) {
        return keyProvider.getSecretKey(hmac.accessKeyId())
                .switchIfEmpty(Mono.error(new HmacAuthenticationException("Access key ID does not exist")))
                .flatMap(secretKey -> {
                    String dataToSign = HmacUtils.buildCanonicalString(
                            Objects.requireNonNullElse(exchange.getRequest().getMethod(), HttpMethod.GET).name(),
                            exchange.getRequest().getURI().getPath(),
                            hmac.timestamp(),
                            hmac.nonce(),
                            bodyHash
                    );

                    if (HmacUtils.verifySignature(dataToSign, secretKey, hmac.signature())) {
                        return Mono.empty();
                    }
                    return Mono.error(new HmacAuthenticationException("Invalid signature"));
                });
    }

    private Mono<Void> validateNonce(String nonce) {
        String nonceKey = "nonce:" + nonce;
        return redisTemplate.opsForValue()
                .setIfAbsent(nonceKey, "1", NONCE_TTL)
                .flatMap(isNew -> Boolean.TRUE.equals(isNew)
                        ? Mono.empty()
                        : Mono.error(new HmacAuthenticationException("Duplicate request")));
    }

    private Mono<Void> validateTimestamp(String timestamp) {
        try {
            long requestTime = Long.parseLong(timestamp);
            long currentTime = System.currentTimeMillis() / 1000;

            if (Math.abs(currentTime - requestTime) > MAX_CLOCK_SKEW_SECONDS) {
                return Mono.error(new HmacAuthenticationException("Request expired"));
            }
            return Mono.empty();
        } catch (NumberFormatException ex) {
            return Mono.error(new HmacAuthenticationException("Invalid timestamp format", ex));
        }
    }

    @SuppressWarnings("null")
    private boolean shouldAuthenticate(ServerWebExchange exchange) {
        Route route = exchange.getAttribute(ServerWebExchangeUtils.GATEWAY_ROUTE_ATTR);
        String path = exchange.getRequest().getURI().getPath();
        if (path.startsWith("/api/xac-thuc/")) {
            return false;
        }

        if (route == null) {
            return true;
        }

        return Boolean.parseBoolean(
                String.valueOf(route.getMetadata().getOrDefault("requires-hmac", "true"))
        );
    }

    @SuppressWarnings("null")
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
        return -1;
    }

    private static final class HmacAuthenticationException extends RuntimeException {
        private HmacAuthenticationException(String message) {
            super(message);
        }

        private HmacAuthenticationException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
