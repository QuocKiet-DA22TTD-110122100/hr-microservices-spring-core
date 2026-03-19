package com.thuctap2026.auth.iam.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.thuctap2026.auth.iam.entity.User;
import com.thuctap2026.auth.iam.entity.UserPasswordHistory;
import com.thuctap2026.auth.iam.repository.UserPasswordHistoryRepository;
import com.thuctap2026.auth.iam.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.argon2.Argon2PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.client.ClientHttpRequestInterceptor;
import org.springframework.web.client.RestClient;

import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.KeyFactory;
import java.security.PublicKey;
import java.security.Signature;
import java.security.spec.X509EncodedKeySpec;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
public class AuthService {

    private static final String JWT_ALG = "EdDSA";
    private static final String JWT_TYPE = "JWT";
    private static final Pattern PASSWORD_POLICY_PATTERN =
        Pattern.compile("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9])(?=\\S+$).{8,}$");

    private final UserRepository userRepository;
    private final UserPasswordHistoryRepository userPasswordHistoryRepository;
    private final ObjectMapper objectMapper;
    private final Argon2PasswordEncoder passwordEncoder;
    private final LoginAttemptService loginAttemptService;
    private final RestClient kmsSignerClient;
    private final RestClient internalKmsClient;
    private final long jwtExpirationSeconds;
    private final int passwordExpiryDays;

    public AuthService(
        UserRepository userRepository,
        UserPasswordHistoryRepository userPasswordHistoryRepository,
        ObjectMapper objectMapper,
        LoginAttemptService loginAttemptService,
        @Value("${kms.base-url:http://localhost:8083}") String kmsBaseUrl,
        @Value("${jwt.expiration-seconds:3600}") long jwtExpirationSeconds,
        @Value("${auth.password-policy.expiry-days:90}") int passwordExpiryDays
    ) {
        this.userRepository = userRepository;
        this.userPasswordHistoryRepository = userPasswordHistoryRepository;
        this.objectMapper = objectMapper;
        this.passwordEncoder = Argon2PasswordEncoder.defaultsForSpringSecurity_v5_8();
        this.loginAttemptService = loginAttemptService;
        this.kmsSignerClient = RestClient.builder().baseUrl(kmsBaseUrl).build();
        this.internalKmsClient = RestClient.builder()
            .baseUrl(kmsBaseUrl)
            .requestInterceptor(buildInternalSignatureInterceptor())
            .build();
        this.jwtExpirationSeconds = jwtExpirationSeconds;
        this.passwordExpiryDays = passwordExpiryDays;
    }

    @Transactional
    public User register(String username, String password, String role) {
        if (username == null || username.isBlank() || password == null || password.isBlank()) {
            throw new IllegalArgumentException("username and password are required");
        }

        String normalizedUsername = username.trim();
        if (normalizedUsername.length() > 100) {
            throw new IllegalArgumentException("username must be <= 100 characters");
        }

        validatePasswordPolicy(password, "password");

        if (userRepository.existsByUsername(normalizedUsername)) {
            throw new IllegalArgumentException("username already exists");
        }

        String normalizedRole = role == null || role.isBlank() ? "USER" : role.trim().toUpperCase();
        if (normalizedRole.length() > 50) {
            throw new IllegalArgumentException("role must be <= 50 characters");
        }

        User user = new User();
        user.setUsername(normalizedUsername);
        String passwordHash = passwordEncoder.encode(password);
        user.setPasswordHash(passwordHash);
        user.setRole(normalizedRole);
        user.setPasswordUpdatedAt(Instant.now());

        User savedUser = userRepository.save(user);
        savePasswordHistory(savedUser.getId(), passwordHash);

        return savedUser;
    }

    @Transactional
    public void changePassword(String username, String oldPassword, String newPassword) {
        if (username == null || username.isBlank() || oldPassword == null || oldPassword.isBlank() || newPassword == null || newPassword.isBlank()) {
            throw new IllegalArgumentException("username, oldPassword and newPassword are required");
        }

        validatePasswordPolicy(newPassword, "newPassword");

        if (oldPassword.equals(newPassword)) {
            throw new IllegalArgumentException("newPassword must be different from oldPassword");
        }

        User user = userRepository.findByUsername(username.trim())
            .orElseThrow(() -> new SecurityException("Invalid credentials"));

        if (!passwordEncoder.matches(oldPassword, user.getPasswordHash())) {
            throw new SecurityException("Invalid credentials");
        }

        if (isReusedPassword(user.getId(), newPassword)) {
            throw new IllegalArgumentException("newPassword must not match last 3 passwords");
        }

        String newPasswordHash = passwordEncoder.encode(newPassword);
        user.setPasswordHash(newPasswordHash);
        user.setPasswordUpdatedAt(Instant.now());
        userRepository.save(user);
        savePasswordHistory(user.getId(), newPasswordHash);
    }

    public String login(String username, String password) {
        if (username == null || username.isBlank() || password == null || password.isBlank()) {
            throw new IllegalArgumentException("username and password are required");
        }

        String normalizedUsername = username.trim();
        if (loginAttemptService.isBlocked(normalizedUsername)) {
            throw new AccountLockedException("Account is locked due to too many failed attempts. Try again after 30 minutes");
        }

        User user = userRepository.findByUsername(normalizedUsername)
            .orElseGet(() -> {
                loginAttemptService.recordFailure(normalizedUsername);
                throw new SecurityException("Invalid credentials");
            });

        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            loginAttemptService.recordFailure(normalizedUsername);
            throw new SecurityException("Invalid credentials");
        }

        if (isPasswordExpired(user)) {
            loginAttemptService.resetAttempts(normalizedUsername);
            throw new PasswordExpiredException("Password expired. Please change your password");
        }

        loginAttemptService.resetAttempts(normalizedUsername);

        long exp = Instant.now().plusSeconds(jwtExpirationSeconds).getEpochSecond();

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("userId", user.getId());
        payload.put("username", user.getUsername());
        payload.put("role", user.getRole());
        payload.put("exp", exp);

        String encodedPayload = encodeBase64Url(toJsonBytes(payload));

        Map<String, Object> header = new LinkedHashMap<>();
        header.put("alg", JWT_ALG);
        header.put("typ", JWT_TYPE);

        String encodedHeaderWithoutKid = encodeBase64Url(toJsonBytes(header));
        KmsSignResponse firstSign = signByKms(encodedHeaderWithoutKid + "." + encodedPayload);

        header.put("kid", firstSign.keyId());
        String encodedHeader = encodeBase64Url(toJsonBytes(header));

        String signingInput = encodedHeader + "." + encodedPayload;
        KmsSignResponse signed = signByKms(signingInput);
        if (!firstSign.keyId().equals(signed.keyId())) {
            throw new IllegalStateException("KMS key rotated during JWT signing");
        }

        String signatureBase64 = signed.signature();
        String signatureBase64Url = encodeBase64Url(Base64.getDecoder().decode(signatureBase64));

        return signingInput + "." + signatureBase64Url;
    }

    public Map<String, Object> verifyToken(String token) {
        if (token == null || token.isBlank()) {
            throw new IllegalArgumentException("token is required");
        }

        String[] parts = token.split("\\.");
        if (parts.length != 3) {
            throw new SecurityException("Invalid token format");
        }

        Map<String, Object> header = readJsonMap(decodeBase64Url(parts[0]));
        Map<String, Object> payload = readJsonMap(decodeBase64Url(parts[1]));

        String alg = String.valueOf(header.get("alg"));
        if (!JWT_ALG.equals(alg)) {
            throw new SecurityException("Unsupported JWT algorithm");
        }

        String kid = header.get("kid") == null ? null : String.valueOf(header.get("kid"));
        if (kid == null || kid.isBlank()) {
            throw new SecurityException("Missing kid in JWT header");
        }

        JwkKey jwkKey = loadJwkByKid(kid);
        verifySignature(parts[0] + "." + parts[1], parts[2], jwkKey);
        validateExpiration(payload);

        return payload;
    }

    private KmsSignResponse signByKms(String payloadToSign) {
        KmsSignResponse response = internalKmsClient.post()
            .uri("/kms/internal/sign")
            .contentType(MediaType.APPLICATION_JSON)
            .body(new KmsSignRequest(payloadToSign))
            .retrieve()
            .body(KmsSignResponse.class);

        if (response == null || response.keyId() == null || response.signature() == null || response.signature().isBlank()) {
            throw new IllegalStateException("KMS sign response is empty");
        }

        return response;
    }

    private byte[] toJsonBytes(Object value) {
        try {
            return objectMapper.writeValueAsBytes(value);
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Failed to serialize JWT data", ex);
        }
    }

    private String encodeBase64Url(byte[] data) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(data);
    }

    private byte[] decodeBase64Url(String encoded) {
        return Base64.getUrlDecoder().decode(encoded);
    }

    private Map<String, Object> readJsonMap(byte[] bytes) {
        try {
            return objectMapper.readValue(bytes, new TypeReference<Map<String, Object>>() {
            });
        } catch (Exception ex) {
            throw new SecurityException("Invalid JWT JSON content", ex);
        }
    }

    private JwkKey loadJwkByKid(String kid) {
        JwksResponse response = internalKmsClient.get()
            .uri("/kms/internal/.well-known/jwks.json")
            .retrieve()
            .body(JwksResponse.class);

        if (response == null || response.keys() == null || response.keys().isEmpty()) {
            throw new IllegalStateException("JWKS response is empty");
        }

        return response.keys().stream()
            .filter(key -> kid.equals(key.kid()))
            .findFirst()
            .orElseThrow(() -> new SecurityException("Signing key not found in JWKS"));
    }

    private void verifySignature(String signingInput, String encodedSignature, JwkKey jwkKey) {
        if (!"OKP".equals(jwkKey.kty()) || !"Ed25519".equals(jwkKey.crv()) || !JWT_ALG.equals(jwkKey.alg())) {
            throw new SecurityException("Unsupported JWK key type");
        }

        try {
            byte[] x = decodeBase64Url(jwkKey.x());
            if (x.length != 32) {
                throw new SecurityException("Invalid Ed25519 public key length");
            }

            byte[] spkiPrefix = new byte[] {
                0x30, 0x2A, 0x30, 0x05, 0x06, 0x03, 0x2B, 0x65, 0x70, 0x03, 0x21, 0x00
            };
            byte[] spki = Arrays.copyOf(spkiPrefix, spkiPrefix.length + x.length);
            System.arraycopy(x, 0, spki, spkiPrefix.length, x.length);

            KeyFactory keyFactory = KeyFactory.getInstance("Ed25519");
            PublicKey publicKey = keyFactory.generatePublic(new X509EncodedKeySpec(spki));

            Signature verifier = Signature.getInstance("Ed25519");
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
        if (expObj instanceof Number num) {
            exp = num.longValue();
        } else {
            exp = Long.parseLong(String.valueOf(expObj));
        }

        long now = Instant.now().truncatedTo(ChronoUnit.SECONDS).getEpochSecond();
        if (now >= exp) {
            throw new SecurityException("Token expired");
        }
    }

    private ClientHttpRequestInterceptor buildInternalSignatureInterceptor() {
        return (request, body, execution) -> {
            String timestamp = String.valueOf(Instant.now().toEpochMilli());
            String payload = new String(body, StandardCharsets.UTF_8);
            String message = payload + timestamp;

            KmsSignResponse signature = signMessageByKms(message);

            request.getHeaders().set("X-Internal-Timestamp", timestamp);
            request.getHeaders().set("X-Internal-Signature", signature.signature());
            request.getHeaders().set("X-Internal-Key-Id", signature.keyId());

            return execution.execute(request, body);
        };
    }

    private KmsSignResponse signMessageByKms(String message) {
        KmsSignResponse response = kmsSignerClient.post()
            .uri("/kms/sign")
            .contentType(MediaType.APPLICATION_JSON)
            .body(new KmsSignRequest(message))
            .retrieve()
            .body(KmsSignResponse.class);

        if (response == null || response.keyId() == null || response.signature() == null || response.signature().isBlank()) {
            throw new IllegalStateException("Failed to create internal request signature");
        }

        return response;
    }

    private void validatePasswordPolicy(String password, String fieldName) {
        if (!PASSWORD_POLICY_PATTERN.matcher(password).matches()) {
            throw new IllegalArgumentException(
                fieldName + " must be at least 8 characters and include uppercase, lowercase, number, special character, and no whitespace"
            );
        }
    }

    private boolean isReusedPassword(UUID userId, String rawPassword) {
        List<UserPasswordHistory> latestHistory = userPasswordHistoryRepository.findTop3ByUserIdOrderByCreatedAtDesc(userId);
        return latestHistory.stream().anyMatch(history -> passwordEncoder.matches(rawPassword, history.getPasswordHash()));
    }

    private void savePasswordHistory(UUID userId, String passwordHash) {
        UserPasswordHistory history = new UserPasswordHistory();
        history.setUserId(userId);
        history.setPasswordHash(passwordHash);
        userPasswordHistoryRepository.save(history);
    }

    private boolean isPasswordExpired(User user) {
        Instant updatedAt = user.getPasswordUpdatedAt();
        if (updatedAt == null) {
            return true;
        }

        Instant expiresAt = updatedAt.plus(Duration.ofDays(passwordExpiryDays));
        return Instant.now().isAfter(expiresAt);
    }

    private record KmsSignRequest(String payload) {
    }

    private record KmsSignResponse(String keyId, String algorithm, String signature) {
    }

    private record JwksResponse(List<JwkKey> keys) {
    }

    private record JwkKey(
        String kid,
        String kty,
        String crv,
        String use,
        String alg,
        String x
    ) {
    }
}
