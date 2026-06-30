package com.hrservice.task.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Component
@ConfigurationProperties(prefix = "task.notification")
public class TaskNotificationProperties {

    private String provider = "log";
    private String snsRegion = "ap-southeast-1";
    private String emailFrom = "no-reply@hr.local";
    private String assigneeDomain = "hr.local";
    private String snsTopicArn = "";
    private Map<String, String> assigneeEmailMap = new HashMap<>();

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

    public String getEmailFrom() {
        return emailFrom;
    }

    public void setEmailFrom(String emailFrom) {
        this.emailFrom = emailFrom;
    }

    public String getAssigneeDomain() {
        return assigneeDomain;
    }

    public void setAssigneeDomain(String assigneeDomain) {
        this.assigneeDomain = assigneeDomain;
    }

    public String getSnsTopicArn() {
        return snsTopicArn;
    }

    public void setSnsTopicArn(String snsTopicArn) {
        this.snsTopicArn = snsTopicArn;
    }

    public Map<String, String> getAssigneeEmailMap() {
        return assigneeEmailMap;
    }

    public void setAssigneeEmailMap(Map<String, String> assigneeEmailMap) {
        this.assigneeEmailMap = assigneeEmailMap;
    }
}
