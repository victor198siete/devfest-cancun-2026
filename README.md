# DevFest Cancún 2026 — A mobile app with AI in one hour

Hands-on workshop: **Angular, Gemini and Google Cloud**.
DevFest Cancún 2026 · Friday, November 20 · Universidad del Caribe.

Report a lost or injured pet (or share a campaign) from your phone: pick a photo,
add the location and a note. Your own API on Cloud Run asks Gemini on Vertex AI
to read the photo and returns a structured report ready to share.

| Folder | What it is |
|---|---|
| `app/` | Native mobile app with Angular (ng-native) running in Expo Go |
| `api/` | NestJS API that calls Gemini on Vertex AI, deployed to Cloud Run |
| `scripts/` | Google Cloud setup and deploy scripts |
| `docs/` | Workshop guides |

> Work in progress.

## Deploy your own API

[![Open in Cloud Shell](https://gstatic.com/cloudssh/images/open-btn.svg)](https://shell.cloud.google.com/cloudshell/editor?cloudshell_git_repo=https://github.com/victor198siete/devfest-cancun-2026&cloudshell_tutorial=docs/tutorial.md)

Opens Cloud Shell with a step-by-step tutorial. Two commands (`scripts/setup-gcp.sh` and
`scripts/deploy.sh`) deploy your own copy of the API to Cloud Run using a public image.

---

## En español

Taller práctico de DevFest Cancún 2026: una app móvil con IA en una hora, con Angular,
Gemini y Google Cloud. Reporta una mascota perdida, herida o una campaña desde tu
teléfono; tu propia API en Cloud Run usa Gemini para entender la foto y redactar el aviso.

## License

[MIT](LICENSE)
