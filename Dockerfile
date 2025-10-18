# --- FASE 1: BUILD (Instalación de dependencias) ---
FROM node:20-alpine AS builder

# Establece el directorio de trabajo
WORKDIR /app

# Copia los archivos de definición de dependencias
COPY package.json package-lock.json ./

# Instala las dependencias de producción
RUN npm install --omit=dev

# --- FASE 2: PRODUCCIÓN (Imagen final) ---
FROM node:20-alpine

# Establece el directorio de trabajo
WORKDIR /app

# Copia las dependencias instaladas
COPY --from=builder /app/node_modules ./node_modules

# Copia el código fuente completo
COPY . .

# ⚠️ PASO CRÍTICO: COPIA EL ARCHIVO DE CREDENCIALES
# Este comando copia el archivo desde la raíz de su repositorio (donde debe estar)
# a la ruta que su código JS espera: /workspace/credentials.json
# Esto resuelve el error de "key must be a string" (archivo no encontrado).
RUN mkdir -p /workspace/
COPY credentials.json /workspace/credentials.json 

# Expone el puerto (8081 es el valor por defecto en index.js)
EXPOSE 8081

# Comando para iniciar la aplicación
CMD [ "npm", "start" ]
