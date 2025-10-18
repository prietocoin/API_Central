// index.js (El Entry Point FINAL de la nueva API)

const express = require('express');
const app = express();

// Importamos el servicio para forzar su inicialización y obtener herramientas
const sheetsService = require('./services/sheets.service'); 
const dataController = require('./controllers/data.controller');

// Desestructuración de herramientas para un código limpio
const asyncHandler = sheetsService.asyncHandler; 
const CLIENTE_ACTIVO = sheetsService.CLIENTE_ACTIVO; 
const PORT = process.env.PORT || 8080;

// --- CONFIGURACIÓN DE RUTAS FIJAS (Migradas del original) ---
const RUTAS = {
    RUTA_TASAS_FUNDABLOCK: '/tasas-fundablock',
    RUTA_TASAS_COP_VES: '/tasas-cop_ves',
    RUTA_TASAS_PROMEDIO: '/tasas-promedio',
    RUTA_MATRIZ_GANANCIA: '/matriz-ganancia',
    RUTA_TASAS_VES: '/tasas-ves',
    RUTA_DATOS_IMAGEN: '/datos-imagen',
    RUTA_CONVERTIR: '/convertir',
};

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
        message: 'API V2 operativa.',
        cliente_activo: CLIENTE_ACTIVO,
    });
});

// 1. /matriz-ganancia
app.get(RUTAS.RUTA_MATRIZ_GANANCIA, asyncHandler(dataController.getMatrizGanancia));

// 2. /tasas-ves
app.get(RUTAS.RUTA_TASAS_VES, asyncHandler(dataController.getTasasVES));

// 3. /tasas-fundablock
app.get(RUTAS.RUTA_TASAS_FUNDABLOCK, asyncHandler(dataController.getTasasFundablock));

// 4. /tasas-promedio
app.get(RUTAS.RUTA_TASAS_PROMEDIO, asyncHandler(dataController.getTasasPromedio));

// 5. /datos-imagen
app.get(RUTAS.RUTA_DATOS_IMAGEN, asyncHandler(dataController.getDatosImagen));

// 6. /tasas-cop_ves
app.get(RUTAS.RUTA_TASAS_COP_VES, asyncHandler(dataController.getTasasCopVes));

// 7. /convertir
app.get(RUTAS.RUTA_CONVERTIR, asyncHandler(dataController.getConvertir));


// --------------------------------------------------------------------------
// --- MIDDLEWARE CENTRALIZADO PARA MANEJO DE ERRORES (ÚLTIMO) ---
// --------------------------------------------------------------------------

app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
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
