# --- FASE 1: BUILD (Instalación de dependencias) ---
FROM node:20-alpine AS builder

# Establece el directorio de trabajo
WORKDIR /app

# Copia solo el package.json (más seguro si package-lock.json no existe)
COPY package.json ./

# Instala las dependencias de producción
RUN npm install --omit=dev

# --- FASE 2: PRODUCCIÓN (Imagen final, más pequeña y limpia) ---
FROM node:20-alpine

# Establece el directorio de trabajo
WORKDIR /app

# Copia las dependencias instaladas
COPY --from=builder /app/node_modules ./node_modules

# Copia el código fuente completo
COPY . .

# ⚠️ Solución: Creamos el archivo credentials.json DENTRO del contenedor
# utilizando una VARIABLE DE ENTORNO (EXTERNAL_CREDENTIALS_JSON) de EasyPanel.
# Esto asegura que el archivo SIEMPRE exista en la ruta /workspace/credentials.json.
ARG EXTERNAL_CREDENTIALS_JSON

# Creamos el directorio de trabajo si no existe y luego escribimos el contenido JSON
RUN mkdir -p /workspace/ && echo "$EXTERNAL_CREDENTIALS_JSON" > /workspace/credentials.json

# Expone el puerto que usa tu aplicación
EXPOSE 8080

# Comando para iniciar la aplicación
CMD [ "npm", "start" ]
