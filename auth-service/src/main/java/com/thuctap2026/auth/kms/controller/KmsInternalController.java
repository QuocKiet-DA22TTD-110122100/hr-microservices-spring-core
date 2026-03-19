package com.thuctap2026.auth.kms.controller;

import com.thuctap2026.auth.kms.service.KeyService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@RestController
@RequestMapping("/kms/internal")
public class KmsInternalController {

    private final KeyService keyService;

    public KmsInternalController(KeyService keyService) {
        this.keyService = keyService;
    }

    @PostMapping("/sign")
    public ResponseEntity<SignResponse> sign(@RequestBody SignRequest request) {
        if (request == null || request.payload() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "payload is required");
        }

        KeyService.SignResult signed = keyService.signPayload(request.payload());
        return ResponseEntity.ok(new SignResponse(signed.keyId(), signed.algorithm(), signed.signature()));
    }

    public record SignRequest(String payload) {
    }

    public record SignResponse(UUID keyId, String algorithm, String signature) {
    }
}
