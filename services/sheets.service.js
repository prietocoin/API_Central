// services/sheets.service.js

const { google } = require('googleapis');
const NodeCache = require('node-cache');
const fs = require('fs'); // <--- ¡Módulo de archivos necesario!

// ... (El resto de las declaraciones de variables)

// --------------------------------------------------------------------------
// --- LÓGICA CORE: INICIALIZACIÓN, AUTENTICACIÓN Y CARGA DE CONFIG ---
// --------------------------------------------------------------------------

function initializeSheetsService() {
    try {
        // 0. Ruta al archivo de configuración creado por Dockerfile
        const CONFIG_FILE_PATH = '/app/cliente_config.json';
        
        // Leemos el string JSON del archivo (Seguro contra saltos de línea de ENV)
        const CLIENTE_CONFIG_JSON_STRING = fs.readFileSync(CONFIG_FILE_PATH, 'utf8'); 
        
        // 1. Cargar Configuración de Cliente (¡Nueva lectura segura!)
        const allConfigs = JSON.parse(CLIENTE_CONFIG_JSON_STRING); // Parseo SEGURO desde archivo
        // ... (El resto de la lógica de inicialización y autenticación se mantiene)

    } catch (error) {
        console.error(`[SERVICE] ERROR CRÍTICO al inicializar Sheets o cargar config: ${error.message}`);
        
        if (error.code === 'ENOENT') {
             console.error(`DIAGNÓSTICO: No se encuentra el archivo ${CONFIG_FILE_PATH}. Verifica la variable CLIENTE_CONFIG_JSON en EasyPanel.`);
        }
        process.exit(1); 
    }
}
// ... (resto del archivo)
