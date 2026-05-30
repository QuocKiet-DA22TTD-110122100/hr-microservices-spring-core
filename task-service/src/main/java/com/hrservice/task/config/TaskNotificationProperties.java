package com.hrservice.task.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "task.notification")
public class TaskNotificationProperties {

    private String provider = "log";
    private String snsRegion = "ap-southeast-1";

    public String getProvider() {
        return provider;
    }

    public void setProvider(String provider) {
        this.provider = provider;
    }

    public String getSnsRegion() {
        return snsRegion;
    }

    public void setSnsRegion(String snsRegion) {
        this.snsRegion = snsRegion;
    }
}
