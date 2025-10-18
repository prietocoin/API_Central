// controllers/data.controller.js

const sheetsService = require('../services/sheets.service');
const constants = require('../constants');
const utils = require('../services/utils'); // Para lógica de parseo si es necesario aquí

// --------------------------------------------------------------------------
// --- LÓGICA DE NEGOCIO POR ENDPOINT (Migrada del index.js) ---
// --------------------------------------------------------------------------

/**
 * 1. Controlador para /tasas-promedio
 */
async function getTasasPromedio(req, res) {
    const data = await sheetsService.getSheetData(constants.HOJA_PRECIOS, constants.RANGO_PRECIOS);
    res.json(data);
}

/**
 * 2. Controlador para /matriz-ganancia
 */
async function getMatrizGanancia(req, res) {
    const data = await sheetsService.getSheetData(constants.HOJA_GANANCIA, constants.RANGO_GANANCIA);
    res.json(data);
}

/**
 * 3. Controlador para /tasas-ves (Lógica compleja)
 */
async function getTasasVES(req, res) {
    // La lógica de combinación de encabezados y valores reside aquí, delegando la I/O al servicio
    const headersArray = await sheetsService.getSheetData(constants.HOJA_GANANCIA, constants.RANGO_HEADERS_GANANCIA); 
    const valuesArray = await sheetsService.getSheetData(constants.HOJA_GANANCIA, constants.RANGO_TASAS_VES); 

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
    const data = await sheetsService.getSheetData(constants.HOJA_IMAGEN, constants.RANGO_IMAGEN);
    res.json(data);
}

/**
 * 5. Controlador para /tasas-fundablock
 */
async function getTasasFundablock(req, res) {
    const data = await sheetsService.getSheetData(constants.HOJA_IMAGEN, constants.RANGO_FUNDABLOCK);
    res.json(data);
}

/**
 * 6. Controlador para /tasas-cop_ves (Lógica compleja)
 */
async function getTasasCopVes(req, res) {
    const dataMatrix = await sheetsService.getSheetData(constants.HOJA_IMAGEN, constants.RANGO_TASAS_COP_VES); 

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
                // Aquí usamos la lógica de parseo de coma decimal
                ratesObject[key] = value.replace(',', '.'); 
            }
        }
    }
    res.json([ratesObject]);
}

/**
 * 7. Controlador para /convertir
 */
async function getConvertir(req, res) {
    // Implementación placeholder
    res.status(501).json({ error: "Servicio de Conversión (RUTA_CONVERTIR) aún no implementado." });
}


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
};
