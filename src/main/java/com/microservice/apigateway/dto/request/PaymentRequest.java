package com.microservice.apigateway.dto.request;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentRequest {
    private String orderId;
    private Long amount;
    private String currency;

    public String toLogString() {
        return String.format("orderId=%s&amount=%d&currency=%s", orderId, amount, currency);
    }
}