package com.thuctap2026.auth.security;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebSecurityConfig implements WebMvcConfigurer {

    private final AuthRoleInterceptor authRoleInterceptor;

    public WebSecurityConfig(AuthRoleInterceptor authRoleInterceptor) {
        this.authRoleInterceptor = authRoleInterceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(authRoleInterceptor);
    }
}
