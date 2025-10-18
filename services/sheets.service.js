// services/sheets.service.js

const { google } = require('googleapis');
const constants = require('../constants');
const utils = require('./utils');

// --- SINGLETON DE CONEXIÓN ---
let sheetsClient = null;

// Helper para envolver async
const asyncHandler = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// --------------------------------------------------------------------------
// --- FUNCIÓN PRINCIPAL DE GOOGLE SHEETS (Singleton Autenticación Perezoso) ---
// --------------------------------------------------------------------------

async function getSheetData(sheetName, range) {
    // 1. Inicialización Perezosa (Singleton)
    if (!sheetsClient) {
        try {
            const authClient = new google.auth.GoogleAuth({
                keyFile: constants.CREDENTIALS_PATH,
                scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
            });
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
            // --- ESTA ES LA LÍNEA CORREGIDA (Usa backticks `` ` ``) ---
            range: `${sheetName}!${range}`,
        });

        const values = response.data.values;
        if (!values || values.length === 0) return [];

        // --- Lógica de manipulación de datos V1 ---
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
        // --- CÓDIGO DE CORRECCIÓN INMEDIATA: Exponer el error de Google ---
        const googleError = err.response?.data?.error?.message || err.message;
        // Esta línea también debe usar backticks para que las variables funcionen
        console.error(`[Sheets API] Error al leer ${sheetName}/${range}: `, googleError);
        throw new Error(`Fallo de Google Sheets: ${googleError}.`); // <--- EXPONE EL ERROR REAL
    }
}


// --------------------------------------------------------------------------
// --- EXPORTACIÓN PÚBLICA (Funciones y Herramientas) ---
// --------------------------------------------------------------------------

module.exports = {
    asyncHandler,
    getSheetData,
};
