# --- FASE 1: BUILD (Instalación de dependencias) ---
# Usamos una imagen base estable de Node.js
FROM node:20-alpine AS builder

# Establece el directorio de trabajo
WORKDIR /app

# Copia los archivos de definición de dependencias
COPY package.json package-lock.json ./

# Instala las dependencias de producción (omite las de desarrollo)
# Esto instala Express, googleapis y node-cache.
RUN npm install --omit=dev

# --- FASE 2: PRODUCCIÓN (Imagen final, más pequeña y limpia) ---
FROM node:20-alpine

# Establece el directorio de trabajo
WORKDIR /app

# Copia las dependencias instaladas de la fase 'builder'
COPY --from=builder /app/node_modules ./node_modules

# Copia el código fuente completo (index.js, services/, controllers/, etc.)
COPY . .

# ⚠️ PASO CRÍTICO: Copia el archivo de credenciales a la ruta esperada por tu código.
# Asume que credentials.json está en tu directorio local para la subida.
COPY credentials.json /workspace/credentials.json 

# Expone el puerto que usa tu aplicación
EXPOSE 8080

# Comando para iniciar la aplicación
CMD [ "npm", "start" ]
