package com.microservice.apigateway.dto.request;

import org.springframework.http.server.reactive.ServerHttpRequest;

public record HmacHeaders(
        String accessKeyId,
        String signature,
        String timestamp,
        String nonce
) {
    public static HmacHeaders from(ServerHttpRequest request){
        var h = request.getHeaders();
        return new HmacHeaders(
                h.getFirst("X-Access-Key-Id"),// Lấy header X-Access-Key-Id
                h.getFirst("X-Signature"),// Lấy header X-Signature
                h.getFirst("X-Timestamp"),// Lấy header X-Timestamp
                h.getFirst("X-Nonce")// Lấy header X-Nonce
                );
    }
    public boolean isInvalid(){
        return accessKeyId == null || signature == null || 
                timestamp == null || nonce == null; // Nếu bất kỳ header nào thiếu, coi là không hợp lệ
    }
}