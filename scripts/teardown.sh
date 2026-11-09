#!/usr/bin/env bash
# ==============================================================================
# Script de Desmantelamiento y Limpieza Ordenada (Teardown) - DocuProcess Cloud
# Universidad ICESI - Plataformas II
# ==============================================================================
set -euo pipefail

echo "=============================================================================="
echo "      DOCUPROCESS CLOUD - DESMANTELAMIENTO Y LIMPIEZA DEL ENTORNO"
echo "                   Universidad ICESI - Plataformas II"
echo "=============================================================================="

read -p "¿Está seguro de eliminar todas las cargas de trabajo de Kubernetes? (s/N): " -r CONFIRM
if [[ ! "${CONFIRM}" =~ ^[sS]$ ]]; then
    echo "Operación cancelada. El clúster permanece intacto."
    exit 0
fi

echo "1/7 Eliminando capa de Ingress, HPA y NetworkPolicies..."
kubectl delete -f k8s/ingress/ --ignore-not-found=true
kubectl delete -f k8s/hpa/ --ignore-not-found=true
kubectl delete -f k8s/network-policies/ --ignore-not-found=true

echo "2/7 Eliminando capa de aplicación (Frontend & Backend Canary/Stable)..."
kubectl delete -f k8s/app/ --ignore-not-found=true

echo "3/7 Desinstalando release de Kubecost FinOps..."
helm uninstall kubecost -n docuprocess-finops 2>/dev/null || true

echo "4/7 Eliminando observabilidad y centralización de logs (ELK, Prometheus, Grafana, Jaeger)..."
kubectl delete -f k8s/monitoring/ --ignore-not-found=true
kubectl delete -f k8s/logging/ --ignore-not-found=true

echo "5/7 Eliminando seguridad y persistencia de datos (Keycloak & PostgreSQL)..."
kubectl delete -f k8s/security/ --ignore-not-found=true
kubectl delete -f k8s/data/ --ignore-not-found=true

echo "6/7 Eliminando volúmenes persistentes (PVCs) y namespaces..."
kubectl delete -f k8s/base/storage/ --ignore-not-found=true
kubectl delete -f k8s/base/namespaces/ --ignore-not-found=true

echo "7/7 Limpiando entradas en /etc/hosts..."
if grep -q "docuprocess.local" /etc/hosts 2>/dev/null; then
    sudo sed -i '/docuprocess.local/d' /etc/hosts 2>/dev/null || echo "Nota: Ejecute 'sudo sed -i \"/docuprocess.local/d\" /etc/hosts' manualmente si requiere permisos de superusuario."
fi

echo "=============================================================================="
echo "✅ Todos los recursos de Kubernetes han sido eliminados ordenadamente."
echo "Para apagar el nodo Minikube y liberar RAM/CPU del host ejecute: 'minikube stop'"
echo "Para destruir el clúster por completo ejecute: 'minikube delete'"
echo "=============================================================================="
