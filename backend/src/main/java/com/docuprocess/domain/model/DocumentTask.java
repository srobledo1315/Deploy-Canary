package com.docuprocess.domain.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "document_tasks")
public class DocumentTask {

    @Id
    private UUID id;

    @Column(nullable = false)
    private String filename;

    @Column(nullable = false)
    private String contentType;

    @Column(nullable = false)
    private Long fileSize;

    @Column(nullable = false)
    private String tenantId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DocumentType documentType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DocumentStatus status;

    private Long processingDurationMs;

    @Column(columnDefinition = "TEXT")
    private String extractedMetadata;

    @Column(columnDefinition = "TEXT")
    private String ocrSummary;

    private String storagePath;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    private Instant completedAt;

    public DocumentTask() {
    }

    public DocumentTask(UUID id, String filename, String contentType, Long fileSize, String tenantId,
                        DocumentType documentType, DocumentStatus status, String storagePath) {
        this.id = id;
        this.filename = filename;
        this.contentType = contentType;
        this.fileSize = fileSize;
        this.tenantId = tenantId;
        this.documentType = documentType;
        this.status = status;
        this.storagePath = storagePath;
        this.createdAt = Instant.now();
    }

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getFilename() { return filename; }
    public void setFilename(String filename) { this.filename = filename; }

    public String getContentType() { return contentType; }
    public void setContentType(String contentType) { this.contentType = contentType; }

    public Long getFileSize() { return fileSize; }
    public void setFileSize(Long fileSize) { this.fileSize = fileSize; }

    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }

    public DocumentType getDocumentType() { return documentType; }
    public void setDocumentType(DocumentType documentType) { this.documentType = documentType; }

    public DocumentStatus getStatus() { return status; }
    public void setStatus(DocumentStatus status) { this.status = status; }

    public Long getProcessingDurationMs() { return processingDurationMs; }
    public void setProcessingDurationMs(Long processingDurationMs) { this.processingDurationMs = processingDurationMs; }

    public String getExtractedMetadata() { return extractedMetadata; }
    public void setExtractedMetadata(String extractedMetadata) { this.extractedMetadata = extractedMetadata; }

    public String getOcrSummary() { return ocrSummary; }
    public void setOcrSummary(String ocrSummary) { this.ocrSummary = ocrSummary; }

    public String getStoragePath() { return storagePath; }
    public void setStoragePath(String storagePath) { this.storagePath = storagePath; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getCompletedAt() { return completedAt; }
    public void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }
}
