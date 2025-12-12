// src/composables/useExcelExport.js

import * as XLSX from 'xlsx';
import { date } from 'quasar';

// src/composables/useExcelExport.js

export function useExcelExport() {
  /**
   * Exporta los datos de la encuesta a un archivo Excel
   * @param {Object} params Parámetros para la exportación
   * @returns {Promise<void>}
   */
  const exportarEncuestaToExcel = async ({
    infoEncuesta,
    preguntas,
    envios,
    respuestas, // Mantener este parámetro
    notify
  }) => {
    try {
      // Preparar estructura del Excel
      const workbook = XLSX.utils.book_new();

      // Construir encabezados
      const headers = [
        'ID Envío',
        'Fecha de Envío',
        'Aplicador',
        'Código Aplicador',
        'Latitud',
        'Longitud'
      ];

      // Agregar todas las preguntas como columnas
      preguntas.forEach(p => {
        headers.push(p.enunciado);
      });

      // Preparar filas (un envío por fila)
      const rows = envios.map(envio => {
        // Información base del envío
        const row = [
          envio.id,
          formatDateTime(envio.created_at),
          envio.aplicador ? `${envio.aplicador.nombres || ''} ${envio.aplicador.apellidos || ''}`.trim() : 'No especificado',
          envio.aplicador ? envio.aplicador.usuario : '',
          envio.lat || '',
          envio.lng || ''
        ];

        // Agregar respuestas para cada pregunta
        preguntas.forEach(pregunta => {
          // Intentamos obtener la respuesta desde el envío
          let respuesta = envio.respuestas?.find(r => r.pregunta_id === pregunta.id);

          // Si no la encontramos en el envío, buscar en el arreglo general de respuestas
          if (!respuesta && respuestas) {
            respuesta = respuestas.find(r =>
              r.envio_id === envio.id && r.pregunta_id === pregunta.id
            );
          }

          if (respuesta) {
            switch (pregunta.tipo) {
              case 'text':
                row.push(respuesta.valor_texto || '');
                break;
              case 'number':
                row.push(respuesta.valor_num || '');
                break;
              case 'scale':
                row.push(respuesta.valor_escala || '');
                break;
              case 'single':
              case 'multi':
                if (respuesta.opciones && respuesta.opciones.length > 0) {
                  row.push(respuesta.opciones.map(o => o.texto).join(', '));
                } else {
                  row.push('');
                }
                break;
              case 'matrix':
                if (respuesta.valor_texto) {
                  try {
                    const parsed = JSON.parse(respuesta.valor_texto);
                    // Mapear IDs a texto
                    // pregunta.configuracion puede ser string si no se casteó en el frontend, intentamos parsear
                    let config = pregunta.configuracion;
                    if (typeof config === 'string') {
                        try { config = JSON.parse(config); } catch (error) { console.warn(error); }
                    }

                    const formatted = Object.entries(parsed).map(([rowId, colId]) => {
                       const row = config?.filas?.find(f => f.id === rowId)?.texto || 'Fila desconocida';
                       const col = pregunta.opciones?.find(o => o.id === colId)?.texto || 'Opción desconocida';
                       return `${row}: ${col}`;
                    }).join('; ');

                    row.push(formatted);
                  } catch (error) {
                    console.warn(error);
                    row.push(respuesta.valor_texto || '');
                  }
                } else {
                  row.push('');
                }
                break;
              case 'date':
                if (respuesta.valor_texto) {
                  try {
                    const fecha = new Date(respuesta.valor_texto);
                    row.push(fecha.toLocaleDateString());
                  } catch  {
                    row.push(respuesta.valor_texto || '');
                  }
                } else {
                  row.push('');
                }
                break;
              default:
                row.push('');
            }
          } else {
            row.push(''); // No hay respuesta para esta pregunta
          }
        });

        return row;
      });

      // Crear la hoja de cálculo
      const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);

      // Ajustar anchos de columna basados en el contenido
      const colWidths = headers.map((h, i) => {
        // Calcular ancho basado en contenido
        let maxWidth = h ? h.length : 10;

        rows.forEach(row => {
          if (row[i] && String(row[i]).length > maxWidth) {
            maxWidth = String(row[i]).length;
          }
        });

        // Limitar ancho máximo y mínimo
        return Math.max(8, Math.min(50, maxWidth + 2));
      });

      worksheet['!cols'] = colWidths.map(width => ({ wch: width }));

      // Estilos para los encabezados
      const headerStyle = {
        font: { bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '663399' } }, // Color primario púrpura
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true }
      };

      // Aplicar estilos a los encabezados
      const range = XLSX.utils.decode_range(worksheet['!ref']);
      for (let col = range.s.c; col <= range.e.c; col++) {
        const headerCell = XLSX.utils.encode_cell({ r: 0, c: col });
        if (!worksheet[headerCell]) continue;

        worksheet[headerCell].s = headerStyle;
      }

      // Aplicar estilos alternos a las filas de datos
      for (let row = 1; row <= range.e.r; row++) {
        const backgroundColor = row % 2 === 0 ? 'F5F7FA' : 'FFFFFF';

        for (let col = range.s.c; col <= range.e.c; col++) {
          const dataCell = XLSX.utils.encode_cell({ r: row, c: col });
          if (!worksheet[dataCell]) continue;

          worksheet[dataCell].s = {
            fill: { fgColor: { rgb: backgroundColor } },
            alignment: { vertical: 'center', wrapText: true }
          };
        }
      }

      // Generar nombre para la hoja y limpiar caracteres no válidos
      const sheetName = (infoEncuesta.titulo || 'Encuesta')
        .substring(0, 30)
        .replace(/[\\/[\]*?:]/g, '');

      // Agregar la hoja al libro
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

      // Crear hoja de resumen
      const summaryData = [
        ['RESUMEN DE LA ENCUESTA', ''],
        ['Título', infoEncuesta.titulo || 'N/A'],
        ['Descripción', infoEncuesta.descripcion || 'N/A'],
        ['Total de envíos', envios.length.toString()],
        ['Total de preguntas', preguntas.length.toString()],
        ['Fecha de exportación', formatDateTime(new Date())],
      ];

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      summarySheet['!cols'] = [{ wch: 30 }, { wch: 50 }];

      // Aplicar estilos a la hoja de resumen
      const summaryRange = XLSX.utils.decode_range(summarySheet['!ref']);
      for (let row = 0; row <= summaryRange.e.r; row++) {
        for (let col = 0; col <= summaryRange.e.c; col++) {
          const cell = XLSX.utils.encode_cell({ r: row, c: col });

          summarySheet[cell].s = {
            font: row === 0 ? { bold: true, color: { rgb: 'FFFFFF' } } : { bold: col === 0 },
            fill: row === 0 ? { fgColor: { rgb: '009999' } } : { fgColor: { rgb: 'FFFFFF' } },
            alignment: { vertical: 'center', wrapText: true }
          };
        }
      }

      // Agregar la hoja de resumen al libro
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen');

      // Generar nombre de archivo
      const filename = `Encuesta_${infoEncuesta.id || 'Export'}_${Date.now()}.xlsx`;

      // Guardar el archivo
      XLSX.writeFile(workbook, filename);

      // Mostrar notificación de éxito si se proporcionó una función de notificación
      if (notify) {
        notify({
          type: 'positive',
          message: 'Datos exportados correctamente',
          position: 'top',
          timeout: 3000
        });
      }

      return true;
    } catch (error) {
      console.error('Error al exportar datos:', error);

      // Mostrar notificación de error si se proporcionó una función de notificación
      if (notify) {
        notify({
          type: 'negative',
          message: 'Error al exportar datos: ' + (error.message || 'Error desconocido'),
          position: 'top',
          timeout: 5000
        });
      }

      return false;
    }
  };

  /**
   * Formatea una fecha en formato legible
   */
  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'No especificada';

    try {
      return date.formatDate(dateStr, 'DD/MM/YYYY HH:mm');
    } catch {
      return dateStr;
    }
  };

  return {
    exportarEncuestaToExcel
  };
}
