// index.js (SOLUCIÓN DE EMERGENCIA: Capa Única, minimiza errores de módulo)

const express = require('express');
const { google } = require('googleapis');
const NodeCache = require('node-cache');
const fs = require('fs'); // Necesario para leer archivos de configuración
const app = express();

// --- CONSTANTES DE ENTORNO Y CONFIGURACIÓN ---
const PORT = process.env.PORT || 8080;
const CREDENTIALS_PATH = '/workspace/credentials.json';
const CONFIG_FILE_PATH = '/app/cliente_config.json'; 

const CLIENTE_ACTIVO = (process.env.CLIENTE_ACTIVO || 'DEFAULT').toUpperCase(); 
const dataCache = new NodeCache({ stdTTL: 300 }); 

let CLIENT_MAESTRA_ID;
let ENDPOINT_CONFIG; 
let auth, sheets;

// --- INICIALIZACIÓN CORE (TODO EN ESTE ARCHIVO) ---

try {
    // 1. Cargar Configuración de Cliente (IDs y Rangos Dinámicos)
    if (!fs.existsSync(CONFIG_FILE_PATH)) {
        throw new Error(`El archivo de configuración ${CONFIG_FILE_PATH} no existe.`);
    }
    const CLIENTE_CONFIG_JSON_STRING = fs.readFileSync(CONFIG_FILE_PATH, 'utf8'); 
    
    const allConfigs = JSON.parse(CLIENTE_CONFIG_JSON_STRING);
    const CLIENT_CONFIG = allConfigs[CLIENTE_ACTIVO];
    
    if (!CLIENT_CONFIG || !CLIENT_CONFIG.MAESTRA_ID || !CLIENT_CONFIG.ENDPOINTS) {
        throw new Error("La configuración del cliente (JSON) es válida, pero incompleta.");
    }

    CLIENT_MAESTRA_ID = CLIENT_CONFIG.MAESTRA_ID;
    ENDPOINT_CONFIG = CLIENT_CONFIG.ENDPOINTS;

    // 2. Autenticación Singleton (Usando la ruta de archivo)
    auth = new google.auth.GoogleAuth({
        keyFile: CREDENTIALS_PATH,
        scopes: 'https://www.googleapis.com/auth/spreadsheets.readonly',
    });
    
    sheets = google.sheets({ version: 'v4', auth });

    console.log(`[INIT OK] Servicio iniciado para cliente: ${CLIENTE_ACTIVO}.`);
    
} catch (error) {
    console.error(`[ERROR CRÍTICO] Fallo en el arranque o inicialización: ${error.message}`);
    process.exit(1); 
}

// --- FUNCIONES AUXILIARES (Migradas) ---

function transformToObjects(data) {
    if (!data || data.length === 0) return [];
    
    let headerRowIndex = 0;
    while (headerRowIndex < data.length && data[headerRowIndex].filter(String).length === 0) {
        headerRowIndex++;
    }
    
    if (headerRowIndex >= data.length) return [];
    
    const headers = data[headerRowIndex].map(h => h ? h.trim() : '');
    const rows = data.slice(headerRowIndex + 1);

    return rows.map(row => {
        const obj = {};
        headers.forEach((header, index) => {
            obj[key] = row[index] || '';
        });
        return obj;
    }).filter(obj => Object.values(obj).some(val => val !== ''));
}

// Middleware de manejo de errores (ahora local)
const asyncHandler = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// --- FUNCIÓN CENTRAL DE I/O (simplificada) ---

async function getSheetData(endpointName) {
    const config = ENDPOINT_CONFIG[endpointName];
    // Se asume validación previa en initialize

    const spreadsheetId = config.ID || CLIENT_MAESTRA_ID;
    
    try {
        const response = await sheets.spreadsheets.values.get({ 
            spreadsheetId: spreadsheetId, 
            range: `${config.HOJA}!${config.RANGO}`, 
        });

        const values = response.data.values;
        if (!values || values.length === 0) return [];

        // Por simplicidad, solo devolvemos los valores crudos para la prueba
        return values; 

    } catch (err) {
        console.error(`[Sheets API] Error al leer ${endpointName} (ID: ${spreadsheetId}): ${err.message}`);
        throw new Error(`Error de I/O de Sheets para ${endpointName}.`);
    }
}


// --------------------------------------------------------------------------
// --- RUTAS (Endpoints) ---
// --------------------------------------------------------------------------

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    next();
});

app.get('/salud', (req, res) => {
    // Si llegamos aquí, el servicio de Sheets se inicializó
    res.json({
        status: 'OK',
        message: 'Servicio RESTAURADO. Inicialización de Sheets OK.',
        cliente_activo: CLIENTE_ACTIVO,
    });
});

// Ruta de prueba simple para la conexión a Sheets
app.get('/test-matriz', asyncHandler(async (req, res) => {
    // Usamos el endpoint MATRIZ_GANANCIA para probar la conexión
    const data = await getSheetData('MATRIZ_GANANCIA');
    res.json({
        endpoint: 'Matriz Ganancia (Test)',
        status: 'Conexión Exitosa',
        data_rows: data.length,
        first_row: data[0] // Muestra los datos crudos para verificación
    });
}));


// --- MANEJO DE ERRORES FINAL ---

app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    console.error(`[ERROR ${statusCode} GENERAL]`, err.message, err.stack); 

    res.status(statusCode).json({
        error: `Fallo interno del servidor.`,
        detalle: err.message,
    });
});


// --- INICIO DEL SERVIDOR ---

app.listen(PORT, () => {
    console.log(`Servidor API (EMERGENCIA) escuchando en el puerto: ${PORT}.`);
});
