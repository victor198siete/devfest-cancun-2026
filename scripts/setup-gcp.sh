#!/usr/bin/env bash
# Prepara tu proyecto de Google Cloud para el taller (se puede correr varias veces).
set -euo pipefail

P=$(gcloud config get-value project 2>/dev/null || true)
if [ -z "$P" ]; then
  echo "No hay proyecto elegido. Ejecuta: gcloud config set project TU_ID"
  exit 1
fi
echo "Proyecto: $P"

# El error más común: el ID no existe o el proyecto es de otra cuenta de Google
if ! gcloud projects describe "$P" >/dev/null 2>&1; then
  CUENTA=$(gcloud config get-value account 2>/dev/null || true)
  echo "No encuentro el proyecto '$P' con la cuenta $CUENTA."
  echo "Tus proyectos (usa el valor de la columna PROJECT_ID):"
  gcloud projects list --format="table(projectId,name)" 2>/dev/null || true
  echo "Luego: gcloud config set project TU_ID   y vuelve a correr este script."
  echo "Si la lista está vacía, crea el proyecto en el paso «Elige tu proyecto» del tutorial."
  exit 1
fi
SA="reportes-api@$P.iam.gserviceaccount.com"

if ! out=$(gcloud services enable aiplatform.googleapis.com run.googleapis.com --project "$P" 2>&1); then
  if grep -qi "billing" <<<"$out"; then
    echo "Tu proyecto no tiene facturación. Liga la cuenta de facturación del crédito:"
    echo "https://console.cloud.google.com/billing/linkedaccount?project=$P"
  else
    echo "$out"
  fi
  exit 1
fi
echo "✔ APIs de Cloud Run y Vertex AI activadas"

if ! gcloud iam service-accounts describe "$SA" --project "$P" >/dev/null 2>&1; then
  gcloud iam service-accounts create reportes-api \
    --display-name="API de reportes de mascotas" --project "$P" >/dev/null
fi
echo "✔ Cuenta de servicio reportes-api lista"

# La cuenta nueva tarda unos segundos en propagarse: reintentamos
for i in 1 2 3 4 5 6; do
  if gcloud projects add-iam-policy-binding "$P" --member="serviceAccount:$SA" \
    --role=roles/aiplatform.user --condition=None >/dev/null 2>&1; then
    echo "✔ Permiso para usar Gemini asignado"
    echo "Listo. Siguiente paso: bash scripts/deploy.sh"
    exit 0
  fi
  echo "  esperando a que la cuenta se propague ($i/6)..."
  sleep 10
done
echo "No se pudo asignar el permiso. Vuelve a correr este script."
exit 1
