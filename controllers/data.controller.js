// controllers/data.controller.js
// Esta capa maneja la lógica de negocio y delega la I/O al servicio.

const sheetsService = require('../services/sheets.service'); 

// --------------------------------------------------------------------------
// --- LÓGICA DE NEGOCIO POR ENDPOINT ---
// --------------------------------------------------------------------------

async function getMatrizGanancia(req, res) {
    const data = await sheetsService.getMatrizGanancia();
    res.json(data);
}

async function getTasasVES(req, res) {
    const data = await sheetsService.getTasasVES();
    res.json(data);
}

async function getTasasFundablock(req, res) {
    const data = await sheetsService.getTasasFundablock();
    res.json(data);
}

async function getTasasPromedio(req, res) {
    const data = await sheetsService.getTasasPromedio();
    res.json(data);
}

async function getDatosImagen(req, res) {
    const data = await sheetsService.getDatosImagen();
    res.json(data);
}

async function getTasasCopVes(req, res) {
    const data = await sheetsService.getTasasCopVes();
    res.json(data);
}

// Lógica de conversión (Ejemplo)
async function getConvertir(req, res) {
    const { cantidad, origen, destino } = req.query;

    if (!cantidad || !origen || !destino) {
        return res.status(400).json({ error: "Parámetros de conversión incompletos (cantidad, origen, destino)." });
    }
    
    // En una implementación real:
    // const tasas = await sheetsService.getTasasVES();
    
    res.json({
        conversion_status: "Pendiente de implementación de lógica",
        input: { cantidad: parseFloat(cantidad), origen, destino }
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
