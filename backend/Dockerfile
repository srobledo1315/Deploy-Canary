# Stage 1: Build and Unit Test with Maven and Temurin Java 21
FROM maven:3.9.9-eclipse-temurin-21-alpine AS builder
WORKDIR /workspace

# Cache maven dependencies layer
COPY pom.xml .
RUN mvn dependency:go-offline -B || true

# Copy source and build artifact
COPY src ./src
ARG APP_VERSION=1.0.0
RUN mvn clean package -DskipTests=false -Ddocuprocess.version=${APP_VERSION}

# Stage 2: Hardened Runtime Container (Non-root, minimal surface)
FROM eclipse-temurin:21-jre-alpine AS runtime

# Security: Create non-privileged user and group
RUN addgroup -g 10001 docugroup && \
    adduser -u 10001 -G docugroup -s /bin/sh -D docuuser && \
    mkdir -p /data/storage && \
    chown -R docuuser:docugroup /data/storage

WORKDIR /app

# Copy executable jar from builder
COPY --from=builder --chown=docuuser:docugroup /workspace/target/docuprocess-backend-*.jar app.jar

USER 10001:10001

EXPOSE 8080

HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health || exit 1

ENTRYPOINT ["java", \
    "-XX:+UseG1GC", \
    "-XX:MaxRAMPercentage=75.0", \
    "-Djava.security.egd=file:/dev/./urandom", \
    "-jar", "app.jar"]

