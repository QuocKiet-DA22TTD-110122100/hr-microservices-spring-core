package com.hrservice.task.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.sns.SnsClient;

@Configuration
@ConditionalOnProperty(prefix = "task.notification", name = "provider", havingValue = "sns")
public class AwsSnsConfig {

    @Bean
    public SnsClient snsClient(TaskNotificationProperties properties) {
        String region = properties.getSnsRegion() == null || properties.getSnsRegion().isBlank()
                ? "ap-southeast-1"
                : properties.getSnsRegion();
        return SnsClient.builder().region(Region.of(region)).build();
    }
}
