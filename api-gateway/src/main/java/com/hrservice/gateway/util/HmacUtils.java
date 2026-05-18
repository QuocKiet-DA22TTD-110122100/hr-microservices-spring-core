package com.hrservice.gateway.util;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import java.util.HexFormat;

public final class HmacUtils {

    private static final String ALGORITHM = "HmacSHA256";

    private HmacUtils() {
    }

    /**
     * Tạo chữ ký HMAC từ dữ liệu và khóa bí mật
     */
    public static String generateSignature(String data, String secret) {
        if (data == null || secret == null) {
            throw new IllegalArgumentException("data và secret không được null");
        }
        try 
        {
            SecretKeySpec signingKey = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), ALGORITHM);
            Mac mac = Mac.getInstance(ALGORITHM);
            mac.init(signingKey);
            byte[] rawHmac = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(rawHmac);
        } catch (GeneralSecurityException e) {
            throw new HmacOperationException("Lỗi khi tính toán HMAC", e);
        }
    }

    /**
     * Kiểm tra chữ ký có khớp hay không
     */
    public static boolean verifySignature(String data, String secret, String clientSignature) {
        if (clientSignature == null || data == null || secret == null) return false;
        String serverSignature = generateSignature(data, secret);
        return MessageDigest.isEqual(
                serverSignature.getBytes(StandardCharsets.UTF_8),
                clientSignature.getBytes(StandardCharsets.UTF_8));
    }



    public static String hashContent(byte[] content) {
        if (content == null || content.length == 0) {
            return "";
        }
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] encodedHash = digest.digest(content);
            return HexFormat.of().formatHex(encodedHash);

        } catch (NoSuchAlgorithmException e) {
            throw new HmacOperationException("Error hashing content", e);
        }
    }

    /**
     * Tạo chuỗi chuẩn (Canonical String) từ các thành phần request
     */
    // Trong HmacUtils.java
    public static String buildCanonicalString(String method, String path, String timestamp, String nonce, String bodyHash) {
        return String.join("\n", method, path, timestamp, nonce, bodyHash);
    }

    public static final class HmacOperationException extends IllegalStateException {
        public HmacOperationException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}