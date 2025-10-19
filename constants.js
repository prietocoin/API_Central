// constants.js

// --- CONFIGURACIÓN DE CONEXIÓN (Paths) ---
// ELIMINADO: SPREADSHEET_ID ya no es global. Se definirá en el controlador.
const CREDENTIALS_PATH = '/workspace/credentials.json';

// --- DEFINICIONES ESTRUCTURALES (Hojas y Rangos) ---
// ELIMINADAS: Todas las constantes HOJA_ y RANGO_ se moverán 
// al controlador para que cada endpoint sea único.

// --- DEFINICIONES DE RUTAS (Se conservan) ---
const RUTA_TASAS_PROMEDIO = '/tasas-promedio';
const RUTA_MATRIZ_GANANCIA = '/matriz-ganancia';
const RUTA_TASAS_VES = '/tasas-ves';
const RUTA_DATOS_IMAGEN = '/datos-imagen';
const RUTA_TASAS_FUNDABLOCK = '/tasas-fundablock';
const RUTA_TASAS_COP_VES = '/tasas-cop_ves';
const RUTA_CONVERTIR = '/convertir';

module.exports = {
    // Solo exportamos las constantes que quedaron:
    CREDENTIALS_PATH,
    RUTAS: {
        RUTA_TASAS_PROMEDIO, RUTA_MATRIZ_GANANCIA, RUTA_TASAS_VES, RUTA_DATOS_IMAGEN,
        RUTA_TASAS_FUNDABLOCK, RUTA_TASAS_COP_VES, RUTA_CONVERTIR
    }
};
