package com.hrservice.gateway.filter.global;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hrservice.gateway.dto.request.HmacHeaders;
import com.hrservice.gateway.dto.response.ApiResponse;
import com.hrservice.gateway.security.KeyProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.route.Route;
import org.springframework.cloud.gateway.support.ServerWebExchangeUtils;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import com.hrservice.gateway.util.HmacUtils;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Objects;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.core.io.buffer.DefaultDataBufferFactory;
import org.springframework.http.server.reactive.ServerHttpRequestDecorator;
import reactor.core.publisher.Flux;
import org.springframework.http.HttpHeaders;


@Component
@Slf4j
@RequiredArgsConstructor
@SuppressWarnings("null")
public class HmacSecurityFilter implements GlobalFilter, Ordered {

    private final ObjectMapper objectMapper;
    private final ReactiveStringRedisTemplate redisTemplate; // Dùng bản Reactive
    private final KeyProvider keyProvider; // Inject Interface đã tạo

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        if(!shouldAuthenticate(exchange)){
            return chain.filter(exchange);
        }

        ServerHttpRequest request = exchange.getRequest();
        HmacHeaders hmac = HmacHeaders.from(request);

        if (hmac.isInvalid()) {
            // 1. Log ra trước để debug
            log.info("--- DEBUG SECURITY FILTER ---");
            log.info("Danh sách Header nhận được: {}", request.getHeaders().keySet());
            
            String authHeader = request.getHeaders().getFirst("Authorization");
            log.info("Giá trị Authorization thực tế: {}", authHeader);
            return onError(exchange, "Thiếu tiêu đề bảo mật", HttpStatus.UNAUTHORIZED);
            
        }

        return validateNonce(hmac.nonce())
                .then(validateTimestamp(hmac.timestamp()))
                .then(resolveBodyAndVerify(exchange, hmac))
                // QUAN TRỌNG: Phải dùng newExchange (đã được mutate) để đi tiếp
                .flatMap(chain::filter)
                .onErrorResume(ex -> onError(exchange, ex.getMessage(), HttpStatus.UNAUTHORIZED));
    }

    private Mono<ServerWebExchange> resolveBodyAndVerify(ServerWebExchange exchange, HmacHeaders hmac) {
        HttpMethod method = exchange.getRequest().getMethod();


        boolean hasBody = (method != HttpMethod.GET && method != HttpMethod.DELETE);

        if (!hasBody) {
            // Luồng không Body: Xác thực luôn với hash rỗng
            return verifyHmacStep(exchange, hmac, "")
                    .thenReturn(exchange);
        }

        // Luồng có Body: Gom dữ liệu, tính hash, xác thực và đóng gói lại
        return DataBufferUtils.join(exchange.getRequest().getBody())
                .defaultIfEmpty(DefaultDataBufferFactory.sharedInstance.wrap(new byte[0]))
                .flatMap(dataBuffer -> {
                    byte[] bytes = new byte[dataBuffer.readableByteCount()];
                    dataBuffer.read(bytes);
                    DataBufferUtils.release(dataBuffer);

                    String bodyHash = HmacUtils.hashContent(bytes);
                        ServerHttpRequest decoratedRequest = Objects.requireNonNull(
                            decorateRequest(exchange, bytes),
                            "decoratedRequest must not be null"
                        );

                    return verifyHmacStep(exchange, hmac, bodyHash)
                            .thenReturn(exchange.mutate()
                                .request(decoratedRequest)
                                    .build());
                });
    }
// Tạo một ServerHttpRequest mới với body đã được đọc và hash lại, đồng thời đảm bảo các header được cập nhật đúng (đặc biệt là Content-Length)
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
                if (bytes.length == 0) return Flux.empty();
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
        // 1. Lấy chìa khóa bí mật
        return keyProvider.getSecretKey(hmac.accessKeyId())
                .switchIfEmpty(Mono.error(new RuntimeException("Access Key ID không tồn tại"))) // Nếu không tìm thấy key, ném lỗi
                .flatMap(secretKey -> {
                    // 2. Chuẩn bị dữ liệu để ký
                    String dataToSign = HmacUtils.buildCanonicalString(
                            exchange.getRequest().getMethod().name(),
                            exchange.getRequest().getURI().getPath(),
                            hmac.timestamp(),
                            hmac.nonce(),
                            bodyHash
                    );

                    boolean isValid = HmacUtils.verifySignature(dataToSign, secretKey, hmac.signature());

                    if (isValid) {
                        return Mono.empty();
                    } else {
                        return Mono.error(new RuntimeException("Chữ ký không hợp lệ")); // Chữ ký sai -> ném lỗi
                    }
                });
    }

    private Mono<Void> validateNonce(String nonce) {
        String nonceKey = "nonce:" + nonce;
        Duration ttl = Duration.ofMinutes(5);
        return redisTemplate.opsForValue()
            .setIfAbsent(nonceKey, "1", Objects.requireNonNull(ttl, "ttl must not be null"))
                .flatMap(isNew -> Boolean.TRUE.equals(isNew) ?
                        Mono.empty() :
                        Mono.error(new RuntimeException("Yêu cầu trùng lặp")));
    }

    private Mono<Void> validateTimestamp(String timestamp) {
        try {
            long requestTime = Long.parseLong(timestamp);
            long currentTime = System.currentTimeMillis() / 1000;

            if (Math.abs(currentTime - requestTime) > 300) {
                // Ném ra lỗi nếu quá 5 phút
                return Mono.error(new RuntimeException("Request expired"));
            }
            // Nếu ổn thì trả về trống (đi tiếp)
            return Mono.empty();
        } catch (Exception e) {
            return Mono.error(new RuntimeException("Invalid timestamp format"));// thiếu hoặc sai định dạng timestamp -> ném lỗi
        }
    }


    @SuppressWarnings("null")
    private boolean shouldAuthenticate(ServerWebExchange exchange)
    {
        Route route = exchange.getAttribute(ServerWebExchangeUtils.GATEWAY_ROUTE_ATTR);
        // Check path-based public endpoints first (before route resolution)
        String path = exchange.getRequest().getURI().getPath();
        if (path.startsWith("/api/iam/login")
            || path.startsWith("/api/iam/register")
            || path.startsWith("/api/iam/user/register")
            || path.startsWith("/api/iam/logout")) {
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
}