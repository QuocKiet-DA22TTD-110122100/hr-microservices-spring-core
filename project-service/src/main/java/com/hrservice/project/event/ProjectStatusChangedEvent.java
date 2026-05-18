package com.hrservice.project.event;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.hrservice.project.entity.Project;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class ProjectStatusChangedEvent extends ProjectEvent {
    
    @JsonProperty("old_status")
    private Project.ProjectStatus oldStatus;
    
    @JsonProperty("new_status")
    private Project.ProjectStatus newStatus;
    
    @JsonProperty("lead_id")
    private Long leadId;
}
