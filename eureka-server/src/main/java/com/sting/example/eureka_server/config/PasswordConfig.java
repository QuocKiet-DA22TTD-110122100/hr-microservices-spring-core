package com.sting.example.eureka_server.config;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.NoOpPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class PasswordConfig {
    
    @Bean
    @SuppressWarnings("deprecation")
    public PasswordEncoder passwordEncoder() {
        // NoOpPasswordEncoder is for development only.
        // Production should use BCryptPasswordEncoder.
        return NoOpPasswordEncoder.getInstance();
    }

}
