// index.js (Capa Única de Emergencia - Restaura funcionalidad y añade config dinámica)

const express = require('express');
const { google } = require('googleapis');
const fs = require('fs'); // Necesario para leer archivos de configuración
const app = express();

// --- CONSTANTES DE ENTORNO ---
const PORT = process.env.PORT || 8080;
const CREDENTIALS_PATH = '/workspace/credentials.json'; // Ruta de credenciales
const CONFIG_FILE_PATH = '/app/cliente_config.json'; // Archivo de configuración dinámica

// --- CONSTANTES DE HOJA DE CÁLCULO (DINÁMICAS) ---
let CLIENTE_ACTIVO;
let CLIENT_MAESTRA_ID;
let ENDPOINT_CONFIG;

// --- LÓGICA DE INICIALIZACIÓN (FUNCIÓN SÍNCRONA DE ARRANQUE) ---
try {
    // 1. Cargamos el cliente activo (Fundablock o Miguelacho)
    CLIENTE_ACTIVO = (process.env.CLIENTE_ACTIVO || 'DEFAULT').toUpperCase();

    // 2. Leemos el archivo de configuración JSON creado por Dockerfile
    if (!fs.existsSync(CONFIG_FILE_PATH)) {
        throw new Error(`[INIT] El archivo de configuración ${CONFIG_FILE_PATH} no existe.`);
    }
    const CLIENTE_CONFIG_JSON_STRING = fs.readFileSync(CONFIG_FILE_PATH, 'utf8');
    const allConfigs = JSON.parse(CLIENTE_CONFIG_JSON_STRING);

    // 3. Obtenemos la configuración específica
    const CLIENT_CONFIG = allConfigs[CLIENTE_ACTIVO];
    if (!CLIENT_CONFIG || !CLIENT_CONFIG.MAESTRA_ID || !CLIENT_CONFIG.ENDPOINTS) {
        throw new Error("La configuración del cliente (JSON) es válida, pero incompleta.");
    }

    CLIENT_MAESTRA_ID = CLIENT_CONFIG.MAESTRA_ID;
    ENDPOINT_CONFIG = CLIENT_CONFIG.ENDPOINTS;

    console.log(`[INIT] Configuración de cliente cargada: ${CLIENTE_ACTIVO}.`);

} catch (error) {
    console.error(`[ERROR CRÍTICO] Fallo en el arranque o inicialización: ${error.message}`);
    // Si falla la inicialización, cerramos el proceso inmediatamente
    process.exit(1);
}

// --- CONSTANTES DE REFERENCIA DE HOJAS (Ahora se leen de ENDPOINT_CONFIG) ---
function getConfig(endpointName) {
    const config = ENDPOINT_CONFIG[endpointName];
    if (!config || !config.HOJA || !config.RANGO) {
        throw new Error(`[Config Error] Faltan HOJA/RANGO para el endpoint: ${endpointName}.`);
    }
    return config;
}

// Convierte cadena con coma decimal a número
function parseFactor(factorString) {
    if (typeof factorString !== 'string') return 1.0;
    return parseFloat(factorString.replace(',', '.')) || 1.0;
}

// Transforma la respuesta de Sheets en un array de objetos JSON
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
            const key = header;
            obj[key] = row[index] || '';
        });
        return obj;
    }).filter(obj => Object.values(obj).some(val => val !== ''));
}

// --- FUNCIÓN PRINCIPAL DE GOOGLE SHEETS (Migrada y adaptada al cliente dinámico) ---
// Retorna valores crudos para rangos de procesamiento especial 
async function getSheetData(endpointName, isRaw = false) {
    const config = getConfig(endpointName);
    const spreadsheetId = config.ID || CLIENT_MAESTRA_ID; // Usa ID específico o Maestro
    
    const auth = new google.auth.GoogleAuth({
        keyFile: CREDENTIALS_PATH,
        scopes: 'https://www.googleapis.com/auth/spreadsheets.readonly',
    });

    const sheets = google.sheets({ version: 'v4', auth });

    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: spreadsheetId,
            range: `${config.HOJA}!${config.RANGO}`,
        });

        const values = response.data.values;
        if (!values || values.length === 0) return [];

        // Si se pide raw (para Tasas VES), o si el endpoint requiere raw (Ejemplo del V1)
        if (isRaw || config.RAW_OUTPUT) {
            return values;
        }

        // Lógica de filtrado de última fila (Mercado)
        if (config.ULTIMA_FILA) {
            const data = transformToObjects(values);
            if(data.length > 0) {
                const latestRow = data[data.length - 1];
                return [latestRow];
            }
            return [];
        }

        return transformToObjects(values);

    } catch (err) {
        console.error(`Error en ${endpointName} (ID: ${spreadsheetId}): ${err.message}`);
        throw new Error(`Error al obtener datos de Sheets para ${endpointName}.`);
    }
}


// --- MIDDLEWARE Y RUTA RAÍZ ---
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    next();
});

// Helper para envolver async
const asyncHandler = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// Ruta de salud
app.get('/salud', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Servicio Restaurado y Listo.',
        cliente_activo: CLIENTE_ACTIVO,
        maestra_id: CLIENT_MAESTRA_ID
    });
});

// 1. Obtener la última fila de Precios Promedio (Hoja Mercado)
app.get('/tasas-promedio', asyncHandler(async (req, res) => {
    let data = await getSheetData('PRECIOS_PROMEDIO');
    res.json(data);
}));

// 2. Obtener la Matriz de Ganancia (Hoja Miguelacho)
app.get('/matriz-ganancia', asyncHandler(async (req, res) => {
    const data = await getSheetData('MATRIZ_GANANCIA');
    res.json(data);
}));

// *** 3. TASA VES (Ruta de lógica compleja - Requiere dos rangos) ***
app.get('/tasas-ves', asyncHandler(async (req, res) => {
    const config = ENDPOINT_CONFIG.TASAS_VES;

    // Aquí necesitamos leer dos rangos y combinarlos (headers y valores)
    const auth = new google.auth.GoogleAuth({ keyFile: CREDENTIALS_PATH, scopes: 'https://www.googleapis.com/auth/spreadsheets.readonly', });
    const sheets = google.sheets({ version: 'v4', auth });
    
    // Leemos headers
    const headersResponse = await sheets.spreadsheets.values.get({ 
        spreadsheetId: CLIENT_MAESTRA_ID, 
        range: `${config.HOJA}!${config.RANGO_HEADERS}`,
    });
    // Leemos valores
    const valuesResponse = await sheets.spreadsheets.values.get({ 
        spreadsheetId: CLIENT_MAESTRA_ID, 
        range: `${config.HOJA}!${config.RANGO_VALORES}`,
    });

    const headersArray = headersResponse.data.values;
    const valuesArray = valuesResponse.data.values;

    if (!headersArray || headersArray.length === 0 || !valuesArray || valuesArray.length === 0) {
        return res.json([]);
    }
    
    const headers = headersArray[0];
    const values = valuesArray[0];
            
    const resultObject = {};
    if (Array.isArray(headers) && Array.isArray(values)) {
        headers.forEach((header, index) => {
            resultObject[header.trim() || `Columna${index}`] = values[index] || '';
        });
    }
    
    res.json([resultObject]);
}));

// 4. Obtener Datos de Imagen
app.get('/datos-imagen', asyncHandler(async (req, res) => {
    const data = await getSheetData('DATOS_IMAGEN');
    res.json(data);
}));


// 5. TASAS FUNDABLOCK (Usa el ID específico si está en el JSON)
app.get('/tasas-fundablock', asyncHandler(async (req, res) => {
    const data = await getSheetData('FUNDABLOCK');
    res.json(data);
}));

// 6. TASAS COP/VES (Ruta de lógica compleja - Requiere dos rangos)
app.get('/tasas-cop_ves', asyncHandler(async (req, res) => {
    const config = ENDPOINT_CONFIG.TASAS_COP_VES;

    // Aquí necesitamos leer dos rangos y combinarlos (headers y valores)
    const auth = new google.auth.GoogleAuth({ keyFile: CREDENTIALS_PATH, scopes: 'https://www.googleapis.com/auth/spreadsheets.readonly', });
    const sheets = google.sheets({ version: 'v4', auth });

    // Leemos headers
    const headersResponse = await sheets.spreadsheets.values.get({ 
        spreadsheetId: CLIENT_MAESTRA_ID, 
        range: `${config.HOJA}!${config.RANGO_HEADERS}`,
    });
    // Leemos valores
    const valuesResponse = await sheets.spreadsheets.values.get({ 
        spreadsheetId: CLIENT_MAESTRA_ID, 
        range: `${config.HOJA}!${config.RANGO_VALORES}`,
    });

    const headersArray = headersResponse.data.values;
    const valuesArray = valuesResponse.data.values;

    if (!headersArray || headersArray.length < 2 || !valuesArray || valuesArray.length < 2) {
        return res.json([]);
    }
    
    const headers = headersArray[0];
    const values = valuesArray[0];
            
    const resultObject = {};
    if (Array.isArray(headers) && Array.isArray(values)) {
        headers.forEach((header, index) => {
            // Normalizar la coma a punto decimal
            resultObject[header.trim().toUpperCase() || `Columna${index}`] = (values[index] || '').replace(',', '.');
        });
    }
    
    res.json([resultObject]);
}));


// 7. SERVICIO DE CONVERSIÓN CENTRALIZADO (RUTA ORIGINAL)
app.get('/convertir', asyncHandler(async (req, res) => {
    // Lógica de conversión...
    res.json({
        error: "Servicio de Conversión aún no implementado",
        query: req.query
    });
}));


// --- MIDDLEWARE CENTRALIZADO PARA MANEJO DE ERRORES ---
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    
    console.error(`[ERROR ${statusCode} en ${req.path}] para cliente ${CLIENTE_ACTIVO}`, err.message, err.stack); 

    res.status(statusCode).json({
        error: `Fallo interno del servidor.`,
        detalle: err.message, 
        ruta: req.path
    });
});


// --- INICIO DEL SERVIDOR ---
app.listen(PORT, () => {
    console.log(`Servidor de API escuchando en el puerto: ${PORT} para cliente: ${CLIENTE_ACTIVO}`);
});

process.on('SIGTERM', () => {
    console.log('[SHUTDOWN] Señal SIGTERM recibida. Terminando proceso...');
    process.exit(0);
});
