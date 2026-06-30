package com.hrservice.auth.iam.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Locale;

@Service
public class TotpService {

    private static final String BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${app.security.2fa.issuer:HRSystem}")
    private String issuer;

    @Value("${app.security.2fa.time-step-seconds:30}")
    private long timeStepSeconds;

    @Value("${app.security.2fa.digits:6}")
    private int digits;

    @Value("${app.security.2fa.window:1}")
    private int validationWindow;

    public String generateSecret() {
        byte[] random = new byte[20];
        secureRandom.nextBytes(random);
        return base32Encode(random);
    }

    public String buildOtpAuthUri(String username, String secret) {
        String encodedIssuer = URLEncoder.encode(issuer, StandardCharsets.UTF_8);
        String encodedLabel = URLEncoder.encode(issuer + ":" + username, StandardCharsets.UTF_8);
        return "otpauth://totp/" + encodedLabel
                + "?secret=" + secret
                + "&issuer=" + encodedIssuer
                + "&algorithm=SHA1"
                + "&digits=" + digits
                + "&period=" + timeStepSeconds;
    }

    public boolean verifyCode(String secret, String code) {
        if (secret == null || secret.isBlank() || code == null || !code.matches("\\d{" + digits + "}")) {
            return false;
        }

        long counter = Instant.now().getEpochSecond() / timeStepSeconds;
        for (int offset = -validationWindow; offset <= validationWindow; offset++) {
            String expected = generateCode(secret, counter + offset);
            if (expected.equals(code)) {
                return true;
            }
        }
        return false;
    }

    private String generateCode(String secret, long counter) {
        try {
            byte[] key = base32Decode(secret);
            byte[] data = new byte[8];
            for (int i = 7; i >= 0; i--) {
                data[i] = (byte) (counter & 0xFF);
                counter >>= 8;
            }

            Mac mac = Mac.getInstance("HmacSHA1");
            mac.init(new SecretKeySpec(key, "HmacSHA1"));
            byte[] hash = mac.doFinal(data);

            int offset = hash[hash.length - 1] & 0x0F;
            int binary = ((hash[offset] & 0x7F) << 24)
                    | ((hash[offset + 1] & 0xFF) << 16)
                    | ((hash[offset + 2] & 0xFF) << 8)
                    | (hash[offset + 3] & 0xFF);

            int otp = binary % (int) Math.pow(10, digits);
            String otpText = Integer.toString(otp);
            return "0".repeat(Math.max(0, digits - otpText.length())) + otpText;
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to generate TOTP code", ex);
        }
    }

    private String base32Encode(byte[] data) {
        StringBuilder result = new StringBuilder();
        int buffer = 0;
        int bitsLeft = 0;

        for (byte b : data) {
            buffer = (buffer << 8) | (b & 0xFF);
            bitsLeft += 8;
            while (bitsLeft >= 5) {
                int index = (buffer >> (bitsLeft - 5)) & 0x1F;
                bitsLeft -= 5;
                result.append(BASE32_ALPHABET.charAt(index));
            }
        }

        if (bitsLeft > 0) {
            int index = (buffer << (5 - bitsLeft)) & 0x1F;
            result.append(BASE32_ALPHABET.charAt(index));
        }

        return result.toString();
    }

    private byte[] base32Decode(String input) {
        String normalized = input.replace("=", "").replace(" ", "").toUpperCase(Locale.ROOT);
        int buffer = 0;
        int bitsLeft = 0;
        byte[] result = new byte[(normalized.length() * 5) / 8];
        int index = 0;

        for (char c : normalized.toCharArray()) {
            int value = BASE32_ALPHABET.indexOf(c);
            if (value < 0) {
                throw new IllegalArgumentException("Invalid base32 character");
            }
            buffer = (buffer << 5) | value;
            bitsLeft += 5;
            if (bitsLeft >= 8) {
                result[index++] = (byte) ((buffer >> (bitsLeft - 8)) & 0xFF);
                bitsLeft -= 8;
            }
        }

        if (index == result.length) {
            return result;
        }

        byte[] trimmed = new byte[index];
        System.arraycopy(result, 0, trimmed, 0, index);
        return trimmed;
    }
}
