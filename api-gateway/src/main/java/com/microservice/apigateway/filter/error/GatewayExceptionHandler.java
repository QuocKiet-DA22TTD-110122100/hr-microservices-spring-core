package com.microservice.apigateway.filter.error;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.web.reactive.error.ErrorWebExceptionHandler;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Component
@Order(-1) // Ưu tiên cao nhất để đè các handler mặc định của Spring
@RequiredArgsConstructor
public class GatewayExceptionHandler implements ErrorWebExceptionHandler {

    private final ObjectMapper objectMapper;

    @Override
    public Mono<Void> handle(ServerWebExchange exchange, Throwable ex) {
        ServerHttpResponse response = exchange.getResponse();

        // 1. Kiểm tra nếu phản hồi đã được gửi đi (commit) thì không can thiệp
        if (response.isCommitted()) {
            return Mono.error(ex);
        }

        // 2. Thiết lập Header mặc định là JSON
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);

        // 3. Xử lý logic trả về dựa trên Status Code
        // Nếu status hiện tại là 429 (do RateLimiter set) hoặc lỗi từ hệ thống
        HttpStatus status = (HttpStatus) response.getStatusCode();
        if (status == null) status = HttpStatus.INTERNAL_SERVER_ERROR;

        // 4. Tạo Body JSON chuyên nghiệp
        Map<String, Object> errorDetails = new HashMap<>();
        errorDetails.put("timestamp", System.currentTimeMillis());
        errorDetails.put("path", exchange.getRequest().getPath().toString());
        errorDetails.put("status", status.value());

        if (status == HttpStatus.TOO_MANY_REQUESTS) {
            errorDetails.put("error", "Too Many Requests");
            errorDetails.put("message", "Hệ thống đang bận do có quá nhiều yêu cầu. Vui lòng thử lại sau vài giây.");
        } else {
            errorDetails.put("error", status.getReasonPhrase());
            errorDetails.put("message", ex.getMessage());
        }

        return response.writeWith(Mono.fromSupplier(() -> {
            DataBuffer buffer;
            try {
                byte[] bytes = objectMapper.writeValueAsBytes(errorDetails);
                buffer = response.bufferFactory().wrap(bytes);
            } catch (JsonProcessingException e) {
                log.error("Error writing JSON response", e);
                buffer = response.bufferFactory().wrap("{\"error\":\"Internal Server Error\"}".getBytes());
            }
            return buffer;
        }));
    }
}