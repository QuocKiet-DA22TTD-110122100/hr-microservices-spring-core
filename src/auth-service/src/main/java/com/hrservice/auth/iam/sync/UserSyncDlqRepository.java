package com.hrservice.auth.iam.sync;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface UserSyncDlqRepository extends JpaRepository<UserSyncDlq, UUID> {
}
