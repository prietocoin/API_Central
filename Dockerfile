# --- FASE 1: BUILD (Instalación de dependencias) ---
FROM node:20-alpine AS builder

# (ELIMINADO: El ARG GOOGLE_CREDENTIALS_JSON ya no es necesario)
# EasyPanel montará el archivo después, en tiempo de ejecución.

# Establece el directorio de trabajo
WORKDIR /app

# Copia los archivos de definición de dependencias
# (CORREGIDO: Se quita package-lock.json para evitar el error de "not found")
COPY package.json ./

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

# (ELIMINADO: El RUN para crear /workspace/credentials.json)
# El "Punto de Montaje" de EasyPanel se encargará de poner el archivo 
# en /workspace/credentials.json automáticamente.

# Expone el puerto (8081 es el valor por defecto en index.js)
EXPOSE 8081

# Comando para iniciar la aplicación
CMD [ "npm", "start" ]
