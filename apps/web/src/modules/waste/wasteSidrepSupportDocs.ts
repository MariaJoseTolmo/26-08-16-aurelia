/**
 * Estado del paso 2 del flujo SIDREP —"Documentos de respaldo"— y sus reglas.
 *
 * Mismo papel que `wasteSidrepForm.ts` para el paso 1: el modelo vive fuera de
 * `components/` para que las tarjetas solo dibujen.
 */

/** Documentos obligatorios del nodo `3765:39853`, en el orden en que se muestran. */
export const SIDREP_REQUIRED_DOCS = [
  { key: 'dispatchGuide', label: 'Guía de despacho RESPEL' },
  { key: 'safetyDataSheet', label: 'HDS' },
] as const;

/** Las cuatro vistas del vehículo del nodo `3765:39883`, en orden. */
export const SIDREP_VEHICLE_VIEWS = [
  { key: 'front', label: 'Frontal' },
  { key: 'rear', label: 'Posterior' },
  { key: 'left', label: 'Lateral izquierda' },
  { key: 'right', label: 'Lateral derecha' },
] as const;

export type SidrepRequiredDocKey = (typeof SIDREP_REQUIRED_DOCS)[number]['key'];
export type SidrepVehicleViewKey = (typeof SIDREP_VEHICLE_VIEWS)[number]['key'];

/** Tipos y tamaño de los documentos, del nodo `3765:39867`. */
export const SIDREP_DOC_ACCEPT = 'application/pdf';
export const SIDREP_DOC_HINT = 'Pdf· Máx. 10 MB';

/** Tipos y tamaño de las fotos, del nodo `3765:39891`. */
export const SIDREP_PHOTO_ACCEPT = 'image/png,image/jpeg';
export const SIDREP_PHOTO_HINT = 'Png, Jpg· Máx. 10 MB';

export interface WasteSidrepSupportDocsValues {
  docs: Record<SidrepRequiredDocKey, File | null>;
  photos: Record<SidrepVehicleViewKey, File | null>;
}

export function createWasteSidrepSupportDocsValues(): WasteSidrepSupportDocsValues {
  return {
    docs: { dispatchGuide: null, safetyDataSheet: null },
    photos: { front: null, rear: null, left: null, right: null },
  };
}

/**
 * `true` cuando están los dos documentos y las cuatro fotos.
 *
 * Habilita "Continuar" (nodo `4278:21348`), que en ESTE paso el diseño dibuja
 * HABILITADO —`bg #c8a064`, texto blanco—, a diferencia del paso 1. Aun así la
 * regla se aplica igual: el aviso del paso anterior dice que Medio Ambiente exige
 * los cuatro respaldos, así que avanzar sin ellos no tendría sentido.
 *
 * Los seis son obligatorios porque el encabezado de la tarjeta se llama
 * "Documentos obligatorios" y el párrafo de fotos pide "una foto de cada lado".
 */
export function isWasteSidrepSupportDocsComplete(values: WasteSidrepSupportDocsValues): boolean {
  const docsReady = SIDREP_REQUIRED_DOCS.every(({ key }) => values.docs[key] !== null);
  const photosReady = SIDREP_VEHICLE_VIEWS.every(({ key }) => values.photos[key] !== null);
  return docsReady && photosReady;
}
