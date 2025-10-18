// services/sheets.service.js

const { google } = require('googleapis');
const NodeCache = require('node-cache'); // Mantener la dependencia para el caching
// Importamos la configuración dinámica del Entry Point
// NOTA: Para este servicio funcionar solo, necesitamos que index.js lo inicialice con las variables de entorno.

const CREDENTIALS_PATH = '/workspace/credentials.json'; // Usamos la ruta original (solución de credentials)

// --- CONSTANTES GLOBALES DE ESTA CAPA (Variables de Estado) ---
const CLIENTE_ACTIVO = (process.env.CLIENTE_ACTIVO || 'DEFAULT').toUpperCase(); 
const CLIENTE_CONFIG_JSON = process.env.CLIENTE_CONFIG_JSON || "{}"; 
const dataCache = new NodeCache({ stdTTL: 300 }); 

let CLIENT_MAESTRA_ID;
let ENDPOINT_CONFIG; 
let auth, sheets;

// --------------------------------------------------------------------------
// --- LÓGICA CORE: INICIALIZACIÓN DE GOOGLE SHEETS (SINGLETON) ---
// --------------------------------------------------------------------------

function initializeSheetsService() {
    try {
        // 1. Cargar Configuración de Cliente (IDs y Rangos/Hojas Dinámicas)
        const allConfigs = JSON.parse(CLIENTE_CONFIG_JSON);
        const CLIENT_CONFIG = allConfigs[CLIENTE_ACTIVO];
        
        if (!CLIENT_CONFIG || !CLIENT_CONFIG.MAESTRA_ID || !CLIENT_CONFIG.ENDPOINTS) {
            throw new Error("La configuración del cliente (JSON) está incompleta.");
        }

        CLIENT_MAESTRA_ID = CLIENT_CONFIG.MAESTRA_ID;
        ENDPOINT_CONFIG = CLIENT_CONFIG.ENDPOINTS;

        // 2. Autenticación usando la ruta de archivo (Tu solución de credentials)
        auth = new google.auth.GoogleAuth({
            keyFile: CREDENTIALS_PATH,
            scopes: 'https://www.googleapis.com/auth/spreadsheets.readonly',
        });
        
        sheets = google.sheets({ version: 'v4', auth });

        console.log(`[SERVICE] Sheets inicializado y listo. Cliente: ${CLIENTE_ACTIVO}.`);
        
    } catch (error) {
        console.error(`[SERVICE] ERROR CRÍTICO al inicializar Sheets o cargar config: ${error.message}`);
        process.exit(1); 
    }
}
initializeSheetsService();


// --------------------------------------------------------------------------
// --- FUNCIÓN DE TRANSFORMACIÓN (Migrada) ---
// --------------------------------------------------------------------------

function transformToObjects(data) {
    // ... (Tu lógica de transformación de array a objeto JSON)
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
            const key = header;
            obj[key] = row[index] || '';
        });
        return obj;
    }).filter(obj => Object.values(obj).some(val => val !== ''));
}


// --------------------------------------------------------------------------
// --- FUNCIÓN CENTRAL DE I/O (El corazón de la API) ---
// --------------------------------------------------------------------------

/**
 * Función central para leer datos de la hoja de cálculo.
 * @param {string} endpointName - Clave del endpoint (ej., 'MATRIZ_GANANCIA') para buscar config.
 */
async function getSheetData(endpointName) {
    const config = ENDPOINT_CONFIG[endpointName];

    if (!config || !config.HOJA || !config.RANGO) {
        throw new Error(`Configuración de HOJA/RANGO incompleta para el endpoint: ${endpointName}.`);
    }

    // ID Dinámico: puede ser específico del endpoint (ej. Fundablock) o el MAESTRA_ID
    const spreadsheetId = config.ID || CLIENT_MAESTRA_ID;
    
    try {
        const response = await sheets.spreadsheets.values.get({ 
            spreadsheetId: spreadsheetId, 
            range: `${config.HOJA}!${config.RANGO}`, // Usa la HOJA y RANGO dinámicos
        });

        const values = response.data.values;
        if (!values || values.length === 0) return [];

        // Por defecto, devolvemos la versión transformada
        return transformToObjects(values);

    } catch (err) {
        console.error(`[Sheets API] Error al leer ${endpointName} (ID: ${spreadsheetId}): ${err.message}`);
        throw new Error(`Error de I/O de Sheets para ${endpointName}.`);
    }
}


// --------------------------------------------------------------------------
// --- EXPORTACIÓN PÚBLICA (Funciones de Acceso y Herramientas) ---
// --------------------------------------------------------------------------

// Middleware para Express
const asyncHandler = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// Exportamos la función I/O central para que los controladores la usen
module.exports = {
    asyncHandler,
    getSheetData,
    // Exportamos el cliente activo para logging
    CLIENTE_ACTIVO
    // ... Las funciones de caching se añadirán aquí con el resto del servicio
};
