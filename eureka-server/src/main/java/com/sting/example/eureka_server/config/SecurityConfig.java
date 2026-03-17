package com.sting.example.eureka_server.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.config.Customizer;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Value("${security.user.name:eureka}")
    private String username;
    
    @Value("${security.user.password:123456}")
    private String password;

    @Bean
    public UserDetailsService userDetailsService(PasswordEncoder passwordEncoder) {
        // Tạo user từ application.yml
        UserDetails user = User.builder()
            .username(username)
            .password(passwordEncoder.encode(password))
            .roles("USER")
            .build();
        
        return new InMemoryUserDetailsManager(user);
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // Disable CSRF for Eureka endpoints
            .csrf(csrf -> csrf
                .ignoringRequestMatchers("/eureka/**")
            )
            // Configure session management - IMPORTANT: Use NEVER to avoid double login
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.NEVER)
            )
            // Configure authorization
            .authorizeHttpRequests(auth -> auth 
                .requestMatchers("/actuator/health", "/actuator/info").permitAll() // Health checks don't need auth
                .requestMatchers("/eureka/css/**", "/eureka/js/**", "/eureka/fonts/**").permitAll() // Static resources
                .anyRequest().authenticated()
            )
            // Use only HTTP Basic auth, disable form login to prevent double authentication
            .httpBasic(Customizer.withDefaults())
            .formLogin(form -> form.disable()); // DISABLE form login to prevent double authentication
        
        return http.build();    
    }
}
