// index.js (El Router Final - Arquitectura Genérica)

const express = require('express');
const constants = require('./constants');
const sheetsService = require('./services/sheets.service'); // Para asyncHandler
const dataController = require('./controllers/data.controller'); // Lógica de la petición/respuesta
const app = express();

// --- CONFIGURACIÓN DE ENTORNO ---
const PORT = process.env.PORT || 8081; 

// --- MIDDLEWARE ---
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    next();
});

// --- ¡CAMBIO CLAVE! AÑADIR PARSER DE JSON ---
// Esto es OBLIGATORIO para leer el 'body' de las peticiones POST 
// (donde vendrán el id, hoja, rango y formato)
app.use(express.json());

// --- RUTA RAÍZ (Documentación Actualizada) ---
app.get('/', (req, res) => {
    const hostUrl = req.headers.host;

    // --- CAMBIO: Simplificar endpoints a la nueva ruta genérica ---
    const htmlContent = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>API CENTRAL - (Genérica)</title>
            <style>
                body { font-family: Arial, sans-serif; background-color: #0d1117; color: #c9d1d9; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
                .container { background-color: #161b22; padding: 30px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5); width: 90%; max-width: 600px; }
                h1 { color: #58a6ff; border-bottom: 2px solid #30363d; padding-bottom: 10px; margin-top: 0; }
                .endpoint-list { list-style: none; padding: 0; }
                .endpoint-item { margin-bottom: 15px; background-color: #21262d; padding: 15px; border-radius: 8px; }
                .endpoint-item a { text-decoration: none; color: #58a6ff; font-weight: bold; display: block; font-size: 1.1em; margin-bottom: 5px; word-wrap: break-word; }
                .endpoint-item p { margin: 0; color: #8b949e; font-size: 0.9em; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>API CENTRAL en Línea (Arquitectura Genérica)</h1>
                <p>Esta API expone un único endpoint genérico (POST) para consultar Google Sheets:</p>
                <ul class="endpoint-list">
                    <li class="endpoint-item">
                        <a>${hostUrl}${constants.RUTAS.RUTA_QUERY} (Método: POST)</a>
                        <p>Envía un JSON en el body con: { id, hoja, rango, formato }.</p>
                        <p>Formatos válidos: "raw", "json", "json_ultima_fila", "json_clave_valor".</p>
                    </li>
                </ul>
                <p style="text-align: center; font-size: 0.8em; color: #484f58;">Arquitectura Genérica v3.0</p>
            </div>
        </body>
        </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.send(htmlContent);
});

// --- RUTAS DE LA API (DELEGADAS AL CONTROLADOR) ---
const asyncHandler = sheetsService.asyncHandler;

// --- ¡CAMBIO CLAVE! Rutas antiguas eliminadas ---
/*
app.get(constants.RUTAS.RUTA_TASAS_PROMEDIO, ...);
app.get(constants.RUTAS.RUTA_MATRIZ_GANANCIA, ...);
app.get(constants.RUTAS.RUTA_TASAS_VES, ...);
app.get(constants.RUTAS.RUTA_DATOS_IMAGEN, ...);
app.get(constants.RUTAS.RUTA_TASAS_FUNDABLOCK, ...);
app.get(constants.RUTAS.RUTA_TASAS_COP_VES, ...);
app.get(constants.RUTAS.RUTA_CONVERTIR, ...);
*/

// --- ¡CAMBIO CLAVE! Nueva ruta genérica POST ---
// Esta ruta recibirá {id, hoja, rango, formato} en el body
app.post(constants.RUTAS.RUTA_QUERY, asyncHandler(dataController.postQueryGenerico));


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
