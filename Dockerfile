# --- FASE 1: BUILD (Instalación de dependencias) ---
FROM node:20-alpine AS builder

# Establece el directorio de trabajo
WORKDIR /app

# Copia solo el package.json (más robusto si package-lock.json no existe)
COPY package.json ./

# Instala las dependencias de producción (express, googleapis, node-cache)
RUN npm install --omit=dev

# --- FASE 2: PRODUCCIÓN (Imagen final, más pequeña y limpia) ---
FROM node:20-alpine

# Módulo 'fs' es requerido para leer archivos, lo instalamos aquí
RUN apk add --no-cache bash

# Establece el directorio de trabajo
WORKDIR /app

# Copia las dependencias instaladas
COPY --from=builder /app/node_modules ./node_modules

# Copia el código fuente completo (index.js, services/, controllers/, etc.)
COPY . .

# ----------------------------------------------------------------------
# --- MANEJO DE ARCHIVOS CRÍTICOS (RUNTIME) ---
# ----------------------------------------------------------------------

# 1. Escribimos las credenciales de Google Sheets al archivo esperado (/workspace/credentials.json).
#    Esto resuelve la falla de I/O, usando la variable de entorno de runtime de EasyPanel.
#    Usamos 'sh -c' para que las variables de entorno (que son de runtime) se expandan correctamente.
RUN mkdir -p /workspace/ && \
    sh -c 'echo "$GOOGLE_CREDENTIALS_JSON" > /workspace/credentials.json'

# 2. Escribimos el JSON de CONFIGURACIÓN grande al archivo (/app/cliente_config.json).
#    Esto resuelve el error de 'JSON.parse()' que se rompía con saltos de línea de la variable de entorno.
RUN sh -c 'echo "$CLIENTE_CONFIG_JSON" > /app/cliente_config.json'

# ----------------------------------------------------------------------

# Expone el puerto que usa tu aplicación
EXPOSE 8080

# Comando para iniciar la aplicación
CMD [ "npm", "start" ]
