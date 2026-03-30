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
        String token = jwtService.generateToken(username, resolveRoles(username));
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
        String token = jwtService.generateToken(username, resolveRoles(username));
        return Map.of(
                "message", "Đăng ký thành công",
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
            username = "Không xác định";
        }
        return Map.of(
                "user", username,
                "content", "User profile of " + username
        );
    }

    private List<String> resolveRoles(String username) {
        if ("admin".equalsIgnoreCase(username)) {
            return List.of("ROLE_ADMIN");
        }
        return List.of("ROLE_USER");
    }
}