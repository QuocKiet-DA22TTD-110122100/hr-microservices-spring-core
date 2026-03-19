package com.thuctap2026.auth.iam.repository;

import com.thuctap2026.auth.iam.entity.UserPasswordHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface UserPasswordHistoryRepository extends JpaRepository<UserPasswordHistory, UUID> {

    List<UserPasswordHistory> findTop3ByUserIdOrderByCreatedAtDesc(UUID userId);
}
