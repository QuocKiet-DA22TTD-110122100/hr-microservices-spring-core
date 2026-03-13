
package com.example.mockservice;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/iam/auth")
public class AuthController {

    @PostMapping("/login")
    public String login() {
        return "Login success from IAM service";
    }

    @PostMapping("/register")
    public String register() {
        return "Register success";
    }

    @GetMapping("/profile")
    public String profile() {
        return "User profile";
    }
}