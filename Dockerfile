# --- FASE 1: BUILD (Instalación de dependencias) ---
FROM node:20-alpine AS builder

# Argumento para las credenciales de Google (SECRETO - Se pasa desde EasyPanel)
ARG GOOGLE_CREDENTIALS_JSON

# Establece el directorio de trabajo
WORKDIR /app

# Copia los archivos de definición de dependencias (package.json debe estar en el repositorio)
COPY package.json package-lock.json ./

# Instala las dependencias de producción
RUN npm install --omit=dev

# --- FASE 2: PRODUCCIÓN (Imagen final, optimizada) ---
FROM node:20-alpine

# Establece el directorio de trabajo
WORKDIR /app

# Copia las dependencias instaladas de la fase 'builder'
COPY --from=builder /app/node_modules ./node_modules

# Copia el código fuente completo (index.js, constants.js, services/, controllers/)
COPY . .

# ⚠️ PASO CRÍTICO: Escribir el contenido de la credencial (GOOGLE_CREDENTIALS_JSON) a un archivo.
# Esto garantiza que el archivo exista en /workspace/credentials.json para que el código JS lo encuentre.
RUN mkdir -p /workspace/ && \
    printf "%s" "$GOOGLE_CREDENTIALS_JSON" > /workspace/credentials.json

# Expone el puerto (8081 es el valor por defecto en index.js)
EXPOSE 8081

# Comando para iniciar la aplicación
CMD [ "npm", "start" ]
