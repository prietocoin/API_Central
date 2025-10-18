// controllers/data.controller.js

// Importamos el servicio donde reside toda la lógica de I/O y Caching
const sheetsService = require('../services/sheets.service'); 

// --------------------------------------------------------------------------
// --- LÓGICA DE NEGOCIO POR ENDPOINT ---
// --------------------------------------------------------------------------

/**
 * 1. Controlador para /matriz-ganancia
 */
async function getMatrizGanancia(req, res) {
    // El servicio getMatrizGanancia ya implementa el caching internamente
    const data = await sheetsService.getMatrizGanancia();
    res.json(data);
}

/**
 * 2. Controlador para /tasas-ves
 */
async function getTasasVES(req, res) {
    const data = await sheetsService.getTasasVES();
    res.json(data);
}

/**
 * 3. Controlador para /tasas-fundablock
 */
async function getTasasFundablock(req, res) {
    const data = await sheetsService.getTasasFundablock();
    res.json(data);
}

/**
 * 4. Controlador para /tasas-promedio
 */
async function getTasasPromedio(req, res) {
    const data = await sheetsService.getTasasPromedio();
    res.json(data);
}

/**
 * 5. Controlador para /datos-imagen
 */
async function getDatosImagen(req, res) {
    const data = await sheetsService.getDatosImagen();
    res.json(data);
}

/**
 * 6. Controlador para /tasas-cop_ves
 */
async function getTasasCopVes(req, res) {
    const data = await sheetsService.getTasasCopVes();
    res.json(data);
}

/**
 * 7. Controlador para /convertir (Implementación Placeholder)
 * NOTA: La lógica de conversión es más compleja y se implementaría aquí.
 */
async function getConvertir(req, res) {
    // Aquí iría la lógica de leer req.query (cantidad, origen, destino)
    // y usar los datos de tasas obtenidos de los servicios para calcular la conversión.
    
    // Devolvemos un placeholder por ahora
    res.json({
        error: "Servicio de Conversión Aún No Implementado",
        query: req.query
    });
}


// --------------------------------------------------------------------------
// --- EXPORTACIÓN DE CONTROLADORES ---
// --------------------------------------------------------------------------
module.exports = {
    getMatrizGanancia,
    getTasasVES,
    getTasasFundablock,
    getTasasPromedio,
    getDatosImagen,
    getTasasCopVes,
    getConvertir
};
