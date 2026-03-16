package com.example.iam.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AuthResponse {

    private String accessToken;
    private String refreshToken;
    private long expiresInSeconds;
    private String tokenType;
}
