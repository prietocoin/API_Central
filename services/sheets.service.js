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

// --- CAMBIO 1: Se añade "spreadsheetId" como primer argumento ---
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
            // --- CAMBIO 2: Se usa el parámetro "spreadsheetId" ---
            spreadsheetId: spreadsheetId,
            range: `${sheetName}!${range}`,
        });

        const values = response.data.values;
        if (!values || values.length === 0) return [];

        // --- Lógica de manipulación de datos V1 ---
        // Esta lógica de excepciones ahora se moverá al controlador, 
        // pero por ahora la dejamos aquí. 
        // (Idealmente, el controlador debería definir cómo se procesan los datos)
        if ((sheetName === "Miguelacho" && (range === "B23:L23" || range === "B2:L2")) ||
             (sheetName === "imagen" && (range === "B15:L16" || range === "B18:K19" || range === "B21:L22"))) {
            return values;
        }

        // Lógica de filtrado de última fila (Mercado)
        if (sheetName === "Mercado" && range === "A1:M999" && values.length > 0) {
            const data = utils.transformToObjects(values);
            return (data.length > 0) ? [data[data.length - 1]] : [];
        }

        return utils.transformToObjects(values);

    } catch (err) {
        const googleError = err.response?.data?.error?.message || err.message;
        // --- CAMBIO 3: Se añade "spreadsheetId" al log de error ---
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
