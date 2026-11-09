# Estructura de Diapositivas para la Sustentación Final (15 Diapositivas)

**Proyecto:** DocuProcess Cloud — Plataforma SaaS con Observabilidad Integral y Despliegue Progresivo  
**Asignatura:** Plataformas II — Universidad ICESI  
**Expositores:** Santiago Gómez Robledo & Valeria Ortiz  
**Tiempo Total Estimado:** 15 Minutos (10 min exposición teórica + 4 min demostración en vivo + 1 min conclusiones y preguntas)  
**Entorno de Despliegue:** Kubernetes v1.32.0 (Minikube v1.39.0 sobre Containerd, 8 vCPUs, 14 GiB RAM)  

---

### Diapositiva 1: Portada & Presentación Ejecutiva
- **Título:** DocuProcess Cloud: Plataforma SaaS Enterprise en Kubernetes Minikube.
- **Subtítulo:** Procesamiento asíncrono y análisis inteligente de documentos e imágenes corporativas.
- **Autores:** Santiago Gómez Robledo & Valeria Ortiz.
- **Curso:** Plataformas II — Departamento de TIC — Universidad ICESI.
- **Propósito:** Demostración práctica de cómo la ingeniería de plataformas sostiene el código, protege la economía del SaaS y garantiza continuidad 24/7.

---

### Diapositiva 2: El Desafío Enterprise y la Oportunidad SaaS
- **El Problema Real:** Cierres mensuales en bancos, aseguradoras y firmas legales donde miles de analistas cargan facturas electrónicas y contratos masivos simultáneamente.
- **El Fallo Tradicional:** Llamadas HTTP síncronas bloquean los hilos del servidor web durante la extracción OCR, generando pantallas congeladas y errores HTTP 504 Gateway Timeout.
- **La Solución:** Desacoplar la ingesta del cómputo pesado mediante un pipeline cloud-native orientado a eventos.

---

### Diapositiva 3: Propuesta de Valor y Filosofía Cloud-Native
- **Ingesta Inmediata:** Confirmación en tiempo real con código `HTTP 202 Accepted` y un UUID de seguimiento (`tracking_id`) en menos de 50 ms.
- **Cómputo Elástico en Background:** Pools de trabajadores que consumen las tareas asíncronamente y actualizan el estado en base de datos.
- **Arquitectura Multi-Tenant:** Aislamiento de datos corporativos, alta disponibilidad y resiliencia ante picos de demanda.

---

### Diapositiva 4: Topología Kubernetes y Segmentación de Namespaces
- **Separación de Planos:** Distinción estricta entre el Plano de Control (Ingress, DNS, CNI) y el Plano de Datos (Storage, Workloads).
- **Segmentación en 6 Namespaces Dedicados:**
  - `docuprocess-app`: Cargas de trabajo de usuario (React 19 Frontend + Spring Boot 3.5 Backend).
  - `docuprocess-data`: PostgreSQL 17 relacional con almacenamiento persistente PVC.
  - `docuprocess-security`: Keycloak 26 gestionando identidades, clientes OIDC y políticas MFA.
  - `docuprocess-logging`: Stack ELK (Elasticsearch 8.17, Logstash y Kibana).
  - `docuprocess-monitoring`: Prometheus, Alertmanager, OpenTelemetry Collector y Jaeger.
  - `docuprocess-finops`: Kubecost 2.8.7 para monitoreo financiero.
- **Restricción de Diseño:** Despliegue 100% nativo mediante manifiestos declarativos K8s (sin Terraform).

---

### Diapositiva 5: Capa de Aplicación: Frontend React 19 y Backend Java 21
- **Clean Architecture:** Desacoplamiento en 4 capas (Domain, Application, Infrastructure, Presentation).
- **Frontend Moderno:** React 19 + TypeScript + Vite + Tailwind CSS con Dark Mode, diseño responsive y consumo de APIs federadas.
- **Backend Robusto:** Java 21 LTS + Spring Boot 3.5.x empaquetado en imágenes OCI seguras ejecutando con usuario sin privilegios (`UID 10001 non-root`).
- **Telemetría Nativa:** Spring Actuator exponiendo métricas Prometheus y OpenTelemetry SDK en el runtime.

---

### Diapositiva 6: Persistencia Transaccional y StatefulSets
- **Base de Datos:** PostgreSQL 17 desplegado mediante StatefulSet con headless service en el puerto TCP 5432.
- **Almacenamiento Dinámico:** PVC `postgres-data-pvc` de 5 GiB y `docuprocess-storage-pvc` de 10 GiB montado en `/data/storage`.
- **Esquemas Desacoplados:** Bases de datos independientes `docuprocess_db` (negocio) y `keycloak_db` (identidad).
- **Criptografía de Datos:** Extensiones `pgcrypto` y `uuid-ossp` para trazabilidad de auditoría.

---

### Diapositiva 7: Seguridad Perimetral L3/L4: Modelo Zero-Trust
- **Principio de Mínimo Privilegio:** Regla predeterminada `Default Deny` en capas de red L3 y L4.
- **Ingress como Única Puerta de Entrada:** El NGINX Ingress Controller es el único componente autorizado a emitir tráfico hacia el Frontend y Backend.
- **Aislamiento de la Base de Datos:** PostgreSQL solo acepta sockets TCP procedentes de pods con labels `app: docuprocess-backend` o `app.kubernetes.io/name: keycloak`.
- **Bloqueo Lateral:** Todo sondeo de red lateral entre namespaces no explícitamente autorizados es bloqueado por el kernel vía CNI.

---

### Diapositiva 8: Identidad Enterprise Federada y SSO (Keycloak 26)
- **Identidad Moderna:** Implementación de OpenID Connect (OIDC) y OAuth 2.0 con flujo Authorization Code + PKCE.
- **Realm `docuprocess-enterprise`:**
  - Control de Acceso Basado en Roles (**RBAC**): `TENANT_ADMIN`, `DOCUMENT_OPERATOR`, `AUDITOR`.
  - **MFA Obligatorio:** Segundo factor de autenticación mediante Time-Based One-Time Password (TOTP).
  - **Brute-Force Shield:** Detección y bloqueo automático de ataques de fuerza bruta.
- **Validación Criptográfica:** El backend valida tokens JWT en memoria mediante firmas asimétricas RSA sin sobrecargar la base de datos.

---

### Diapositiva 9: Observabilidad de Aplicación: Modelo RED
- **Rate (Tasa):** Peticiones por segundo clasificadas en tiempo real por versión de backend (Stable vs Canary).
- **Errors (Errores):** Tasa de respuestas HTTP 4xx y 5xx con regla de alerta crítica en Alertmanager ante fallos $> 2\%$.
- **Duration (Latencia):** Tiempo de respuesta del procesamiento asíncrono con percentiles $P_{50}, P_{95}$ y $P_{99}$ (alerta crítica si $P_{99} > 2.5\text{s}$).

---

### Diapositiva 10: Observabilidad de Infraestructura: Modelo USE
- **Utilization (Utilización):** Consumo de CPU y memoria de nodos y pods extraído de cAdvisor.
- **Saturation (Saturación):** Profundidad de colas de procesamiento y presión de memoria cgroups.
- **Errors (Errores de Sistema):** Conteo de reinicios de contenedores, fallos de montaje de PVCs y eventos OOMKilled.
- **Alertas Proactivas:** Notificaciones automáticas de Alertmanager si la CPU del nodo supera el 85%.

---

### Diapositiva 11: Trazabilidad Distribuida E2E y Correlación de Logs
- **Stack ELK:** Logstash recibiendo logs JSON estructurados por TCP 5000, Elasticsearch 8.17 indexando por fecha y Kibana para filtrado visual.
- **OpenTelemetry Collector:** Pipelines desacoplados de Receivers (OTLP gRPC 4317 y HTTP 4318), Processors (batch, memory limiter) y Exporters hacia Jaeger.
- **Correlación Distribuida:** Un log en Kibana contiene el `traceId` que abre exactamente el span de ejecución en Jaeger All-in-One.

---

### Diapositiva 12: Elasticidad Automática con HPA v2
- **Formulación Matemática del Escalado:**
  $$\text{Replicas Deseadas} = \left\lceil \text{Replicas Actuales} \times \left( \frac{\text{Métrica Actual}}{\text{Métrica Objetivo}} \right) \right\rceil$$
- **Parámetros Operativos:**
  - Rango elástico de 2 a 8 réplicas en `docuprocess-backend-stable`.
  - Umbral de activación al 70% de utilización de CPU.
  - Ventana de estabilización (*stabilization window*) de 180 segundos para eliminar el aleteo (*flapping*).

---

### Diapositiva 13: Gobierno Financiero y FinOps con Kubecost
- **Atribución de Costos en Tiempo Real:** Desglose del gasto de infraestructura por Namespace, Deployment y Pod.
- **Optimización de Recursos:** Detección de sobre-aprovisionamiento para ajustar requests y limits de memoria.
- **Unit Economics (Economía Unitaria):** Costo computacional marginal calculado en **$0.0014 USD** por documento procesado, garantizando márgenes de rentabilidad superiores al 75%.

---

### Diapositiva 14: Despliegue Progresivo: Estrategia Canary Deployment
- **Mitigación de Riesgo:** Eliminación de los despliegues "Big Bang" de reemplazo total.
- **Ponderación en Ingress:** NGINX enruta 90% a la versión Stable (`v1.0.0`) y 10% a la versión Canary (`v2.0.0`).
- **Enrutamiento por Cabecera:** Cabecera `X-Canary-Test: always` para pruebas deterministas del equipo de QA.
- **Rollback Instantáneo:** Reversión a 0% de tráfico y 0 réplicas del Canary en 2 segundos ante anomalías.

---

### Diapositiva 15: Validación Operativa (Live Demo) y Conclusiones
- **Demostración en Vivo:**
  1. Login SSO en Keycloak con usuario enterprise `srobledo`.
  2. Ingesta asíncrona en React 19 y retorno HTTP 202 con `tracking_id`.
  3. Visualización de logs en tiempo real en Kibana con correlación `traceId`.
  4. Inspección del árbol de spans en Jaeger.
  5. Monitoreo en vivo de los paneles RED y USE en Grafana.
  6. Inyección de carga y escalado dinámico con HPA.
  7. Ejecución de `./scripts/e2e-validate.sh` (8/8 DoD Cumplido al 100%).
- **Conclusiones:** La ingeniería de plataformas moderna cierra la brecha entre el código de software y la viabilidad económica del negocio.
