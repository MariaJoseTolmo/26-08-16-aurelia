/**
 * Payload del "Respaldo de Traslado de Residuo Peligroso" — nodo Figma
 * `3084:11044`. Lo genera el botón "Descargar PDF" del modal `3085:13254`.
 *
 * Mismo criterio que `WasteSinaderExportRequest` y `WarehouseControlExportRequest`:
 * es un DOCUMENTO, no una consulta. Describe exactamente lo que el aprobador tiene en
 * pantalla, y por eso los valores viajan YA FORMATEADOS como texto ("1.020 kg",
 * "05 jul 2026, 08:40") en vez de números y fechas crudas. Eso garantiza que el modal
 * y el PDF digan lo mismo POR CONSTRUCCIÓN, y no porque el formateador de la web en
 * `es-CL` y el del servidor casualmente coincidan.
 *
 * ACÁ ESE RIESGO PESA: el documento se lleva a una fiscalización ambiental, así que la
 * cifra del PDF tiene que ser la que el aprobador leyó antes de descargarlo. La
 * contracara es la misma que ya anotó `WasteSinaderExportController`: el endpoint
 * confía en lo que le manda el cliente. Ver la nota de PENDIENTE allá, que aplica
 * igual a este respaldo.
 */

/** Un par rótulo/valor de "Datos del traslado" — nodo `3084:11075` y hermanos. */
export interface WasteFolioSupportExportField {
  /** Rótulo en su capitalización natural; el documento lo pinta en mayúsculas. */
  label: string;
  value: string;
}

/**
 * Un respaldo del paquete — nodo `3084:11173` y hermanos.
 *
 * EL DOCUMENTO SEPARA QUÉ ES DE CÓMO SE LLAMA EL ARCHIVO, en dos columnas, mientras el
 * modal los junta en una sola línea. Por eso son dos campos y no un string armado: en
 * el PDF el nombre del archivo va alineado a la derecha y en otro cuerpo y color.
 */
export interface WasteFolioSupportExportDocument {
  /** "Guía de despacho RESPEL". */
  label: string;
  /** "guia_respel_2204.pdf". */
  filename: string;
}

/**
 * La conciliación de pesos de la banda `3084:11131`: despachado → recibido = brecha.
 *
 * Las tres cifras llegan con su unidad porque así las escribe el nodo ("1.020 kg"), y
 * `differenceLabel` trae ya resuelta la calificación entre paréntesis —"Diferencia
 * (normal)"— que el servidor no puede deducir: la tolerancia del diseño es prosa, no
 * un umbral con el que calcular.
 */
export interface WasteFolioSupportExportWeights {
  dispatched: string;
  received: string;
  difference: string;
  differenceLabel: string;
}

export interface WasteFolioSupportExportRequest {
  /**
   * Número de folio SIDREP: "2026-SD-04690".
   *
   * Viaja aparte aunque `subtitle` ya lo contenga, porque de él sale el NOMBRE DEL
   * ARCHIVO. Extraerlo del subtítulo con una expresión regular ataría el nombre del
   * archivo a la redacción de una frase.
   */
  folio: string;
  /** Título del documento — nodo `3084:11061`. */
  title: string;
  /** Folio, residuo y transportista — nodo `3084:11064`. */
  subtitle: string;
  /**
   * Rótulo del estado SIN el "Estado: " que el documento antepone — nodo `3084:11069`.
   * Se manda "Cerrado" y no la frase completa para que el prefijo viva en un solo
   * lugar, igual que en el modal.
   */
  statusLabel: string;
  fields: WasteFolioSupportExportField[];
  weights: WasteFolioSupportExportWeights;
  documents: WasteFolioSupportExportDocument[];
}
