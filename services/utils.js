// services/utils.js

// --------------------------------------------------------------------------
// --- FUNCIONES DE UTILIDAD (Deben estar definidas ANTES de exportarse) ---
// --------------------------------------------------------------------------

// Convierte cadena con coma decimal a número (ej. "0,93" -> 0.93)
function parseFactor(factorString) {
    if (typeof factorString !== 'string') return 1.0;
    return parseFloat(factorString.replace(',', '.')) || 1.0;
}

// Transforma la respuesta de Sheets en un array de objetos JSON
function transformToObjects(data) {
    if (!data || data.length === 0) return [];
    
    // Si la primera fila contiene solo valores vacíos, la salta.
    let headerRowIndex = 0;
    while (headerRowIndex < data.length && data[headerRowIndex].filter(String).length === 0) {
        headerRowIndex++;
    }
    
    if (headerRowIndex >= data.length) return []; // No hay datos
    
    const headers = data[headerRowIndex].map(h => h ? h.trim() : '');
    const rows = data.slice(headerRowIndex + 1);

    return rows.map(row => {
        const obj = {};
        headers.forEach((header, index) => {
            const key = header;
            obj[key] = row[index] || '';
        });
        return obj;
    }).filter(obj => Object.values(obj).some(val => val !== ''));
}


/**
 * Transforma la respuesta de Sheets en un objeto JSON de CRUCE (Fila-Columna).
 * La primera columna se usa como clave (header de fila) y la primera fila
 * se usa como clave secundaria (header de columna).
 */
function transformToCrossJoin(data) {
    if (!data || data.length < 2 || data[0].length < 2) return {};

    // 1. Obtener los encabezados de columna (saltando el primer elemento, que es la esquina)
    const columnHeaders = data[0].slice(1).map(h => h ? h.trim() : '');

    const crossObject = {};

    // 2. Iterar sobre las filas (saltando la primera fila de encabezados)
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const rowHeader = row[0] ? row[0].trim() : `row_${i}`; // Clave de la fila (1ra columna)

        if (!rowHeader) continue;

        const rowContent = {};

        // 3. Iterar sobre los valores de la fila (saltando el primer elemento/header de fila)
        for (let j = 1; j < row.length; j++) {
            const colHeader = columnHeaders[j - 1];
            const value = row[j] || '';

            if (colHeader) {
                rowContent[colHeader] = value;
            }
        }

        if (Object.keys(rowContent).length > 0) {
            crossObject[rowHeader] = rowContent;
        }
    }

    return crossObject;
}

// --------------------------------------------------------------------------
// --- EXPORTACIÓN PÚBLICA (Todas las funciones deben estar definidas) ---
// --------------------------------------------------------------------------

module.exports = {
    parseFactor, // ✅ Corregido el error de referencia al asegurar la definición anterior.
    transformToObjects,
    transformToCrossJoin,
};
