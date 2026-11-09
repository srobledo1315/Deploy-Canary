# DocuProcess Cloud — Manual Técnico y Runbook de Operaciones
**Curso:** Plataformas II — Universidad ICESI  
**Autores:** Equipo de Infraestructura y DevOps (Santiago Gómez Robledo & Valeria Ortiz)  
**Entorno:** Kubernetes v1.32.0 (Minikube v1.39.0 Engine)  
**Estrategia:** Despliegue Progresivo Canary (NGINX Ingress) sin Terraform  

---

## 1. Arquitectura del Sistema y Mapeo de Red

DocuProcess Cloud es una plataforma SaaS de procesamiento asíncrono y análisis de documentos e imágenes corporativas, basada en microservicios desacoplados con aislamiento perimetral estricto (Zero Trust mediante NetworkPolicies) y observabilidad basada en los modelos **USE** (Infraestructura) y **RED** (Aplicación).

```mermaid
flowchart TD
    Client["Cliente Enterprise / Web Browser"] --> Ingress["NGINX Ingress Controller\n(Minikube IP: 192.168.49.2)"]

    subgraph AppNS["Namespace: docuprocess-app"]
        Frontend["docuprocess-frontend\nReact 19 + Vite (Port 80)"]
        BackendV1["docuprocess-backend-stable\nSpring Boot 3.5 (v1.0.0, 90% Tráfico)"]
        BackendV2["docuprocess-backend-canary\nSpring Boot 3.5 (v2.0.0, 10% Tráfico)"]
        PVC_Store[("docuprocess-storage-pvc\n(10Gi /data/storage)")]
    end

    subgraph DataNS["Namespace: docuprocess-data"]
        Postgres[("PostgreSQL 17 Stateful\n(docuprocess_db + keycloak_db)")]
        PVC_PG[("postgres-data-pvc\n(5Gi)")]
    end

    subgraph SecNS["Namespace: docuprocess-security"]
        Keycloak["Keycloak 26 SSO\n(Realm: docuprocess-enterprise)"]
    end

    subgraph LoggingNS["Namespace: docuprocess-logging"]
        ES[("Elasticsearch 8.17\n(docuprocess-logs-*)")]
        Logstash["Logstash Pipeline\n(TCP 5000 / Beats 5044)"]
        Kibana["Kibana Dashboard (5601)"]
    end

    subgraph ObsNS["Namespace: docuprocess-monitoring"]
        Prometheus["Prometheus v3.2 (9090)"]
        Grafana["Grafana Unified (3000)"]
        Jaeger["Jaeger All-in-One (16686)"]
        OTel["OTel Collector (4317/4318)"]
        Alerts["Alertmanager (9093)"]
    end

    subgraph FinNS["Namespace: docuprocess-finops"]
        Kubecost["Kubecost 2.8.7\n(Cost Analyzer 9090)"]
    end

    %% Enrutamiento Ingress
    Ingress -->|app.docuprocess.local| Frontend
    Ingress -->|api.docuprocess.local (90%)| BackendV1
    Ingress -->|api.docuprocess.local (10% Canary)| BackendV2
    Ingress -->|auth.docuprocess.local| Keycloak
    Ingress -->|grafana.docuprocess.local| Grafana
    Ingress -->|kibana.docuprocess.local| Kibana
    Ingress -->|jaeger.docuprocess.local| Jaeger
    Ingress -->|kubecost.docuprocess.local| Kubecost

    %% Dependencias de Datos
    BackendV1 --> Postgres
    BackendV2 --> Postgres
    BackendV1 --> PVC_Store
    BackendV2 --> PVC_Store

    %% Telemetría
    BackendV1 -.->|Logs JSON| Logstash
    BackendV2 -.->|Logs JSON| Logstash
    Logstash -.-> ES
    ES -.-> Kibana
    BackendV1 -.->|Traces OTLP| OTel
    BackendV2 -.->|Traces OTLP| OTel
    OTel -.-> Jaeger
    BackendV1 -.->|Metrics RED| Prometheus
    BackendV2 -.->|Metrics RED| Prometheus
    Prometheus -.-> Grafana
    Prometheus -.-> Alerts
```

---

## 2. Resolución de Nombres Locales (`/etc/hosts`)

Para acceder a todos los servicios web desde el navegador del host físico, mapee la IP de Minikube en `/etc/hosts`:

```bash
# Obtener IP del clúster Minikube
MINIKUBE_IP=$(minikube ip)

# Agregar entradas al archivo /etc/hosts (ejecutar con sudo):
sudo bash -c "echo '${MINIKUBE_IP} app.docuprocess.local api.docuprocess.local auth.docuprocess.local grafana.docuprocess.local kibana.docuprocess.local jaeger.docuprocess.local kubecost.docuprocess.local' >> /etc/hosts"
```

| URL de Acceso | Servicio y Capa | Credenciales Predeterminadas |
| :--- | :--- | :--- |
| `http://app.docuprocess.local` | Portal Frontend SaaS (React 19) | Autenticación SSO Keycloak |
| `http://api.docuprocess.local/swagger-ui/index.html` | OpenAPI 3 / Swagger Docs | Acceso Público / Bearer Auth |
| `http://auth.docuprocess.local` | Keycloak 26 Admin Console | `admin` / `DocuAdminSecure2026!` |
| `http://grafana.docuprocess.local` | Grafana Unified Dashboard | `admin` / `DocuGrafanaSecure2026!` |
| `http://kibana.docuprocess.local` | Kibana Logs Explorer | Acceso directo / Sin password |
| `http://jaeger.docuprocess.local` | Jaeger Distributed Tracing | Acceso directo |
| `http://kubecost.docuprocess.local` | Kubecost FinOps Dashboard | Acceso directo |

---

## 3. Comandos de Operación y Validación

### 3.1. Auditoría Automatizada del Definition of Done (DoD)
Ejecute la suite completa de 8 validaciones de punta a punta:
```bash
./scripts/e2e-validate.sh
```

### 3.2. Prueba de Despliegue Progresivo Canary (90/10)
Envíe 100 peticiones para medir el ratio de división de tráfico por NGINX Ingress:
```bash
./scripts/verify-canary.sh 100
```
Para forzar tráfico a la versión Canary (v2.0.0) mediante encabezado:
```bash
curl -H "Host: api.docuprocess.local" -H "X-Canary-Test: always" http://$(minikube ip)/api/v1/documents/version
```

### 3.3. Demostración de Autoescalado HPA
Inyecte carga asíncrona concurrente para forzar la saturación de CPU y observar la duplicación de réplicas en vivo:
```bash
./scripts/test-hpa.sh
```
Monitoreo interactivo del autoescalador:
```bash
kubectl get hpa -n docuprocess-app -w
```

---

## 4. Matriz de Usuarios y Roles en Keycloak 26

El Realm `docuprocess-enterprise` ha sido importado automáticamente con los siguientes perfiles:

| Usuario | Contraseña | Rol Asignado | Alcance de Permisos |
| :--- | :--- | :--- | :--- |
| `admin@docuprocess.com` | `AdminPass2026!` | `TENANT_ADMIN` | Configuración integral, auditoría y gestión de cuotas |
| `operator@docuprocess.com` | `OperatorPass2026!` | `DOCUMENT_OPERATOR` | Carga de archivos, consulta y procesamiento asíncrono |
| `auditor@docuprocess.com` | `AuditorPass2026!` | `AUDITOR` | Vista exclusiva de trazas, métricas y reportes FinOps |

---

## 5. Procedimiento de Rescate y Rollback ante Fallos

Si la versión Canary (v2.0.0) presentara una degradación en la tasa de errores o latencia ($P_{99} > 2.5\text{s}$):
1. **Rollback Inmediato de Tráfico:** Establezca `canary-weight: "0"` en el Ingress:
   ```bash
   kubectl annotate ingress -n docuprocess-app docuprocess-api-canary-ingress nginx.ingress.kubernetes.io/canary-weight="0" --overwrite
   ```
2. **Aislamiento del Pod Canary:** Escale a 0 réplicas el deployment canary:
   ```bash
   kubectl scale deployment -n docuprocess-app docuprocess-backend-canary --replicas=0
   ```
3. El 100% del tráfico enterprise retorna instantáneamente a `docuprocess-backend-stable` sin downtime.

---

## 6. Recursos de Sustentación para la Entrega Final

- **Estructura de Diapositivas:** [`PRESENTATION_SLIDES.md`](file:///home/robledo/Deploy-Canary/docs/PRESENTATION_SLIDES.md)
- **Guion de Exposición para Santiago Gómez Robledo & Valeria Ortiz:** [`GUION_EXPOSICION_SANTIAGO_Y_VALERIA.md`](file:///home/robledo/Deploy-Canary/docs/GUION_EXPOSICION_SANTIAGO_Y_VALERIA.md)
- **Suite de Validación DoD:** [`scripts/e2e-validate.sh`](file:///home/robledo/Deploy-Canary/scripts/e2e-validate.sh)

