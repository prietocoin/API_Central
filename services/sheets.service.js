// services/sheets.service.js

const { google } = require('googleapis');
const constants = require('../constants');
// ELIMINADO: utils ya no se usa aquí. El procesamiento se hará en el controlador.

// --- SINGLETON DE CONEXIÓN ---
let sheetsClient = null;

// Helper para envolver async
const asyncHandler = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// --------------------------------------------------------------------------
// --- FUNCIÓN PRINCIPAL (Refactorizada a "Servicio Tonto") ---
// --------------------------------------------------------------------------

/**
 * Obtiene los datos CRUDOS de Google Sheets.
 * Toda la lógica de procesamiento (transformar a JSON, filtrar, etc.)
 * se delega al controlador.
 */
async function getSheetData(spreadsheetId, sheetName, range) {
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
            spreadsheetId: spreadsheetId,
            range: `${sheetName}!${range}`,
        });

        const values = response.data.values;
        if (!values || values.length === 0) return []; // Si no hay datos, retorna array vacío

        // --- Lógica de procesamiento ELIMINADA ---
        // El servicio ahora solo devuelve los datos crudos.
        
        return values; // <-- DEVUELVE DATOS CRUDOS (Array de arrays)

    } catch (err) {
        const googleError = err.response?.data?.error?.message || err.message;
        console.error(`[Sheets API] Error al leer ${spreadsheetId} / ${sheetName}!${range}: `, googleError);
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
