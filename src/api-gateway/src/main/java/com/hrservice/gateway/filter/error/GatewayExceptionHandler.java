package com.hrservice.gateway.filter.error;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.web.reactive.error.ErrorWebExceptionHandler;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Component
@Order(-1) // Ưu tiên cao nhất để đè các handler mặc định của Spring
@RequiredArgsConstructor
@SuppressWarnings("null")
public class GatewayExceptionHandler implements ErrorWebExceptionHandler {

    private static final String KEY_ERROR = "error";
    private static final String KEY_MESSAGE = "message";

    private final ObjectMapper objectMapper;

    @Override
    @NonNull
    public Mono<Void> handle(@NonNull ServerWebExchange exchange, @NonNull Throwable ex) {
        ServerHttpResponse response = exchange.getResponse();

        // 1. Kiểm tra nếu phản hồi đã được gửi đi (commit) thì không can thiệp
        if (response.isCommitted()) {
            return Mono.error(ex);
        }

        // 2. Thiết lập Header mặc định là JSON
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);

        // 3. Xác định status code thật từ exception để tránh luôn trả HTTP 200
        HttpStatusCode statusCode = resolveStatusCode(response.getStatusCode(), ex);
        response.setStatusCode(statusCode);

        // 4. Tạo Body JSON chuyên nghiệp
        Map<String, Object> errorDetails = new HashMap<>();
        errorDetails.put("timestamp", System.currentTimeMillis());
        errorDetails.put("path", exchange.getRequest().getPath().toString());
        errorDetails.put("method", exchange.getRequest().getMethod().name());
        errorDetails.put("requestId", exchange.getRequest().getId());
        errorDetails.put("status", statusCode.value());
        errorDetails.put("exception", ex.getClass().getSimpleName());

        if (statusCode.value() == HttpStatus.TOO_MANY_REQUESTS.value()) {
            errorDetails.put(KEY_ERROR, "Too Many Requests");
            errorDetails.put(KEY_MESSAGE, "Hệ thống đang bận do có quá nhiều yêu cầu. Vui lòng thử lại sau vài giây.");
        } else if (statusCode.value() == HttpStatus.SERVICE_UNAVAILABLE.value() && ex.getMessage() != null
                && ex.getMessage().contains("Unable to find instance for")) {
            errorDetails.put(KEY_ERROR, "Service Unavailable");
            errorDetails.put(KEY_MESSAGE, "Không tìm thấy instance của service đích trên Eureka. Kiểm tra service đã đăng ký và đang healthy.");
            errorDetails.put("debugMessage", ex.getMessage());
        } else {
            HttpStatus resolvedStatus = HttpStatus.resolve(statusCode.value());
            errorDetails.put(KEY_ERROR, resolvedStatus != null ? resolvedStatus.getReasonPhrase() : "Gateway Error");
            errorDetails.put(KEY_MESSAGE, ex.getMessage());
        }

        return response.writeWith(Mono.fromSupplier(() -> {
            try {
                byte[] bytes = objectMapper.writeValueAsBytes(errorDetails);
                return response.bufferFactory().wrap(bytes);
            } catch (JsonProcessingException e) {
                log.error("Error writing JSON response", e);
                return response.bufferFactory().wrap("{\"error\":\"Internal Server Error\"}".getBytes());
            }
        }));
    }

    private HttpStatusCode resolveStatusCode(HttpStatusCode currentStatus, Throwable ex) {
        if (ex instanceof ResponseStatusException responseStatusException) {
            return responseStatusException.getStatusCode();
        }

        if (currentStatus != null) {
            return currentStatus;
        }

        return HttpStatus.INTERNAL_SERVER_ERROR;
    }
}