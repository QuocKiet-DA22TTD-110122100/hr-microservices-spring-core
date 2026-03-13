package microservices.kms.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
public class KmsController {

    @Value("${spring.application.name:kms}")
    private String applicationName;

    @Value("${server.port:8083}")
    private String serverPort;

    @GetMapping("/")
    public Map<String, Object> home() {
        Map<String, Object> response = new HashMap<>();
        response.put("service", applicationName);
        response.put("port", serverPort);
        response.put("status", "UP");
        response.put("timestamp", LocalDateTime.now());
        response.put("message", "Key Management Service is running!");
        return response;
    }

    @GetMapping("/health")
    public Map<String, Object> health() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put("service", applicationName);
        response.put("timestamp", LocalDateTime.now());
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
        response.put("timestamp", LocalDateTime.now());
        return response;
    }
}