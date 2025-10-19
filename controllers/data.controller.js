// controllers/data.controller.js

const sheetsService = require('../services/sheets.service');
// AÑADIDO: 'utils' es necesario de nuevo para que el controlador sea "inteligente"
const utils = require('../services/utils'); 

// --------------------------------------------------------------------------
// --- CONTROLADOR GENÉRICO (El nuevo "Cerebro") ---
// --------------------------------------------------------------------------

/**
 * Controlador genérico para la ruta POST /query.
 * Lee {id, hoja, rango, formato} del body de la petición
 * y devuelve los datos procesados según el formato solicitado.
 */
async function postQueryGenerico(req, res) {
    // 1. Leer los parámetros del body
    const { id, hoja, rango, formato } = req.body;
    const format = formato || 'raw'; // Si no se especifica formato, se devuelven datos crudos

    // 2. Validación básica
    if (!id || !hoja || !rango) {
        return res.status(400).json({ 
            error: "Petición inválida.",
            detalle: "El body debe contener 'id', 'hoja', y 'rango'." 
        });
    }

    // 3. Obtener los datos crudos del servicio "tonto"
    const rawData = await sheetsService.getSheetData(id, hoja, rango);

    // 4. Procesar los datos según el formato solicitado
    switch (format) {
        
        // FORMATO 1: Devolver el array de arrays crudo
        case 'raw':
            return res.json(rawData);

        // FORMATO 2: Convertir a un array de objetos JSON
        case 'json':
            const jsonData = utils.transformToObjects(rawData);
            return res.json(jsonData);

        // FORMATO 3: Convertir a JSON y devolver solo la última fila
        case 'json_ultima_fila':
            const allJson = utils.transformToObjects(rawData);
            const lastRow = (allJson.length > 0) ? [allJson[allJson.length - 1]] : [];
            return res.json(lastRow);

        // FORMATO 4: Procesar 2 filas como Clave/Valor
        case 'json_clave_valor':
            if (!rawData || rawData.length < 2) { 
                return res.json([]); // No hay suficientes datos para procesar
            }
        
            const ratesObject = {};
            const headers = rawData[0] || [];
            const values = rawData[1] || []; 
            
            if (Array.isArray(headers) && Array.isArray(values)) {
                for (let index = 0; index < values.length; index++) {
                    const key = headers[index] ? headers[index].trim().toUpperCase() : null;
                    const value = values[index] || '';
                    if (key) {
                        ratesObject[key] = value.replace(',', '.'); 
                    }
                }
            }
            return res.json([ratesObject]); // Devuelve un array con el objeto

        // Caso por defecto: Formato no reconocido
        default:
            return res.status(400).json({ 
                error: `Formato '${format}' no reconocido.`,
                detalle: "Formatos válidos: raw, json, json_ultima_fila, json_clave_valor."
            });
    }
}


// --------------------------------------------------------------------------
// --- CONTROLADORES ANTIGUOS (ELIMINADOS) ---
// --------------------------------------------------------------------------

// ELIMINADOS: getTasasPromedio, getMatrizGanancia, getTasasVES, 
// getDatosImagen, getTasasFundablock, getTasasCopVes, getConvertir

// --------------------------------------------------------------------------
// --- EXPORTACIÓN DE CONTROLADORES ---
// --------------------------------------------------------------------------

module.exports = {
    // La única función que exportamos
    postQueryGenerico
};
