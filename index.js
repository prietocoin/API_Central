// index.js (El Entry Point FINAL de la nueva API)

const express = require('express');
const app = express();

// Importamos el Controlador
const dataController = require('./controllers/data.controller');
// ⚠️ CORRECCIÓN: Importamos el servicio completo para garantizar la inicialización
const sheetsService = require('./services/sheets.service'); 

// Accedemos a las funciones y variables DEL OBJETO IMPORTADO, no por desestructuración
const asyncHandler = sheetsService.asyncHandler;
const CLIENTE_ACTIVO = sheetsService.CLIENTE_ACTIVO; 

// --- CONFIGURACIÓN DE ENTORNO DINÁMICA ---
const PORT = process.env.PORT || 8080;

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

// Usamos rutas literales ya que la configuración de rutas estáticas se eliminó
app.get('/matriz-ganancia', asyncHandler(dataController.getMatrizGanancia)); 
app.get('/tasas-ves', asyncHandler(dataController.getTasasVES));
app.get('/tasas-fundablock', asyncHandler(dataController.getTasasFundablock));
app.get('/tasas-promedio', asyncHandler(dataController.getTasasPromedio));
app.get('/datos-imagen', asyncHandler(dataController.getDatosImagen));
app.get('/tasas-cop_ves', asyncHandler(dataController.getTasasCopVes));
app.get('/convertir', asyncHandler(dataController.getConvertir));


// --------------------------------------------------------------------------
// --- MIDDLEWARE CENTRALIZADO PARA MANEJO DE ERRORES (ÚLTIMO) ---
// --------------------------------------------------------------------------

app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    // Accedemos de forma segura a la propiedad del objeto
    const cliente = sheetsService.CLIENTE_ACTIVO || 'DESCONOCIDO'; 
    
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
