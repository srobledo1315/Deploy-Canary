package com.docuprocess.presentation.dto;

import com.docuprocess.domain.model.DocumentType;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public record WorkloadRequest(
        @Min(1) @Max(500) Integer totalDocuments,
        String tenantId,
        DocumentType documentType,
        @Min(50) @Max(5000) Long simulatedDurationMs
) {
    public WorkloadRequest {
        if (totalDocuments == null) totalDocuments = 10;
        if (tenantId == null || tenantId.isBlank()) tenantId = "tenant-enterprise-icesi";
        if (documentType == null) documentType = DocumentType.INVOICE;
        if (simulatedDurationMs == null) simulatedDurationMs = 350L;
    }
}
