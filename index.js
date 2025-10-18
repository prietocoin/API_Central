// index.js (El Entry Point FINAL de la nueva API)

const express = require('express');
const app = express();
// Importamos la configuración de rangos y rutas
const config = require('./config/config'); 

// Importamos el Controlador y el Servicio
const dataController = require('./controllers/data.controller');
// Importamos asyncHandler desde el servicio (donde reside)
const sheetsService = require('./services/sheets.service');
const asyncHandler = sheetsService.asyncHandler; // Usamos el handler centralizado

// --- CONFIGURACIÓN DE ENTORNO DINÁMICA (Cargada y Validada Previamente) ---
const PORT = process.env.PORT || 8080;
const CLIENTE_ACTIVO = sheetsService.CLIENTE_ACTIVO; // Tomamos CLIENTE_ACTIVO del servicio

// --------------------------------------------------------------------------
// --- MIDDLEWARE GENERAL ---
// --------------------------------------------------------------------------

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    next();
});

// --------------------------------------------------------------------------
// --- RUTAS DE LA API (Cableado del Controlador) ---
// --------------------------------------------------------------------------

app.get('/salud', (req, res) => {
    res.json({
        status: 'OK',
        message: 'API Base funcionando, Express listo.',
        cliente_activo: CLIENTE_ACTIVO,
        // Eliminamos maestra_id_cargado de aquí, la lógica de IDs está en la capa Service
    });
});

// 1. /matriz-ganancia
app.get(config.RUTAS.RUTA_MATRIZ_GANANCIA, asyncHandler(dataController.getMatrizGanancia));

// 2. /tasas-ves
app.get(config.RUTAS.RUTA_TASAS_VES, asyncHandler(dataController.getTasasVES));

// 3. /tasas-fundablock
app.get(config.RUTAS.RUTA_TASAS_FUNDABLOCK, asyncHandler(dataController.getTasasFundablock));

// 4. /tasas-promedio
app.get(config.RUTAS.RUTA_TASAS_PROMEDIO, asyncHandler(dataController.getTasasPromedio));

// 5. /datos-imagen
app.get(config.RUTAS.RUTA_DATOS_IMAGEN, asyncHandler(dataController.getDatosImagen));

// 6. /tasas-cop_ves
app.get(config.RUTAS.RUTA_TASAS_COP_VES, asyncHandler(dataController.getTasasCopVes));

// 7. /convertir
app.get(config.RUTAS.RUTA_CONVERTIR, asyncHandler(dataController.getConvertir));


// --------------------------------------------------------------------------
// --- MIDDLEWARE CENTRALIZADO PARA MANEJO DE ERRORES (ÚLTIMO) ---
// --------------------------------------------------------------------------

app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    // El servicio nos da el CLIENTE_ACTIVO para el log
    console.error(`[ERROR ${statusCode} en ${req.path}] para cliente ${sheetsService.CLIENTE_ACTIVO}`, err.message, err.stack); 

    res.status(statusCode).json({
        error: `Error interno del servidor (${sheetsService.CLIENTE_ACTIVO}).`,
        detalle: err.message, // Detalle para diagnóstico
        ruta: req.path
    });
});


// --------------------------------------------------------------------------
// --- INICIO DEL SERVIDOR ---
// --------------------------------------------------------------------------

app.listen(PORT, () => {
    console.log(`Servidor API (CENTRAL) escuchando en el puerto: ${PORT} para cliente: ${CLIENTE_ACTIVO}`);
});

process.on('SIGTERM', () => {
    console.log('[SHUTDOWN] Señal SIGTERM recibida. Terminando...');
    process.exit(0);
});
