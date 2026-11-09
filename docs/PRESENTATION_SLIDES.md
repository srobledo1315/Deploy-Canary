# Estructura de Diapositivas para la Sustentación Final
**Proyecto:** DocuProcess Cloud — Plataforma SaaS con Observabilidad Integral y Despliegue Progresivo  
**Asignatura:** Plataformas II — Universidad ICESI  
**Expositores:** Santiago Gómez Robledo & Valeria Ortiz  
**Tiempo Estimado:** 15 - 20 minutos (10 min presentación + 5-10 min demo en vivo)  

---

### Diapositiva 1: Portada & Presentación Ejecutiva
- **Título:** DocuProcess Cloud: Plataforma SaaS Enterprise con Observabilidad Integral, FinOps y Despliegue Canary en Kubernetes.
- **Subtítulo:** Caso de estudio para procesamiento asíncrono de documentos e imágenes corporativas.
- **Autores:** Santiago Gómez Robledo & Valeria Ortiz.
- **Curso:** Plataformas II — Departamento de TIC — Universidad ICESI.
- **Punto Clave:** Demostración práctica de cómo la infraestructura moderna no solo sostiene el código, sino que protege la economía del negocio y garantiza continuidad 24/7.

---

### Diapositiva 2: El Caso de Negocio SaaS y el Desafío de Crecimiento
- **El Problema:** Clientes enterprise (bancos, aseguradoras, firmas legales) cargan miles de facturas y contratos pesados en horarios pico. Un procesamiento síncrono bloquea el navegador y satura servidores.
- **Nuestra Solución:** Arquitectura orientada a eventos asíncronos (`HTTP 202 Accepted`) con pool de hilos y almacenamiento distribuido.
- **Requisitos Críticos:**
  1. Aislamiento estricto de datos corporativos (Zero Trust).
  2. Identidad enterprise federada (Keycloak SSO con MFA).
  3. Observabilidad con impacto de negocio (no solo mirar CPU, sino saber cuántos documentos y dólares se procesan).
  4. Actualizaciones continuas sin interrumpir el servicio (Canary Deployments).

---

### Diapositiva 3: Arquitectura Técnica y Separación de Planos
- **Plano de Control vs Plano de Datos:** Explicación del diagrama arquitectónico.
- **Segmentación por Namespaces:**
  - `docuprocess-app`: Cargas de trabajo de usuario (React 19 Frontend + Spring Boot 3.5 Backend).
  - `docuprocess-data`: PostgreSQL 17 relacional con inicialización automatizada.
  - `docuprocess-security`: Keycloak 26 gestionando realms, clientes OIDC y políticas MFA.
  - `docuprocess-logging`: Stack ELK (Elasticsearch, Logstash, Kibana) para registros estructurados.
  - `docuprocess-monitoring`: Prometheus, Alertmanager, Jaeger All-in-One y OpenTelemetry Collector.
  - `docuprocess-finops`: Kubecost para atribución financiera por tenant.
- **Restricción de Diseño:** Despliegue 100% nativo mediante manifiestos declarativos de Kubernetes (sin Terraform).

---

### Diapositiva 4: Seguridad y Aislamiento de Red L3/L4 (Network Policies)
- **Zero Trust en Kubernetes:** Política predeterminada *Default Deny* en los namespaces de aplicación y datos.
- **Flujo de Tráfico Permitido:**
  - El Ingress Controller es el único punto de entrada autorizado hacia el Frontend y Backend.
  - La base de datos PostgreSQL **solo** acepta tráfico en el puerto TCP 5432 procedente de pods etiquetados `app: docuprocess-backend` y `app.kubernetes.io/name: keycloak`.
  - Se bloquea cualquier intento de sondeo lateral desde pods no autorizados o namespaces vecinos.

---

### Diapositiva 5: Identidad Enterprise & SSO (Keycloak 26)
- **Más allá de usuario y contraseña:** Implementación de OpenID Connect (OIDC) y OAuth 2.0.
- **Realm `docuprocess-enterprise`:**
  - Control de Acceso Basado en Roles (**RBAC**): `TENANT_ADMIN`, `DOCUMENT_OPERATOR`, `AUDITOR`.
  - Políticas de autenticación robusta: Protección contra ataques de fuerza bruta, políticas de contraseñas y doble factor de autenticación (TOTP).
  - Integración PKCE en el Frontend React y validación criptográfica de tokens JWT en el Backend sin compartir credenciales de base de datos.

---

### Diapositiva 6: Modelo de Observabilidad Multinivel: RED y USE
- **Modelo RED (Orientado a Aplicación y Clientes):**
  - **Rate:** Tasa de peticiones por segundo dividida por versión (Stable vs Canary).
  - **Errors:** Tasa de fallos HTTP 4xx y 5xx con umbral crítico $< 2\%$.
  - **Duration:** Latencia de procesamiento asíncrono con percentiles $P_{50}, P_{95}$ y $P_{99}$.
- **Modelo USE (Orientado a Infraestructura):**
  - **Utilization:** Uso de CPU y memoria de nodos y contenedores.
  - **Saturation:** Colas de procesamiento y presión de memoria cgroups.
  - **Errors:** Eventos de reinicio de pods y fallos de I/O en volúmenes persistentes (PVCs).
- **Correlación Unificada:** Un log en Kibana contiene el `traceId` que abre exactamente el flujo de ejecución en Jaeger.

---

### Diapositiva 7: Elasticidad Automática (Horizontal Pod Autoscaler - HPA v2)
- **Formulación Matemática del Escalado:**
  $$\text{Replicas Deseadas} = \left\lceil \text{Replicas Actuales} \times \left( \frac{\text{Métrica Actual}}{\text{Métrica Objetivo}} \right) \right\rceil$$
- **Configuración Práctica:**
  - Mínimo 2 réplicas, máximo 8 réplicas.
  - Escalado rápido ante picos de procesamiento de fin de mes o fechas críticas (target: 70% CPU).
  - Ventana de enfriamiento (*stabilization window*) de 180 segundos para evitar aleteo (*flapping*) y consumo innecesario de recursos.

---

### Diapositiva 8: FinOps y Gestión de Costos en Kubernetes (Kubecost)
- **El reto económico del SaaS:** ¿Cuánto nos cuesta cada cliente y cada documento procesado?
- **Implementación de Kubecost 2.8.7:**
  - Asignación de costos en tiempo real por Namespace, Deployment y Pod.
  - Detección de recursos ociosos o sobre-dimensionados.
  - Estimación de costo computacional por factura procesada, permitiendo proyectar márgenes brutos de rentabilidad para la startup.

---

### Diapositiva 9: Despliegue Progresivo: Canary Deployment en Acción
- **La Estrategia de Lanzamiento:** Evitar el riesgo de actualizaciones "Big Bang".
- **Enrutamiento por NGINX Ingress:**
  - Versión Base Estable (`v1.0.0`): 90% del tráfico enterprise.
  - Versión Canary (`v2.0.0`): 10% del tráfico evaluado en producción.
  - Cabecera de control `X-Canary-Test: always` para pruebas dirigidas por el equipo de QA.
- **Validación Estadística:** Demostración con 100 peticiones en vivo donde el ratio se mantiene matemáticamente sin caída de paquetes.

---

### Diapositiva 10: Demostración en Vivo (Live Demo)
1. Carga de un documento en el Frontend React 19 (Modo Oscuro, responsive).
2. Verificación del log estructurado en Kibana (con campos `tenantId`, `traceId`, `durationMs`).
3. Inspección del trace distribuido en Jaeger.
4. Consulta del Dashboard Ejecutivo Unificado en Grafana.
5. Inyección de lote de carga y verificación del HPA escalando pods.
6. Demostración del script de auditoría `./scripts/e2e-validate.sh` (8/8 DoD Cumplido).

---

### Diapositiva 11: Conclusiones y Lecciones Aprendidas
- La observabilidad no es instalar herramientas, es correlacionar métricas técnicas con valor de negocio.
- Los Canary Deployments mitigan el riesgo operativo al limitar el radio de impacto de fallos a solo un 10% de la carga.
- La gestión de costos (FinOps) es indispensable para la viabilidad financiera de cualquier plataforma SaaS moderna.

