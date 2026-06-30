package com.hrservice.auth.security;

import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.Objects;

@Configuration
public class WebSecurityConfig implements WebMvcConfigurer {

    private final AuthRoleInterceptor authRoleInterceptor;

    public WebSecurityConfig(AuthRoleInterceptor authRoleInterceptor) {
        this.authRoleInterceptor = authRoleInterceptor;
    }

    @Override
    public void addInterceptors(@NonNull InterceptorRegistry registry) {
        registry.addInterceptor(Objects.requireNonNull(authRoleInterceptor, "authRoleInterceptor must not be null"));
    }
}
