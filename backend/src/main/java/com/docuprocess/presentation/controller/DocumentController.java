package com.docuprocess.presentation.controller;

import com.docuprocess.application.service.DocumentProcessingService;
import com.docuprocess.domain.model.DocumentTask;
import com.docuprocess.domain.model.DocumentType;
import com.docuprocess.presentation.dto.DocumentResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/documents")
@Tag(name = "Document Processing API", description = "Endpoints para la ingesta y consulta asíncrona de documentos e imágenes SaaS")
public class DocumentController {

    private final DocumentProcessingService processingService;
    private final String appVersion;

    public DocumentController(DocumentProcessingService processingService,
                              @Value("${docuprocess.version:1.0.0}") String appVersion) {
        this.processingService = processingService;
        this.appVersion = appVersion;
    }

    @PostMapping(value = "/process", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Subir y procesar documento asíncronamente",
            description = "Encola un documento/imagen para extracción y análisis OCR. Retorna HTTP 202 Accepted con el tracking ID.")
    @ApiResponse(responseCode = "202", description = "Documento aceptado y encolado para procesamiento",
            content = @Content(schema = @Schema(implementation = DocumentResponse.class)))
    public ResponseEntity<DocumentResponse> uploadDocument(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "type", defaultValue = "INVOICE") DocumentType type,
            @RequestHeader(value = "X-Enterprise-Tenant", defaultValue = "tenant-enterprise-icesi") String tenantId) {

        DocumentTask task = processingService.submitDocument(file, type, tenantId);
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(DocumentResponse.from(task));
    }

    @GetMapping("/{id}/status")
    @Operation(summary = "Consultar estado de procesamiento",
            description = "Recupera el progreso, metadatos extraídos y resumen OCR del documento.")
    @ApiResponse(responseCode = "200", description = "Estado recuperado exitosamente")
    @ApiResponse(responseCode = "404", description = "Tarea de documento no encontrada")
    public ResponseEntity<DocumentResponse> getStatus(
            @Parameter(description = "UUID de la tarea") @PathVariable UUID id) {
        return processingService.getTask(id)
                .map(task -> ResponseEntity.ok(DocumentResponse.from(task)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping
    @Operation(summary = "Listar documentos del tenant",
            description = "Retorna el historial de documentos procesados para el tenant autenticado.")
    public ResponseEntity<List<DocumentResponse>> listDocuments(
            @RequestHeader(value = "X-Enterprise-Tenant", defaultValue = "tenant-enterprise-icesi") String tenantId) {
        List<DocumentResponse> responses = processingService.listTasks(tenantId)
                .stream()
                .map(DocumentResponse::from)
                .toList();
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/version")
    @Operation(summary = "Versión del microservicio", description = "Informa la versión activa (útil para verificar Canary deployment).")
    public ResponseEntity<Map<String, String>> getVersion() {
        return ResponseEntity.ok(Map.of(
                "service", "docuprocess-backend",
                "version", appVersion,
                "status", "UP"
        ));
    }
}
