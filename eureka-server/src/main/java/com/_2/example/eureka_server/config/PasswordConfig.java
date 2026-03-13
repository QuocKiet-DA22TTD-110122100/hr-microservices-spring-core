package com._2.example.eureka_server.config;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.NoOpPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class PasswordConfig {
    
    @Bean
    @SuppressWarnings("deprecation")
    public PasswordEncoder passwordEncoder() {
        // NoOpPasswordEncoder - Không mã hóa password (chỉ dùng cho development)
        // Production nên dùng BCryptPasswordEncoder
        return NoOpPasswordEncoder.getInstance();
    }

}
