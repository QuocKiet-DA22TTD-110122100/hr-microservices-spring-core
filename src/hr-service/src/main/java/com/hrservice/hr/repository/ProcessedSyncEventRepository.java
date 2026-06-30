package com.hrservice.hr.repository;

import com.hrservice.hr.entity.ProcessedSyncEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ProcessedSyncEventRepository extends JpaRepository<ProcessedSyncEvent, Long> {

    Optional<ProcessedSyncEvent> findByEventId(String eventId);
}
