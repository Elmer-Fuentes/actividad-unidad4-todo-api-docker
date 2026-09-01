# ---------- Etapa 1: build ----------
# Aquí se instalan TODAS las dependencias y se prepara el código.
# Separarla de la etapa final evita arrastrar herramientas de compilación
# a la imagen que se va a publicar.
FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install --no-audit --no-fund

COPY src ./src

# ---------- Etapa 2: runtime ----------
# Imagen final: solo dependencias de producción + código fuente.
FROM node:22-alpine

WORKDIR /app
ENV NODE_ENV=production

# Actualiza los paquetes del sistema operativo (Alpine) a la última versión
# disponible del repositorio. Corrige vulnerabilidades HIGH detectadas por
# Trivy en libssl3/libcrypto3 (OpenSSL desactualizado en la imagen base).
RUN apk update && apk upgrade --no-cache

COPY package*.json ./
RUN npm install --omit=dev --no-audit --no-fund \
  && rm -rf /usr/local/lib/node_modules/npm \
            /usr/local/lib/node_modules/corepack \
            /opt/yarn-v* \
            /usr/local/bin/npm \
            /usr/local/bin/npx \
            /usr/local/bin/corepack

COPY --from=build /app/src ./src

# La imagen node:alpine ya trae el usuario "node" (no root) - lo usamos por seguridad
USER node

# Puerto en el que escucha la app (ver src/server.js -> process.env.PORT || 8080)
EXPOSE 8080

# Healthcheck: le permite a Docker saber si el contenedor está sano
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD node -e "require('http').get('http://localhost:8080/health', r => process.exit(r.statusCode===200?0:1)).on('error', () => process.exit(1))"

CMD ["node", "src/server.js"]