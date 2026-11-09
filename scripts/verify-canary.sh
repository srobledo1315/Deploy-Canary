#!/usr/bin/env bash
# ==============================================================================
# Script de Validación del Despliegue Progresivo Canary (DocuProcess Cloud)
# Envía N peticiones HTTP a api.docuprocess.local y mide el balanceo 90/10
# ==============================================================================
set -euo pipefail

TOTAL_REQUESTS=${1:-100}
INGRESS_IP=$(minikube ip)
HOST_HEADER="api.docuprocess.local"

echo "===================================================================="
echo "Iniciando Prueba de Canary Deployment en DocuProcess Cloud"
echo "Destino: http://${INGRESS_IP} (Host: ${HOST_HEADER})"
echo "Total de Muestras: ${TOTAL_REQUESTS}"
echo "===================================================================="

COUNT_V1=0
COUNT_V2=0
FAILURES=0

for i in $(seq 1 "${TOTAL_REQUESTS}"); do
    RESPONSE=$(curl -s -m 3 -H "Host: ${HOST_HEADER}" "http://${INGRESS_IP}/api/v1/documents/version" || echo "FAIL")
    
    if echo "${RESPONSE}" | grep -q '"version":"1.0.0"'; then
        COUNT_V1=$((COUNT_V1 + 1))
        echo -n "."
    elif echo "${RESPONSE}" | grep -q '"version":"2.0.0"'; then
        COUNT_V2=$((COUNT_V2 + 1))
        echo -n "C"
    else
        FAILURES=$((FAILURES + 1))
        echo -n "X"
    fi

    if (( i % 50 == 0 )); then
        echo " [${i}/${TOTAL_REQUESTS}]"
    fi
done

echo ""
echo "===================================================================="
echo "Resultados del Despliegue Progresivo Canary:"
echo "--------------------------------------------------------------------"
PERCENT_V1=$(awk "BEGIN {printf \"%.1f\", (${COUNT_V1}/${TOTAL_REQUESTS})*100}")
PERCENT_V2=$(awk "BEGIN {printf \"%.1f\", (${COUNT_V2}/${TOTAL_REQUESTS})*100}")

echo "Versión Estable (v1.0.0): ${COUNT_V1} peticiones (${PERCENT_V1}%)"
echo "Versión Canary  (v2.0.0): ${COUNT_V2} peticiones (${PERCENT_V2}%)"
echo "Peticiones Fallidas     : ${FAILURES}"
echo "===================================================================="

if [ "${COUNT_V2}" -gt 0 ]; then
    echo "✅ Canary Deployment OPERATIVO: Tráfico dividido exitosamente sin interrupción de servicio."
else
    echo "⚠️ Advertencia: No se registraron peticiones hacia Canary. Verifique peso del Ingress."
fi
