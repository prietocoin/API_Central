// index.js (El Entry Point de la nueva API)

const express = require('express');
const app = express();
// No se requiere ./config/config.js, ya que la configuración es dinámica

// --- CONFIGURACIÓN DE ENTORNO DINÁMICA ---
const PORT = process.env.PORT || 8080;
const CLIENTE_ACTIVO = (process.env.CLIENTE_ACTIVO || 'DEFAULT').toUpperCase(); 
const CLIENTE_CONFIG_JSON = process.env.CLIENTE_CONFIG_JSON || "{}"; 

let CLIENT_MAESTRA_ID;
let ENDPOINT_CONFIG; 

try {
    const allConfigs = JSON.parse(CLIENTE_CONFIG_JSON);
    const CLIENT_CONFIG = allConfigs[CLIENTE_ACTIVO];
    
    if (!CLIENT_CONFIG || !CLIENT_CONFIG.MAESTRA_ID || !CLIENT_CONFIG.ENDPOINTS) {
        throw new Error("La configuración del cliente (JSON) está incompleta o mal formateada.");
    }

    CLIENT_MAESTRA_ID = CLIENT_CONFIG.MAESTRA_ID;
    ENDPOINT_CONFIG = CLIENT_CONFIG.ENDPOINTS;

} catch (error) {
    console.error(`[INIT] ERROR CRÍTICO DE CONFIGURACIÓN: ${error.message}`);
    process.exit(1); 
}

// --------------------------------------------------------------------------
// --- MIDDLEWARE GENERAL Y RUTA DE PRUEBA (/salud) ---
// --------------------------------------------------------------------------

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    next();
});

app.get('/salud', (req, res) => {
    res.json({
        status: 'OK',
        message: 'API Base funcionando, Express listo.',
        cliente_activo: CLIENTE_ACTIVO,
        maestra_id_cargado: CLIENT_MAESTRA_ID 
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
