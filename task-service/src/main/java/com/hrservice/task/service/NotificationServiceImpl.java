package com.hrservice.task.service;

import com.hrservice.task.event.TaskNotificationEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationServiceImpl implements NotificationService {

    // Minimal implementation: log the notification and create a TaskNotificationEvent placeholder.
    // In future, wire to email/SNS/third-party providers.

    @Override
    public void notifyAssigneeChange(Long taskId, Long previousAssignee, Long newAssignee, String message) {
        TaskNotificationEvent evt = new TaskNotificationEvent();
        evt.setEventId(java.util.UUID.randomUUID().toString());
        evt.setTaskId(taskId);
        evt.setAssigneeId(newAssignee);
        evt.setMessage(message);
        evt.setTimestamp(LocalDateTime.now());

        // For now just log; adapter hooks can be added to actually send emails/SNS messages.
        log.info("[NOTIFICATION] Notify assignee change: taskId={}, from={} to={} message={}", taskId, previousAssignee, newAssignee, message);
    }
}
