package com.hrservice.task.service.adapter;

import com.hrservice.task.config.TaskNotificationProperties;
import com.hrservice.task.event.TaskNotificationEvent;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class EmailNotificationAdapterTest {

    @Test
    void shouldSendEmailToResolvedAddress() {
        JavaMailSender mailSender = mock(JavaMailSender.class);

        TaskNotificationProperties props = new TaskNotificationProperties();
        props.setEmailFrom("no-reply@company.com");
        props.setAssigneeDomain("company.com");
        props.setAssigneeEmailMap(java.util.Map.of("55", "user55@company.com"));

        AssigneeEmailResolver resolver = new ConfigurableAssigneeEmailResolver(props);
        EmailNotificationAdapter adapter = new EmailNotificationAdapter(mailSender, resolver, props);

        TaskNotificationEvent evt = new TaskNotificationEvent();
        evt.setTaskId(999L);
        evt.setAssigneeId(55L);
        evt.setMessage("Project paused");

        adapter.send(evt, 10L);

        ArgumentCaptor<SimpleMailMessage> captor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender, times(1)).send(captor.capture());
        SimpleMailMessage msg = captor.getValue();
        assertThat(msg.getFrom()).isEqualTo("no-reply@company.com");
        assertThat(msg.getTo()).containsExactly("user55@company.com");
        assertThat(msg.getSubject()).contains("999");
    }
}
