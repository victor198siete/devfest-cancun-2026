# Despliega tu propia API de reportes

## Bienvenida

<walkthrough-tutorial-duration duration="10"></walkthrough-tutorial-duration>

Vas a desplegar **tu propia API** en Cloud Run, que usa **Gemini** para leer la foto de una mascota y redactar el reporte. Son dos comandos y tarda unos 5 minutos.

Si ves la pantalla en inglés o algo no carga, no te preocupes: cada paso trae una nota de rescate.

## Elige tu proyecto

<walkthrough-project-setup billing="true"></walkthrough-project-setup>

Elige o crea un proyecto **con la cuenta de facturación del crédito ligada**. Tu proyecto: `{{project-id}}`

```bash
gcloud config set project {{project-id}}
```

Si ves "billing not enabled", liga la cuenta de facturación del crédito al proyecto. Si no aparece tu crédito, revisa que estés con tu Gmail personal, no con la cuenta de la universidad.

## Prepara el proyecto

Activa los servicios y crea la cuenta que usará tu API:

```bash
bash scripts/setup-gcp.sh
```

Si ves "Service account ... does not exist", el script ya reintenta solo; si termina con error, vuelve a correrlo.

## Despliega

```bash
bash scripts/deploy.sh
```

Para que los avisos salgan en inglés:

```bash
bash scripts/deploy.sh en
```

Si pide autorizar, acepta con tu Gmail personal. Al final verás tu URL en grande.

## Prueba tu API

Abre `/docs` en tu URL y prueba `GET /health`: debe responder `{"status":"ok"}`. También puedes probar desde la terminal:

```bash
curl "$(gcloud run services describe reportes-api --region us-central1 --format='value(status.url)')/health"
```

Copia tu URL: es la que pegarás en la app.

Si `/health` no responde, espera 30 segundos y reintenta; si sigue igual, vuelve a correr el despliegue.

## Al terminar el taller

Borra el servicio para no gastar tu crédito:

```bash
gcloud run services delete reportes-api --region us-central1
```

Si dice que no tiene permiso, revisa que sigas en tu proyecto con `gcloud config get-value project`.

## Felicidades

<walkthrough-conclusion-trophy></walkthrough-conclusion-trophy>

Tienes tu propia API con Gemini corriendo en Google Cloud. Ahora conéctala a la app.
