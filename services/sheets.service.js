// services/sheets.service.js

const { google } = require('googleapis');
const constants = require('../constants');
const utils = require('./utils');

// --- SINGLETON DE CONEXIÓN ---
let sheetsClient = null;
let googleCredentials = null; // Almacenará las credenciales parseadas

// Helper para envolver async
const asyncHandler = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// ---------------------------------------------------------------------------------
// --- NUEVO: Carga y parseo de credenciales al inicio ---
// ---------------------------------------------------------------------------------
function loadCredentials() {
    if (googleCredentials) return; // Ya están cargadas

    const credentialsJsonString = process.env.GOOGLE_CREDENTIALS_JSON;

    if (!credentialsJsonString) {
        console.error("[SERVICE] FALLO CRÍTICO: La variable de entorno 'GOOGLE_CREDENTIALS_JSON' no está definida.");
        throw new Error("Error de configuración: GOOGLE_CREDENTIALS_JSON no encontrado.");
    }

    try {
        googleCredentials = JSON.parse(credentialsJsonString);
        console.log("[SERVICE] Credenciales de Google cargadas y parseadas desde variable de entorno.");
    } catch (e) {
        console.error("[SERVICE] FALLO CRÍTICO: 'GOOGLE_CREDENTIALS_JSON' no es un JSON válido.", e.message);
        throw new Error("Credenciales mal formadas. Revise la variable de entorno.");
    }
}

// --------------------------------------------------------------------------
// --- FUNCIÓN PRINCIPAL DE GOOGLE SHEETS (Modificada) ---
// --------------------------------------------------------------------------

async function getSheetData(sheetName, range) {
    // 1. Inicialización Perezosa (Singleton)
    if (!sheetsClient) {
        try {
            // --- CAMBIO CLAVE ---
            // 1. Asegurarnos de que las credenciales estén cargadas
            loadCredentials(); 

            // 2. Usar 'credentials' (objeto) en lugar de 'keyFile' (ruta)
            const authClient = new google.auth.GoogleAuth({
                credentials: googleCredentials,
                scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
            });
            // --- FIN DEL CAMBIO ---

            sheetsClient = google.sheets({ version: 'v4', auth: authClient });
            console.log("[SERVICE] Conexión a Google Sheets autenticada y establecida.");
        } catch (authError) {
            console.error("[SERVICE] FALLO CRÍTICO DE AUTENTICACIÓN:", authError.message);
            throw new Error(`Fallo de Autenticación en Sheets: ${authError.message}`);
        }
    }
    
    if (!sheetsClient) {
         throw new Error("Cliente de Google Sheets no inicializado. Verifique el log de arranque.");
    }

    try {
        const response = await sheetsClient.spreadsheets.values.get({
            spreadsheetId: constants.SPREADSHEET_ID,
            range: `${sheetName}!${range}`,
        });

        // ... (El resto de tu lógica de procesamiento de datos sigue igual) ...
        const values = response.data.values;
        if (!values || values.length === 0) return [];

        // --- Lógica de manipulación de datos V1 ---
        if ((sheetName === constants.HOJA_GANANCIA && (range === constants.RANGO_TASAS_VES || range === constants.RANGO_HEADERS_GANANCIA)) ||
             (sheetName === constants.HOJA_IMAGEN && (range === constants.RANGO_IMAGEN || range === constants.RANGO_FUNDABLOCK || range === constants.RANGO_TASAS_COP_VES))) {
            return values;
        }
        if (sheetName === constants.HOJA_PRECIOS && range === constants.RANGO_PRECIOS && values.length > 0) {
            const data = utils.transformToObjects(values);
            return (data.length > 0) ? [data[data.length - 1]] : [];
        }
        return utils.transformToObjects(values);

    } catch (err) {
        const googleError = err.response?.data?.error?.message || err.message;
        console.error(`[Sheets API] Error al leer ${sheetName}/${range}: `, googleError);
        throw new Error(`Fallo de Google Sheets: ${googleError}.`);
    }
}


// --------------------------------------------------------------------------
// --- EXPORTACIÓN PÚBLICA (Funciones y Herramientas) ---
// --------------------------------------------------------------------------

module.exports = {
    asyncHandler,
    getSheetData,
};
