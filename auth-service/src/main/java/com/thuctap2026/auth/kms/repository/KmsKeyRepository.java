package com.thuctap2026.auth.kms.repository;

import com.thuctap2026.auth.kms.entity.KmsKey;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface KmsKeyRepository extends JpaRepository<KmsKey, UUID> {

	List<KmsKey> findAllByStatus(KmsKey.Status status);

	Optional<KmsKey> findFirstByStatus(KmsKey.Status status);
}
