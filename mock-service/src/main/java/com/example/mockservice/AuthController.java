package com.example.mockservice;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
public class AuthController {

    private final JwtService jwtService;

    // FIX: Thêm constructor để inject JwtService
    public AuthController(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    // ===== /iam/auth endpoints =====
    @PostMapping("/iam/auth/login")
    public Map<String, Object> iamAuthLogin(@RequestBody Map<String, String> credentials) {
        String username = credentials.getOrDefault("username", "anonymous");
        String token = jwtService.generateToken(username, resolveRoles(username));
        return Map.of(
                "message", "đăng nhập thành công",
                "accessToken", token,
                "tokenType", "Bearer",
                "expiresIn", 86400,
                "user", username
        );
    }

    @PostMapping("/iam/auth/register")
    public Map<String, Object> iamAuthRegister(@RequestBody Map<String, Object> userData) {
        String username = (String) userData.getOrDefault("username", "anonymous");
        String token = jwtService.generateToken(username, resolveRoles(username));
        return Map.of(
                "message", "Đăng ký thành công",
                "accessToken", token,
                "tokenType", "Bearer",
                "expiresIn", 86400,
                "user", username,
                "receivedData", userData
        );
    }

    @GetMapping("/iam/auth/profile")
    public Map<String, String> iamAuthProfile() {
        return Map.of(
                "message", "User profile",
                "service", "IAM Auth Service"
        );
    }

    // ===== /api/v1/auth endpoints =====
    @PostMapping("/api/v1/auth/login")
    public Map<String, Object> apiV1AuthLogin(@RequestBody Map<String, String> credentials) {
        String username = credentials.getOrDefault("username", "anonymous");
        String token = jwtService.generateToken(username, resolveRoles(username));
        return Map.of(
                "message", "Đăng nhập thành công từ API v1",
                "accessToken", token,
                "tokenType", "Bearer",
                "expiresIn", 86400,
                "user", username
        );
    }

    @PostMapping("/api/v1/auth/register")
    public Map<String, Object> apiV1AuthRegister(@RequestBody Map<String, Object> userData) {
        String username = (String) userData.getOrDefault("username", "anonymous");
        String token = jwtService.generateToken(username, resolveRoles(username));
        return Map.of(
                "message", "Đăng ký thành công từ API v1",
                "accessToken", token,
                "tokenType", "Bearer",
                "expiresIn", 86400,
                "user", username,
                "receivedData", userData
        );
    }

    private List<String> resolveRoles(String username) {
        if ("admin".equalsIgnoreCase(username)) {
            return List.of("ROLE_ADMIN");
        }
        return List.of("ROLE_USER");
    }
}