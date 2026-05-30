package com.hrservice.task.service.adapter;

import com.hrservice.task.config.TaskNotificationProperties;
import com.hrservice.task.event.TaskNotificationEvent;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import software.amazon.awssdk.services.sns.SnsClient;
import software.amazon.awssdk.services.sns.model.PublishRequest;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class SnsNotificationAdapterTest {

    @Test
    void shouldPublishToSnsWhenTopicConfigured() {
        SnsClient snsClient = mock(SnsClient.class);
        TaskNotificationProperties props = new TaskNotificationProperties();
        props.setSnsTopicArn("arn:aws:sns:ap-southeast-1:123456789012:task-topic");

        SnsNotificationAdapter adapter = new SnsNotificationAdapter(snsClient, props);

        TaskNotificationEvent evt = new TaskNotificationEvent();
        evt.setTaskId(100L);
        evt.setAssigneeId(200L);
        evt.setMessage("reassigned");

        adapter.send(evt, 99L);

        ArgumentCaptor<PublishRequest> captor = ArgumentCaptor.forClass(PublishRequest.class);
        verify(snsClient, times(1)).publish(captor.capture());
        PublishRequest req = captor.getValue();
        assertThat(req.topicArn()).isEqualTo("arn:aws:sns:ap-southeast-1:123456789012:task-topic");
        assertThat(req.message()).contains("Task 100 reassigned");
    }

    @Test
    void shouldNotPublishWhenTopicMissing() {
        SnsClient snsClient = mock(SnsClient.class);
        TaskNotificationProperties props = new TaskNotificationProperties();
        props.setSnsTopicArn("");

        SnsNotificationAdapter adapter = new SnsNotificationAdapter(snsClient, props);

        TaskNotificationEvent evt = new TaskNotificationEvent();
        evt.setTaskId(100L);
        evt.setAssigneeId(200L);
        evt.setMessage("reassigned");

        adapter.send(evt, 99L);

        verify(snsClient, never()).publish(any(PublishRequest.class));
    }
}
