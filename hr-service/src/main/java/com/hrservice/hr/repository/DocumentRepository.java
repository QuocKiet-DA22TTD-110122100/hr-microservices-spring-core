package com.hrservice.hr.repository;

import com.hrservice.hr.entity.Document;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface DocumentRepository extends JpaRepository<Document, Long> {

    @Query("SELECT d.id, d.fileName, d.fileType, d.fileSize, d.departmentId, d.uploadedBy, d.createdAt FROM Document d WHERE d.departmentId = :departmentId ORDER BY d.createdAt DESC")
    List<Object[]> findMetaByDepartmentId(Long departmentId);

    List<Document> findByDepartmentIdOrderByCreatedAtDesc(Long departmentId);
}
