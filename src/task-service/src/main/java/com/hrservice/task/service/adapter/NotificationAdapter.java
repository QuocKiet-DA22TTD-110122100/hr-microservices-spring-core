package com.hrservice.task.service.adapter;

import com.hrservice.task.event.TaskNotificationEvent;

public interface NotificationAdapter {
    void send(TaskNotificationEvent event, Long previousAssignee);
}
