package com.example.demo;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
public class DemoController {

    @Value("${spring.application.name:demo-service}")
    private String applicationName;

    @Value("${server.port:8082}")
    private String serverPort;

    @GetMapping("/")
    public Map<String, Object> home() {
        Map<String, Object> response = new HashMap<>();
        response.put("service", applicationName);
        response.put("port", serverPort);
        response.put("status", "UP");
        response.put("timestamp", LocalDateTime.now());
        response.put("message", "chỉ là đemo xem!");
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
        response.put("description", "Demo service for Eureka testing");
        response.put("port", serverPort);
        return response;
    }
}