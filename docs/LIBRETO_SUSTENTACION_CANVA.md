# Libreto Oficial de Sustentación — DocuProcess Cloud (Canva Slides)

**Asignatura:** Plataformas II — Departamento de TIC — Universidad ICESI  
**Autores y Expositores:** Santiago Gómez Robledo & Valeria Ortiz  
**Duración Total:** 15 Minutos (10 minutos de sustentación teórica/arquitectónica + 5 minutos de demostración en vivo)  
**Entorno de Demostración:** Kubernetes v1.32.0 (Minikube v1.39.0 sobre Containerd, 8 vCPUs, 14 GiB RAM)  
**Enlace a la Presentación Oficial en Canva:** [https://canva.link/ei6fwopawpoey6r](https://canva.link/ei6fwopawpoey6r)  
**Enlace Directo de Edición (Canva App):** [https://www.canva.com/d/8M04aX33msDShbP](https://www.canva.com/d/8M04aX33msDShbP)  
**ID del Diseño:** `DAHacpdbq-Y` (11 diapositivas generadas en la cuenta de Santiago Gomez Robledo)  

---

## Estructura Temporal y Distribución de Roles

| Diapositiva | Título de la Diapositiva | Orador Principal | Tiempo Sugerido |
| :---: | :--- | :---: | :---: |
| **1** | Portada y Presentación Ejecutiva | **Santiago & Valeria** | 00:00 - 01:00 |
| **2** | El Caso de Negocio SaaS y el Desafío de Escalamiento | **Valeria Ortiz** | 01:00 - 02:15 |
| **3** | Arquitectura de Microservicios y Segmentación de Red | **Santiago Gómez Robledo** | 02:15 - 03:30 |
| **4** | Seguridad Perimetral L3/L4 y Modelo Zero-Trust | **Santiago Gómez Robledo** | 03:30 - 04:30 |
| **5** | Identidad Enterprise Federada y SSO (Keycloak 26) | **Valeria Ortiz** | 04:30 - 05:45 |
| **6** | Observabilidad Multinivel: Modelos RED y USE | **Valeria Ortiz** | 05:45 - 07:00 |
| **7** | Elasticidad Automática con Horizontal Pod Autoscaler (HPA v2) | **Santiago Gómez Robledo** | 07:00 - 08:00 |
| **8** | Gobierno Financiero FinOps con Kubecost | **Valeria Ortiz** | 08:00 - 09:00 |
| **9** | Despliegue Progresivo: Estrategia Canary Deployment | **Santiago Gómez Robledo** | 09:00 - 10:00 |
| **10** | Validación Operativa y Demostración en Vivo (Live Demo) | **Santiago & Valeria** | 10:00 - 14:00 |
| **11** | Conclusiones y Valor Estratégico de Plataformas II | **Santiago & Valeria** | 14:00 - 15:00 |

---

## Desarrollo Diapositiva por Diapositiva

### Diapositiva 1: Portada y Presentación Ejecutiva
- **Visual en Canva:** Título de alto impacto *DocuProcess Cloud*, subtítulo del curso *Plataformas II - Universidad ICESI*, nombres de los integrantes e insignias de tecnologías (Kubernetes, Spring Boot, React 19, Keycloak, Prometheus, Grafana, ELK, Kubecost).
- **Tiempo:** 1 minuto (00:00 - 01:00).
- **Oradores:** Santiago Gómez Robledo y Valeria Ortiz.

> **Santiago:**  
> *"Buenas tardes profesor y compañeros. Hoy tenemos el gusto de presentarles **DocuProcess Cloud**, nuestro proyecto final para el curso de **Plataformas II** en la Universidad ICESI. Mi nombre es Santiago Gómez Robledo y junto a mi compañera Valeria Ortiz diseñamos, implementamos y desplegamos una plataforma SaaS Enterprise de alta disponibilidad enfocada en el procesamiento asíncrono y análisis de documentos corporativos."*

> **Valeria:**  
> *"En este proyecto no nos limitamos a escribir código de backend y frontend; diseñamos una solución integral cloud-native operada sobre Kubernetes que aborda los desafíos reales de las empresas modernas: autenticación federada con SSO y MFA, aislamiento perimetral estricto Zero-Trust, observabilidad multinivel bajo los modelos RED y USE, gobernanza financiera con FinOps y despliegues progresivos sin indisponibilidad mediante Canary Deployments."*

---

### Diapositiva 2: El Caso de Negocio SaaS y el Desafío de Escalamiento
- **Visual en Canva:** Gráfico comparativo entre arquitecturas síncronas tradicionales (pantallas congeladas, colapso HTTP) vs. la arquitectura asíncrona de DocuProcess Cloud (código HTTP 202 Accepted inmediato + procesamiento en background).
- **Tiempo:** 1 minuto 15 segundos (01:00 - 02:15).
- **Orador:** Valeria Ortiz.

> **Valeria:**  
> *"Para entender la arquitectura, primero debemos entender el dolor del negocio. Imaginemos una compañía enterprise —como un banco, una aseguradora o una firma contable— donde al final de cada mes miles de analistas cargan simultáneamente facturas electrónicas, declaraciones de renta y contratos legales.*  
>  
> *En los sistemas tradicionales con llamadas HTTP síncronas, el servidor web retiene el hilo de conexión mientras ejecuta la extracción OCR pesada. El resultado es devastador: timeouts en los navegadores, errores HTTP 504 Gateway Timeout, pérdida de información y clientes corporativos frustrados.*  
>  
> *DocuProcess Cloud resuelve esto mediante una arquitectura orientada a eventos desacoplada: cuando el usuario sube un archivo, el sistema valida la carga en milisegundos, almacena el binario en un volumen persistente y responde de inmediato un código **HTTP 202 Accepted** junto a un UUID de seguimiento. El procesamiento y análisis OCR ocurren de manera asíncrona en pools elásticos de cómputo, garantizando que el usuario jamás experimente bloqueos."*

---

### Diapositiva 3: Arquitectura de Microservicios y Segmentación de Red
- **Visual en Canva:** Diagrama de bloques de la topología Kubernetes, mostrando los 6 namespaces (`docuprocess-app`, `data`, `security`, `logging`, `monitoring`, `finops`) y la separación nítida entre el Plano de Control y el Plano de Datos.
- **Tiempo:** 1 minuto 15 segundos (02:15 - 03:30).
- **Orador:** Santiago Gómez Robledo.

> **Santiago:**  
> *"Para materializar este SaaS, desplegamos un clúster local de Kubernetes Minikube configurado con 8 núcleos de CPU y 14 GiB de memoria RAM sobre el motor Containerd. Una de las restricciones de diseño más exigentes fue **no utilizar Terraform bajo ninguna circunstancia**, basando el aprovisionamiento en manifiestos puramente declarativos de Kubernetes.*  
>  
> *Organizamos la infraestructura en 6 namespaces aislados:*  
> *1. `docuprocess-app`: Hospeda las dos réplicas del frontend en React 19 y las versiones Stable y Canary del backend Spring Boot 3.5 en Java 21.*  
> *2. `docuprocess-data`: Contiene el StatefulSet de PostgreSQL 17 con almacenamiento PVC dedicado de 5 GiB y extensiones criptográficas `pgcrypto`.*  
> *3. `docuprocess-security`: Aloja el Identity Provider Keycloak 26 en Quarkus.*  
> *4. `docuprocess-logging`: El Stack ELK completo (Elasticsearch 8.17, Logstash y Kibana).*  
> *5. `docuprocess-monitoring`: Plataforma unificada de observabilidad con Prometheus, Alertmanager, OpenTelemetry Collector y Jaeger.*  
> *6. `docuprocess-finops`: Kubecost 2.8.7 para monitoreo de costos.*  
>  
> *Todo el tráfico externo ingresa a través del Ingress Controller NGINX, terminando conexiones y aplicando balanceo L7."*

---

### Diapositiva 4: Seguridad Perimetral L3/L4 y Modelo Zero-Trust
- **Visual en Canva:** Diagrama de red de Capa 3 y 4 (OSI) ilustrando las NetworkPolicies, la regla predeterminada `Default Deny` y las flechas de tráfico estrictamente autorizadas hacia PostgreSQL y el Backend.
- **Tiempo:** 1 minuto (03:30 - 04:30).
- **Orador:** Santiago Gómez Robledo.

> **Santiago:**  
> *"En un entorno multi-tenant enterprise, la seguridad no puede depender de confiar ciegamente en la red interna. Por ello implementamos un modelo **Zero-Trust** utilizando Kubernetes NetworkPolicies nativas.*  
>  
> *La regla fundacional es un **Default Deny** en las Capas 3 y 4: ningún pod puede emitir tráfico de red hacia otro a menos que exista una política explícita que lo autorice.  
>  
> *Diseñamos tres reglas de ingreso granular:*  
> *1. El Frontend y Backend solo aceptan tráfico HTTP proveniente exclusivamente de los pods del namespace `ingress-nginx`.*  
> *2. La base de datos PostgreSQL en el puerto TCP 5432 solo admite paquetes originados por pods etiquetados con `app: docuprocess-backend` o `app.kubernetes.io/name: keycloak`.*  
>  
> *Si un atacante o un contenedor comprometido en el namespace de logging o monitoring intentara ejecutar un escaneo lateral o una conexión TCP hacia la base de datos, el kernel de Linux a través del CNI descarta los paquetes de inmediato sin respuesta."*

---

### Diapositiva 5: Identidad Enterprise Federada y SSO (Keycloak 26)
- **Visual en Canva:** Pantalla de Login SSO corporativo, flujo OIDC con OpenID Connect y Authorization Code Flow con PKCE, y detalle de roles RBAC (`TENANT_ADMIN`, `OPERATOR`, `AUDITOR`) y MFA (TOTP).
- **Tiempo:** 1 minuto 15 segundos (04:30 - 05:45).
- **Orador:** Valeria Ortiz.

> **Valeria:**  
> *"En el apartado de identidad, los requerimientos del proyecto exigían ir mucho más allá del clásico login con usuario y contraseña cableados en una tabla. Integramos **Keycloak 26**, la solución líder de identidad federada de código abierto.*  
>  
> *Configuramos el Realm dedicado `docuprocess-enterprise`, aplicando los estándares OIDC y OAuth 2.0:*  
> *1. **Control de Acceso Basado en Roles (RBAC):** Definimos perfiles estrictos; por ejemplo, `TENANT_ADMIN` tiene control total de la organización, `OPERATOR` puede procesar documentos y `AUDITOR` únicamente tiene lectura sobre métricas y registros contables.*  
> *2. **Seguridad Robusta:** Implementamos protección contra ataques de fuerza bruta (bloqueando cuentas tras múltiples intentos fallidos), directivas de contraseñas seguras y **Autenticación Multifactor (MFA)** mediante Time-Based One-Time Password (TOTP).*  
> *3. **Validación Criptográfica:** El Frontend React 19 obtiene un token JWT firmado criptográficamente que el Backend Java valida en memoria sin necesidad de consultar la base de datos en cada petición, optimizando la latencia."*

---

### Diapositiva 6: Observabilidad Multinivel: Modelos RED y USE
- **Visual en Canva:** Tabla de dos columnas comparando el Modelo RED (Rate, Errors, Duration para la aplicación) con el Modelo USE (Utilization, Saturation, Errors para la infraestructura), mostrando la correlación de trazas con Jaeger y logs con ELK.
- **Tiempo:** 1 minuto 15 segundos (05:45 - 07:00).
- **Orador:** Valeria Ortiz.

> **Valeria:**  
> *"Una de las joyas del proyecto es su plataforma de observabilidad integral. No nos limitamos a graficar el uso de CPU; implementamos los dos marcos de referencia recomendados por la industria:*  
>  
> *Primero, el **Modelo RED** enfocado en el cliente y la aplicación:*  
> *- **Rate (Tasa):** Medimos las peticiones por segundo desglosadas por versión.*  
> *- **Errors (Errores):** Vigilamos el porcentaje de respuestas HTTP 5xx, con una regla de alerta crítica en Alertmanager si supera el 2%.*  
> *- **Duration (Duración):** Monitoreamos la latencia del pipeline asíncrono con percentiles $P_{50}, P_{95}$ y $P_{99}$, disparando alertas si $P_{99}$ supera los 2.5 segundos.*  
>  
> *Segundo, el **Modelo USE** enfocado en la infraestructura física:*  
> *- **Utilization:** Consumo de CPU y memoria de nodos y pods recopilado por cAdvisor.*  
> *- **Saturation:** Profundidad de colas de procesamiento y presión de memoria cgroups.*  
> *- **Errors:** Conteo de caídas o reinicios inesperados de contenedores.*  
>  
> *Y lo más valioso: **Correlación Distribuida**. Cada log enviado a Logstash e indexado en Elasticsearch contiene el mismo `traceId` generado por el OpenTelemetry SDK, lo que permite pasar de un log con error en Kibana directamente a la traza en Jaeger para ver en qué milisegundo exacto ocurrió el cuello de botella."*

---

### Diapositiva 7: Elasticidad Automática con Horizontal Pod Autoscaler (HPA v2)
- **Visual en Canva:** Ecuación matemática del escalado dinámico de pods, gráfica de escalado de 2 a 8 réplicas bajo carga y explicación de los umbrales de enfriamiento (*stabilization window*).
- **Tiempo:** 1 minuto (07:00 - 08:00).
- **Orador:** Santiago Gómez Robledo.

> **Santiago:**  
> *"Para soportar los picos impredecibles de procesamiento de documentos implementamos el **Horizontal Pod Autoscaler v2** conectado a `metrics-server`.*  
>  
> *El HPA opera bajo una estricta formulación matemática:*  
> $$\text{Replicas Deseadas} = \left\lceil \text{Replicas Actuales} \times \left( \frac{\text{Métrica Actual}}{\text{Métrica Objetivo}} \right) \right\rceil$$  
>  
> *Establecimos un piso mínimo de 2 réplicas para alta disponibilidad y un techo elástico de hasta 8 réplicas, con un target del 70% de utilización de CPU.*  
>  
> *Un aspecto crítico de ingeniería fue configurar la ventana de estabilización (*stabilization window*) de 180 segundos en el escalado hacia abajo. Esto evita el fenómeno de 'aleteo' o *flapping*, donde un pod se crea y se destruye continuamente ante fluctuaciones de tráfico momentáneas, protegiendo la estabilidad del clúster y la vida útil de los contenedores."*

---

### Diapositiva 8: Gobierno Financiero FinOps con Kubecost
- **Visual en Canva:** Captura del dashboard de Kubecost 2.8.7 mostrando la atribución de costos por Namespace y el cálculo del Unit Economics de $0.0014 USD por documento procesado.
- **Tiempo:** 1 minuto (08:00 - 09:00).
- **Orador:** Valeria Ortiz.

> **Valeria:**  
> *"En una startup tecnológica, una arquitectura puede ser técnicamente brillante, pero si no es económicamente sostenible, la empresa quiebra. Por eso integramos **Kubecost 2.8.7** en el namespace `docuprocess-finops`.*  
>  
> *Kubecost nos proporciona tres ventajas competitivas:*  
> *1. **Atribución de Costos en Tiempo Real:** Sabemos exactamente cuántos dólares gasta cada microservicio en CPU, RAM y almacenamiento persistente (PVC).*  
> *2. **Detección de Desperdicio:** Permite identificar sobredimensionamiento de recursos para ajustar los *requests* y *limits* de memoria.*  
> *3. **Unit Economics (Economía Unitaria):** Logramos calcular el costo computacional marginal por documento procesado, el cual se sitúa en **$0.0014 USD**. Esto le permite al equipo de negocio fijar planes de suscripción mensuales con márgenes de ganancia superiores al 75% garantizados por la infraestructura."*

---

### Diapositiva 9: Despliegue Progresivo: Estrategia Canary Deployment
- **Visual en Canva:** Diagrama del NGINX Ingress dividiendo el tráfico 90% hacia `docuprocess-backend-stable` (v1.0.0) y 10% hacia `docuprocess-backend-canary` (v2.0.0), junto con la cabecera `X-Canary-Test: always`.
- **Tiempo:** 1 minuto (09:00 - 10:00).
- **Orador:** Santiago Gómez Robledo.

> **Santiago:**  
> *"El último gran pilar de ingeniería es la entrega continua sin riesgo. En vez de aplicar despliegues de reemplazo total tipo 'Big Bang' —donde un bug oculto afecta al 100% de los usuarios—, implementamos una estrategia de **Canary Deployment** administrada por el Ingress Controller.*  
>  
> *El tráfico se divide de forma ponderada:*  
> *- El **90%** se enruta hacia la versión probada `v1.0.0` (Stable).*  
> *- El **10%** se deriva hacia la nueva versión `v2.0.0` (Canary).*  
>  
> *Adicionalmente, incorporamos una regla de enrutamiento determinista por cabecera HTTP: enviando `X-Canary-Test: always`, el equipo de QA o ciertos usuarios VIP son dirigidos siempre a la versión Canary para validar nuevas funcionalidades en producción real sin tocar a los demás clientes.*  
>  
> *Y ante cualquier anomalía de latencia o errores, el procedimiento de rollback toma exactamente dos segundos: fijamos el peso en 0 en el Ingress y escalamos el Canary a cero réplicas."*

---

### Diapositiva 10: Validación Operativa y Demostración en Vivo (Live Demo)
- **Visual en Canva:** Esquema secuencial de los 6 pasos de la demostración en vivo (Frontend, Kibana, Jaeger, Grafana, HPA y script E2E).
- **Tiempo:** 4 minutos (10:00 - 14:00).
- **Oradores:** Santiago Gómez Robledo & Valeria Ortiz (Intercalado).

> **Santiago:**  
> *"A continuación pasaremos a la demostración en vivo de todos los subsistemas integrados en nuestro clúster."*  
> *(Abre el navegador en `http://app.docuprocess.local`)*  
> *"Aquí podemos apreciar la interfaz de usuario en React 19 con soporte completo para Dark Mode. Iniciamos sesión mediante Keycloak SSO con nuestro usuario `srobledo`, observando la validación del token y los roles asignados."*

> **Valeria:**  
> *(Procede a la sección de carga de documentos)*  
> *"Vamos a realizar la carga de una factura empresarial. Noten que la respuesta es instantánea: el backend devuelve un código 202 con un ID de seguimiento único. Ahora pasemos a Kibana en `http://kibana.docuprocess.local`: aquí vemos el evento indexado en tiempo real con su `tenantId`, tipo de documento y el `traceId` asociado."*

> **Santiago:**  
> *(Abre Jaeger en `http://jaeger.docuprocess.local`)*  
> *"Tomamos ese `traceId` y lo consultamos en Jaeger: podemos observar la traza distribuida completa, con el span del Ingress, la llegada al controlador Spring Boot y la consulta SQL en PostgreSQL, midiendo cada milisegundo del trayecto."*

> **Valeria:**  
> *(Abre Grafana en `http://grafana.docuprocess.local`)*  
> *"En nuestro Dashboard Unificado de Grafana vemos la correlación en vivo: la primera fila muestra los KPIs de negocio (documentos procesados y tasa de éxito); la segunda fila refleja el Modelo RED con el conteo de peticiones y latencia por versión; y la tercera fila vigila el Modelo USE con la salud de CPU y memoria de los pods."*

> **Santiago:**  
> *(Ejecuta en consola `./scripts/test-hpa.sh` y `./scripts/e2e-validate.sh`)*  
> *"Por último, en la terminal inyectamos una ráfaga de solicitudes concurrentes: el HPA detecta el incremento de carga y eleva las réplicas automáticamente. Finalmente, corremos nuestro script de validación integral `./scripts/e2e-validate.sh`, el cual comprueba los 8 criterios de aceptación de la Definition of Done, confirmando un resultado del **100% PASS**."*

---

### Diapositiva 11: Conclusiones y Valor Estratégico de Plataformas II
- **Visual en Canva:** Tres pilares de síntesis: Resiliencia Cloud-Native, Observabilidad con Sentido de Negocio y Eficiencia de Costos FinOps, junto a los agradecimientos finales.
- **Tiempo:** 1 minuto (14:00 - 15:00).
- **Oradores:** Santiago Gómez Robledo & Valeria Ortiz.

> **Valeria:**  
> *"Para cerrar, este proyecto nos deja tres aprendizajes fundamentales de ingeniería:*  
> *1. La observabilidad moderna no consiste en acumular tableros gráficos, sino en conectar cada métrica técnica con el valor y la experiencia de los clientes del negocio.*  
> *2. La seguridad no se añade al final: implementar Zero-Trust a nivel de kernel con NetworkPolicies desde el día uno evita brechas de seguridad masivas en entornos multi-tenant.*  
> *3. El modelo FinOps transforma al ingeniero de plataformas en un actor clave para la rentabilidad de la compañía."*

> **Santiago:**  
> *"Agradecemos al profesor y a nuestros compañeros por su atención durante este semestre en **Plataformas II**. Quedamos a su entera disposición para responder cualquier pregunta técnica sobre la arquitectura o los componentes desplegados. ¡Muchas gracias!"*

---

## Banco de Preguntas y Respuestas Técnicas para los Evaluadores

### P1: ¿Por qué eligieron Minikube con driver Docker en lugar de una máquina virtual o nube pública?
> **Respuesta (Santiago):** *"Minikube v1.39 con el driver Docker nos permite una paridad total con clústeres de producción utilizando el runtime moderno `containerd 2.3.4`. Asignamos 8 vCPUs y 14 GiB de memoria, lo que permite ejecutar simultáneamente 6 namespaces, 25 pods y stacks demandantes como Elasticsearch y Keycloak de forma reproducible, determinista y con cero costo de nube durante la fase de desarrollo y validación académica."*

### P2: ¿Cómo garantizan que la versión Canary no corrompa los esquemas de base de datos?
> **Respuesta (Santiago):** *"Aplicamos el principio de cambios de base de datos no destructivos (*expand-and-contract pattern*). La versión Canary `v2.0.0` y la versión Stable `v1.0.0` comparten un esquema en PostgreSQL compatible hacia atrás y hacia adelante, utilizando claves UUID y columnas anulables. Toda migración destructiva (como renombrar o eliminar columnas) solo se ejecuta una vez que la versión Canary alcanza el 100% del tráfico y se retira la versión previa."*

### P3: ¿Por qué usar OpenTelemetry Collector si Prometheus ya recopila métricas?
> **Respuesta (Valeria):** *"OpenTelemetry desacopla la instrumentación de las aplicaciones del almacenamiento final. El backend de Spring Boot emite trazas mediante el protocolo estándar OTLP (gRPC/HTTP). El OTel Collector actúa como intermediario: procesa en lotes (*batch*), limita la memoria y reenvía las trazas a Jaeger. Si mañana la startup decide migrar de Jaeger a Datadog o Grafana Tempo, solo cambiamos una línea en la configuración del Collector sin tener que recompilar ni tocar una sola línea del código Java."*

### P4: ¿Qué sucede si el pod de Keycloak se cae? ¿Se bloquea todo el clúster?
> **Respuesta (Valeria):** *"No. En el Frontend, los usuarios con sesión activa retienen su token JWT en memoria durante su ciclo de validez (15 minutos). El backend Spring Boot valida la firma criptográfica del JWT utilizando la clave pública RSA obtenida al inicio (JWKS). Por ende, una caída temporal de Keycloak no interrumpe el procesamiento de documentos en curso; únicamente afectaría a los nuevos inicios de sesión mientras el Deployment de Kubernetes reinicia automáticamente el pod mediante sus probes de salud."*
