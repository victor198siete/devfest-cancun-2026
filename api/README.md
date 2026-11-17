# Pet reports API

NestJS API that analyzes a pet photo with Gemini (Vertex AI) and returns a structured report: species, distinguishing marks, urgency, a ready-to-share notice and a Google Maps link for the reported location.

## Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/reportes` | Analyze a photo (base64) with its type (lost/found) and coordinates. Rate limited per IP. |
| GET | `/health` | Liveness check. |
| GET | `/docs` | Swagger UI. |

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3015` | HTTP port (Cloud Run injects `8080`). |
| `GOOGLE_CLOUD_PROJECT` | - | Google Cloud project that runs Vertex AI. |
| `GOOGLE_CLOUD_LOCATION` | `global` | Must be `global`: `gemini-3.8-flash` is only served in the global Vertex AI location. |
| `GEMINI_MODEL` | `gemini-3.8-flash` | Exact model name, never a "-latest" alias. |
| `AVISO_IDIOMA` | `es` | Language of the notice: `es` or `en`. |
| `LIMITE_POR_MINUTO` | `20` | Max `POST /reportes` requests per IP per minute. |

## Run locally

```bash
npm ci
gcloud auth application-default login
cp .env.example .env   # set GOOGLE_CLOUD_PROJECT
npm run start:dev      # or: npm run build && npm run start
```

## Tests

```bash
npm test
```

Gemini is mocked, so no credentials are needed.

## Privacy

The API does not store photos or locations: they are sent to Gemini for analysis and discarded after the response.

Deploy: see the workshop guide.
