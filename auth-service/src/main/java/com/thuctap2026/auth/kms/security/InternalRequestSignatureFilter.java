package com.thuctap2026.auth.kms.security;

import com.thuctap2026.auth.kms.service.KeyService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.net.Inet6Address;
import java.net.InetAddress;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;

@Component
public class InternalRequestSignatureFilter extends OncePerRequestFilter {

    private static final String TIMESTAMP_HEADER = "X-Internal-Timestamp";
    private static final String SIGNATURE_HEADER = "X-Internal-Signature";
    private static final String KEY_ID_HEADER = "X-Internal-Key-Id";
    private static final Duration MAX_SKEW = Duration.ofMinutes(5);

    private final KeyService keyService;

    public InternalRequestSignatureFilter(KeyService keyService) {
        this.keyService = keyService;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path == null || !path.startsWith("/kms/internal/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
        throws ServletException, IOException {

        CachedBodyHttpServletRequest wrappedRequest = new CachedBodyHttpServletRequest(request);

        if (!isInternalIp(wrappedRequest.getRemoteAddr())) {
            response.sendError(HttpStatus.FORBIDDEN.value(), "Access denied: internal IP only");
            return;
        }

        String timestamp = wrappedRequest.getHeader(TIMESTAMP_HEADER);
        String signature = wrappedRequest.getHeader(SIGNATURE_HEADER);
        String keyId = wrappedRequest.getHeader(KEY_ID_HEADER);

        if (timestamp == null || timestamp.isBlank() || signature == null || signature.isBlank()) {
            response.sendError(HttpStatus.UNAUTHORIZED.value(), "Missing internal signature headers");
            return;
        }

        long tsMillis;
        try {
            tsMillis = Long.parseLong(timestamp);
        } catch (NumberFormatException ex) {
            response.sendError(HttpStatus.UNAUTHORIZED.value(), "Invalid internal timestamp");
            return;
        }

        Instant requestTime = Instant.ofEpochMilli(tsMillis);
        Instant now = Instant.now();
        if (requestTime.isBefore(now.minus(MAX_SKEW)) || requestTime.isAfter(now.plus(MAX_SKEW))) {
            response.sendError(HttpStatus.UNAUTHORIZED.value(), "Internal request timestamp out of range");
            return;
        }

        String payload = new String(wrappedRequest.getCachedBody(), StandardCharsets.UTF_8);
        String message = payload + timestamp;

        boolean valid = keyService.verifyPayload(message, signature, keyId);
        if (!valid) {
            response.sendError(HttpStatus.UNAUTHORIZED.value(), "Invalid internal request signature");
            return;
        }

        filterChain.doFilter(wrappedRequest, response);
    }

    private boolean isInternalIp(String remoteAddr) {
        if (remoteAddr == null || remoteAddr.isBlank()) {
            return false;
        }

        try {
            InetAddress address = InetAddress.getByName(remoteAddr);

            if (address.isAnyLocalAddress() || address.isLoopbackAddress() || address.isSiteLocalAddress() || address.isLinkLocalAddress()) {
                return true;
            }

            if (address instanceof Inet6Address inet6) {
                byte[] bytes = inet6.getAddress();
                // fc00::/7 unique local addresses
                return (bytes[0] & (byte) 0xFE) == (byte) 0xFC;
            }

            return false;
        } catch (Exception ex) {
            return false;
        }
    }
}
