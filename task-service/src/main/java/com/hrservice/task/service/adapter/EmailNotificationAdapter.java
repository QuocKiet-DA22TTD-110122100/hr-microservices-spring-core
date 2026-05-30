package com.hrservice.task.service.adapter;

import com.hrservice.task.event.TaskNotificationEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
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

    @Value("${task.notification.email.from:no-reply@hr.local}")
    private String from;

    @Value("${task.notification.email.assigneeDomain:hr.local}")
    private String assigneeDomain;

    @Override
    public void send(TaskNotificationEvent event, Long previousAssignee) {
        String to = event.getAssigneeId() + "@" + assigneeDomain;

        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setFrom(from);
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
