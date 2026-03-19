package com.thuctap2026.auth.kms.controller;

import com.thuctap2026.auth.kms.service.KeyService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class JwksController {

    private final KeyService keyService;

    public JwksController(KeyService keyService) {
        this.keyService = keyService;
    }

    @GetMapping("/.well-known/jwks.json")
    public ResponseEntity<JwksResponse> getJwks() {
        return ResponseEntity.ok(toJwksResponse());
    }

    @GetMapping("/kms/internal/.well-known/jwks.json")
    public ResponseEntity<JwksResponse> getInternalJwks() {
        return ResponseEntity.ok(toJwksResponse());
    }

    private JwksResponse toJwksResponse() {
        List<JwkKeyResponse> keys = keyService.getJwksKeys().stream()
            .map(key -> new JwkKeyResponse(key.kid(), key.kty(), key.crv(), key.use(), key.alg(), key.x()))
            .toList();

        return new JwksResponse(keys);
    }

    public record JwksResponse(List<JwkKeyResponse> keys) {
    }

    public record JwkKeyResponse(
        String kid,
        String kty,
        String crv,
        String use,
        String alg,
        String x
    ) {
    }
}
