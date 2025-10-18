// index.js (El Router Final)

const express = require('express');
const { google } = require('googleapis');
const constants = require('./constants'); // <--- ¡Constantes necesarias!
const utils = require('./services/utils');
const sheetsService = require('./services/sheets.service'); // Singleton de conexión y I/O
const dataController = require('./controllers/data.controller'); // Lógica de la petición/respuesta
const app = express();

// --- CONFIGURACIÓN DE ENTORNO ---
const PORT = process.env.PORT || 8080;

// --- MIDDLEWARE Y RUTA RAÍZ ---
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    next();
});

// Ruta raíz que devuelve HTML para el chequeo de salud y documentación
app.get('/', (req, res) => {
    const hostUrl = req.headers.host;

    const endpoints = [
        { path: constants.RUTAS.RUTA_TASAS_PROMEDIO, description: 'DATOS: Tasas de Precios Promedio (última fila, Hoja Mercado)' },
        { path: constants.RUTAS.RUTA_MATRIZ_GANANCIA, description: 'DATOS: Matriz de Ganancia Estática (Hoja Miguelacho)' },
        { path: constants.RUTAS.RUTA_TASAS_VES, description: 'DATOS: Tasa de Ganancia VES (Hoja Miguelacho, Fila 23)' }, 
        { path: constants.RUTAS.RUTA_TASAS_COP_VES, description: 'NUEVO: Tasas COP/VES (Hoja Imagen, Rango B21:L22)' },
        { path: constants.RUTAS.RUTA_DATOS_IMAGEN, description: 'DATOS ADICIONALES: Datos de la Hoja Imagen (Rango B15:L16)' }, 
        { path: constants.RUTAS.RUTA_TASAS_FUNDABLOCK, description: 'TASAS FUNDABLOCK (Hoja Imagen, Rango B18:K19)' },
        { path: constants.RUTAS.RUTA_CONVERTIR + '?cantidad=100&origen=USD&destino=COP', description: 'Servicio de Conversión (Calculadora Centralizada)' }
    ];

    const htmlContent = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>API CENTRAL - Documentación</title>
            <style>
                body { font-family: Arial, sans-serif; background-color: #0d1117; color: #c9d1d9; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
                .container { background-color: #161b22; padding: 30px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5); width: 90%; max-width: 600px; }
                h1 { color: #58a6ff; border-bottom: 2px solid #30363d; padding-bottom: 10px; margin-top: 0; }
                .endpoint-list { list-style: none; padding: 0; }
                .endpoint-item { margin-bottom: 15px; background-color: #21262d; padding: 15px; border-radius: 8px; transition: background-color 0.3s; }
                .endpoint-item:hover { background-color: #30363d; }
                .endpoint-item a { text-decoration: none; color: #58a6ff; font-weight: bold; display: block; font-size: 1.1em; margin-bottom: 5px; word-wrap: break-word; }
                .endpoint-item p { margin: 0; color: #8b949e; font-size: 0.9em; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>API CENTRAL en Línea</h1>
                <p>API REST para obtener datos de hojas de cálculo de Google Sheets. Base de la reestructuración modular:</p>
                <ul class="endpoint-list">
                    ${endpoints.map(ep => {
                        const linkPath = ep.path.startsWith('/') ? ep.path : '/' + ep.path;
                        const fullLinkDisplay = `${hostUrl}${linkPath}`;
                        return `
                        <li class="endpoint-item">
                            <a href="${linkPath}">${fullLinkDisplay}</a>
                            <p>${ep.description}</p>
                        </li>
                        `;
                    }).join('')}
                </ul>
                <p style="text-align: center; font-size: 0.8em; color: #484f58;">Arquitectura en Transición</p>
            </div>
        </body>
        </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.send(htmlContent);
});

// --- RUTAS DE LA API (DELEGADAS AL CONTROLADOR) ---
// Obtenemos el helper del servicio (asyncHandler) y lo usamos para envolver cada controlador
const asyncHandler = sheetsService.asyncHandler;

// 1. Obtener la última fila de Precios Promedio (Hoja Mercado)
app.get(constants.RUTAS.RUTA_TASAS_PROMEDIO, asyncHandler(dataController.getTasasPromedio));

// 2. Obtener la Matriz de Ganancia (Hoja Miguelacho)
app.get(constants.RUTAS.RUTA_MATRIZ_GANANCIA, asyncHandler(dataController.getMatrizGanancia));

// 3. TASA VES
app.get(constants.RUTAS.RUTA_TASAS_VES, asyncHandler(dataController.getTasasVES));

// 4. Obtener Datos de Imagen
app.get(constants.RUTAS.RUTA_DATOS_IMAGEN, asyncHandler(dataController.getDatosImagen));

// 5. ENDPOINT EXISTENTE: /tasas-fundablock
app.get(constants.RUTAS.RUTA_TASAS_FUNDABLOCK, asyncHandler(dataController.getTasasFundablock));

// 6. NUEVO ENDPOINT SOLICITADO: /tasas-cop_ves
app.get(constants.RUTAS.RUTA_TASAS_COP_VES, asyncHandler(dataController.getTasasCopVes));

// 7. SERVICIO DE CONVERSIÓN CENTRALIZADO
app.get(constants.RUTAS.RUTA_CONVERTIR, asyncHandler(dataController.getConvertir));


// --- MANEJADOR DE ERRORES (Recomendado) ---
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    console.error(`[ERROR] ${req.path}: ${err.message}`, err.stack); 

    res.status(statusCode).json({
        error: 'Error interno del servidor en la API CENTRAL.',
        detalle: err.message,
    });
});


// --- INICIO DEL SERVIDOR (NO SE MODIFICA) ---
app.listen(PORT, () => {
    console.log(`Servidor de API CENTRAL escuchando en el puerto: ${PORT}`);
});

process.on('SIGTERM', () => {
    console.log('[SHUTDOWN] Señal SIGTERM recibida. Terminando proceso de API CENTRAL...');
    process.exit(0);
});
