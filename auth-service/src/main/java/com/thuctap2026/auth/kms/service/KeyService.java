package com.thuctap2026.auth.kms.service;

import com.thuctap2026.auth.kms.entity.KmsKey;
import com.thuctap2026.auth.kms.repository.KmsKeyRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.KeyFactory;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.NoSuchAlgorithmException;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.Signature;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;
import java.util.List;
import java.util.UUID;

@Service
public class KeyService {

    private static final String ED25519_ALGORITHM = "Ed25519";

    private final KmsKeyRepository kmsKeyRepository;

    public KeyService(KmsKeyRepository kmsKeyRepository) {
        this.kmsKeyRepository = kmsKeyRepository;
    }

    @Transactional
    public KmsKey createKey() {
        deactivateAllActiveKeys();
        return generateAndSaveActiveEd25519Key();
    }

    @Transactional
    public KmsKey createEd25519KeyPair() {
        return createKey();
    }

    @Transactional
    public KmsKey rotateKey() {
        deactivateAllActiveKeys();
        return generateAndSaveActiveEd25519Key();
    }

    public SignResult signPayload(String payload) {
        if (payload == null) {
            throw new IllegalArgumentException("Payload must not be null");
        }

        List<KmsKey> activeKeys = kmsKeyRepository.findAllByStatus(KmsKey.Status.ACTIVE);
        if (activeKeys.isEmpty()) {
            throw new IllegalStateException("No ACTIVE key found");
        }
        if (activeKeys.size() > 1) {
            throw new IllegalStateException("Multiple ACTIVE keys found");
        }

        KmsKey activeKey = activeKeys.get(0);

        try {
            byte[] privateKeyBytes = Base64.getDecoder().decode(activeKey.getPrivateKey());
            PKCS8EncodedKeySpec privateKeySpec = new PKCS8EncodedKeySpec(privateKeyBytes);
            KeyFactory keyFactory = KeyFactory.getInstance(ED25519_ALGORITHM);
            PrivateKey privateKey = keyFactory.generatePrivate(privateKeySpec);

            Signature signature = Signature.getInstance(ED25519_ALGORITHM);
            signature.initSign(privateKey);
            signature.update(payload.getBytes(StandardCharsets.UTF_8));

            byte[] signedBytes = signature.sign();
            return new SignResult(
                activeKey.getId(),
                activeKey.getAlgorithm(),
                Base64.getEncoder().encodeToString(signedBytes)
            );
        } catch (GeneralSecurityException | IllegalArgumentException ex) {
            throw new IllegalStateException("Failed to sign payload with ACTIVE key", ex);
        }
    }

    public List<JwkPublicKey> getJwksKeys() {
        List<KmsKey> keys = kmsKeyRepository.findAllByStatus(KmsKey.Status.ACTIVE);
        return keys.stream()
            .map(this::toJwkPublicKey)
            .toList();
    }

    public boolean verifyPayload(String payload, String signatureBase64, String keyId) {
        if (payload == null || signatureBase64 == null || signatureBase64.isBlank()) {
            return false;
        }

        KmsKey key = resolveKeyForVerification(keyId);
        if (key == null) {
            return false;
        }

        try {
            byte[] publicKeyBytes = Base64.getDecoder().decode(key.getPublicKey());
            X509EncodedKeySpec publicKeySpec = new X509EncodedKeySpec(publicKeyBytes);
            KeyFactory keyFactory = KeyFactory.getInstance(ED25519_ALGORITHM);
            PublicKey publicKey = keyFactory.generatePublic(publicKeySpec);

            Signature verifier = Signature.getInstance(ED25519_ALGORITHM);
            verifier.initVerify(publicKey);
            verifier.update(payload.getBytes(StandardCharsets.UTF_8));

            byte[] signatureBytes = Base64.getDecoder().decode(signatureBase64);
            return verifier.verify(signatureBytes);
        } catch (GeneralSecurityException | IllegalArgumentException ex) {
            return false;
        }
    }

    private void deactivateAllActiveKeys() {
        List<KmsKey> activeKeys = kmsKeyRepository.findAllByStatus(KmsKey.Status.ACTIVE);
        if (activeKeys.isEmpty()) {
            return;
        }

        for (KmsKey activeKey : activeKeys) {
            activeKey.setStatus(KmsKey.Status.INACTIVE);
        }

        // Flush inactive updates first to avoid unique index conflict on ACTIVE insert.
        kmsKeyRepository.saveAllAndFlush(activeKeys);
    }

    private KmsKey generateAndSaveActiveEd25519Key() {
        try {
            KeyPairGenerator keyPairGenerator = KeyPairGenerator.getInstance(ED25519_ALGORITHM);
            KeyPair keyPair = keyPairGenerator.generateKeyPair();

            String publicKeyBase64 = Base64.getEncoder().encodeToString(keyPair.getPublic().getEncoded());
            String privateKeyBase64 = Base64.getEncoder().encodeToString(keyPair.getPrivate().getEncoded());

            KmsKey kmsKey = new KmsKey();
            kmsKey.setAlgorithm(ED25519_ALGORITHM);
            kmsKey.setPublicKey(publicKeyBase64);
            kmsKey.setPrivateKey(privateKeyBase64);
            kmsKey.setStatus(KmsKey.Status.ACTIVE);

            return kmsKeyRepository.save(kmsKey);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("Ed25519 algorithm is not available", ex);
        }
    }

    private JwkPublicKey toJwkPublicKey(KmsKey key) {
        byte[] spki = Base64.getDecoder().decode(key.getPublicKey());
        if (spki.length < 32) {
            throw new IllegalStateException("Invalid Ed25519 public key format");
        }

        byte[] rawPublicKey = new byte[32];
        System.arraycopy(spki, spki.length - 32, rawPublicKey, 0, 32);
        String x = Base64.getUrlEncoder().withoutPadding().encodeToString(rawPublicKey);

        return new JwkPublicKey(
            key.getId().toString(),
            "OKP",
            "Ed25519",
            "sig",
            "EdDSA",
            x
        );
    }

    private KmsKey resolveKeyForVerification(String keyId) {
        if (keyId != null && !keyId.isBlank()) {
            try {
                return kmsKeyRepository.findById(UUID.fromString(keyId)).orElse(null);
            } catch (IllegalArgumentException ex) {
                return null;
            }
        }

        return kmsKeyRepository.findFirstByStatus(KmsKey.Status.ACTIVE).orElse(null);
    }

    public record SignResult(UUID keyId, String algorithm, String signature) {
    }

    public record JwkPublicKey(
        String kid,
        String kty,
        String crv,
        String use,
        String alg,
        String x
    ) {
    }
}
