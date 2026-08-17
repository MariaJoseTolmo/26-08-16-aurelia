import type { WasteDefinitionItem } from './components/WasteDefinitionGrid';
import type { WasteFolioListRow } from './components/WasteFolioListCard';

/**
 * Folios SIDREP de la vista `3083:10562`, pestaña "Cerrados".
 *
 * UN SOLO MODELO POR FOLIO, y de él salen las DOS proyecciones que la pantalla
 * necesita: la fila de la lista maestra (`folioListRow`) y la grilla de datos del
 * panel de detalle (`folioFacts`). El nodo dibuja el mismo folio en los dos lados
 * —"Baterías de plomo-ácido — 610 kg" en la fila y "610 kg" en "Peso neto
 * despachado"—, así que tenerlo dos veces escrito a mano garantizaba que un día
 * dijeran cosas distintas.
 *
 * TODO ESTO ES MAQUETA y desaparece cuando exista el endpoint: `rows` pasa a un hook
 * de TanStack Query sobre un `SidrepFolioResponse` de `@aurelia/contracts` y estas
 * proyecciones quedan como los formateadores que ya son. Es el mismo camino que
 * `wasteHistoryRows.ts`.
 *
 * EL NODO SÓLO DIBUJA EL DETALLE DEL TERCER FOLIO (`2026-SD-04812`). De los otros
 * dos da nada más que lo que se ve en la fila: residuo, peso, transportista, folio y
 * fecha de cierre. Su peso recibido, su empresa destinataria, sus fechas y sus
 * respaldos se completan de forma coherente —cerraron sin brecha, así que reciben lo
 * mismo que despacharon y no llevan recuadro de alerta— para que la lista sea
 * navegable en esta iteración. No son datos del diseño y no se deben tomar como
 * tales.
 */

export interface WasteSidrepFolioGap {
  /**
   * Brecha en kilos, sólo el número: "20". La unidad la pega cada consumidor,
   * porque el diseño la escribe distinto en los dos lugares donde aparece — "20kg"
   * pegado en el recuadro de alerta (`3437:3367`) y "20 kg" separado en la grilla
   * de datos (`3083:10989`)—. Guardar el string ya formateado obligaba a parchear
   * uno de los dos con un `replace`.
   */
  kg: string;
  /** Brecha en porcentaje, con coma decimal: "3,3%". Nodo `3437:3369`. */
  percentage: string;
  /** Tolerancia esperada y su procedencia. Nodo `3437:3376`. */
  tolerance: string;
}

export interface WasteSidrepFolio {
  /** Número de folio SIDREP: "2026-SD-04812". */
  folio: string;
  wasteType: string;
  /** Empresa transportista: "Resiter S.A.". */
  carrier: string;
  /** Peso neto despachado en kg, ya formateado con separador de miles: "1.020". */
  dispatchedKg: string;
  /** Peso recibido en destino, mismo formato. */
  receivedKg: string;
  /** Brecha de peso, o `null` cuando el folio cerró sin diferencia. */
  gap: WasteSidrepFolioGap | null;
  /** Empresa destinataria: "KDM Tratamiento". */
  destination: string;
  /** Fecha y hora de generación: "06 jul, 10:15". */
  generatedAt: string;
  /** Fecha y hora de cierre: "08 jul, 12:40". */
  closedAt: string;
  /** Fecha corta de la fila de la lista: "08 jul". */
  closedDate: string;
  /** Respaldos de cierre, como los escribe el nodo `3083:11022` y hermanos. */
  docs: string[];
}

/** Rótulo de estado. Los tres folios de la pestaña "Cerrados" comparten el mismo. */
export const WASTE_SIDREP_FOLIO_CLOSED_STATUS = 'Cerrado';

export const WASTE_SIDREP_CLOSED_FOLIOS: WasteSidrepFolio[] = [
  {
    folio: '2026-SD-04690',
    wasteType: 'Aceite lubricante usado',
    carrier: 'Resiter S.A.',
    dispatchedKg: '1.020',
    receivedKg: '1.020',
    gap: null,
    destination: 'Hidronor Chile S.A.',
    generatedAt: '03 jul, 09:20',
    closedAt: '05 jul, 16:05',
    closedDate: '05 jul',
    docs: [
      'Ticket de recepción — ticket_recepcion_04690.pdf',
      'Certificado de disposición final — cert_disposicion_04690.pdf',
    ],
  },
  {
    folio: '2026-SD-04756',
    wasteType: 'Envases contaminados',
    carrier: 'Resiter S.A.',
    dispatchedKg: '145',
    receivedKg: '145',
    gap: null,
    destination: 'Hidronor Chile S.A.',
    generatedAt: '08 jul, 11:40',
    closedAt: '10 jul, 10:15',
    closedDate: '10 jul',
    docs: [
      'Ticket de recepción — ticket_recepcion_04756.pdf',
      'Certificado de disposición final — cert_disposicion_04756.pdf',
    ],
  },
  {
    /* El único folio cuyo detalle dibuja el nodo, y el único con brecha de peso. */
    folio: '2026-SD-04812',
    wasteType: 'Baterías de plomo-ácido',
    carrier: 'Resiter S.A.',
    dispatchedKg: '610',
    receivedKg: '590',
    gap: {
      kg: '20',
      percentage: '3,3%',
      tolerance:
        'Tolerancia esperada para Baterías de plomo: ±2% (~12 kg) · histórico general por tipo de residuo.',
    },
    destination: 'KDM Tratamiento',
    generatedAt: '06 jul, 10:15',
    closedAt: '08 jul, 12:40',
    closedDate: '08 jul',
    docs: [
      'Ticket de recepción — ticket_recepcion_04710.pdf',
      'Certificado de disposición final — cert_disposicion_04710.pdf',
      'Guía de despacho complementaria — guia_2204_b.pdf',
    ],
  },
];

/**
 * Fila de la lista maestra.
 *
 * El tono lo decide la BRECHA y no el folio: con diferencia de peso la casilla va
 * ámbar con la balanza, sin diferencia va teal con el tilde. Es lo que separa las
 * dos primeras filas del nodo de la tercera.
 */
export function folioListRow(folio: WasteSidrepFolio): WasteFolioListRow {
  return {
    id: folio.folio,
    title: `${folio.wasteType} — ${folio.dispatchedKg} kg`,
    subtitle: `${folio.carrier} · Folio ${folio.folio}`,
    status: WASTE_SIDREP_FOLIO_CLOSED_STATUS,
    date: folio.closedDate,
    tone: folio.gap ? 'weightGap' : 'closed',
  };
}

/** Subtítulo del panel de detalle. Texto del nodo `3440:3378`. */
export function folioDetailSubtitle(folio: WasteSidrepFolio): string {
  return `Folio SIDREP ${folio.folio} · ${folio.wasteType} · ${folio.carrier}`;
}

/**
 * Los seis datos de la grilla del panel, en el orden del nodo `3083:10974`.
 *
 * "Diferencia de peso" es el ÚNICO que se colorea, y sólo cuando hay brecha: el
 * `#6b3a1f` del nodo `3083:10989` es el marrón del recuadro de alerta que está
 * arriba en el mismo panel. Sin brecha el dato va en "0 kg" y neutro, porque
 * esconder la fila movería los otros cinco de columna.
 */
export function folioFacts(folio: WasteSidrepFolio): WasteDefinitionItem[] {
  return [
    { label: 'Peso neto despachado', value: `${folio.dispatchedKg} kg` },
    { label: 'Peso recibido en destino', value: `${folio.receivedKg} kg` },
    folio.gap
      ? { label: 'Diferencia de peso', value: `${folio.gap.kg} kg`, valueTone: '#6b3a1f' }
      : { label: 'Diferencia de peso', value: '0 kg' },
    { label: 'Empresa destinataria', value: folio.destination },
    { label: 'Fecha de generación', value: folio.generatedAt },
    { label: 'Fecha de cierre', value: folio.closedAt },
  ];
}
