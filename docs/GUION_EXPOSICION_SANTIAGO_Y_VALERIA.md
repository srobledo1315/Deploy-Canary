# Guion de Sustentación — DocuProcess Cloud
**Asignatura:** Infraestructura III — Universidad ICESI  
**Integrantes:** Santiago Gómez Robledo & Valeria Ortiz  
**Tiempo Total:** 15 Minutos (10 min Exposición Teórico-Técnica + 5 min Demostración en Vivo)  

---

## Minuto 0:00 - 02:00 | Introducción y Caso de Negocio SaaS (Valeria Ortiz)

> **Valeria:**  
> "Buenas tardes profesor y compañeros. Hoy les presentamos **DocuProcess Cloud**, una plataforma SaaS diseñada para resolver un problema crítico en empresas medianas y grandes: el procesamiento asíncrono y análisis inteligente de grandes volúmenes de documentos, como facturas electrónicas, contratos legales e imágenes de identidad.
> 
> En modelos tradicionales, cuando cientos de usuarios cargan archivos pesados simultáneamente a fin de mes, las aplicaciones monolíticas colapsan, los usuarios experimentan pantallas congeladas y la empresa pierde dinero. DocuProcess Cloud fue concebida bajo una filosofía cloud-native: el usuario recibe una confirmación inmediata mediante un código HTTP 202 Accepted con un ID de seguimiento, mientras pipelines asíncronos en Kubernetes procesan, extraen metadatos OCR y notifican el resultado.
> 
> Pero para que una startup SaaS sobreviva, el código no basta. Necesitamos tres pilares fundamentales:
> 1. **Seguridad e Identidad Enterprise**, garantizando autenticación federada y control de accesos.
> 2. **Observabilidad Integral**, no solo para ver si un servidor se calienta, sino para entender el comportamiento de los clientes y la tasa de éxito de los procesos.
> 3. **Gestión de Costos FinOps**, para saber exactamente cuánto nos cuesta procesar cada documento en la nube.
> 
> A continuación, mi compañero Santiago explicará cómo diseñamos la arquitectura y la separación de capas en Kubernetes."

---

## Minuto 02:00 - 04:30 | Arquitectura K8s, Aislamiento y Redes L3/L4 (Santiago Gómez Robledo)

> **Santiago:**  
> "Gracias Valeria. Para garantizar alta disponibilidad, aislamiento y portabilidad, desplegamos DocuProcess Cloud sobre un clúster local de Kubernetes Minikube v1.39.0 utilizando únicamente manifiestos declarativos nativos, sin depender de Terraform.
> 
> Diseñamos una estricta separación de **Plano de Control** y **Plano de Datos** distribuida en 6 espacios de nombres lógicos:
> - `docuprocess-app`, donde residen el Frontend en React 19 y dos despliegues del Backend en Java 21 y Spring Boot 3.5.
> - `docuprocess-data`, alojando PostgreSQL 17 con persistencia respaldada por PersistentVolumeClaims de 5 GiB.
> - `docuprocess-security`, con Keycloak 26 gestionando la identidad.
> - `docuprocess-logging`, con el stack ELK completo: Elasticsearch, Logstash y Kibana.
> - `docuprocess-monitoring`, agrupando Prometheus, Alertmanager, Jaeger y OpenTelemetry Collector.
> - Y finalmente `docuprocess-finops`, con Kubecost.
> 
> En términos de seguridad de red en los niveles L3 y L4 del modelo OSI, aplicamos el principio de **Privilegio Mínimo** y **Zero Trust** mediante **Network Policies**. Por defecto, implementamos un *Default Deny* que bloquea todo el tráfico cruzado. Por ejemplo, la base de datos PostgreSQL en el puerto TCP 5432 solo acepta conexiones procedentes exclusivamente de los pods etiquetados como backend y Keycloak. Ningún pod de otro namespace o intruso en la red puede establecer sockets directos hacia la base de datos."

---

## Minuto 04:30 - 06:30 | Identidad Enterprise SSO y Control de Roles (Valeria Ortiz)

> **Valeria:**  
> "En el ámbito de la seguridad de aplicación, los clientes corporativos exigen ir más allá de un simple usuario y contraseña. Implementamos **Keycloak 26** como proveedor de identidad federado mediante el protocolo OpenID Connect (OIDC).
> 
> Creamos el Realm corporativo `docuprocess-enterprise` con Control de Acceso Basado en Roles (RBAC), definiendo tres perfiles principales:
> - `TENANT_ADMIN`: Administrador empresarial con acceso a métricas globales, cuotas y auditoría.
> - `DOCUMENT_OPERATOR`: Usuario operativo que sube documentos y consulta resultados.
> - `AUDITOR`: Perfil de solo lectura con acceso a las trazas y reportes de facturación.
> 
> Además, activamos políticas de mitigación contra ataques de fuerza bruta con bloqueos progresivos, obligatoriedad de autenticación multifactor (MFA por TOTP) y tokens JWT firmados mediante llaves criptográficas asimétricas. El Backend valida estos tokens en tiempo de ejecución consultando las llaves públicas de Keycloak mediante JWKS, lo que desacopla la autenticación del código de negocio."

---

## Minuto 06:30 - 09:30 | Observabilidad RED/USE, FinOps y Despliegue Canary (Santiago Gómez Robledo)

> **Santiago:**  
> "Para la observabilidad, implementamos un modelo de telemetría de 4 capas correlacionadas:
> 1. En la capa de infraestructura, aplicamos el **Modelo USE** (Utilización, Saturación y Errores): Prometheus recolecta métricas de cAdvisor para vigilar la CPU, memoria y presión de disco. Alertmanager cuenta con reglas activas si el uso de CPU supera el 85%.
> 2. En la capa de aplicación, aplicamos el **Modelo RED** (Rate, Errors, Duration): Micrometer y Actuator exportan la tasa de peticiones por segundo, la tasa de errores HTTP 5xx y la latencia del procesamiento asíncrono con percentiles $P_{50}, P_{95}$ y $P_{99}$.
> 3. En logging y trazabilidad distribuida, cada petición genera un `traceId` bajo el estándar W3C con OpenTelemetry, el cual viaja al colector OTel y se visualiza en Jaeger. Al mismo tiempo, el Backend despacha logs en formato JSON estructurado hacia Logstash por un socket TCP asíncrono, indexándose en Elasticsearch y haciéndose consultables en Kibana. El mismo `traceId` une el log de Kibana con el span en Jaeger.
> 4. En gobernanza económica, integramos **Kubecost 2.8.7**, permitiéndonos saber en dólares/día cuánto cuesta operar cada pod y proyectar el costo por documento procesado.
> 
> Por último, resolvimos el ciclo de vida de software con un **Canary Deployment**: en lugar de reemplazar la aplicación abruptamente, el NGINX Ingress Controller enruta el 90% del tráfico a la versión estable v1.0.0 y el 10% a la versión Canary v2.0.0. Además, permite a nuestro equipo de QA enviar la cabecera `X-Canary-Test: always` para ser dirigidos directamente a la versión de prueba."

---

## Minuto 09:30 - 14:00 | Demostración en Vivo / Live Demo (Valeria Ortiz & Santiago Gómez Robledo)

> **Valeria:**  
> *(Mostrando el navegador en `http://app.docuprocess.local`)*  
> "Aquí vemos el portal web de DocuProcess Cloud construido en React 19, Vite y TypeScript, con diseño responsive y soporte nativo para Modo Oscuro. Arriba observamos la sesión activa, el rol empresarial y la etiqueta del Backend que nos atendió: en este momento, la versión Estable v1.0.0.
> 
> Procedo a cargar una factura electrónica de prueba. Al darle 'Iniciar Procesamiento', el frontend envía el archivo, recibe inmediatamente el estado `QUEUED`, y en pantalla una barra de progreso refleja la ejecución asíncrona. Una vez completado, el estado pasa a `SUCCESS` con una duración de 380 milisegundos y podemos abrir el JSON con los metadatos y el hash criptográfico del OCR."

> **Santiago:**  
> *(Pasando a la terminal y dashboards)*  
> "Ahora veamos qué ocurrió por debajo en la infraestructura:
> 1. Primero, ejecutamos nuestro script de verificación del Canary: `./scripts/verify-canary.sh 100`. Como pueden observar en pantalla, de 100 peticiones enviadas a `api.docuprocess.local`, exactamente 88 fueron a v1.0.0 y 12 a la versión Canary v2.0.0, con 0% de errores.
> 2. Segundo, pasamos a **Kibana** en `kibana.docuprocess.local`: aquí vemos el índice `docuprocess-logs-*` con los campos estructurados `tenantId`, `documentId` y `processingDurationMs`.
> 3. Tercero, abrimos **Jaeger** en `jaeger.docuprocess.local`: vemos la traza distribuida completa con los spans del controlador y el servicio asíncrono.
> 4. Cuarto, abrimos **Grafana** en `grafana.docuprocess.local`: nuestro Dashboard unificado muestra en tiempo real las métricas de negocio, los percentiles RED de duración y el consumo de CPU.
> 5. Y quinto, ejecutamos nuestra suite de auditoría `./scripts/e2e-validate.sh` que evalúa los 8 criterios del Definition of Done: los 8 puntos pasan en verde con 100% de éxito."

---

## Minuto 14:00 - 15:00 | Conclusiones y Cierre (Valeria Ortiz)

> **Valeria:**  
> "Para concluir, este proyecto demuestra cómo la ingeniería de infraestructura moderna cierra la brecha entre el desarrollo de software y la viabilidad empresarial. No solo logramos una plataforma escalable, segura y observable, sino que dotamos a la organización de herramientas para tomar decisiones basadas en datos de rendimiento y costo.
> 
> Muchas gracias por su atención, quedamos atentos a cualquier pregunta del profesor o de los compañeros."
