package com.hrservice.gateway.filter.global;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hrservice.gateway.dto.response.ApiResponse;
import com.hrservice.gateway.security.SecurityL1Cache;
import com.hrservice.gateway.util.JwtUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.cloud.gateway.route.Route;
import org.springframework.cloud.gateway.support.ServerWebExchangeUtils;
import org.springframework.core.Ordered;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.security.MessageDigest;
import java.nio.charset.StandardCharsets;

@Component
@Slf4j
@RequiredArgsConstructor
public class JwtAuthFilter implements GlobalFilter, Ordered {

    private static final String AUTH_USER_HEADER = "X-Auth-User";
    private static final String AUTH_ROLE_HEADER = "X-Auth-Role";
    private static final String AUTH_ROLES_HEADER = "X-Auth-Roles";
    private static final String TOKEN_BLACKLIST_PREFIX = "blacklist:token:";

    private final JwtUtils jwtUtils;
    private final ObjectMapper objectMapper;
    private final ReactiveStringRedisTemplate redisTemplate;
    private final SecurityL1Cache l1Cache;

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        if (!shouldAuthenticate(exchange)) {
            return chain.filter(exchange);
        }

        String authHeader = exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        String path = exchange.getRequest().getPath().value();
        String method = exchange.getRequest().getMethod() != null ? exchange.getRequest().getMethod().name() : "UNKNOWN";
        String ip = getClientIp(exchange);

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            log.warn("[GW][AUTH] ip={}, method={}, path={}, result=missing_authorization", ip, method, path);
            return onError(exchange, "Missing or invalid Authorization header", HttpStatus.UNAUTHORIZED);
        }

        String token = authHeader.substring(7);
        return jwtUtils.validateAndExtract(token)
                .flatMap(claims -> {
                    String tokenId = extractTokenId(claims, token);
                    return isTokenRevoked(tokenId)
                            .flatMap(isRevoked -> {
                                boolean revoked = Boolean.TRUE.equals(isRevoked);
                                if (revoked) {
                                    log.info("[GW][AUTH] ip={}, method={}, path={}, result=token_revoked, tokenId={}", ip, method, path, tokenId);
                                    return onError(exchange, "Token đã bị thu hồi", HttpStatus.UNAUTHORIZED);
                                }
                                return forwardAuthenticatedRequest(exchange, chain, claims);
                            });
                })
                .onErrorResume(e -> {
                    log.warn("[GW][AUTH] ip={}, method={}, path={}, result=token_invalid, reason={}", ip, method, path, e.getMessage());
                    return onError(exchange, "Token sai hoặc hết hạn", HttpStatus.UNAUTHORIZED);
                });
    }

    private Mono<Void> forwardAuthenticatedRequest(
            ServerWebExchange exchange,
            GatewayFilterChain chain,
            Map<String, Object> claims
    ) {
        String username = getStringClaim(claims, "username");
        if (username == null || username.isBlank()) {
            username = getStringClaim(claims, "sub");
        }
        List<String> roles = extractRoles(claims);
        String primaryRole = roles.isEmpty() ? "" : roles.get(0);

        // Keep both role and roles headers to support legacy and new services.
        ServerHttpRequest mutatedRequest = exchange.getRequest().mutate()
                .header(AUTH_USER_HEADER, username == null ? "" : username)
                .header(AUTH_ROLE_HEADER, primaryRole)
                .header(AUTH_ROLES_HEADER, String.join(",", roles))
                .build();

        log.info("[GW][AUTH] ip={}, user={}, method={}, path={}, result=authenticated", getClientIp(exchange), username, exchange.getRequest().getMethod(), exchange.getRequest().getPath().value());
        return chain.filter(exchange.mutate().request(mutatedRequest).build());
    }

    private Mono<Boolean> isTokenRevoked(String tokenId) {
        if (tokenId == null || tokenId.isBlank()) {
            return Mono.just(false);
        }

        if (l1Cache.isBlacklisted(tokenId) != null) {
            log.debug("[JWT] L1 cache hit for token blacklist: {}", tokenId);
            return Mono.just(true);
        }

        return redisTemplate.hasKey(TOKEN_BLACKLIST_PREFIX + tokenId)
                .map(Boolean.TRUE::equals)
                .doOnNext(revoked -> {
                    if (Boolean.TRUE.equals(revoked)) {
                        l1Cache.put(tokenId);
                        log.debug("[JWT] L2 cache hit for token blacklist: {}", tokenId);
                    }
                })
                .onErrorResume(ex -> {
                    log.error("[JWT] Redis blacklist check failed, fallback allow: {}", ex.getMessage());
                    return Mono.just(false);
                });
    }

    private String extractTokenId(Map<String, Object> claims, String token) {
        String jti = getStringClaim(claims, "jti");
        if (jti != null && !jti.isBlank()) {
            return jti;
        }

        // Backward-compatible fallback for old tokens without jti.
        return sha256(token);
    }

    private String sha256(String value) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (Exception ex) {
            throw new IllegalStateException("Unable to hash token", ex);
        }
    }

    @SuppressWarnings("null")
    private boolean shouldAuthenticate(ServerWebExchange exchange) {
        String path = exchange.getRequest().getURI().getPath();
        if (path.startsWith("/api/xac-thuc/")) {
            return !isPublicIamPath(path);
        }

        Route route = exchange.getAttribute(ServerWebExchangeUtils.GATEWAY_ROUTE_ATTR);
        if (route == null) return false;
        return Boolean.parseBoolean(
                Objects.toString(route.getMetadata().getOrDefault("requires-jwt", "false"), "false")
        );
    }

    private boolean isPublicIamPath(String path) {
        return path.equals("/api/xac-thuc/dang-nhap")
                || path.equals("/api/xac-thuc/dang-ky")
                || path.equals("/api/xac-thuc/dang-xuat")
                || path.equals("/api/xac-thuc/oauth2/token")
                || path.startsWith("/api/xac-thuc/2fa/");
    }

    @SuppressWarnings("null")
    private Mono<Void> onError(ServerWebExchange exchange, String message, HttpStatus status) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(status);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);

        ApiResponse<Object> errorResponse = ApiResponse.builder()
                .status(status.value())
                .message(message)
                .data(null)
                .timestamp(LocalDateTime.now())
                .build();

        return response.writeWith(Mono.fromCallable(() -> {
            byte[] bytes = objectMapper.writeValueAsBytes(errorResponse);
            return response.bufferFactory().wrap(Objects.requireNonNull(bytes, "bytes must not be null"));
        }));
    }

    @Override
    public int getOrder() {
        // Sau HMAC (-1), trước routing
        return 0;
    }

    private List<String> extractRoles(Map<String, Object> claims) {
        List<String> roles = extractRolesFromClaim(claims.get("roles"));
        if (!roles.isEmpty()) {
            return roles;
        }

        return extractSingleRole(claims.get("role"));
    }

    private List<String> extractRolesFromClaim(Object rolesClaim) {
        if (rolesClaim instanceof Collection<?> collection) {
            return normalizeCollectionRoles(collection);
        }

        if (rolesClaim instanceof String rolesText) {
            return normalizeCsvRoles(rolesText);
        }

        return List.of();
    }

    private List<String> normalizeCollectionRoles(Collection<?> collection) {
        List<String> roles = new ArrayList<>();
        for (Object role : collection) {
            String normalized = normalizeRole(role);
            if (normalized != null) {
                roles.add(normalized);
            }
        }
        return roles;
    }

    private List<String> normalizeCsvRoles(String rolesText) {
        if (rolesText.isBlank()) {
            return List.of();
        }

        List<String> roles = new ArrayList<>();
        for (String role : rolesText.split(",")) {
            String normalized = normalizeRole(role);
            if (normalized != null) {
                roles.add(normalized);
            }
        }
        return roles;
    }

    private List<String> extractSingleRole(Object roleClaim) {
        String normalized = normalizeRole(roleClaim);
        if (normalized == null) {
            return List.of();
        }
        return List.of(normalized);
    }

    private String normalizeRole(Object role) {
        if (role == null) {
            return null;
        }
        String text = String.valueOf(role).trim();
        if (text.isBlank()) {
            return null;
        }
        return text;
    }

    private String getStringClaim(Map<String, Object> claims, String key) {
        Object value = claims.get(key);
        if (value == null) {
            return null;
        }
        return String.valueOf(value);
    }

    private String getClientIp(ServerWebExchange exchange) {
        String forwardedFor = exchange.getRequest().getHeaders().getFirst("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }

        var remoteAddress = exchange.getRequest().getRemoteAddress();
        if (remoteAddress != null && remoteAddress.getAddress() != null) {
            return remoteAddress.getAddress().getHostAddress();
        }
        return "unknown";
    }
}
