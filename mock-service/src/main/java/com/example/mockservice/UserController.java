package com.example.mockservice;

import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/iam/user")
public class UserController {

    private final JwtService jwtService;

    public UserController(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody Map<String, String> credentials) {
        String username = credentials.getOrDefault("username", "anonymous");
        // Tạo JWT token với thông tin user
        String token = jwtService.generateToken(username, List.of("ROLE_USER"));
        return Map.of(
                "accessToken", token,
                "tokenType", "Bearer",
                "expiresIn", 86400,
                "user", username
        );
    }

    @PostMapping("/register")
    public Map<String, Object> register(@RequestBody Map<String, Object> userData) {
        String username = (String) userData.getOrDefault("username", "anonymous");
        String token = jwtService.generateToken(username, List.of("ROLE_USER"));
        return Map.of(
                "message", "Register success",
                "accessToken", token,
                "tokenType", "Bearer",
                "expiresIn", 86400,
                "receivedData", userData
        );
    }

    @GetMapping("/profile")
    public Map<String, String> profile(HttpServletRequest request) {
        // Lấy thông tin user từ header do api-gateway truyền xuống sau khi xác thực JWT
        String username = request.getHeader("X-Auth-User");
        if (username == null || username.isBlank()) {
            username = "Unknown";
        }
        return Map.of(
                "user", username,
                "content", "User profile of " + username
        );
    }
}