#!/usr/bin/env bash
# ==============================================================================
# Script de Demostración de Escalado Automático HPA (DocuProcess Cloud)
# Dispara carga sintética concurrente de procesamiento asíncrono y CPU
# ==============================================================================
set -euo pipefail

INGRESS_IP=$(minikube ip)
API_HOST="api.docuprocess.local"

echo "===================================================================="
echo "Iniciando Demostración de Horizontal Pod Autoscaler (HPA)"
echo "Destino: http://${INGRESS_IP} (Host: ${API_HOST})"
echo "===================================================================="

echo "[1/3] Estado actual del HPA y Réplicas antes de la carga:"
kubectl get hpa -n docuprocess-app docuprocess-backend-hpa
kubectl get deployment -n docuprocess-app docuprocess-backend-stable

echo ""
echo "[2/3] Inyectando 60 documentos asíncronos concurrentes y carga de CPU..."
for i in {1..5}; do
    curl -s -X POST "http://${INGRESS_IP}/api/v1/simulate/workload" \
         -H "Host: ${API_HOST}" \
         -H "Content-Type: application/json" \
         -d '{"totalDocuments": 15, "tenantId": "icesi-stress-test", "simulatedDurationMs": 800}' > /dev/null &
    
    curl -s "http://${INGRESS_IP}/api/v1/simulate/cpu-spike?durationMs=4000" \
         -H "Host: ${API_HOST}" > /dev/null &
done

echo "Carga inyectada. Monitoreando comportamiento del HPA durante 45 segundos..."
for sec in {1..9}; do
    sleep 5
    echo -n "T+$((sec * 5))s | "
    kubectl get hpa -n docuprocess-app docuprocess-backend-hpa --no-headers 2>/dev/null || true
done

echo ""
echo "[3/3] Estado final del Deployment escalado:"
kubectl get deployment -n docuprocess-app docuprocess-backend-stable
kubectl get pods -n docuprocess-app -l app=docuprocess-backend,track=stable
echo "===================================================================="
echo "Demostración de HPA finalizada."
