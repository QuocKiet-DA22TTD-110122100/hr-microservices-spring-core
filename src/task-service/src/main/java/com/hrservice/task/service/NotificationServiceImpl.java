package com.hrservice.task.service;

import com.hrservice.task.event.TaskNotificationEvent;
import com.hrservice.task.service.adapter.NotificationAdapter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationServiceImpl implements NotificationService {

    private final List<NotificationAdapter> adapters;

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

        log.info("[NOTIFICATION] Notify assignee change: taskId={}, from={} to={} message={}", taskId, previousAssignee, newAssignee, message);

        if (adapters == null || adapters.isEmpty()) {
            log.info("[NOTIFICATION] No adapter enabled (provider=log/default). Event kept in logs only.");
            return;
        }

        for (NotificationAdapter adapter : adapters) {
            try {
                adapter.send(evt, previousAssignee);
            } catch (Exception ex) {
                log.warn("[NOTIFICATION] Adapter {} failed for taskId={}", adapter.getClass().getSimpleName(), taskId, ex);
            }
        }
    }
}
