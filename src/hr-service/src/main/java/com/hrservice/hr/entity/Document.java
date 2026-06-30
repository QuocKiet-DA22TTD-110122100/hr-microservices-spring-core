package com.hrservice.hr.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "documents")
public class Document {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "file_name", nullable = false, length = 500)
    private String fileName;

    @Column(name = "file_type", length = 200)
    private String fileType;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "department_id")
    private Long departmentId;

    @Column(name = "uploaded_by", length = 200)
    private String uploadedBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Lob
    @Column(name = "file_data", nullable = false, columnDefinition = "LONGBLOB")
    @Basic(fetch = FetchType.LAZY)
    private byte[] fileData;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }

    public Long getId() { return id; }
    public String getFileName() { return fileName; }
    public String getFileType() { return fileType; }
    public Long getFileSize() { return fileSize; }
    public Long getDepartmentId() { return departmentId; }
    public String getUploadedBy() { return uploadedBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public byte[] getFileData() { return fileData; }

    public void setId(Long id) { this.id = id; }
    public void setFileName(String fileName) { this.fileName = fileName; }
    public void setFileType(String fileType) { this.fileType = fileType; }
    public void setFileSize(Long fileSize) { this.fileSize = fileSize; }
    public void setDepartmentId(Long departmentId) { this.departmentId = departmentId; }
    public void setUploadedBy(String uploadedBy) { this.uploadedBy = uploadedBy; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setFileData(byte[] fileData) { this.fileData = fileData; }
}
