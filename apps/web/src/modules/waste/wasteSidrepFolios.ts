import type { WasteFolioSupportExportRequest } from '@aurelia/contracts';
import type { WasteDefinitionItem } from './components/WasteDefinitionGrid';
import type { WasteFolioListRow } from './components/WasteFolioListCard';
import {
  WASTE_FOLIO_SUPPORT_TITLES,
  type WasteFolioSupportVariant,
} from './components/WasteFolioSupportModal';

/**
 * Folios SIDREP de la vista `3083:10562`, pestaña "Cerrados", y de sus DOS modales de
 * respaldo: `3085:13254` (residuo peligroso) y `4327:35730` (no peligroso). Ver
 * `folioSupportVariant`, que es la derivación que elige entre los dos.
 *
 * UN SOLO MODELO POR FOLIO, y de él salen las TRES proyecciones que la pantalla
 * necesita: la fila de la lista maestra (`folioListRow`), la grilla del panel de
 * detalle (`folioFacts`) y la grilla del modal de respaldo (`folioSupportFacts`). Los
 * tres nodos escriben el mismo folio con distinto recorte, así que tenerlo tres veces
 * a mano garantizaba que un día dijeran cosas distintas.
 *
 * TODO ESTO ES MAQUETA y desaparece cuando exista el endpoint: pasa a un hook de
 * TanStack Query sobre un `SidrepFolioResponse` de `@aurelia/contracts` y estas
 * proyecciones quedan como los formateadores que ya son. Es el mismo camino que
 * `wasteHistoryRows.ts`.
 *
 * LA TOLERANCIA ES LO QUE DECIDE EL TONO, no la existencia de una brecha. Lo aclara
 * el cruce de los dos nodos: el modal del folio `2026-SD-04690` (`3085:13317`) le
 * dibuja 1.020 despachados contra 1.005 recibidos —15 kg de diferencia— y la califica
 * "DIFERENCIA (NORMAL)", mientras su fila en la lista (`3083:10910`) va con el tilde
 * TEAL y su panel no lleva recuadro de alerta. El `2026-SD-04812`, con 20 kg y 3,3%
 * contra una tolerancia de ±2%, es el que va ÁMBAR con la balanza y el que trae el
 * recuadro. O sea: 15 kg sobre 1.020 es 1,5% y entra en tolerancia; 20 sobre 610 no.
 * Por eso `exceedsTolerance` es un campo y no `gap !== null`, que es lo que esta
 * maqueta asumía antes de que existiera el modal.
 *
 * EL NODO DEL PANEL SÓLO DIBUJA EL DETALLE DEL TERCER FOLIO y el del modal sólo el del
 * primero. Lo que falta —el paquete de respaldos del `04756`, sus datos de transporte,
 * y los del `04812`— se completa de forma coherente para que la vista sea navegable.
 * No son datos del diseño y no se deben tomar como tales.
 */

export interface WasteSidrepFolioGap {
  /**
   * Brecha en kilos, sólo el número: "20". La unidad la pega cada consumidor, porque
   * el diseño la escribe distinto en los tres lugares donde aparece — "20kg" pegado
   * en el recuadro de alerta (`3437:3367`), "20 kg" separado en la grilla del panel
   * (`3083:10989`) y "15 kg" en la banda del modal (`3085:13334`)—.
   */
  kg: string;
  /** Brecha en porcentaje, con coma decimal: "3,3%". Nodo `3437:3369`. */
  percentage: string;
  /** Tolerancia esperada y su procedencia. Nodo `3437:3376`. */
  tolerance: string;
  /**
   * Cómo se califica la brecha contra la tolerancia — el "(normal)" del nodo
   * `3085:13336`, en la banda de pesos del modal.
   *
   * ES UN DATO APARTE Y NO SE DEDUCE ACÁ de comparar `kg` contra `tolerance`: la
   * tolerancia del diseño es un texto en prosa ("±2% (~12 kg) · histórico general por
   * tipo de residuo"), no un umbral con el que se pueda calcular. Cuando exista el
   * endpoint, la calificación la resuelve el backend, que es quien conoce el
   * histórico.
   */
  qualifier: string;
  /**
   * Si la brecha se pasó de la tolerancia. Es lo que enciende el tono ámbar de la
   * fila, el recuadro de alerta del panel y el color del dato "Diferencia de peso".
   */
  exceedsTolerance: boolean;
}

/** Un respaldo del paquete que muestra el modal — nodo `3085:13342` y hermanos. */
export interface WasteSidrepFolioPackageDoc {
  /** Qué es y con qué archivo llegó: "Ticket de pesaje- ticket_pesaje_0847.pdf". */
  label: string;
  /**
   * Peso del archivo, ya formateado: "182 KB".
   *
   * EL NODO LO DEJA EN "XX KB" —un marcador, no un valor— en las ocho filas. Acá van
   * tamaños de maqueta para que la columna se vea como se va a ver; el dato real sale
   * del adjunto cuando exista el endpoint.
   */
  size: string;
}

/**
 * Un respaldo del paquete tal como lo lista el PDF — nodo `3084:11173` y hermanos.
 *
 * ES UNA SEGUNDA LISTA Y NO UN FORMATEO de `packageDocs`, porque el documento no muestra
 * el mismo paquete recortado igual:
 *
 *   1. AGRUPA. El modal enumera las cuatro fotografías del vehículo una por una; el PDF
 *      las declara en una línea, "4 fotografías del vehículo — fotos_vehiculo_04690.zip".
 *      Ocho filas en pantalla son cinco en el documento.
 *   2. SEPARA QUÉ ES DE CÓMO SE LLAMA. El modal los junta ("HDS- hdst_aceite_v4.pdf") y
 *      el PDF los pone en dos columnas, con el archivo alineado a la derecha.
 *   3. NOMBRA DISTINTO. Donde el modal abrevia "HDS", el documento escribe "Hoja de Datos
 *      de Seguridad de Transporte (HDST)": es lo que un fiscalizador busca por nombre.
 *
 * Derivar una de la otra pedía inventar reglas de agrupación y un diccionario de
 * abreviaturas que el diseño no declara. Cuando exista el endpoint, las dos salen del
 * mismo adjunto en el servidor y esta duplicación desaparece.
 */
export interface WasteSidrepFolioPdfDoc {
  /** "Guía de despacho RESPEL". */
  label: string;
  /** "guia_respel_2204.pdf". */
  filename: string;
}

interface WasteSidrepFolioBase {
  /** Número de folio SIDREP: "2026-SD-04812". */
  folio: string;
  wasteType: string;
  /** Empresa transportista: "Resiter S.A.". */
  carrier: string;
  /** Peso neto despachado en kg, ya formateado con separador de miles: "1.020". */
  dispatchedKg: string;
  /** Peso recibido en destino, mismo formato. */
  receivedKg: string;
  /** Brecha de peso, o `null` cuando el folio cerró sin diferencia alguna. */
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

  /*
   * DE ACÁ ABAJO, LOS DATOS QUE SÓLO PIDE EL MODAL DE RESPALDO (`3085:13254` /
   * `4327:35730`). El panel de detalle no los muestra, y por eso no estaban en la
   * primera iteración.
   */

  /** Patente del vehículo: "RLVZ-57". Nodos `3085:13288` y `4327:35764`. */
  plate: string;
  /** Nombre del conductor. Nodos `3085:13293` y `4327:35769`. */
  driver: string;
  /** Cantidad de contenedores del traslado. Nodos `3085:13315` y `4327:35791`. */
  containerCount: number;
  /**
   * Las MISMAS dos fechas de arriba con año: "05 jul 2026, 08:40" (`3085:13299`) y
   * "07 jul 2026, 16:10" (`3085:13304`).
   *
   * Son dos formatos del mismo instante y no dos datos: el panel lo escribe corto
   * porque comparte la fila con otros cinco campos, y el modal largo porque es el
   * documento de respaldo que se lleva a una fiscalización, donde el año importa. Van
   * duplicados sólo mientras esto sea maqueta; con el endpoint llega un ISO y los dos
   * formatos salen de un formateador.
   */
  generatedAtLong: string;
  closedAtLong: string;
}

/**
 * Folio de residuo PELIGROSO (RESPEL) — el caso que dibuja el nodo `3085:13254`.
 *
 * Los tres campos propios existen porque el traslado de un RESPEL los exige: la
 * resolución sanitaria del destinatario, y el paquete de respaldos (guía RESPEL, HDS,
 * fotografías del vehículo, declaración SIDREP) en sus dos recortes.
 */
export interface WasteSidrepHazardousFolio extends WasteSidrepFolioBase {
  isHazardous: true;
  /** Resolución sanitaria verificada: "Res. Exenta N°10171/2022". Nodo `3085:13310`. */
  sanitaryResolution: string;
  /** Los ocho respaldos del paquete, como los lista el MODAL. Nodo `3085:13341`. */
  packageDocs: WasteSidrepFolioPackageDoc[];
  /** El mismo paquete como lo lista el PDF. Ver `WasteSidrepFolioPdfDoc`. */
  pdfDocs: WasteSidrepFolioPdfDoc[];
}

/**
 * Folio de residuo NO PELIGROSO — el caso que dibuja el nodo `4327:35730`.
 *
 * NO LLEVA NINGUNO de los tres campos del peligroso, y eso es la mitad del diseño: su
 * respaldo tiene siete datos en vez de ocho —sin resolución sanitaria— y no tiene
 * sección de paquete, porque un traslado no peligroso no genera esos documentos.
 */
export interface WasteSidrepNonHazardousFolio extends WasteSidrepFolioBase {
  isHazardous: false;
}

/**
 * Un folio de la bandeja, PELIGROSO O NO.
 *
 * ES UNA UNIÓN DISCRIMINADA POR `isHazardous` y no una interfaz con tres campos
 * opcionales: la peligrosidad no es un adorno del folio, es lo que decide qué respaldo
 * existe. Con campos opcionales, `folio.packageDocs` compilaba en cualquier rama y el
 * error aparecía en pantalla —un respaldo "No Peligroso" listando una guía RESPEL—; con
 * la unión, leerlos obliga a estrechar antes, así que la regla la comprueba el
 * compilador y no una revisión.
 *
 * SIDREP ES EL REGISTRO DE RESIDUOS PELIGROSOS, y por eso la lista es casi toda
 * peligrosa: el intro del Histórico separa "peligrosos (con folio SIDREP y aprobación)"
 * de "no peligrosos (informativo, gestionado por Resiter/Servicios Generales)". El nodo
 * `4327:35730` muestra que un traslado no peligroso TAMBIÉN llega a esta bandeja con su
 * respaldo, así que el caso es real y no una precaución. Ver `folioSupportVariant`.
 */
export type WasteSidrepFolio = WasteSidrepHazardousFolio | WasteSidrepNonHazardousFolio;

/** Rótulo de estado. Los tres folios de la pestaña "Cerrados" comparten el mismo. */
export const WASTE_SIDREP_FOLIO_CLOSED_STATUS = 'Cerrado';

/** Tolerancia del aceite lubricante. Sale del mismo histórico que la de las baterías. */
const OIL_TOLERANCE =
  'Tolerancia esperada para Aceite lubricante: ±2% (~20 kg) · histórico general por tipo de residuo.';

const CONTAINER_TOLERANCE =
  'Tolerancia esperada para Envases contaminados: ±3% (~4 kg) · histórico general por tipo de residuo.';

export const WASTE_SIDREP_CLOSED_FOLIOS: WasteSidrepFolio[] = [
  {
    /*
     * El único folio cuyo MODAL dibuja el nodo `3085:13254`. Sus pesos, patente,
     * conductor, resolución, contenedores, fechas largas y los ocho respaldos del
     * paquete salen de ahí.
     */
    folio: '2026-SD-04690',
    wasteType: 'Aceite lubricante usado',
    isHazardous: true,
    carrier: 'Resiter S.A.',
    dispatchedKg: '1.020',
    receivedKg: '1.005',
    gap: {
      kg: '15',
      percentage: '1,5%',
      tolerance: OIL_TOLERANCE,
      qualifier: 'normal',
      /* 15 sobre 1.020 es 1,5%, dentro del ±2%: por eso la fila va teal. */
      exceedsTolerance: false,
    },
    destination: 'Hidronor Chile S.A.',
    generatedAt: '05 jul, 08:40',
    closedAt: '07 jul, 16:10',
    closedDate: '05 jul',
    docs: [
      'Ticket de recepción — ticket_pesaje_0847.pdf',
      'Certificado de disposición final — declaracion2161197_71767.pdf',
    ],
    plate: 'RLVZ-57',
    driver: 'Juan Pérez Soto',
    sanitaryResolution: 'Res. Exenta N°10171/2022',
    containerCount: 4,
    generatedAtLong: '05 jul 2026, 08:40',
    closedAtLong: '07 jul 2026, 16:10',
    packageDocs: [
      { label: 'Ticket de pesaje- ticket_pesaje_0847.pdf', size: '182 KB' },
      { label: 'Guía de despacho RESPEL- guia_respel-2204.pdf', size: '204 KB' },
      { label: 'HDS- hdst_aceite_lubricante_v4.pdf', size: '311 KB' },
      { label: 'Fotografía frontal- foto_1.jpg', size: '1,2 MB' },
      { label: 'Fotografía posterior- foto_2.jpg', size: '1,1 MB' },
      { label: 'Fotografía lateral izquierda- foto_3.jpg', size: '1,3 MB' },
      { label: 'Fotografía lateral derecha- foto_4.jpg', size: '1,2 MB' },
      { label: 'Declaración SIDREP- declaracion2161197_71767.pdf', size: '96 KB' },
    ],
    /* Las cinco filas del nodo `3084:11163`, el único paquete que el PDF dibuja. */
    pdfDocs: [
      { label: 'Ticket de pesaje', filename: 'ticket_pesaje_0847.pdf' },
      { label: 'Guía de despacho RESPEL', filename: 'guia_respel_2204.pdf' },
      { label: 'Hoja de Datos de Seguridad de Transporte (HDST)', filename: 'hdst_aceite_lubricante_v4.pdf' },
      { label: '4 fotografías del vehículo', filename: 'fotos_vehiculo_04690.zip' },
      { label: 'Declaración SIDREP', filename: 'declaracion2161197_71767.pdf' },
    ],
  },
  {
    folio: '2026-SD-04756',
    wasteType: 'Envases contaminados',
    isHazardous: true,
    carrier: 'Resiter S.A.',
    dispatchedKg: '145',
    receivedKg: '142',
    gap: {
      kg: '3',
      percentage: '2,1%',
      tolerance: CONTAINER_TOLERANCE,
      qualifier: 'normal',
      exceedsTolerance: false,
    },
    destination: 'Hidronor Chile S.A.',
    generatedAt: '08 jul, 11:40',
    closedAt: '10 jul, 10:15',
    closedDate: '10 jul',
    docs: [
      'Ticket de recepción — ticket_pesaje_0912.pdf',
      'Certificado de disposición final — declaracion2161204_71802.pdf',
    ],
    plate: 'KHRT-24',
    driver: 'Marcela Ríos Vera',
    sanitaryResolution: 'Res. Exenta N°10171/2022',
    containerCount: 2,
    generatedAtLong: '08 jul 2026, 11:40',
    closedAtLong: '10 jul 2026, 10:15',
    packageDocs: [
      { label: 'Ticket de pesaje- ticket_pesaje_0912.pdf', size: '176 KB' },
      { label: 'Guía de despacho RESPEL- guia_respel-2231.pdf', size: '198 KB' },
      { label: 'HDS- hdst_envases_contaminados_v2.pdf', size: '287 KB' },
      { label: 'Fotografía frontal- foto_1.jpg', size: '1,1 MB' },
      { label: 'Fotografía posterior- foto_2.jpg', size: '1,0 MB' },
      { label: 'Declaración SIDREP- declaracion2161204_71802.pdf', size: '94 KB' },
    ],
    pdfDocs: [
      { label: 'Ticket de pesaje', filename: 'ticket_pesaje_0912.pdf' },
      { label: 'Guía de despacho RESPEL', filename: 'guia_respel_2231.pdf' },
      { label: 'Hoja de Datos de Seguridad de Transporte (HDST)', filename: 'hdst_envases_contaminados_v2.pdf' },
      { label: '2 fotografías del vehículo', filename: 'fotos_vehiculo_04756.zip' },
      { label: 'Declaración SIDREP', filename: 'declaracion2161204_71802.pdf' },
    ],
  },
  {
    /* El único folio cuyo PANEL dibuja el nodo, y el único fuera de tolerancia. */
    folio: '2026-SD-04812',
    wasteType: 'Baterías de plomo-ácido',
    isHazardous: true,
    carrier: 'Resiter S.A.',
    dispatchedKg: '610',
    receivedKg: '590',
    gap: {
      kg: '20',
      percentage: '3,3%',
      tolerance:
        'Tolerancia esperada para Baterías de plomo: ±2% (~12 kg) · histórico general por tipo de residuo.',
      qualifier: 'sobre tolerancia',
      exceedsTolerance: true,
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
    plate: 'JSPD-91',
    driver: 'Rodrigo Navarro Lillo',
    sanitaryResolution: 'Res. Exenta N°8842/2021',
    containerCount: 6,
    generatedAtLong: '06 jul 2026, 10:15',
    closedAtLong: '08 jul 2026, 12:40',
    packageDocs: [
      { label: 'Ticket de recepción- ticket_recepcion_04710.pdf', size: '188 KB' },
      { label: 'Certificado de disposición final- cert_disposicion_04710.pdf', size: '243 KB' },
      { label: 'Guía de despacho complementaria- guia_2204_b.pdf', size: '201 KB' },
      { label: 'HDS- hdst_baterias_plomo_v3.pdf', size: '298 KB' },
      { label: 'Fotografía frontal- foto_1.jpg', size: '1,2 MB' },
      { label: 'Fotografía posterior- foto_2.jpg', size: '1,1 MB' },
      { label: 'Declaración SIDREP- declaracion2161211_71844.pdf', size: '98 KB' },
    ],
    pdfDocs: [
      { label: 'Ticket de recepción', filename: 'ticket_recepcion_04710.pdf' },
      { label: 'Certificado de disposición final', filename: 'cert_disposicion_04710.pdf' },
      { label: 'Guía de despacho complementaria', filename: 'guia_2204_b.pdf' },
      { label: 'Hoja de Datos de Seguridad de Transporte (HDST)', filename: 'hdst_baterias_plomo_v3.pdf' },
      { label: '2 fotografías del vehículo', filename: 'fotos_vehiculo_04812.zip' },
      { label: 'Declaración SIDREP', filename: 'declaracion2161211_71844.pdf' },
    ],
  },
  {
    /*
     * EL FOLIO NO PELIGROSO, el que hace alcanzable el respaldo `4327:35730`.
     *
     * NINGÚN DATO DE ACÁ SALE DEL DISEÑO, y hay que decirlo con precisión: el nodo
     * `4327:35730` se titula "No Peligroso" pero está relleno con el contenido del
     * PRIMER folio de esta lista —folio 2026-SD-04690, aceite lubricante usado, RLVZ-57,
     * Juan Pérez Soto, 1.020 → 1.005—, que es un RESPEL. Es una copia de la maqueta
     * peligrosa en Figma, no un folio distinto, así que tomar esos valores habría dejado
     * el mismo folio en la lista dos veces con peligrosidades contrarias.
     *
     * Lo que sí se toma del nodo es la FORMA: siete datos en vez de ocho, sin resolución
     * sanitaria, con "Cantidad de contenedores" a fila completa y sin paquete. El
     * contenido es de maqueta y se va con el endpoint, igual que el de los otros tres.
     */
    folio: '2026-SD-04788',
    wasteType: 'Chatarra metálica',
    isHazardous: false,
    carrier: 'Resiter S.A.',
    dispatchedKg: '3.480',
    receivedKg: '3.455',
    gap: {
      kg: '25',
      percentage: '0,7%',
      tolerance:
        'Tolerancia esperada para Chatarra metálica: ±2% (~70 kg) · histórico general por tipo de residuo.',
      qualifier: 'normal',
      exceedsTolerance: false,
    },
    destination: 'KDM Tratamiento',
    generatedAt: '09 jul, 09:20',
    closedAt: '11 jul, 15:05',
    closedDate: '11 jul',
    docs: [
      'Ticket de recepción — ticket_recepcion_04788.pdf',
      'Guía de despacho — guia_2312.pdf',
    ],
    plate: 'PSVB-38',
    driver: 'Claudia Fuentes Aravena',
    containerCount: 2,
    generatedAtLong: '09 jul 2026, 09:20',
    closedAtLong: '11 jul 2026, 15:05',
  },
  {
    /*
     * SEGUNDO FOLIO NO PELIGROSO, y el único de esta lista que cierra FUERA DE TOLERANCIA sin
     * ser un RESPEL. Es la combinación que faltaba: hasta acá la brecha ámbar y el respaldo no
     * peligroso no se cruzaban nunca, así que el recuadro de diferencia sobre la variante de
     * siete datos del `4327:35730` no se podía mirar en pantalla.
     *
     * VA ÚLTIMO A PROPÓSITO. La vista entra por `find((f) => f.gap?.exceedsTolerance)` y ese
     * `find` tiene que seguir cayendo en el `2026-SD-04812`, que es el folio cuyo panel dibuja
     * el nodo; al ir después, éste no le gana la selección inicial.
     *
     * NINGÚN DATO SALE DEL DISEÑO, igual que el `2026-SD-04788`: es maqueta para que la rama
     * sea recorrible y se va con el endpoint.
     */
    folio: '2026-SD-04771',
    wasteType: 'Neumáticos fuera de uso',
    isHazardous: false,
    carrier: 'ICB Ingeniería',
    dispatchedKg: '5.240',
    receivedKg: '5.060',
    /* 180 kg sobre 5.240 son 3,4%, y el 2% de ese peso son ~105: se pasa. */
    gap: {
      kg: '180',
      percentage: '3,4%',
      tolerance:
        'Tolerancia esperada para Neumáticos fuera de uso: ±2% (~105 kg) · histórico general por tipo de residuo.',
      qualifier: 'sobre tolerancia',
      exceedsTolerance: true,
    },
    destination: 'KDM Tratamiento',
    generatedAt: '06 jul, 07:40',
    closedAt: '09 jul, 16:20',
    closedDate: '09 jul',
    docs: [
      'Ticket de recepción — ticket_recepcion_04771.pdf',
      'Guía de despacho — guia_2288.pdf',
    ],
    plate: 'RTHM-52',
    driver: 'Marcelo Ibáñez Rojas',
    containerCount: 1,
    generatedAtLong: '06 jul 2026, 07:40',
    closedAtLong: '09 jul 2026, 16:20',
  },
];

/**
 * Fila de la lista maestra.
 *
 * El tono lo decide la TOLERANCIA y no la existencia de la brecha: sólo el folio que
 * se pasó va ámbar con la balanza. Ver la nota del encabezado.
 */
export function folioListRow(folio: WasteSidrepFolio): WasteFolioListRow {
  return {
    id: folio.folio,
    title: `${folio.wasteType} — ${folio.dispatchedKg} kg`,
    subtitle: `${folio.carrier} · Folio ${folio.folio}`,
    /*
     * En esta pestaña el dato destacado es el ESTADO y la leyenda la fecha de cierre.
     * En "Abiertos" las mismas dos ranuras llevan el tiempo abierto y su plazo — ver
     * `openFolioListRow` en `wasteSidrepOpenFolios.ts`.
     */
    highlight: WASTE_SIDREP_FOLIO_CLOSED_STATUS,
    caption: folio.closedDate,
    tone: folio.gap?.exceedsTolerance ? 'weightGap' : 'closed',
    /*
     * Sin `highlightTone`: el nodo pinta el estado en teal en las TRES filas, también
     * en la que cerró fuera de tolerancia. Es el valor por defecto del componente.
     */
  };
}

/**
 * Cuál de los dos respaldos de traslado le corresponde al folio.
 *
 * TODO FOLIO CERRADO TIENE RESPALDO, y esto es un cambio de regla respecto de la
 * iteración anterior, que sólo se lo daba al peligroso. Lo obliga el nodo `4327:35730`:
 * dibuja el respaldo de un traslado NO peligroso, con su descarga en PDF. O sea que la
 * peligrosidad no decide SI hay respaldo, decide CUÁL:
 *
 *   peligroso     `3085:13254`  ocho datos, con resolución sanitaria, con paquete
 *   no peligroso  `4327:35730`  siete datos, sin resolución sanitaria, sin paquete
 *
 * Vive acá y no dentro del componente para que la MISMA derivación alimente los tres
 * lugares que tienen que coincidir: el título del modal, el recorte de `folioSupportFacts`
 * y el título del PDF. Con la condición escrita en línea en cada lugar, alcanzaba con
 * tocar uno para que el documento y la pantalla dijeran cosas distintas.
 *
 * NO ES LO MISMO que el `supportUrl` del Histórico (`wasteHistoryRows.ts`), que sigue
 * siendo el cruce peligroso + cerrado: aquél apunta al paquete de respaldos de un RESPEL,
 * que es justo lo que este respaldo no peligroso no tiene.
 */
export function folioSupportVariant(folio: WasteSidrepFolio): WasteFolioSupportVariant {
  return folio.isHazardous ? 'hazardous' : 'nonHazardous';
}

/** Subtítulo del panel de detalle. Texto del nodo `3440:3378`. */
export function folioDetailSubtitle(folio: WasteSidrepFolio): string {
  return `Folio SIDREP ${folio.folio} · ${folio.wasteType} · ${folio.carrier}`;
}

/** Subtítulo del modal de respaldo. Texto del nodo `3085:13261`, sin el "Folio" inicial. */
export function folioSupportSubtitle(folio: WasteSidrepFolio): string {
  return `Folio SIDREP ${folio.folio} · ${folio.wasteType} · ${folio.carrier}`;
}

/**
 * Los seis datos de la grilla del panel, en el orden del nodo `3083:10974`.
 *
 * "Diferencia de peso" es el ÚNICO que se colorea, y sólo cuando la brecha se pasó de
 * la tolerancia: el `#6b3a1f` del nodo `3083:10989` es el marrón del recuadro de
 * alerta que está arriba en el mismo panel. Una brecha dentro de tolerancia se
 * muestra igual pero neutra, porque es un dato y no una señal.
 */
export function folioFacts(folio: WasteSidrepFolio): WasteDefinitionItem[] {
  return [
    { label: 'Peso neto despachado', value: `${folio.dispatchedKg} kg` },
    { label: 'Peso recibido en destino', value: `${folio.receivedKg} kg` },
    {
      label: 'Diferencia de peso',
      value: folio.gap ? `${folio.gap.kg} kg` : '0 kg',
      valueTone: folio.gap?.exceedsTolerance ? '#6b3a1f' : undefined,
    },
    { label: 'Empresa destinataria', value: folio.destination },
    { label: 'Fecha de generación', value: folio.generatedAt },
    { label: 'Fecha de cierre', value: folio.closedAt },
  ];
}

/**
 * Payload del PDF de respaldo — nodo `3084:11044`.
 *
 * Se arma acá y no en la página por lo que el contrato ya explica: el documento tiene que
 * decir lo MISMO que el modal, y la manera de garantizarlo es que las dos proyecciones
 * salgan del mismo folio en el mismo archivo. Las cifras viajan ya formateadas, con el
 * mismo `${kg} kg` que usa la pantalla.
 *
 * `folioSupportFacts` se reusa tal cual: los pares del modal (`3085:13271` / `4327:35747`) y
 * los del documento (`3084:11074`) son los mismos, en el mismo orden. Lo único propio del PDF
 * es el paquete, que agrupa distinto — ver `WasteSidrepFolioPdfDoc`.
 *
 * EL TÍTULO Y EL PAQUETE SALEN DE LA MISMA VARIANTE QUE EL MODAL: un folio no peligroso
 * baja un documento titulado "…No Peligroso" y con `documents` vacío, que es lo que hace
 * que el PDF omita la sección de paquete. Si el título viniera de un lado y el paquete de
 * otro, el documento podía titularse "No Peligroso" y listar una guía RESPEL.
 */
export function folioSupportExportRequest(folio: WasteSidrepFolio): WasteFolioSupportExportRequest {
  return {
    folio: folio.folio,
    title: WASTE_FOLIO_SUPPORT_TITLES[folioSupportVariant(folio)],
    subtitle: folioSupportSubtitle(folio),
    statusLabel: WASTE_SIDREP_FOLIO_CLOSED_STATUS,
    fields: folioSupportFacts(folio).map((field) => ({ label: field.label, value: field.value })),
    weights: {
      dispatched: `${folio.dispatchedKg} kg`,
      received: `${folio.receivedKg} kg`,
      difference: folio.gap ? `${folio.gap.kg} kg` : '0 kg',
      differenceLabel: folio.gap ? `Diferencia (${folio.gap.qualifier})` : 'Diferencia',
    },
    documents: folio.isHazardous
      ? folio.pdfDocs.map((doc) => ({ label: doc.label, filename: doc.filename }))
      : [],
  };
}

/**
 * Los datos de "Datos del traslado", en el orden de los nodos `3085:13271` (modal
 * peligroso), `4327:35747` (modal no peligroso) y `3084:11074` (PDF).
 *
 * SEIS SON COMUNES Y LOS DOS ÚLTIMOS DEPENDEN DE LA PELIGROSIDAD:
 *
 *   peligroso     `3085:13310` "Resolución sanitaria verificada" + contenedores, los dos
 *                 a media fila, ocho pares en cuatro filas de dos
 *   no peligroso  sin resolución sanitaria —un traslado no peligroso no la exige— y
 *                 "Cantidad de contenedores" a FILA COMPLETA (`4327:35781`), porque queda
 *                 sola y el nodo le da el ancho entero en vez de media columna vacía
 *
 * NO SE SOLAPA con `folioFacts` más que en las fechas: el panel resume los pesos y esto
 * describe el TRASLADO —quién lo llevó, en qué vehículo, con qué resolución—, porque los
 * pesos acá van en su propia banda y no en la grilla.
 */
export function folioSupportFacts(folio: WasteSidrepFolio): WasteDefinitionItem[] {
  const transfer: WasteDefinitionItem[] = [
    { label: 'Empresa transportista', value: folio.carrier },
    { label: 'Empresa destinataria', value: folio.destination },
    { label: 'Patente vehículo', value: folio.plate },
    { label: 'Conductor', value: folio.driver },
    { label: 'Fecha de generación', value: folio.generatedAtLong },
    { label: 'Fecha de cierre', value: folio.closedAtLong },
  ];

  if (!folio.isHazardous) {
    return [
      ...transfer,
      { label: 'Cantidad de contenedores', value: String(folio.containerCount), span: 'full' },
    ];
  }

  return [
    ...transfer,
    { label: 'Resolución sanitaria verificada', value: folio.sanitaryResolution },
    { label: 'Cantidad de contenedores', value: String(folio.containerCount) },
  ];
}
