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
public class ProjectStatusChangedEvent implements Serializable {

    @JsonProperty("event_id")
    private String eventId;

    @JsonProperty("project_id")
    private Long projectId;

    @JsonProperty("timestamp")
    private LocalDateTime timestamp;

    @JsonProperty("event_type")
    private String eventType;

    @JsonProperty("old_status")
    private String oldStatus;

    @JsonProperty("new_status")
    private String newStatus;

    @JsonProperty("lead_id")
    private Long leadId;
}
