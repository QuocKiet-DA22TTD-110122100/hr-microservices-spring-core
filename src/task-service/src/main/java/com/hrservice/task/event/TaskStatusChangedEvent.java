package com.hrservice.task.event;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.hrservice.task.entity.Task;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class TaskStatusChangedEvent extends TaskEvent {
    
    @JsonProperty("old_status")
    private Task.TaskStatus oldStatus;
    
    @JsonProperty("new_status")
    private Task.TaskStatus newStatus;
    
    @JsonProperty("assignee_id")
    private Long assigneeId;
}
