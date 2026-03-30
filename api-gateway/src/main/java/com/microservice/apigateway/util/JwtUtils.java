package com.microservice.apigateway.util;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.security.GeneralSecurityException;
import java.security.KeyFactory;
import java.security.PublicKey;
import java.security.Signature;
import java.security.spec.X509EncodedKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Arrays;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Component
@Slf4j
public class JwtUtils {

    private static final String JWT_ALG = "EdDSA";
    private static final String JWK_KEY_TYPE = "OKP";
    private static final String JWK_CURVE = "Ed25519";

    private final ObjectMapper objectMapper;
    private final WebClient.Builder webClientBuilder;
    private final ConcurrentMap<String, CachedPublicKey> publicKeyCache = new ConcurrentHashMap<>();

    @Value("${app.jwt.jwks-uri:http://kms/kms/internal/.well-known/jwks.json}")
    private String jwksUri;

    @Value("${app.jwt.jwks-cache-seconds:300}")
    private long jwksCacheSeconds;

    public JwtUtils(ObjectMapper objectMapper, WebClient.Builder webClientBuilder) {
        this.objectMapper = objectMapper;
        this.webClientBuilder = webClientBuilder;
    }

    public Mono<Map<String, Object>> validateAndExtract(String token) {
        if (token == null || token.isBlank()) {
            return Mono.error(new IllegalArgumentException("Token is required"));
        }

        String[] parts = token.split("\\.");
        if (parts.length != 3) {
            return Mono.error(new SecurityException("Invalid token format"));
        }

        Map<String, Object> header;
        Map<String, Object> payload;

        try {
            header = readJsonMap(decodeBase64Url(parts[0]));
            payload = readJsonMap(decodeBase64Url(parts[1]));
        } catch (RuntimeException ex) {
            return Mono.error(new SecurityException("Invalid token payload", ex));
        }

        String alg = stringClaim(header, "alg");
        if (!JWT_ALG.equals(alg)) {
            return Mono.error(new SecurityException("Unsupported JWT algorithm"));
        }

        String kid = stringClaim(header, "kid");
        if (kid == null || kid.isBlank()) {
            return Mono.error(new SecurityException("Missing kid in JWT header"));
        }

        String signingInput = parts[0] + "." + parts[1];
        String encodedSignature = parts[2];

        return getPublicKeyByKid(kid)
                .map(publicKey -> {
                    verifySignature(signingInput, encodedSignature, publicKey);
                    validateExpiration(payload);
                    return payload;
                });
    }

    public Mono<Boolean> isValid(String token) {
        return validateAndExtract(token)
                .map(claims -> true)
                .onErrorReturn(false);
    }

    private Mono<PublicKey> getPublicKeyByKid(String kid) {
        CachedPublicKey cached = publicKeyCache.get(kid);
        if (cached != null && !cached.isExpired()) {
            return Mono.just(cached.publicKey());
        }

        return webClientBuilder.build()
                .get()
                .uri(jwksUri)
                .retrieve()
                .bodyToMono(JwksResponse.class)
                .switchIfEmpty(Mono.error(new SecurityException("JWKS response is empty")))
                .map(response -> cacheAndFindKey(kid, response))
                .doOnError(ex -> log.warn("Failed to load JWKS from {}: {}", jwksUri, ex.getMessage()));
    }

    private PublicKey cacheAndFindKey(String kid, JwksResponse response) {
        if (response.keys() == null || response.keys().isEmpty()) {
            throw new SecurityException("JWKS has no keys");
        }

        Instant expiresAt = Instant.now().plusSeconds(Math.max(30, jwksCacheSeconds));
        PublicKey requestedKey = null;

        for (JwkKey key : response.keys()) {
            if (!isSupportedJwk(key)) {
                continue;
            }

            PublicKey publicKey = buildEd25519PublicKey(key.x());
            publicKeyCache.put(key.kid(), new CachedPublicKey(publicKey, expiresAt));

            if (key.kid().equals(kid)) {
                requestedKey = publicKey;
            }
        }

        if (requestedKey == null) {
            throw new SecurityException("Unknown key id in JWT header");
        }

        return requestedKey;
    }

    private boolean isSupportedJwk(JwkKey key) {
        return key != null
                && key.kid() != null
                && JWK_KEY_TYPE.equals(key.kty())
                && JWK_CURVE.equals(key.crv())
                && JWT_ALG.equals(key.alg())
                && key.x() != null
                && !key.x().isBlank();
    }

    private PublicKey buildEd25519PublicKey(String x) {
        try {
            byte[] rawPublicKey = decodeBase64Url(x);
            if (rawPublicKey.length != 32) {
                throw new SecurityException("Invalid Ed25519 public key length");
            }

            byte[] spkiPrefix = new byte[] {
                    0x30, 0x2A, 0x30, 0x05, 0x06, 0x03, 0x2B, 0x65, 0x70, 0x03, 0x21, 0x00
            };
            byte[] spki = Arrays.copyOf(spkiPrefix, spkiPrefix.length + rawPublicKey.length);
            System.arraycopy(rawPublicKey, 0, spki, spkiPrefix.length, rawPublicKey.length);

            KeyFactory keyFactory = KeyFactory.getInstance(JWK_CURVE);
            return keyFactory.generatePublic(new X509EncodedKeySpec(spki));
        } catch (GeneralSecurityException ex) {
            throw new IllegalStateException("Failed to create Ed25519 public key", ex);
        }
    }

    private void verifySignature(String signingInput, String encodedSignature, PublicKey publicKey) {
        try {
            Signature verifier = Signature.getInstance(JWK_CURVE);
            verifier.initVerify(publicKey);
            verifier.update(signingInput.getBytes(StandardCharsets.UTF_8));

            byte[] signatureBytes = decodeBase64Url(encodedSignature);
            if (!verifier.verify(signatureBytes)) {
                throw new SecurityException("Invalid JWT signature");
            }
        } catch (GeneralSecurityException ex) {
            throw new IllegalStateException("Failed to verify JWT signature", ex);
        }
    }

    private void validateExpiration(Map<String, Object> payload) {
        Object expObj = payload.get("exp");
        if (expObj == null) {
            throw new SecurityException("Missing exp claim");
        }

        long exp;
        if (expObj instanceof Number number) {
            exp = number.longValue();
        } else {
            exp = Long.parseLong(String.valueOf(expObj));
        }

        long now = Instant.now().getEpochSecond();
        if (now >= exp) {
            throw new SecurityException("Token expired");
        }
    }

    private Map<String, Object> readJsonMap(byte[] bytes) {
        try {
            return objectMapper.readValue(bytes, new TypeReference<Map<String, Object>>() {
            });
        } catch (Exception ex) {
            throw new IllegalArgumentException("Invalid JSON payload", ex);
        }
    }

    private byte[] decodeBase64Url(String value) {
        return Base64.getUrlDecoder().decode(value);
    }

    private String stringClaim(Map<String, Object> source, String key) {
        Object value = source.get(key);
        return value == null ? null : String.valueOf(value);
    }

    private record JwksResponse(List<JwkKey> keys) {
    }

    private record JwkKey(String kid, String kty, String crv, String use, String alg, String x) {
    }

    private record CachedPublicKey(PublicKey publicKey, Instant expiresAt) {
        private boolean isExpired() {
            return Instant.now().isAfter(expiresAt);
        }
    }
}
