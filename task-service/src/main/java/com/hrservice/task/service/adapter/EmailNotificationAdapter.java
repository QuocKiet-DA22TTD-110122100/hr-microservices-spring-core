package com.hrservice.task.service.adapter;

import com.hrservice.task.config.TaskNotificationProperties;
import com.hrservice.task.event.TaskNotificationEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(prefix = "task.notification", name = "provider", havingValue = "email")
public class EmailNotificationAdapter implements NotificationAdapter {

    private final JavaMailSender mailSender;
    private final AssigneeEmailResolver assigneeEmailResolver;
    private final TaskNotificationProperties properties;

    @Override
    public void send(TaskNotificationEvent event, Long previousAssignee) {
        String to = assigneeEmailResolver.resolve(event.getAssigneeId());
        if (to == null || to.isBlank()) {
            log.warn("[NOTIFICATION][EMAIL] Cannot resolve email for assigneeId={}, skip", event.getAssigneeId());
            return;
        }

        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setFrom(properties.getEmailFrom());
        msg.setTo(to);
        msg.setSubject("Task reassigned: " + event.getTaskId());
        msg.setText("Task " + event.getTaskId() + " was reassigned from " + previousAssignee + " to " + event.getAssigneeId() + ". " + event.getMessage());

        try {
            mailSender.send(msg);
            log.info("[NOTIFICATION][EMAIL] Sent reassignment email for taskId={} to={}", event.getTaskId(), to);
        } catch (Exception ex) {
            log.warn("[NOTIFICATION][EMAIL] Failed sending email for taskId={}", event.getTaskId(), ex);
        }
    }
}
