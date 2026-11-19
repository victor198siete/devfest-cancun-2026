# Sirve la app a Expo Go con Metro (modo desarrollo). Expo Go en Android no carga los módulos de
# Expo en un bundle publicado fuera de EAS; con Metro sí, en Android y en iOS.
# Se construye desde la raíz del repo: gcloud builds submit --config servidor-metro/cloudbuild.yaml
FROM node:24-slim
WORKDIR /app
COPY app/package.json app/package-lock.json ./
RUN npm ci
COPY app/ ./
COPY servidor-metro/arrancar.sh /arrancar.sh
ENV CI=1 EXPO_OFFLINE=1 EXPO_NO_TELEMETRY=1 PORT=8080
EXPOSE 8080
CMD ["bash", "/arrancar.sh"]
