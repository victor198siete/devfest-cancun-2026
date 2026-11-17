#!/usr/bin/env bash
# Despliega tu propia API de reportes en Cloud Run. Uso: bash scripts/deploy.sh [es|en]
set -euo pipefail

IDIOMA=${1:-es}
if [ "$IDIOMA" != "es" ] && [ "$IDIOMA" != "en" ]; then
  echo "Idioma inválido: '$IDIOMA'. Usa 'es' o 'en'."
  exit 1
fi

P=$(gcloud config get-value project 2>/dev/null || true)
if [ -z "$P" ]; then
  echo "No hay proyecto elegido. Ejecuta: gcloud config set project TU_ID"
  exit 1
fi
IMAGEN=us-central1-docker.pkg.dev/devfest-cancun-2026/taller/reportes-api:v1

echo "Desplegando en $P (idioma: $IDIOMA)..."
gcloud run deploy reportes-api --project "$P" --region us-central1 \
  --image "$IMAGEN" \
  --service-account "reportes-api@$P.iam.gserviceaccount.com" \
  --allow-unauthenticated --max-instances 2 \
  --set-env-vars "GOOGLE_CLOUD_PROJECT=$P,GOOGLE_CLOUD_LOCATION=global,GEMINI_MODEL=gemini-3.8-flash,AVISO_IDIOMA=$IDIOMA,LIMITE_POR_MINUTO=20" \
  --quiet

URL=$(gcloud run services describe reportes-api --project "$P" --region us-central1 --format='value(status.url)')
echo
echo "=============================================="
echo "  TU API:   $URL"
echo "  DOCS:     $URL/docs"
echo "=============================================="
echo "Para borrarla: gcloud run services delete reportes-api --region us-central1"
