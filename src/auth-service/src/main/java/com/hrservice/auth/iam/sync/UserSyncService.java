package com.hrservice.auth.iam.sync;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hrservice.auth.iam.entity.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import java.time.Instant;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Service
public class UserSyncService {

    private static final Logger log = LoggerFactory.getLogger(UserSyncService.class);

    private final UserSyncOutboxRepository outboxRepository;
    private final UserSyncDlqRepository dlqRepository;
    private final ObjectMapper objectMapper;
    private final RestClient hrSyncClient;
    private final String internalSecret;
    private final boolean syncEnabled;
    private final int batchSize;
    private final int maxRetries;
    private final int retryBaseDelaySeconds;

    public UserSyncService(
        UserSyncOutboxRepository outboxRepository,
        UserSyncDlqRepository dlqRepository,
        ObjectMapper objectMapper,
        @Value("${sync.hr.base-url}") String hrSyncBaseUrl,
        @Value("${sync.hr.internal-secret}") String internalSecret,
        @Value("${sync.hr.enabled:true}") boolean syncEnabled,
        @Value("${sync.hr.batch-size:20}") int batchSize,
        @Value("${sync.hr.max-retries:5}") int maxRetries,
        @Value("${sync.hr.retry-base-delay-seconds:10}") int retryBaseDelaySeconds
    ) {
        this.outboxRepository = outboxRepository;
        this.dlqRepository = dlqRepository;
        this.objectMapper = objectMapper;
        this.hrSyncClient = RestClient.builder().baseUrl(Objects.requireNonNull(hrSyncBaseUrl, "hrSyncBaseUrl must not be null")).build();
        this.internalSecret = internalSecret;
        this.syncEnabled = syncEnabled;
        this.batchSize = batchSize;
        this.maxRetries = maxRetries;
        this.retryBaseDelaySeconds = retryBaseDelaySeconds;
    }

    @Transactional
    public void enqueueUserCreated(User user) {
        UserSyncOutbox outbox = new UserSyncOutbox();
        outbox.setEventId(UUID.randomUUID());
        outbox.setUserId(user.getId());
        outbox.setUsername(user.getUsername());
        outbox.setRole(user.getRole());
        outbox.setStatus(UserSyncStatus.PENDING);
        outbox.setRetryCount(0);
        outbox.setMaxRetries(maxRetries);
        outbox.setNextRetryAt(Instant.now());
        outboxRepository.save(outbox);
    }

    @Transactional(readOnly = true)
    public SyncStatusView getSyncStatus(UUID userId) {
        return outboxRepository.findTopByUserIdOrderByCreatedAtDesc(userId)
            .map(this::toView)
            .orElseGet(() -> new SyncStatusView(userId, "NOT_FOUND", 0, null, null));
    }

    @Transactional
    public SyncStatusView retrySync(UUID userId) {
        UserSyncOutbox outbox = outboxRepository.findTopByUserIdOrderByCreatedAtDesc(userId)
            .orElseThrow(() -> new IllegalArgumentException("Sync state not found for userId=" + userId));

        outbox.setStatus(UserSyncStatus.PENDING);
        outbox.setRetryCount(0);
        outbox.setNextRetryAt(Instant.now());
        outbox.setLastError(null);
        outbox.setSyncedAt(null);
        UserSyncOutbox saved = outboxRepository.save(outbox);
        return toView(saved);
    }

    @Transactional
    public void processReadySyncs() {
        if (!syncEnabled) {
            return;
        }

        List<UserSyncOutbox> readyItems = outboxRepository.findReadyForSync(Instant.now(), PageRequest.of(0, batchSize));
        for (UserSyncOutbox outbox : readyItems) {
            processOne(outbox);
        }
    }

    private void processOne(UserSyncOutbox outbox) {
        HrUserSyncRequest payload = new HrUserSyncRequest(
            outbox.getEventId().toString(),
            outbox.getUserId().toString(),
            outbox.getUsername(),
            outbox.getRole(),
            outbox.getRetryCount(),
            outbox.getCreatedAt() == null ? Instant.now().toString() : outbox.getCreatedAt().toString()
        );

        try {
            hrSyncClient.post()
                .uri("/nhan-vien/internal/users/sync")
                .contentType(Objects.requireNonNull(MediaType.APPLICATION_JSON, "contentType must not be null"))
                .header("X-Internal-Secret", internalSecret)
                .body(payload)
                .retrieve()
                .toBodilessEntity();

            outbox.setStatus(UserSyncStatus.SYNCED);
            outbox.setSyncedAt(Instant.now());
            outbox.setLastError(null);
            outboxRepository.save(outbox);
        } catch (Exception ex) {
            int nextRetryCount = outbox.getRetryCount() + 1;
            outbox.setRetryCount(nextRetryCount);
            outbox.setLastError(ex.getMessage());

            if (nextRetryCount >= outbox.getMaxRetries()) {
                outbox.setStatus(UserSyncStatus.FAILED);
                outboxRepository.save(outbox);
                saveToDlq(outbox, payload, ex.getMessage());
                log.error("User sync moved to DLQ for userId={}, reason={}", outbox.getUserId(), ex.getMessage());
                return;
            }

            outbox.setStatus(UserSyncStatus.RETRYING);
            outbox.setNextRetryAt(Instant.now().plusSeconds(calculateBackoffSeconds(nextRetryCount)));
            outboxRepository.save(outbox);
            log.warn("User sync retry scheduled for userId={}, retryCount={}, reason={}", outbox.getUserId(), nextRetryCount, ex.getMessage());
        }
    }

    private long calculateBackoffSeconds(int retryCount) {
        long multiplier = 1L << Math.max(0, retryCount - 1);
        return Math.min(300L, retryBaseDelaySeconds * multiplier);
    }

    private void saveToDlq(UserSyncOutbox outbox, HrUserSyncRequest payload, String reason) {
        UserSyncDlq dlq = new UserSyncDlq();
        dlq.setEventId(outbox.getEventId());
        dlq.setUserId(outbox.getUserId());
        dlq.setUsername(outbox.getUsername());
        dlq.setRole(outbox.getRole());
        dlq.setRetryCount(outbox.getRetryCount());
        dlq.setFailureReason(reason);
        dlq.setPayloadJson(serializePayload(payload));
        dlqRepository.save(dlq);
    }

    private String serializePayload(HrUserSyncRequest payload) {
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException ex) {
            return "{\"error\":\"payload serialization failed\"}";
        }
    }

    private SyncStatusView toView(UserSyncOutbox outbox) {
        return new SyncStatusView(
            outbox.getUserId(),
            outbox.getStatus().name(),
            outbox.getRetryCount(),
            outbox.getLastError(),
            outbox.getUpdatedAt()
        );
    }

    public record SyncStatusView(
        UUID userId,
        String status,
        int retryCount,
        String lastError,
        Instant updatedAt
    ) {
    }

    private record HrUserSyncRequest(
        String eventId,
        String userId,
        String username,
        String role,
        int retryCount,
        String createdAt
    ) {
    }
}
