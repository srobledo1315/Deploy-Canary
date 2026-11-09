package com.docuprocess.application.service;

import com.docuprocess.domain.model.DocumentStatus;
import com.docuprocess.domain.model.DocumentTask;
import com.docuprocess.domain.model.DocumentType;
import com.docuprocess.domain.repository.DocumentTaskRepository;
import com.docuprocess.infrastructure.config.MetricsConfig;
import com.docuprocess.infrastructure.storage.FileStorageService;
import io.micrometer.core.instrument.Timer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class DocumentProcessingService {

    private static final Logger log = LoggerFactory.getLogger(DocumentProcessingService.class);

    private final DocumentTaskRepository repository;
    private final FileStorageService storageService;
    private final MetricsConfig metricsConfig;

    public DocumentProcessingService(DocumentTaskRepository repository,
                                   FileStorageService storageService,
                                   MetricsConfig metricsConfig) {
        this.repository = repository;
        this.storageService = storageService;
        this.metricsConfig = metricsConfig;
    }

    public DocumentTask submitDocument(MultipartFile file, DocumentType type, String tenantId) {
        UUID documentId = UUID.randomUUID();
        String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "doc_" + documentId;
        String contentType = file.getContentType() != null ? file.getContentType() : "application/octet-stream";
        long size = file.getSize();

        String storagePath = storageService.store(file, documentId, tenantId);

        DocumentTask task = new DocumentTask(
                documentId,
                originalFilename,
                contentType,
                size,
                tenantId,
                type != null ? type : DocumentType.INVOICE,
                DocumentStatus.QUEUED,
                storagePath
        );

        DocumentTask saved = repository.save(task);
        log.info("Document queued successfully. TaskId: {}, Tenant: {}, Filename: {}", documentId, tenantId, originalFilename);

        // Dispatch async processing
        processAsync(saved.getId(), 400L);

        return saved;
    }

    public DocumentTask createSyntheticTask(String filename, DocumentType type, String tenantId, long simulatedMs) {
        UUID documentId = UUID.randomUUID();
        String storagePath = storageService.storeBytes(
                ("Synthetic document content for task: " + documentId).getBytes(),
                filename,
                documentId,
                tenantId
        );

        DocumentTask task = new DocumentTask(
                documentId,
                filename,
                "application/pdf",
                1024L * ThreadLocalRandom.current().nextInt(50, 2500),
                tenantId,
                type,
                DocumentStatus.QUEUED,
                storagePath
        );

        DocumentTask saved = repository.save(task);
        processAsync(saved.getId(), simulatedMs);
        return saved;
    }

    @Async("documentProcessingExecutor")
    public CompletableFuture<Void> processAsync(UUID taskId, long simulatedMs) {
        long startTime = System.currentTimeMillis();

        Optional<DocumentTask> opt = repository.findById(taskId);
        if (opt.isEmpty()) {
            return CompletableFuture.completedFuture(null);
        }

        DocumentTask task = opt.get();
        task.setStatus(DocumentStatus.PROCESSING);
        repository.save(task);

        MDC.put("documentId", task.getId().toString());
        MDC.put("tenantId", task.getTenantId());
        MDC.put("documentType", task.getDocumentType().name());

        log.info("Starting asynchronous processing for document: {}", task.getId());

        try {
            // Simulate realistic compute workload (OCR, NLP Entity Extraction, Table detection)
            long duration = simulatedMs + ThreadLocalRandom.current().nextLong(50, 300);
            Thread.sleep(duration);

            long elapsed = System.currentTimeMillis() - startTime;
            task.setProcessingDurationMs(elapsed);
            task.setCompletedAt(Instant.now());

            // 98% success, 2% failure simulation for realistic RED error tracking
            boolean isSuccess = ThreadLocalRandom.current().nextInt(100) < 98;
            if (isSuccess) {
                task.setStatus(DocumentStatus.SUCCESS);
                task.setExtractedMetadata(String.format("{\"confidence\":0.978,\"fields\":[\"invoice_number\",\"tax_id\",\"total_amount\"],\"currency\":\"COP\",\"hash\":\"%s\"}", UUID.randomUUID()));
                task.setOcrSummary(String.format("Recognized %d characters across 3 pages. Digital signature verified.", ThreadLocalRandom.current().nextInt(1200, 4500)));
            } else {
                task.setStatus(DocumentStatus.FAILED);
                task.setExtractedMetadata("{\"error\":\"CORRUPTED_STREAM\",\"reason\":\"Unrecognized image encoding\"}");
                task.setOcrSummary("Processing failed during OCR segmentation.");
            }

            repository.save(task);

            // Record metrics
            Timer timer = metricsConfig.getProcessingTimer(task.getDocumentType().name());
            timer.record(elapsed, java.util.concurrent.TimeUnit.MILLISECONDS);
            metricsConfig.incrementDocumentProcessed(task.getTenantId(), task.getDocumentType().name(), task.getStatus().name());

            MDC.put("processingDurationMs", String.valueOf(elapsed));
            log.info("Finished asynchronous processing. Status: {}, Duration: {}ms", task.getStatus(), elapsed);

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.error("Document processing interrupted for taskId: {}", taskId, e);
            task.setStatus(DocumentStatus.FAILED);
            repository.save(task);
        } finally {
            MDC.clear();
        }

        return CompletableFuture.completedFuture(null);
    }

    public Optional<DocumentTask> getTask(UUID taskId) {
        return repository.findById(taskId);
    }

    public List<DocumentTask> listTasks(String tenantId) {
        return repository.findByTenantIdOrderByCreatedAtDesc(tenantId);
    }

    public long countAll() {
        return repository.count();
    }
}

