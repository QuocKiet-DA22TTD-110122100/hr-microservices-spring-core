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
public class TaskAssignedEvent implements Serializable {

    @JsonProperty("event_id")
    private String eventId;

    @JsonProperty("task_id")
    private Long taskId;

    @JsonProperty("project_id")
    private Long projectId;

    @JsonProperty("previous_assignee")
    private Long previousAssignee;

    @JsonProperty("new_assignee")
    private Long newAssignee;

    @JsonProperty("timestamp")
    private LocalDateTime timestamp;

    @JsonProperty("event_type")
    private String eventType;
}
