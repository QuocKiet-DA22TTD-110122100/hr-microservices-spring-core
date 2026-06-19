package com.hrservice.gateway.config;

import org.springframework.cloud.client.loadbalancer.LoadBalanced;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class WebClientConfig {

    @Bean
    @LoadBalanced // Quan trọng: Để WebClient hiểu được Service ID từ Eureka
    public WebClient.Builder webClientBuilder() {
        return WebClient.builder();
    }

    @Bean("directWebClientBuilder")
    public WebClient.Builder directWebClientBuilder() {
        return WebClient.builder();
    }
}
