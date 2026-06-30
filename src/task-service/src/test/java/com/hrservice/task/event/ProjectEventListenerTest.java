package com.hrservice.task.event;

import com.hrservice.task.entity.Task;
import com.hrservice.task.repository.TaskRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class ProjectEventListenerTest {

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private com.hrservice.task.repository.TaskHistoryRepository taskHistoryRepository;

    @Mock
    private com.hrservice.task.event.TaskEventPublisher taskEventPublisher;

    private ProjectEventListener listener;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        com.hrservice.task.config.TaskReassignProperties props = new com.hrservice.task.config.TaskReassignProperties();
        props.setDefaultPoolAssigneeId(0L);
        listener = new ProjectEventListener(taskRepository, taskHistoryRepository, taskEventPublisher, new com.hrservice.task.service.NotificationService() {
            @Override
            public void notifyAssigneeChange(Long taskId, Long previousAssignee, Long newAssignee, String message) {
                // no-op for test
            }
        }, props);
    }

    @Test
    void onProjectStatusChanged_reassignsTasks_whenProjectPaused() {
        Task t1 = new Task(1L, "T1", "d", Task.TaskStatus.OPEN, 5L, 300L, java.time.LocalDateTime.now(), java.time.LocalDateTime.now());
        Task t2 = new Task(2L, "T2", "d", Task.TaskStatus.IN_PROGRESS, 6L, 300L, java.time.LocalDateTime.now(), java.time.LocalDateTime.now());
        List<Task> tasks = Arrays.asList(t1, t2);

        when(taskRepository.findByProjectId(300L)).thenReturn(tasks);

        ProjectStatusChangedEvent evt = new ProjectStatusChangedEvent();
        evt.setProjectId(300L);
        evt.setOldStatus("ACTIVE");
        evt.setNewStatus("PAUSED");
        evt.setLeadId(99L);

        listener.onProjectStatusChanged(evt);

        ArgumentCaptor<List<Task>> captor = ArgumentCaptor.forClass((Class) List.class);
        verify(taskRepository, times(1)).saveAll(captor.capture());
        List<Task> saved = captor.getValue();
        assertEquals(99L, saved.get(0).getAssigneeId());
        assertEquals(99L, saved.get(1).getAssigneeId());
        verify(taskHistoryRepository, atLeastOnce()).save(any());
        verify(taskEventPublisher, atLeastOnce()).publishTaskAssignedEvent(anyLong(), anyLong(), anyLong(), anyLong());
    }

    @Test
    void onProjectStatusChanged_marksTasksCompleted_whenProjectCompleted() {
        Task t1 = new Task(1L, "T1", "d", Task.TaskStatus.OPEN, 10L, 100L, LocalDateTime.now(), LocalDateTime.now());
        Task t2 = new Task(2L, "T2", "d", Task.TaskStatus.IN_PROGRESS, 11L, 100L, LocalDateTime.now(), LocalDateTime.now());
        List<Task> tasks = Arrays.asList(t1, t2);

        when(taskRepository.findByProjectId(100L)).thenReturn(tasks);

        ProjectStatusChangedEvent evt = new ProjectStatusChangedEvent();
        evt.setProjectId(100L);
        evt.setOldStatus("ACTIVE");
        evt.setNewStatus("COMPLETED");

        listener.onProjectStatusChanged(evt);

        ArgumentCaptor<List<Task>> captor = ArgumentCaptor.forClass((Class) List.class);
        verify(taskRepository, times(1)).saveAll(captor.capture());

        List<Task> saved = captor.getValue();
        assertEquals(2, saved.size());
        assertTrue(saved.stream().allMatch(t -> t.getStatus() == Task.TaskStatus.COMPLETED));
        // verify history and event published
        verify(taskHistoryRepository, atLeastOnce()).save(any());
        verify(taskEventPublisher, atLeastOnce()).publishTaskStatusChangedEvent(anyLong(), anyLong(), any(), any(), anyLong());
    }

    @Test
    void onProjectStatusChanged_marksTasksCancelled_whenProjectArchived() {
        Task t1 = new Task(1L, "T1", "d", Task.TaskStatus.OPEN, 10L, 200L, LocalDateTime.now(), LocalDateTime.now());
        Task t2 = new Task(2L, "T2", "d", Task.TaskStatus.COMPLETED, 11L, 200L, LocalDateTime.now(), LocalDateTime.now());
        Task t3 = new Task(3L, "T3", "d", Task.TaskStatus.IN_PROGRESS, 12L, 200L, LocalDateTime.now(), LocalDateTime.now());
        List<Task> tasks = Arrays.asList(t1, t2, t3);

        when(taskRepository.findByProjectId(200L)).thenReturn(tasks);

        ProjectStatusChangedEvent evt = new ProjectStatusChangedEvent();
        evt.setProjectId(200L);
        evt.setOldStatus("ACTIVE");
        evt.setNewStatus("ARCHIVED");

        listener.onProjectStatusChanged(evt);

        ArgumentCaptor<List<Task>> captor = ArgumentCaptor.forClass((Class) List.class);
        verify(taskRepository, times(1)).saveAll(captor.capture());

        List<Task> saved = captor.getValue();
        // t1 and t3 should be CANCELLED, t2 remains COMPLETED
        assertEquals(Task.TaskStatus.CANCELLED, saved.get(0).getStatus());
        assertEquals(Task.TaskStatus.COMPLETED, saved.get(1).getStatus());
        assertEquals(Task.TaskStatus.CANCELLED, saved.get(2).getStatus());
        verify(taskHistoryRepository, atLeastOnce()).save(any());
        verify(taskEventPublisher, atLeastOnce()).publishTaskStatusChangedEvent(anyLong(), anyLong(), any(), any(), anyLong());
    }
}
