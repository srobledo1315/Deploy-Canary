package com.docuprocess.application;

import com.docuprocess.application.service.DocumentProcessingService;
import com.docuprocess.domain.model.DocumentStatus;
import com.docuprocess.domain.model.DocumentTask;
import com.docuprocess.domain.model.DocumentType;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
public class DocumentProcessingServiceTest {

    @Autowired
    private DocumentProcessingService processingService;

    @Test
    void testSyntheticTaskCreationAndAsyncExecution() throws InterruptedException {
        String tenantId = "test-tenant-unit";
        DocumentTask task = processingService.createSyntheticTask(
                "invoice_test_101.pdf",
                DocumentType.INVOICE,
                tenantId,
                100L
        );

        assertNotNull(task.getId(), "Document Task ID must be generated");
        assertEquals(tenantId, task.getTenantId());
        assertEquals(DocumentType.INVOICE, task.getDocumentType());

        // Wait for async execution
        Thread.sleep(300);

        List<DocumentTask> tasks = processingService.listTasks(tenantId);
        assertFalse(tasks.isEmpty(), "Tasks list for tenant should not be empty");

        DocumentTask executedTask = tasks.get(0);
        assertTrue(executedTask.getStatus() == DocumentStatus.SUCCESS || executedTask.getStatus() == DocumentStatus.FAILED,
                "Status should transition to SUCCESS or FAILED");
    }
}

