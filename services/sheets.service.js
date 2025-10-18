// services/sheets.service.js
// Contiene la lógica central de I/O, Autenticación, Caching y la lógica de IDs dinámicos.

const { google } = require('googleapis');
const NodeCache = require('node-cache');

// --- CONSTANTES GLOBALES DE ESTA CAPA (Variables de Estado) ---
const CREDENTIALS_PATH = '/workspace/credentials.json'; // Ruta de credenciales
const CLIENTE_ACTIVO = (process.env.CLIENTE_ACTIVO || 'DEFAULT').toUpperCase(); 
const CLIENTE_CONFIG_JSON = process.env.CLIENTE_CONFIG_JSON || "{}"; 

const dataCache = new NodeCache({ stdTTL: 300 }); // Inicialización del Cache

let CLIENT_MAESTRA_ID;
let ENDPOINT_CONFIG; 
let auth, sheets;

// --------------------------------------------------------------------------
// --- LÓGICA CORE: INICIALIZACIÓN, AUTENTICACIÓN Y CARGA DE CONFIG ---
// --------------------------------------------------------------------------

function initializeSheetsService() {
    try {
        // 1. Cargar Configuración de Cliente (IDs y Rangos/Hojas Dinámicas)
        const allConfigs = JSON.parse(CLIENTE_CONFIG_JSON);
        const CLIENT_CONFIG = allConfigs[CLIENTE_ACTIVO];
        
        if (!CLIENT_CONFIG || !CLIENT_CONFIG.MAESTRA_ID || !CLIENT_CONFIG.ENDPOINTS) {
            throw new Error("La configuración del cliente (JSON) está incompleta o mal formateada.");
        }

        CLIENT_MAESTRA_ID = CLIENT_CONFIG.MAESTRA_ID;
        ENDPOINT_CONFIG = CLIENT_CONFIG.ENDPOINTS;

        // 2. Autenticación usando la ruta de archivo (Tu solución de credentials)
        auth = new google.auth.GoogleAuth({
            keyFile: CREDENTIALS_PATH,
            scopes: 'https://www.googleapis.com/auth/spreadsheets.readonly',
        });
        
        sheets = google.sheets({ version: 'v4', auth });

        console.log(`[SERVICE] Sheets inicializado OK. Cliente: ${CLIENTE_ACTIVO}.`);
        
    } catch (error) {
        console.error(`[SERVICE] ERROR CRÍTICO al inicializar Sheets o cargar config: ${error.message}`);
        process.exit(1); 
    }
}
initializeSheetsService();


// --------------------------------------------------------------------------
// --- LÓGICA DE TRANSFORMACIÓN Y UTILERÍAS ---
// --------------------------------------------------------------------------

// Convierte cadena con coma decimal a número (ej. "0,93" -> 0.93)
function parseFactor(factorString) {
    if (typeof factorString !== 'string') return 1.0;
    // Utilizamos replace para normalizar la coma decimal
    return parseFloat(factorString.replace(',', '.')) || 1.0;
}

// Transforma la respuesta de Sheets en un array de objetos JSON
function transformToObjects(data) {
    if (!data || data.length === 0) return [];
    
    // Lógica para encontrar la fila de encabezados
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
// --- FUNCIÓN CENTRAL DE I/O (CORE) ---
// --------------------------------------------------------------------------

/**
 * Función central para leer datos de la hoja de cálculo.
 * @param {string} endpointName - Clave del endpoint (e.g., 'MATRIZ_GANANCIA') para buscar config.
 * @param {boolean} skipTransform - Si es true, devuelve los valores crudos.
 */
async function getSheetData(endpointName, skipTransform = false) {
    const config = ENDPOINT_CONFIG[endpointName];

    if (!config || !config.HOJA || !config.RANGO) {
        throw new Error(`Configuración de HOJA/RANGO incompleta para el endpoint: ${endpointName}.`);
    }

    // El ID de la hoja de cálculo puede ser específico del endpoint (ID) o el MAESTRA_ID
    const spreadsheetId = config.ID || CLIENT_MAESTRA_ID;
    
    try {
        const response = await sheets.spreadsheets.values.get({ 
            spreadsheetId: spreadsheetId, 
            range: `${config.HOJA}!${config.RANGO}`, 
        });

        const values = response.data.values;
        if (!values || values.length === 0) return [];

        if (skipTransform) return values;

        // Lógica de filtrado de última fila (Se aplica si el JSON de config tiene ULTIMA_FILA: true)
        if (config.ULTIMA_FILA) { 
            const data = transformToObjects(values);
            return (data.length > 0) ? [data[data.length - 1]] : [];
        }

        return transformToObjects(values);

    } catch (err) {
        console.error(`[Sheets API] Error al leer ${endpointName} (ID: ${spreadsheetId}): ${err.message}`);
        throw new Error(`Error de I/O de Sheets para ${endpointName}. Detalle: ${err.message}`);
    }
}


// --------------------------------------------------------------------------
// --- FUNCIONES EXPORTABLES POR ENDPOINT (Lógica de Caching) ---
// --------------------------------------------------------------------------

// Middleware para envolver funciones asíncronas y capturar excepciones (para Express)
const asyncHandler = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// Función genérica para obtener datos con lógica de caché
async function getCachedData(endpointName, dataFetcher) {
    const cacheKey = `${CLIENTE_ACTIVO}-${endpointName}`;
    let data = dataCache.get(cacheKey);

    if (data) return data;

    data = await dataFetcher();
    dataCache.set(cacheKey, data);
    return data;
}

// Exportación del objeto de servicio
module.exports = {
    asyncHandler,
    CLIENTE_ACTIVO,
    
    // 1. Matriz de Ganancia
    getMatrizGanancia: () => getCachedData('MATRIZ_GANANCIA', () => {
        return getSheetData('MATRIZ_GANANCIA'); 
    }),

    // 2. Tasas VES (Requiere lógica de doble lectura de rangos: RANGO_HEADERS y RANGO_VALORES)
    getTasasVES: () => getCachedData('TASAS_VES', async () => {
        const config = ENDPOINT_CONFIG.TASAS_VES;

        // Lectura del primer rango (Headers)
        const headersResponse = await sheets.spreadsheets.values.get({ 
            spreadsheetId: CLIENT_MAESTRA_ID, 
            range: `${config.HOJA}!${config.RANGO_HEADERS}`,
        });
        // Lectura del segundo rango (Valores)
        const valuesResponse = await sheets.spreadsheets.values.get({ 
            spreadsheetId: CLIENT_MAESTRA_ID, 
            range: `${config.HOJA}!${config.RANGO_VALORES}`,
        });
        
        const headersArray = headersResponse.data.values;
        const valuesArray = valuesResponse.data.values;
        
        if (!headersArray || headersArray.length === 0 || !valuesArray || valuesArray.length === 0) return [];
        
        // Lógica de combinación:
        const headers = headersArray[0];
        const values = valuesArray[0];
        const resultObject = {};

        if (Array.isArray(headers) && Array.isArray(values)) {
            headers.forEach((header, index) => {
                resultObject[header.trim() || `Columna${index}`] = values[index] || '';
            });
        }
        return [resultObject];
    }),
    
    // 3. Tasas Fundablock
    getTasasFundablock: () => getCachedData('FUNDABLOCK', () => {
        return getSheetData('FUNDABLOCK');
    }),
    
    // 4. Tasas Promedio
    getTasasPromedio: () => getCachedData('PRECIOS_PROMEDIO', () => {
        return getSheetData('PRECIOS_PROMEDIO'); 
    }),
    
    // 5. Datos Imagen
    getDatosImagen: () => getCachedData('DATOS_IMAGEN', () => {
        return getSheetData('DATOS_IMAGEN'); 
    }),
    
    // 6. Tasas COP/VES (Similar a Tasas VES, asume HOJA, RANGO_HEADERS y RANGO_VALORES)
    getTasasCopVes: () => getCachedData('TASAS_COP_VES', async () => {
        const config = ENDPOINT_CONFIG.TASAS_COP_VES;

        const headersResponse = await sheets.spreadsheets.values.get({ 
            spreadsheetId: CLIENT_MAESTRA_ID, 
            range: `${config.HOJA}!${config.RANGO_HEADERS}`,
        });
        const valuesResponse = await sheets.spreadsheets.values.get({ 
            spreadsheetId: CLIENT_MAESTRA_ID, 
            range: `${config.HOJA}!${config.RANGO_VALORES}`,
        });

        const headersArray = headersResponse.data.values;
        const valuesArray = valuesResponse.data.values;
        
        if (!headersArray || headersArray.length === 0 || !valuesArray || valuesArray.length === 0) return [];

        const ratesObject = {};
        const headers = headersArray[0] || [];
        const values = valuesArray[0] || []; 
        
        if (Array.isArray(headers) && Array.isArray(values)) {
            for (let index = 0; index < values.length; index++) {
                const key = headers[index] ? headers[index].trim().toUpperCase() : null;
                const value = values[index] || '';

                if (key) {
                    ratesObject[key] = value.replace(',', '.'); 
                }
            }
        }
        return [ratesObject];
    }),

    // 7. Implementación de Conversión (Lógica placeholder)
    getConversionData: async () => {
        // En una implementación real, esta función obtendría los datos necesarios
        // para la conversión. Por ahora, solo es una utilidad.
        return { message: "Data requerida para conversión lista." };
    }
};
