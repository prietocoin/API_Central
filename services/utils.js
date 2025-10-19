// services/utils.js

// ... (parseFactor y transformToObjects existentes)

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

module.exports = {
    parseFactor,
    transformToObjects,
    transformToCrossJoin, // <-- ¡NUEVA EXPORTACIÓN!
};
