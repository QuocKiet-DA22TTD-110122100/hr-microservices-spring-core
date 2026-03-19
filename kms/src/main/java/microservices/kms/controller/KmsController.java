package microservices.kms.controller;

import microservices.kms.service.KmsSigningService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/kms")
public class KmsController {

    private final KmsSigningService kmsSigningService;

    @Value("${spring.application.name:kms}")
    private String applicationName;
    
    @Value("${server.port:8083}")
    private String serverPort;

    public KmsController(KmsSigningService kmsSigningService) {
        this.kmsSigningService = kmsSigningService;
    }

    @GetMapping("/")
    public Map<String, Object> home() {
        Map<String, Object> response = new HashMap<>();
        response.put("service", applicationName);
        response.put("port", serverPort);
        response.put("status", "UP");
            response.put("timestamp", Instant.now().toString());
        response.put("message", "Key Management Service is running!");
        return response;
    }

    @GetMapping("/health")
    public Map<String, Object> health() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put("service", applicationName);
        response.put("timestamp", Instant.now().toString());
        return response;
    }

    @GetMapping("/info")
    public Map<String, Object> info() {
        Map<String, Object> response = new HashMap<>();
        response.put("app", applicationName);
        response.put("version", "1.0.0");
        response.put("description", "Key Management Service");
        response.put("port", serverPort);
        return response;
    }

    @GetMapping("/keys")
    public Map<String, Object> getKeys() {
        Map<String, Object> response = new HashMap<>();
        response.put("message", "KMS Keys endpoint");
        response.put("keys", new String[]{"key1", "key2", "key3"});
        response.put("timestamp", Instant.now().toString());
        return response;
    }

    /**
     * Sign a message with the current KMS key (for external/interceptor calls)
     * POST /kms/sign
     */
    @PostMapping("/sign")
    public SigningResponseDto sign(@RequestBody SigningRequestDto request) {
        if (request == null || request.payload() == null || request.payload().isBlank()) {
            throw new IllegalArgumentException("payload is required");
        }

        KmsSigningService.SigningResult result = kmsSigningService.sign(request.payload());
        return new SigningResponseDto(result.keyId(), result.algorithm(), result.signature());
    }

    /**
     * Sign a message with the current KMS key (for internal JWT signing)
     * POST /kms/internal/sign
     */
    @PostMapping("/internal/sign")
    public SigningResponseDto signInternal(@RequestBody SigningRequestDto request) {
        if (request == null || request.payload() == null || request.payload().isBlank()) {
            throw new IllegalArgumentException("payload is required");
        }

        KmsSigningService.SigningResult result = kmsSigningService.sign(request.payload());
        return new SigningResponseDto(result.keyId(), result.algorithm(), result.signature());
    }

    /**
     * Get JWKS (JSON Web Key Set) for token verification
     * GET /kms/internal/.well-known/jwks.json
     */
    @GetMapping(value = "/internal/.well-known/jwks.json", produces = MediaType.APPLICATION_JSON_VALUE)
    public Map<String, Object> getJwks() {
        return kmsSigningService.getJwks();
    }

    /**
     * DTO for signing requests
     */
    public record SigningRequestDto(String payload) {
    }

    /**
     * DTO for signing responses
     */
    public record SigningResponseDto(String keyId, String algorithm, String signature) {
    }
}