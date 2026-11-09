package com.docuprocess.presentation.dto;

import com.docuprocess.domain.model.DocumentStatus;
import com.docuprocess.domain.model.DocumentTask;
import com.docuprocess.domain.model.DocumentType;

import java.time.Instant;
import java.util.UUID;

public record DocumentResponse(
        UUID id,
        String filename,
        String contentType,
        Long fileSize,
        String tenantId,
        DocumentType documentType,
        DocumentStatus status,
        Long processingDurationMs,
        String extractedMetadata,
        String ocrSummary,
        Instant createdAt,
        Instant completedAt
) {
    public static DocumentResponse from(DocumentTask task) {
        return new DocumentResponse(
                task.getId(),
                task.getFilename(),
                task.getContentType(),
                task.getFileSize(),
                task.getTenantId(),
                task.getDocumentType(),
                task.getStatus(),
                task.getProcessingDurationMs(),
                task.getExtractedMetadata(),
                task.getOcrSummary(),
                task.getCreatedAt(),
                task.getCompletedAt()
        );
    }
}

