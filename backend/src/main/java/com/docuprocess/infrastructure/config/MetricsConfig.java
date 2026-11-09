package com.docuprocess.infrastructure.config;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.atomic.AtomicInteger;

@Configuration
public class MetricsConfig {

    private final MeterRegistry meterRegistry;
    private final String appVersion;
    private final AtomicInteger activeUsersGauge;

    public MetricsConfig(MeterRegistry meterRegistry,
                         @Value("${docuprocess.version:1.0.0}") String appVersion) {
        this.meterRegistry = meterRegistry;
        this.appVersion = appVersion;
        this.activeUsersGauge = meterRegistry.gauge("docuprocess_active_users", new AtomicInteger(12));
    }

    public void incrementDocumentProcessed(String tenant, String type, String status) {
        Counter.builder("docuprocess_documents_total")
                .description("Total number of documents ingested and processed in DocuProcess Cloud")
                .tag("tenant", tenant != null ? tenant : "default")
                .tag("type", type != null ? type : "UNKNOWN")
                .tag("status", status != null ? status : "UNKNOWN")
                .tag("version", appVersion)
                .register(meterRegistry)
                .increment();
    }

    public Timer getProcessingTimer(String type) {
        return Timer.builder("docuprocess_processing_duration_seconds")
                .description("Time taken to process and analyze a document asynchronously")
                .tag("type", type != null ? type : "UNKNOWN")
                .tag("version", appVersion)
                .publishPercentiles(0.5, 0.95, 0.99)
                .register(meterRegistry);
    }

    public void setActiveUsers(int count) {
        if (activeUsersGauge != null) {
            activeUsersGauge.set(count);
        }
    }

    public int getActiveUsers() {
        return activeUsersGauge != null ? activeUsersGauge.get() : 0;
    }
}
