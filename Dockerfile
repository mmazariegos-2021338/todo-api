# Imagen base ligera y con soporte activo (reduce superficie de vulnerabilidades
# frente a una imagen "full" de node).
FROM node:22-alpine AS ui
WORKDIR /ui
COPY frontend/package*.json ./
RUN npm install
COPY frontend ./
RUN npm run build

FROM node:22-alpine

# Directorio de trabajo dentro del contenedor.
WORKDIR /usr/src/app

# Parchea paquetes del sistema (p. ej. openssl HIGH CVE-2026-14456: 3.5.7-r0 -> 3.5.8-r0).
RUN apk upgrade --no-cache

# Copiamos primero solo los manifiestos para aprovechar la cache de capas de Docker:
# si el código cambia pero las dependencias no, no se reinstalan.
COPY package*.json ./

# Solo dependencias de producción. Luego se elimina npm/yarn/corepack: no se usan
# en runtime (CMD es "node") y Trivy reportó CRITICAL/HIGH en esos paquetes de la imagen.
RUN npm install --omit=dev && npm cache clean --force \
  && rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack /opt/yarn*

# API + build de React (Vite).
COPY src ./src
COPY --from=ui /ui/dist ./public

# La imagen node:alpine ya trae el usuario "node" (uid 1000) sin privilegios;
# lo usamos en vez de root dentro del contenedor por buenas prácticas de seguridad.
USER node

ARG APP_VERSION=1.0
ENV APP_VERSION=$APP_VERSION
ENV PORT=8080
EXPOSE 8080

# Chequeo de salud del contenedor usando el endpoint /health de la propia app.
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD node -e "require('http').get('http://localhost:8080/health', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "src/server.js"]
