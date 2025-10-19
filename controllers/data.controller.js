// controllers/data.controller.js

const sheetsService = require('../services/sheets.service');
// ELIMINADO: constants.js ya no se usa aquí. Las constantes se definen localmente.
// ELIMINADO: utils.js no se usa en este archivo (la lógica de parseo está en el servicio).

// --------------------------------------------------------------------------
// --- PATRÓN DE DISEÑO PARA ESCALABILIDAD ---
//
// Cada función ahora define sus PROPIAS constantes (ID, Hoja, Rango).
// Esto permite que cada endpoint consulte un archivo, hoja o rango 
// completamente diferente, logrando la escalabilidad para múltiples clientes.
// 
// --------------------------------------------------------------------------

/**
 * 1. Controlador para /tasas-promedio
 */
async function getTasasPromedio(req, res) {
    // --- Constantes locales para este endpoint ---
    const SPREADSHEET_ID = '1jv-wydSjH84MLUtj-zRvHsxUlpEiqe5AlkTkr6K2248';
    const HOJA_PRECIOS = 'Mercado';
    const RANGO_PRECIOS = 'A1:M999';

    const data = await sheetsService.getSheetData(SPREADSHEET_ID, HOJA_PRECIOS, RANGO_PRECIOS);
    res.json(data);
}

/**
 * 2. Controlador para /matriz-ganancia
 */
async function getMatrizGanancia(req, res) {
    // --- Constantes locales para este endpoint ---
    const SPREADSHEET_ID = '1jv-wydSjH84MLUtj-zRvHsxUlpEiqe5AlkTkr6K2248';
    const HOJA_GANANCIA = 'Miguelacho';
    const RANGO_GANANCIA = 'B2:L12';

    const data = await sheetsService.getSheetData(SPREADSHEET_ID, HOJA_GANANCIA, RANGO_GANANCIA);
    res.json(data);
}

/**
 * 3. Controlador para /tasas-ves (Lógica compleja)
 */
async function getTasasVES(req, res) {
    // --- Constantes locales para este endpoint ---
    const SPREADSHEET_ID = '1jv-wydSjH84MLUtj-zRvHsxUlpEiqe5AlkTkr6K2248';
    const HOJA_GANANCIA = 'Miguelacho';
    const RANGO_HEADERS_GANANCIA = 'B2:L2';
    const RANGO_TASAS_VES = 'B23:L23';

    // La lógica de combinación de encabezados y valores reside aquí
    const headersArray = await sheetsService.getSheetData(SPREADSHEET_ID, HOJA_GANANCIA, RANGO_HEADERS_GANANCIA); 
    const valuesArray = await sheetsService.getSheetData(SPREADSHEET_ID, HOJA_GANANCIA, RANGO_TASAS_VES); 

    if (!headersArray || headersArray.length === 0 || !valuesArray || valuesArray.length === 0) {
        return res.json([]);
    }
    
    // Procesamiento de datos crudos
    const headers = headersArray[0];
    const values = valuesArray[0];
        
    const resultObject = {};
    if (Array.isArray(headers) && Array.isArray(values)) {
        headers.forEach((header, index) => {
            resultObject[header.trim() || `Columna${index}`] = values[index] || '';
        });
    }
    res.json([resultObject]);
}

/**
 * 4. Controlador para /datos-imagen
 */
async function getDatosImagen(req, res) {
    // --- Constantes locales para este endpoint ---
    const SPREADSHEET_ID = '1jv-wydSjH84MLUtj-zRvHsxUlpEiqe5AlkTkr6K2248';
    const HOJA_IMAGEN = 'imagen';
    const RANGO_IMAGEN = 'B15:L16';

    const data = await sheetsService.getSheetData(SPREADSHEET_ID, HOJA_IMAGEN, RANGO_IMAGEN);
    res.json(data);
}

/**
 * 5. Controlador para /tasas-fundablock
 */
async function getTasasFundablock(req, res) {
    // --- Constantes locales para este endpoint ---
    const SPREADSHEET_ID = '1jv-wydSjH84MLUtj-zRvHsxUlpEiqe5AlkTkr6K2248';
    const HOJA_IMAGEN = 'imagen';
    const RANGO_FUNDABLOCK = 'B18:K19';

    const data = await sheetsService.getSheetData(SPREADSHEET_ID, HOJA_IMAGEN, RANGO_FUNDABLOCK);
    res.json(data);
}

/**
 * 6. Controlador para /tasas-cop_ves (Lógica compleja)
 */
async function getTasasCopVes(req, res) {
    // --- Constantes locales para este endpoint ---
    const SPREADSHEET_ID = '1jv-wydSjH84MLUtj-zRvHsxUlpEiqe5AlkTkr6K2248';
    const HOJA_IMAGEN = 'imagen';
    const RANGO_TASAS_COP_VES = 'B21:L22';

    const dataMatrix = await sheetsService.getSheetData(SPREADSHEET_ID, HOJA_IMAGEN, RANGO_TASAS_COP_VES); 

    if (!dataMatrix || dataMatrix.length < 2) { 
        return res.json([]);
    }

    const ratesObject = {};
    const headers = dataMatrix[0] || [];
    const values = dataMatrix[1] || []; 
    
    // 2. Procesar las dos filas
    if (Array.isArray(headers) && Array.isArray(values)) {
        for (let index = 0; index < values.length; index++) {
            const key = headers[index] ? headers[index].trim().toUpperCase() : null;
            const value = values[index] || '';

            if (key) {
                ratesObject[key] = value.replace(',', '.');D_   
            }
        }
    }
    res.json([ratesObject]);
}

/**
 * 7. Controlador para /convertir
 */
async function getConvertir(req, res) {
    // Esta función aún no usa Google Sheets. 
    // Cuando lo haga, sigue el mismo patrón:
    /*
    const SPREADSHEET_ID = '...';
    const HOJA_CONVERSION = '...';
    const RANGO_CONVERSION = '...';
    const data = await sheetsService.getSheetData(SPREADSHEET_ID, HOJA_CONVERSION, RANGO_CONVERSION);
    ...
    */
    res.status(501).json({ error: "Servicio de Conversión (RUTA_CONVERTIR) aún no implementado." });
}


// --- EJEMPLO DE CÓMO AÑADIR UN NUEVO CLIENTE ---
/*
async function getDatosClienteNuevo(req, res) {
    // --- Constantes para un cliente y archivo TOTALMENTE NUEVO ---
    const SPREADSHEET_ID_CLIENTE = 'ID-DEL-NUEVO-ARCHIVO-abc123';
    const HOJA_CLIENTE = 'ReporteMensual';
    const RANGO_CLIENTE = 'B2:Z100';

    const data = await sheetsService.getSheetData(SPREADSHEET_ID_CLIENTE, HOJA_CLIENTE, RANGO_CLIENTE);
    // ... (puedes aplicar lógica de transformación si es necesario) ...
    res.json(data);
}
*/


// --------------------------------------------------------------------------
// --- EXPORTACIÓN DE CONTROLADORES ---
// --------------------------------------------------------------------------

module.exports = {
    getTasasPromedio,
    getMatrizGanancia,
    getTasasVES,
    getDatosImagen,
    getTasasFundablock,
    getTasasCopVes,
    getConvertir
    // Cuando añadas nuevos clientes, expórtalos aquí:
    // getDatosClienteNuevo
};
