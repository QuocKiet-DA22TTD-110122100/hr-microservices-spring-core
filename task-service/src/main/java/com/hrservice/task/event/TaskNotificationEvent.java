package com.hrservice.task.event;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TaskNotificationEvent implements Serializable {

    @JsonProperty("event_id")
    private String eventId;

    @JsonProperty("task_id")
    private Long taskId;

    @JsonProperty("assignee_id")
    private Long assigneeId;

    @JsonProperty("message")
    private String message;

    @JsonProperty("timestamp")
    private LocalDateTime timestamp;
}
