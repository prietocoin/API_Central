// index.js (El Entry Point FINAL de la nueva API)

const express = require('express');
const app = express();
// Importamos la configuración de rangos y rutas
const config = require('./config/config'); 

// Importamos el Controlador
const dataController = require('./controllers/data.controller');
// Importamos asyncHandler directamente del objeto sheetsService para que Node.js lo reconozca
const { asyncHandler, CLIENTE_ACTIVO } = require('./services/sheets.service'); // <--- ¡CORRECCIÓN!

// --- CONFIGURACIÓN DE ENTORNO DINÁMICA (Cargada y Validada Previamente) ---
const PORT = process.env.PORT || 8080;
// No necesitamos definir CLIENTE_ACTIVO de nuevo, lo tomamos de la desestructuración
// const CLIENTE_ACTIVO = sheetsService.CLIENTE_ACTIVO; // Línea que se elimina

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
    // Debemos acceder a CLIENTE_ACTIVO de forma segura si el servicio falló al iniciar
    const cliente = sheetsService ? sheetsService.CLIENTE_ACTIVO : 'DESCONOCIDO'; 
    
    console.error(`[ERROR ${statusCode} en ${req.path}] para cliente ${cliente}`, err.message, err.stack); 

    res.status(statusCode).json({
        error: `Error interno del servidor (${cliente}).`,
        detalle: err.message, 
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
