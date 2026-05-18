package com.hrservice.gateway.dto.request;


public class PaymentRequest {
    private String orderId;
    private Long amount;
    private String currency;

    // Hàm này giúp tạo chuỗi chuẩn để ký HMAC
    public String toLogString() {
        return String.format("orderId=%s&amount=%d&currency=%s", orderId, amount, currency);
    }
}