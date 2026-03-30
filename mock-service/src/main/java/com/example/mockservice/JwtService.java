package com.example.mockservice;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.List;
import java.util.UUID;

@Service
public class JwtService {

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.jwt.expiration-ms:86400000}")
    private long expirationMs;

    public String generateToken(String username, List<String> roles) {
        SecretKey key = Keys.hmacShaKeyFor(getSecureKeyBytes());

        return Jwts.builder()
                .subject(username)
                .claim("roles", roles)
                .id(UUID.randomUUID().toString())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expirationMs))
                .signWith(key)
                .compact();
    }

    private byte[] getSecureKeyBytes() {
        byte[] secretBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
        // JJWT requires at least 256 bits (32 bytes) for HMAC-SHA algorithms
        // If the secret is too short, extend it by repeating the secret
        if (secretBytes.length < 32) {
            byte[] extendedBytes = new byte[32];
            for (int i = 0; i < 32; i++) {
                extendedBytes[i] = secretBytes[i % secretBytes.length];
            }
            return extendedBytes;
        }
        return secretBytes;
    }
}
