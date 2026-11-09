#!/usr/bin/env bash
# ==============================================================================
# Script de Mapeo DNS Local para DocuProcess Cloud
# Universidad ICESI - Plataformas II
# ==============================================================================
set -euo pipefail

MINIKUBE_IP=$(minikube ip)
DOMAINS="app.docuprocess.local api.docuprocess.local auth.docuprocess.local grafana.docuprocess.local kibana.docuprocess.local jaeger.docuprocess.local kubecost.docuprocess.local"

echo "Configurando resolución DNS local hacia Minikube (${MINIKUBE_IP})..."

if grep -q "docuprocess.local" /etc/hosts 2>/dev/null; then
    echo "Limpiando entradas previas en /etc/hosts..."
    sudo sed -i '/docuprocess.local/d' /etc/hosts
fi

echo "${MINIKUBE_IP} ${DOMAINS}" | sudo tee -a /etc/hosts > /dev/null

echo "=============================================================================="
echo "✅ /etc/hosts configurado exitosamente:"
echo "------------------------------------------------------------------------------"
grep "docuprocess.local" /etc/hosts
echo "=============================================================================="

