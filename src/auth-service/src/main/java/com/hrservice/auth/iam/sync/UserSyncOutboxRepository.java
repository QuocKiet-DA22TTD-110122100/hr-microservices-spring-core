package com.hrservice.auth.iam.sync;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserSyncOutboxRepository extends JpaRepository<UserSyncOutbox, UUID> {

    Optional<UserSyncOutbox> findTopByUserIdOrderByCreatedAtDesc(UUID userId);

    @Query("""
        select o from UserSyncOutbox o
        where (o.status = com.hrservice.auth.iam.sync.UserSyncStatus.PENDING
            or o.status = com.hrservice.auth.iam.sync.UserSyncStatus.RETRYING)
          and o.nextRetryAt <= :now
        order by o.createdAt asc
        """)
    List<UserSyncOutbox> findReadyForSync(@Param("now") Instant now, Pageable pageable);
}
