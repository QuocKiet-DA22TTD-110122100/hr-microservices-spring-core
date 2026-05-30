package com.hrservice.task.service;

public interface NotificationService {
    void notifyAssigneeChange(Long taskId, Long previousAssignee, Long newAssignee, String message);
}
