package com.docuprocess.domain.repository;

import com.docuprocess.domain.model.DocumentStatus;
import com.docuprocess.domain.model.DocumentTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DocumentTaskRepository extends JpaRepository<DocumentTask, UUID> {
    List<DocumentTask> findByTenantIdOrderByCreatedAtDesc(String tenantId);
    List<DocumentTask> findByStatus(DocumentStatus status);
    long countByTenantId(String tenantId);
    long countByStatus(DocumentStatus status);
}
