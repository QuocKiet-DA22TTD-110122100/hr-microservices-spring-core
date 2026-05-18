package com.hrservice.project.event;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public abstract class ProjectEvent implements Serializable {
    
    @JsonProperty("event_id")
    private String eventId;
    
    @JsonProperty("project_id")
    private Long projectId;
    
    @JsonProperty("timestamp")
    private LocalDateTime timestamp;
    
    @JsonProperty("event_type")
    private String eventType;
}
