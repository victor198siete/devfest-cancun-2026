# Exporta la app como JavaScript plano y la sirve a Expo Go.
# Se construye desde la raíz del repo: gcloud builds submit --config servidor-app/cloudbuild.yaml
FROM node:24-slim AS export
WORKDIR /app
COPY app/package.json app/package-lock.json ./
RUN npm ci
COPY app/ ./
RUN npx expo export --platform ios --platform android --no-bytecode --output-dir dist \
 && npx expo config --json --type public > dist/expoConfig.json

FROM node:24-slim
WORKDIR /srv
ENV NODE_ENV=production
COPY servidor-app/server.mjs ./
COPY --from=export /app/dist ./dist
USER node
CMD ["node", "server.mjs"]
