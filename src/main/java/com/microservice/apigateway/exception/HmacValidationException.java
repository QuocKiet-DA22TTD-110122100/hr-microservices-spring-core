package com.microservice.apigateway.exception;

import org.springframework.http.HttpStatus;

public class HmacValidationException extends GatewayException {

    public HmacValidationException(String message) {
        super(message, HttpStatus.UNAUTHORIZED);
    }
}
