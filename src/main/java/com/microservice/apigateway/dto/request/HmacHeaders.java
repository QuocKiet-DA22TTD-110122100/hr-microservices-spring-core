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
                h.getFirst("X-Access-Key-Id"),
                h.getFirst("X-Signature"),
                h.getFirst("X-Timestamp"),
                h.getFirst("X-Nonce")
                );
    }
    public boolean isInvalid(){
        return accessKeyId == null || signature == null ||
                timestamp == null || nonce == null;
    }
}