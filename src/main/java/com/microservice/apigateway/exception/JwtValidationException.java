package com.microservice.apigateway.exception;

import org.springframework.http.HttpStatus;

public class JwtValidationException extends GatewayException {

    public JwtValidationException(String message) {
        super(message, HttpStatus.UNAUTHORIZED);
    }
}
