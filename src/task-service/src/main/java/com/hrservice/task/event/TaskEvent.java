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
// Đây là lớp cơ sở cho tất cả các sự kiện liên quan đến Task, có thể mở rộng để thêm các trường cụ thể cho từng loại sự kiện
public abstract class TaskEvent implements Serializable {
    
    @JsonProperty("event_id")
    private String eventId;
    
    @JsonProperty("task_id")
    private Long taskId;
    
    @JsonProperty("project_id")
    private Long projectId;
    
    @JsonProperty("timestamp")
    private LocalDateTime timestamp;
    
    @JsonProperty("event_type")
    private String eventType;
}
