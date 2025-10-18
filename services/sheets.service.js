// services/sheets.service.js

const { google } = require('googleapis');
const constants = require('../constants');
const utils = require('./utils'); // Necesita el archivo utils.js (creado en el paso anterior)

// --- SINGLETON DE CONEXIÓN (Variables de estado) ---
let sheetsClient = null;

// Helper para envolver async
const asyncHandler = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// --------------------------------------------------------------------------
// --- FUNCIÓN PRINCIPAL DE GOOGLE SHEETS (Migrada y Limpia) ---
// --------------------------------------------------------------------------

/**
 * Función que realiza la llamada real a la API de Google Sheets.
 * Implementa el Singleton Perezoso para la conexión.
 * @param {string} sheetName - Nombre de la hoja.
 * @param {string} range - Rango A1.
 */
async function getSheetData(sheetName, range) {
    // 1. Inicialización Perezosa (Singleton): Solo se autentica la primera vez
    if (!sheetsClient) {
        const authClient = new google.auth.GoogleAuth({
            keyFile: constants.CREDENTIALS_PATH,
            scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        });
        sheetsClient = google.sheets({ version: 'v4', auth: authClient });
        console.log("[SERVICE] Conexión a Google Sheets autenticada y establecida.");
    }
    
    if (!sheetsClient) {
         throw new Error("Cliente de Google Sheets no inicializado. Verifique el log de arranque.");
    }

    try {
        const response = await sheetsClient.spreadsheets.values.get({
            spreadsheetId: constants.SPREADSHEET_ID,
            range: `${sheetName}!${range}`,
        });

        const values = response.data.values;
        if (!values || values.length === 0) return [];

        // Lógica de manipulación de datos (basada en el V1 original)
        
        // *** EXCEPCIÓN: Retornar valores crudos para el procesamiento manual ***
        if ((sheetName === constants.HOJA_GANANCIA && (range === constants.RANGO_TASAS_VES || range === constants.RANGO_HEADERS_GANANCIA)) ||
             (sheetName === constants.HOJA_IMAGEN && (range === constants.RANGO_IMAGEN || range === constants.RANGO_FUNDABLOCK || range === constants.RANGO_TASAS_COP_VES))) {
            return values;
        }

        // Lógica de filtrado de última fila (Mercado)
        if (sheetName === constants.HOJA_PRECIOS && range === constants.RANGO_PRECIOS && values.length > 0) {
            const data = utils.transformToObjects(values);
            return (data.length > 0) ? [data[data.length - 1]] : [];
        }

        return utils.transformToObjects(values);

    } catch (err) {
        console.error(`[Sheets API] Error al leer ${sheetName}/${range}: ${err}`);
        throw new Error('Error al acceder a Google Sheets. Verifique la conexión/rangos.');
    }
}


// --------------------------------------------------------------------------
// --- EXPORTACIÓN PÚBLICA (Funciones y Herramientas) ---
// --------------------------------------------------------------------------

module.exports = {
    asyncHandler,
    getSheetData,
};
