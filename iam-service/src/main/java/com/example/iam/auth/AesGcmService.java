package com.example.iam.auth;

import com.example.iam.config.SecurityProperties;
import com.example.iam.exception.AuthException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;

@Service
@Slf4j
public class AesGcmService {

    private static final String AES = "AES";
    private static final String AES_GCM = "AES/GCM/NoPadding";
    private static final int GCM_TAG_LENGTH = 128;
    private static final int IV_LENGTH = 12;

    private final SecretKey secretKey;
    private final SecureRandom secureRandom = new SecureRandom();

    public AesGcmService(SecurityProperties properties) {
        this.secretKey = resolveKey(properties);
    }

    private SecretKey resolveKey(SecurityProperties properties) {
        String base64 = properties.getAes().getKeyBase64();
        if (base64 == null || base64.isBlank()) {
            log.warn("AES_KEY_BASE64 is empty, generated in-memory AES key will rotate at restart");
            return generateDefaultKey();
        }
        try {
            byte[] raw = Base64.getDecoder().decode(base64);
            if (raw.length != 32) {
                throw new IllegalStateException("AES key must be 32 bytes for AES-256");
            }
            return new SecretKeySpec(raw, AES);
        } catch (Exception ex) {
            throw new IllegalStateException("Invalid AES_KEY_BASE64", ex);
        }
    }

    private SecretKey generateDefaultKey() {
        try {
            KeyGenerator keyGenerator = KeyGenerator.getInstance(AES);
            keyGenerator.init(256);
            return keyGenerator.generateKey();
        } catch (Exception ex) {
            throw new IllegalStateException("Unable to initialize AES key", ex);
        }
    }

    public String encrypt(String plaintext) {
        if (plaintext == null || plaintext.isBlank()) {
            return null;
        }
        try {
            byte[] iv = new byte[IV_LENGTH];
            secureRandom.nextBytes(iv);

            Cipher cipher = Cipher.getInstance(AES_GCM);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, new GCMParameterSpec(GCM_TAG_LENGTH, iv));
            byte[] encrypted = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));

            byte[] payload = new byte[iv.length + encrypted.length];
            System.arraycopy(iv, 0, payload, 0, iv.length);
            System.arraycopy(encrypted, 0, payload, iv.length, encrypted.length);
            return Base64.getEncoder().encodeToString(payload);
        } catch (Exception ex) {
            throw new AuthException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to encrypt sensitive data");
        }
    }

    public String decrypt(String ciphertext) {
        if (ciphertext == null || ciphertext.isBlank()) {
            return null;
        }
        try {
            byte[] payload = Base64.getDecoder().decode(ciphertext);
            byte[] iv = new byte[IV_LENGTH];
            byte[] encrypted = new byte[payload.length - IV_LENGTH];

            System.arraycopy(payload, 0, iv, 0, IV_LENGTH);
            System.arraycopy(payload, IV_LENGTH, encrypted, 0, encrypted.length);

            Cipher cipher = Cipher.getInstance(AES_GCM);
            cipher.init(Cipher.DECRYPT_MODE, new SecretKeySpec(secretKey.getEncoded(), AES), new GCMParameterSpec(GCM_TAG_LENGTH, iv));
            return new String(cipher.doFinal(encrypted), StandardCharsets.UTF_8);
        } catch (Exception ex) {
            throw new AuthException(HttpStatus.BAD_REQUEST, "Invalid encrypted payload");
        }
    }
}
