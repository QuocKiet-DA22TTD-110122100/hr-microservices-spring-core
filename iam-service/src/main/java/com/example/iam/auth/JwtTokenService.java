package com.example.iam.auth;

import com.example.iam.config.SecurityProperties;
import com.example.iam.entity.UserAccount;
import com.example.iam.exception.AuthException;
import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JOSEObjectType;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.RSASSASigner;
import com.nimbusds.jose.crypto.RSASSAVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.security.KeyFactory;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.time.Instant;
import java.util.Base64;
import java.util.Date;
import java.util.List;
import java.util.UUID;

@Service
public class JwtTokenService {

    private final SecurityProperties properties;
    private final RSAPrivateKey privateKey;
    private final RSAPublicKey publicKey;

    public JwtTokenService(SecurityProperties properties) {
        this.properties = properties;
        KeyPair pair = resolveKeyPair(properties);
        this.privateKey = (RSAPrivateKey) pair.getPrivate();
        this.publicKey = (RSAPublicKey) pair.getPublic();
    }

    public String issueAccessToken(UserAccount user) {
        return issueToken(user, "access", properties.getJwt().getAccessTokenMinutes() * 60);
    }

    public String issueRefreshToken(UserAccount user) {
        return issueToken(user, "refresh", properties.getJwt().getRefreshTokenDays() * 86400);
    }

    public long accessTokenTtlSeconds() {
        return properties.getJwt().getAccessTokenMinutes() * 60;
    }

    public JWTClaimsSet verify(String token) {
        try {
            SignedJWT jwt = SignedJWT.parse(token);
            if (!jwt.verify(new RSASSAVerifier(publicKey))) {
                throw new AuthException(HttpStatus.UNAUTHORIZED, "Invalid token signature");
            }
            JWTClaimsSet claims = jwt.getJWTClaimsSet();
            if (claims.getExpirationTime() == null || claims.getExpirationTime().before(new Date())) {
                throw new AuthException(HttpStatus.UNAUTHORIZED, "Token expired");
            }
            if (!properties.getJwt().getIssuer().equals(claims.getIssuer())) {
                throw new AuthException(HttpStatus.UNAUTHORIZED, "Invalid token issuer");
            }
            return claims;
        } catch (AuthException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new AuthException(HttpStatus.UNAUTHORIZED, "Invalid token");
        }
    }

    private String issueToken(UserAccount user, String tokenType, long ttlSeconds) {
        Instant now = Instant.now();
        Instant exp = now.plusSeconds(ttlSeconds);
        JWTClaimsSet claims = new JWTClaimsSet.Builder()
                .issuer(properties.getJwt().getIssuer())
                .subject(user.getUsername())
                .claim("uid", user.getId())
                .claim("role", user.getRole().name())
                .claim("type", tokenType)
                .audience(List.of("iam", "gateway", "hr"))
                .jwtID(UUID.randomUUID().toString())
                .issueTime(Date.from(now))
                .expirationTime(Date.from(exp))
                .build();

        JWSHeader header = new JWSHeader.Builder(JWSAlgorithm.RS256)
                .type(JOSEObjectType.JWT)
                .build();

        SignedJWT jwt = new SignedJWT(header, claims);
        try {
            jwt.sign(new RSASSASigner(privateKey));
            return jwt.serialize();
        } catch (JOSEException ex) {
            throw new AuthException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to sign JWT");
        }
    }

    private KeyPair resolveKeyPair(SecurityProperties properties) {
        String privateB64 = properties.getJwt().getPrivateKeyBase64();
        String publicB64 = properties.getJwt().getPublicKeyBase64();

        try {
            if (privateB64 != null && !privateB64.isBlank() && publicB64 != null && !publicB64.isBlank()) {
                PrivateKey privateKey = KeyFactory.getInstance("RSA")
                        .generatePrivate(new PKCS8EncodedKeySpec(Base64.getDecoder().decode(privateB64)));
                PublicKey publicKey = KeyFactory.getInstance("RSA")
                        .generatePublic(new X509EncodedKeySpec(Base64.getDecoder().decode(publicB64)));
                return new KeyPair(publicKey, privateKey);
            }

            KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
            generator.initialize(2048);
            return generator.generateKeyPair();
        } catch (Exception ex) {
            throw new IllegalStateException("Unable to resolve RSA key pair", ex);
        }
    }
}
