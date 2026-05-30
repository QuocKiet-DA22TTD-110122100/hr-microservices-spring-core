package com.hrservice.task.service.adapter;

import com.hrservice.task.event.TaskNotificationEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.sns.SnsClient;
import software.amazon.awssdk.services.sns.model.PublishRequest;

@Service
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(prefix = "task.notification", name = "provider", havingValue = "sns")
public class SnsNotificationAdapter implements NotificationAdapter {

    private final SnsClient snsClient;

    @Value("${task.notification.sns.topicArn:}")
    private String topicArn;

    @Override
    public void send(TaskNotificationEvent event, Long previousAssignee) {
        if (topicArn == null || topicArn.isBlank()) {
            log.warn("[NOTIFICATION][SNS] topicArn is empty, skipping notification for taskId={}", event.getTaskId());
            return;
        }

        String body = "Task " + event.getTaskId() + " reassigned from " + previousAssignee + " to " + event.getAssigneeId() + ". " + event.getMessage();
        try {
            snsClient.publish(PublishRequest.builder()
                    .topicArn(topicArn)
                    .subject("Task reassignment")
                    .message(body)
                    .build());
            log.info("[NOTIFICATION][SNS] Published reassignment for taskId={}", event.getTaskId());
        } catch (Exception ex) {
            log.warn("[NOTIFICATION][SNS] Failed publishing for taskId={}", event.getTaskId(), ex);
        }
    }
}
