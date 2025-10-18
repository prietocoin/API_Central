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
    // 1. Inicialización Perezosa (Singleton): Solo se autentica la primera vez
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
            throw new Error(`Fallo de Autenticación: ${authError.message}. Verifique el archivo de credenciales.`);
        }
    }
    
    // 2. Ejecución de la API
    try {
        const response = await sheetsClient.spreadsheets.values.get({
            spreadsheetId: constants.SPREADSHEET_ID,
            range: `${sheetName}!${range}`,
        });
        // ... (resto del código)

        const values = response.data.values;
        if (!values || values.length === 0) return [];
        // Lógica de manipulación de datos
        
        // ... (el resto de la lógica de excepciones y transformación)
        
    } catch (err) {
        // Exponemos el mensaje de error de Google para diagnóstico.
        console.error(`[Sheets API] Error al leer ${sheetName}/${range}: ${err}`);
        throw new Error(`Fallo de Google Sheets: ${err.message}. Revise los permisos 403.`);
    }
}


// ... (El resto de las exportaciones se mantienen igual)
