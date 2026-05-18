package com.hrservice.kms.service;

import com.hrservice.kms.config.CacheConfig;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.PublicKey;
import java.security.Signature;
import java.util.Base64;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class KmsSigningService {

    private static final String ED25519 = "Ed25519";
    private static final String CURVE_ED25519 = ED25519;
    private static final int MAX_KEYS = 3;
    private final Map<String, KeyPair> keyStore = new LinkedHashMap<>();
    private String currentKeyId;

    public KmsSigningService() {
        this.currentKeyId = initializeKeys();
    }

    /**
     * Initialize Ed25519 keys for the first time
     */
    private String initializeKeys() {
        try {
            return generateNewKeyPair();
        } catch (Exception e) {
            throw new KmsSigningException("Failed to initialize KMS keys", e);
        }
    }

    /**
     * Generate a new Ed25519 key pair and store it
     */
    @CacheEvict(cacheNames = {CacheConfig.JWK_BY_KID_CACHE, CacheConfig.JWKS_ALL_CACHE}, allEntries = true)
    public synchronized String generateNewKeyPair() {
        try {
            KeyPairGenerator kpg = KeyPairGenerator.getInstance(ED25519);
            KeyPair keyPair = kpg.generateKeyPair();
            String keyId = UUID.randomUUID().toString();

            keyStore.put(keyId, keyPair);

            // Keep only the last MAX_KEYS key pairs
            if (keyStore.size() > MAX_KEYS) {
                String oldestKey = keyStore.keySet().iterator().next();
                keyStore.remove(oldestKey);
            }

            this.currentKeyId = keyId;
            return keyId;
        } catch (Exception e) {
            throw new KmsSigningException("Failed to generate key pair", e);
        }
    }

    /**
     * Sign a message using the current key
     */
    public SigningResult sign(String message) {
        try {
            KeyPair keyPair = keyStore.get(currentKeyId);
            if (keyPair == null) {
                throw new IllegalStateException("Current key not found");
            }

            Signature signer = Signature.getInstance(ED25519);
            signer.initSign(keyPair.getPrivate());
            signer.update(message.getBytes());

            byte[] signature = signer.sign();
            String signatureBase64 = Base64.getEncoder().encodeToString(signature);

            return new SigningResult(currentKeyId, "EdDSA", signatureBase64);
        } catch (Exception e) {
            throw new KmsSigningException("Failed to sign message", e);
        }
    }

    /**
     * Get public key in JWK format for a specific key ID
     */
    @Cacheable(cacheNames = CacheConfig.JWK_BY_KID_CACHE, key = "#keyId")
    public Map<String, Object> getPublicKeyAsJwk(String keyId) {
        try {
            KeyPair keyPair = keyStore.get(keyId);
            if (keyPair == null) {
                throw new IllegalArgumentException("Key not found: " + keyId);
            }

            PublicKey publicKey = keyPair.getPublic();
            byte[] publicKeyBytes = publicKey.getEncoded();

            // Extract the public key bytes from PKCS#8 encoding (last 32 bytes for Ed25519)
            byte[] x = new byte[32];
            System.arraycopy(publicKeyBytes, publicKeyBytes.length - 32, x, 0, 32);

            Map<String, Object> jwk = new LinkedHashMap<>();
            jwk.put("kty", "OKP");
            jwk.put("crv", CURVE_ED25519);
            jwk.put("x", Base64.getUrlEncoder().withoutPadding().encodeToString(x));
            jwk.put("use", "sig");
            jwk.put("alg", "EdDSA");
            jwk.put("kid", keyId);

            return jwk;
        } catch (Exception e) {
            throw new KmsSigningException("Failed to get JWK", e);
        }
    }

    /**
     * Get JWKS (JSON Web Key Set) with all public keys
     */
    @Cacheable(cacheNames = CacheConfig.JWKS_ALL_CACHE)
    public Map<String, Object> getJwks() {
        try {
            List<Map<String, Object>> keys = keyStore.keySet().stream()
                    .map(this::getPublicKeyAsJwk)
                    .toList();

            Map<String, Object> jwks = new HashMap<>();
            jwks.put("keys", keys);
            return jwks;
        } catch (Exception e) {
            throw new KmsSigningException("Failed to get JWKS", e);
        }
    }

    /**
     * Get the current key ID
     */
    public String getCurrentKeyId() {
        return currentKeyId;
    }

    public static class KmsSigningException extends RuntimeException {
        public KmsSigningException(String message, Throwable cause) {
            super(message, cause);
        }
    }

    public record SigningResult(String keyId, String algorithm, String signature) {
    }
}
