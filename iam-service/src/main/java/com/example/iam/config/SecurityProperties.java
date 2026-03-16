package com.example.iam.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "security")
public class SecurityProperties {

    private Jwt jwt = new Jwt();
    private Aes aes = new Aes();
    private Password password = new Password();
    private Lock lock = new Lock();
    private InternalHmac internalHmac = new InternalHmac();

    @Getter
    @Setter
    public static class Aes {
        private String keyBase64;
    }

    @Getter
    @Setter
    public static class Jwt {
        private String issuer;
        private long accessTokenMinutes;
        private long refreshTokenDays;
        private String privateKeyBase64;
        private String publicKeyBase64;
    }

    @Getter
    @Setter
    public static class Password {
        private long expiryDays;
    }

    @Getter
    @Setter
    public static class Lock {
        private int userMaxAttempts;
        private int userLockMinutes;
        private int ipMaxAttempts;
        private int ipLockMinutes;
        private int ipRateLimitPerSecond;
    }

    @Getter
    @Setter
    public static class InternalHmac {
        private boolean enabled;
        private long clockSkewSeconds;
        private String serviceSecrets;
    }
}
