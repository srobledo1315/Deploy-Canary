package com.docuprocess.presentation.controller;

import com.docuprocess.application.service.DocumentProcessingService;
import com.docuprocess.domain.model.DocumentTask;
import com.docuprocess.domain.model.DocumentType;
import com.docuprocess.presentation.dto.DocumentResponse;
import com.docuprocess.presentation.dto.WorkloadRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/simulate")
@Tag(name = "Simulation & Load Testing", description = "Endpoints para inyección de carga sintética, prueba de HPA y generación de métricas RED/USE")
public class SimulateTrafficController {

    private final DocumentProcessingService processingService;
    private final String appVersion;

    public SimulateTrafficController(DocumentProcessingService processingService,
                                     @Value("${docuprocess.version:1.0.0}") String appVersion) {
        this.processingService = processingService;
        this.appVersion = appVersion;
    }

    @PostMapping("/workload")
    @Operation(summary = "Inyectar lote de documentos para prueba de carga y HPA",
            description = "Genera N tareas sintéticas de procesamiento asíncrono para saturar CPU y disparar autoescalado.")
    public ResponseEntity<Map<String, Object>> injectWorkload(@Valid @RequestBody WorkloadRequest request) {
        List<DocumentResponse> generated = new ArrayList<>();
        int count = request.totalDocuments();

        for (int i = 0; i < count; i++) {
            String filename = "simulated_batch_" + request.documentType() + "_" + (i + 1) + ".pdf";
            DocumentTask task = processingService.createSyntheticTask(
                    filename,
                    request.documentType(),
                    request.tenantId(),
                    request.simulatedDurationMs()
            );
            generated.add(DocumentResponse.from(task));
        }

        return ResponseEntity.status(HttpStatus.ACCEPTED).body(Map.of(
                "message", "Batch workload injected successfully",
                "injectedCount", count,
                "tenantId", request.tenantId(),
                "simulatedDurationPerDocMs", request.simulatedDurationMs(),
                "backendVersion", appVersion,
                "sampleTaskId", generated.isEmpty() ? null : generated.get(0).id()
        ));
    }

    @GetMapping("/cpu-spike")
    @Operation(summary = "Generar pico de cómputo transitorio",
            description = "Ejecuta cálculos matemáticos iterativos durante N milisegundos para evaluar HPA.")
    public ResponseEntity<Map<String, Object>> triggerCpuSpike(
            @RequestParam(defaultValue = "1500") int durationMs) {
        long end = System.currentTimeMillis() + durationMs;
        double result = 0;
        while (System.currentTimeMillis() < end) {
            result += Math.sqrt(Math.random()) * Math.sin(Math.random());
        }
        return ResponseEntity.ok(Map.of(
                "status", "CPU spike simulated",
                "durationMs", durationMs,
                "calcHash", Double.toHexString(result),
                "backendVersion", appVersion
        ));
    }
}
