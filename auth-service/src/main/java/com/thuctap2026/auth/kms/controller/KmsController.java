package com.thuctap2026.auth.kms.controller;

import com.thuctap2026.auth.kms.entity.KmsKey;
import com.thuctap2026.auth.kms.service.KeyService;
import com.thuctap2026.auth.security.RequiredRoles;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@RestController
@RequestMapping("/kms")
public class KmsController {

    private final KeyService keyService;

    public KmsController(KeyService keyService) {
        this.keyService = keyService;
    }

    @RequiredRoles({"ADMIN"})
    @PostMapping("/keys")
    public ResponseEntity<CreateKeyResponse> createKey() {
        KmsKey savedKey = keyService.createKey();

        return ResponseEntity.status(HttpStatus.CREATED).body(toCreateKeyResponse(savedKey));
    }

    @RequiredRoles({"ADMIN"})
    @PostMapping("/rotate")
    public ResponseEntity<CreateKeyResponse> rotateKey() {
        KmsKey rotatedKey = keyService.rotateKey();

        return ResponseEntity.status(HttpStatus.CREATED).body(toCreateKeyResponse(rotatedKey));
    }

    @PostMapping("/sign")
    public ResponseEntity<SignResponse> sign(@RequestBody SignRequest request) {
        if (request == null || request.payload() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "payload is required");
        }

        KeyService.SignResult signed = keyService.signPayload(request.payload());
        return ResponseEntity.ok(new SignResponse(signed.keyId(), signed.algorithm(), signed.signature()));
    }

    private CreateKeyResponse toCreateKeyResponse(KmsKey savedKey) {
        return new CreateKeyResponse(
            savedKey.getId(),
            savedKey.getAlgorithm(),
            savedKey.getPublicKey(),
            savedKey.getStatus().name()
        );
    }

    public record CreateKeyResponse(
        UUID keyId,
        String algorithm,
        String publicKey,
        String status
    ) {
    }

    public record SignRequest(String payload) {
    }

    public record SignResponse(UUID keyId, String algorithm, String signature) {
    }
}
