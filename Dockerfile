# ---------- Etapa 1: build ----------
FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci --ignore-scripts --no-audit --no-fund

COPY src ./src

# ---------- Etapa 2: runtime ----------
FROM node:22-alpine

WORKDIR /app
ENV NODE_ENV=production

RUN apk update && apk upgrade --no-cache

COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts --no-audit --no-fund \
  && rm -rf /usr/local/lib/node_modules/npm \
            /usr/local/lib/node_modules/corepack \
            /opt/yarn-v* \
            /usr/local/bin/npm \
            /usr/local/bin/npx \
            /usr/local/bin/corepack

COPY --from=build /app/src ./src

USER node
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD node -e "require('http').get('http://localhost:8080/health', r => process.exit(r.statusCode===200?0:1)).on('error', () => process.exit(1))"

CMD ["node", "src/server.js"]