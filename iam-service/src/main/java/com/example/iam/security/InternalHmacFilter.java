package com.example.iam.security;

import com.example.iam.config.SecurityProperties;
import com.example.iam.exception.AuthException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class InternalHmacFilter extends OncePerRequestFilter {

    private static final String HEADER_SERVICE = "X-Internal-Service";
    private static final String HEADER_TIMESTAMP = "X-Internal-Timestamp";
    private static final String HEADER_SIGNATURE = "X-Internal-Signature";

    private final SecurityProperties properties;
    private final AntPathMatcher pathMatcher = new AntPathMatcher();

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !pathMatcher.match("/internal/**", request.getRequestURI());
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        if (!properties.getInternalHmac().isEnabled()) {
            filterChain.doFilter(request, response);
            return;
        }

        String serviceId = request.getHeader(HEADER_SERVICE);
        String timestamp = request.getHeader(HEADER_TIMESTAMP);
        String signature = request.getHeader(HEADER_SIGNATURE);

        if (isBlank(serviceId) || isBlank(timestamp) || isBlank(signature)) {
            throw new AuthException(HttpStatus.UNAUTHORIZED, "Missing internal signature headers");
        }

        long ts;
        try {
            ts = Long.parseLong(timestamp);
        } catch (NumberFormatException ex) {
            throw new AuthException(HttpStatus.UNAUTHORIZED, "Invalid internal timestamp");
        }

        long now = Instant.now().getEpochSecond();
        long skew = Math.abs(now - ts);
        if (skew > properties.getInternalHmac().getClockSkewSeconds()) {
            throw new AuthException(HttpStatus.UNAUTHORIZED, "Internal signature is expired");
        }

        String secret = parseSecrets().get(serviceId);
        if (secret == null) {
            throw new AuthException(HttpStatus.UNAUTHORIZED, "Unknown internal service");
        }

        String payload = request.getMethod() + "\n" + request.getRequestURI() + "\n" + timestamp;
        String expected = hmac(payload, secret);
        if (!MessageDigest.isEqual(expected.getBytes(StandardCharsets.UTF_8), signature.getBytes(StandardCharsets.UTF_8))) {
            throw new AuthException(HttpStatus.UNAUTHORIZED, "Invalid internal signature");
        }

        filterChain.doFilter(request, response);
    }

    private Map<String, String> parseSecrets() {
        Map<String, String> secrets = new HashMap<>();
        String raw = properties.getInternalHmac().getServiceSecrets();
        if (raw == null || raw.isBlank()) {
            return secrets;
        }

        String[] pairs = raw.split(",");
        for (String pair : pairs) {
            String[] parts = pair.split(":", 2);
            if (parts.length == 2) {
                secrets.put(parts[0].trim(), parts[1].trim());
            }
        }
        return secrets;
    }

    private String hmac(String payload, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return Base64.getEncoder().encodeToString(mac.doFinal(payload.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception ex) {
            throw new AuthException(HttpStatus.INTERNAL_SERVER_ERROR, "Unable to verify internal signature");
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
