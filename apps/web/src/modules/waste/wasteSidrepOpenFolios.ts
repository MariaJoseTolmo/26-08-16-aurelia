import type { WasteFolioCloseVariant } from './components/WasteFolioCloseModal';
import type { WasteDefinitionItem } from './components/WasteDefinitionGrid';
import type { WasteFolioListRow } from './components/WasteFolioListCard';
import type { WasteSidrepFolioGap } from './wasteSidrepFolios';

/**
 * Folios SIDREP de la pestaña "Abiertos" — nodo `3081:7463`.
 *
 * UN FOLIO ABIERTO ES UN TRASLADO EN CURSO: el residuo salió de faena con su folio
 * generado y la plataforma del Ministerio todavía no confirmó la recepción en destino.
 * Por eso la pestaña no mide pesos —no hay peso recibido con el que comparar— sino
 * TIEMPO: cuántos días lleva abierto y si eso se pasó del plazo.
 *
 * ES EL MISMO PATRÓN QUE `wasteSidrepFolios.ts`, con un solo modelo por folio y las
 * proyecciones que la pantalla necesita: la fila de la lista maestra
 * (`openFolioListRow`) y la grilla del panel de detalle (`openFolioFacts`). Los dos
 * nodos escriben el mismo folio con distinto recorte.
 *
 * NO COMPARTE MODELO CON LOS FOLIOS CERRADOS, y no es duplicación: son dos estados
 * con datos distintos. Un folio cerrado tiene peso recibido, brecha, fecha de cierre y
 * paquete de respaldos; uno abierto tiene días transcurridos, plazo y aceptación del
 * transportista. Unificarlos daba una interfaz donde la mitad de los campos está en
 * `null` según el estado, y la unión discriminada de `wasteSidrepFolios.ts` ya muestra
 * qué preferimos cuando la forma depende del estado.
 *
 * TODO ESTO ES MAQUETA y desaparece cuando exista el endpoint: pasa a un hook de
 * TanStack Query y estas proyecciones quedan como los formateadores que ya son.
 *
 * EL NODO REUSA EL FOLIO `2026-SD-04812`, que ya está en la lista de CERRADOS con el
 * mismo residuo y el mismo peso (610 kg de baterías de plomo-ácido de Resiter S.A.).
 * Un folio no puede estar abierto y cerrado a la vez: es una copia de la maqueta en
 * Figma, no un dato. Se reproduce tal cual porque es lo que el nodo dibuja —y porque
 * con el endpoint el solapamiento no puede ocurrir, las dos listas salen del mismo
 * recurso filtrado por estado—, pero no se debe leer como el mismo folio.
 *
 * EL NODO SÓLO DIBUJA EL PANEL DEL PRIMER FOLIO. Los datos de transporte de los otros
 * tres —patente, destinataria, fecha, aceptación— se completan de forma coherente para
 * que la vista sea navegable. No son datos del diseño y no se deben tomar como tales.
 *
 * EL CUARTO TRASLADO TAMPOCO ESTÁ EN LA MAQUETA DEL `3081:7463`, y entra por el mismo motivo
 * que el cuarto folio cerrado de `wasteSidrepFolios.ts`: los tres del nodo son RESPEL por el
 * DS 148, así que sin él la variante NO PELIGROSA de la pestaña —el panel `6854:5707` y el
 * cierre `4230:14038`— no era alcanzable ni verificable.
 *
 * EL NODO `6854:5367` DIBUJA LAS TRES FILAS NO PELIGROSAS, con el residuo, el peso y los días
 * en placeholders ("[Nombre del residuo no peligroso] — X.XXX kg", "X días"). NO se copió esa
 * lista: es la ilustración de la variante, no otra maqueta de datos, y con los tres traslados
 * cambiados de rama la variante PELIGROSA se volvía inalcanzable. La bandeja queda con TRES
 * PELIGROSOS Y DOS NO PELIGROSOS: las dos ramas se recorren en la misma pantalla y ninguna se
 * lee como la excepción de la otra.
 */

/**
 * Lo que la DECLARACIÓN SIDREP transcribe cuando se sube al modal de cierre — nodos
 * `4230:13653`, `4230:13657` y `4230:13658` del estado completo `4230:13614`.
 *
 * ESTOS TRES DATOS NO SE TIPEAN, y es la mitad del diseño del modal. El estado vacío
 * (`4230:13273`) los dibuja como dos cajas grises que dicen "Se requiere declaración
 * SIDREP", y el completo los muestra ya escritos en azul: salen de LEER el documento, igual
 * que los tres pesos de "Peso del residuo" salen de leer el ticket de pesaje. Cuando exista
 * el parser, esto es la respuesta de la API y el modal la recibe por prop.
 *
 * REUSA `WasteSidrepFolioGap` de los folios CERRADOS, y no contradice el "no comparte
 * modelo" de más arriba: lo que no se comparte es el FOLIO —abierto y cerrado tienen datos
 * distintos—, pero la brecha de peso es la misma medición, con los mismos nodos y los
 * mismos cuatro campos. Registrar el cierre es justamente lo que convierte un folio de esta
 * lista en uno de aquélla.
 */
export interface WasteSidrepOpenFolioDeclarationReading {
  /** N° de ticket de recepción en destino: "TR-04812". Nodo `4230:13653`. */
  receptionTicket: string;
  /**
   * Kg recibidos en destino, sólo el número: "590". La unidad la pega el consumidor porque
   * el nodo `4230:13657` la escribe PEGADA ("590kg") y el `4230:13669` separada ("610 kg").
   */
  receivedKg: string;
  /** La brecha contra el peso despachado, con su tolerancia y su calificación. */
  gap: WasteSidrepFolioGap;
}

/** Lo que TODO traslado abierto tiene, con folio SIDREP o sin él. */
interface WasteSidrepOpenFolioBase {
  /**
   * Identidad del traslado en la lista y en la selección del maestro-detalle.
   *
   * NO ES EL FOLIO, y es lo que hace falta para que la unión de abajo sea posible: el nodo
   * `6854:5707` dibuja el panel de un traslado NO PELIGROSO y no escribe número de folio en
   * ninguna parte, así que la vista necesitaba una clave que exista en los dos casos. En el
   * peligroso ES el folio —es su clave natural—; en el no peligroso es una clave interna de
   * maqueta, y con el endpoint los dos pasan a ser el id del recurso.
   */
  id: string;
  wasteType: string;
  /**
   * Si el residuo es PELIGROSO (RESPEL).
   *
   * ES LO QUE DECIDE CON QUÉ DOCUMENTO SE CIERRA EL FOLIO, y ya no SI se cierra: el nodo
   * `4230:14038` es el mismo formulario de cierre pidiendo el ticket de recepción final en
   * vez de la declaración SIDREP del `4230:13273`. Los dos folios llegan al modal; la
   * peligrosidad elige la variante. Ver `openFolioCloseVariant`.
   *
   * REGLA QUE CAMBIÓ: antes un folio no peligroso llevaba "Registrar cierre" DESHABILITADO,
   * porque el único formulario dibujado pedía un documento que ese traslado no genera. Es la
   * misma corrección que ya hizo el respaldo de traslado con `folioSupportVariant`: la
   * peligrosidad no decide si la acción existe, decide cuál de sus dos formas se usa.
   *
   * Y TAMBIÉN DECIDE SI HAY FOLIO SIDREP, que es lo que lo volvió el discriminante de una
   * unión: el nodo `6854:5707` prueba que el traslado no peligroso no tiene número de folio.
   * Ver `WasteSidrepOpenNonHazardousFolio`.
   */
  isHazardous: boolean;
  /** Empresa transportista: "Resiter S.A.". Nodo `3081:7880`. */
  carrier: string;
  /** Peso neto despachado en kg, ya formateado con separador de miles: "1.020". */
  dispatchedKg: string;
  /** Patente del vehículo: "HTFR-22". Nodo `3081:7946`. */
  plate: string;
  /** Empresa destinataria: "KDM Tratamiento". Nodo `3081:7951`. */
  destination: string;
  /** Fecha y hora de generación del folio: "12 jul, 14:30". Nodo `3081:7956`. */
  generatedAt: string;
  /**
   * Días transcurridos tal como los escribe la GRILLA del panel: "4 días". Nodo
   * `3081:7961`.
   *
   * NO ES `openedFor`, aunque en el primer folio los dos digan lo mismo. La grilla
   * escribe siempre una duración —es el campo "Días transcurridos"— mientras la fila
   * escribe el titular del folio, que en el recién generado es "Recién generado" y no
   * una cantidad de días. Con el endpoint los dos salen del mismo instante y esta
   * duplicación desaparece.
   */
  elapsedLabel: string;
  /**
   * Cómo se anuncia el folio en la LISTA: "4 días", "1 día", "Recién generado".
   * Nodos `3081:7883`, `3081:7899` y `3081:7915`.
   */
  openedFor: string;
  /**
   * Leyenda debajo, en la lista. El nodo le da TRES formas distintas y ninguna se
   * deduce de las otras dos, así que es un dato y no una derivación:
   *
   *   `3081:7885`  "sobre 3 días"     el que se pasó del plazo, con el plazo
   *   `3081:7901`  "dentro de plazo"  el que va en tiempo, sin cifra
   *   `3081:7917`  "hace 3 horas"     el recién generado, con su antigüedad
   */
  openedForCaption: string;
  /**
   * Estado de la aceptación del transportista en la plataforma oficial:
   * "Confirmada en plataforma oficial". Nodo `3081:7966`.
   */
  carrierAcceptance: string;
  /**
   * Si el folio se pasó del plazo de revisión. Es lo que enciende el rojo del dato
   * destacado de la fila (`3081:7883`) y lo que hace aparecer la alerta del panel
   * (`3081:7923`).
   *
   * ES UN CAMPO Y NO UNA COMPARACIÓN entre `elapsedLabel` y el plazo: los dos son
   * texto en prosa, no umbrales. Con el endpoint lo resuelve el backend, que es quien
   * conoce el SLA vigente por tipo de residuo.
   */
  overSla: boolean;
  /**
   * Plazo excedido, ya formateado: "3 días". Sólo lo llevan los folios fuera de plazo,
   * que son los que lo mencionan —en la leyenda de la fila y en la alerta del panel—.
   */
  slaLabel: string | null;
  /**
   * Lo que la declaración SIDREP de este folio va a transcribir — ver
   * `WasteSidrepOpenFolioDeclarationReading`.
   *
   * ES MAQUETA Y VIVE EN EL FOLIO SÓLO HASTA QUE EXISTA EL PARSER. No es un dato del folio
   * abierto: un folio abierto todavía no tiene ticket de recepción ni peso recibido —por eso
   * está abierto—. Está acá para que el estado completo del modal (`4230:13614`) sea
   * alcanzable y verificable hoy, subiendo cualquier PDF. Cuando exista el endpoint, el modal
   * lo recibe de un `useMutation` y este campo desaparece.
   */
  declarationReading: WasteSidrepOpenFolioDeclarationReading;
}

/**
 * Traslado de residuo PELIGROSO — el caso que dibujan los nodos `3081:7463` y `3081:7930`.
 *
 * ES EL ÚNICO QUE TIENE FOLIO SIDREP, y de ahí sale toda la diferencia de la vista: la fila
 * lo escribe al lado del transportista, el subtítulo del panel lo encabeza, el modal de cierre
 * lo repite en su cabecera y el aviso ámbar del pie habla de cerrarlo en la plataforma del
 * Ministerio.
 */
export interface WasteSidrepOpenHazardousFolio extends WasteSidrepOpenFolioBase {
  isHazardous: true;
  /** Número de folio SIDREP: "2026-SD-04812". Nodo `3081:7881`. */
  folio: string;
}

/**
 * Traslado de residuo NO PELIGROSO — el caso que dibuja el nodo `6854:5707`, emplazado en el
 * `6854:5367`.
 *
 * NO TIENE FOLIO SIDREP, y no es un olvido de la maqueta: SIDREP es el Sistema de Declaración
 * de Residuos PELIGROSOS, así que un traslado no peligroso no genera folio ahí. El nodo lo
 * confirma tres veces —la fila escribe sólo "Resiter S.A." donde la peligrosa escribe
 * "Resiter S.A. · Folio 2026-SD-04812", el subtítulo del panel escribe sólo el transportista,
 * y el aviso ámbar sobre "el cierre del SIDREP en la plataforma oficial" DESAPARECE del
 * cuerpo—. Las tres cosas dicen lo mismo: acá no hay folio que cerrar en la plataforma.
 */
export interface WasteSidrepOpenNonHazardousFolio extends WasteSidrepOpenFolioBase {
  isHazardous: false;
}

/**
 * Un traslado de la bandeja "Abiertos", PELIGROSO O NO.
 *
 * ES UNA UNIÓN DISCRIMINADA POR `isHazardous` —igual que `WasteSidrepFolio` en los cerrados—
 * y ya no un campo plano con el folio siempre presente. La razón es la del nodo `6854:5707`:
 * el folio SIDREP existe SÓLO en la rama peligrosa, así que leerlo obliga a estrechar antes y
 * la regla la comprueba el compilador. Con `folio: string` en los dos casos, cualquier
 * proyección nueva podía escribir "Folio SIDREP …" sobre un traslado que no tiene folio, y el
 * error se veía en pantalla en vez de en el build.
 */
export type WasteSidrepOpenFolio =
  | WasteSidrepOpenHazardousFolio
  | WasteSidrepOpenNonHazardousFolio;

/**
 * Tolerancias por tipo de residuo de las lecturas de maqueta.
 *
 * La del aceite es LITERALMENTE el mismo texto que en `wasteSidrepFolios.ts`, porque es el
 * mismo tipo de residuo y el mismo histórico. La de los envases NO se copia de allá: aquel
 * folio despacha 142 kg y su texto dice "~4 kg", y el 3% de los 210 de éste son ~6, así que
 * copiarla habría dejado una tolerancia que no cierra con su propio peso. Las dos mueren con
 * el endpoint, que es quien conoce el histórico.
 */
const OPEN_OIL_TOLERANCE =
  'Tolerancia esperada para Aceite lubricante: ±2% (~20 kg) · histórico general por tipo de residuo.';

const OPEN_CONTAINER_TOLERANCE =
  'Tolerancia esperada para Envases contaminados: ±3% (~6 kg) · histórico general por tipo de residuo.';

/*
 * La de la chatarra usa el MISMO ±2% que la del folio cerrado homónimo —mismo tipo de residuo,
 * mismo histórico— pero con los kilos de ESTE traslado: el 2% de 2.640 son ~53, no los ~70 de
 * aquellos 3.480. Copiar el texto entero habría dejado una tolerancia que no cierra con su
 * propio peso.
 */
const OPEN_SCRAP_TOLERANCE =
  'Tolerancia esperada para Chatarra metálica: ±2% (~53 kg) · histórico general por tipo de residuo.';

/* Ídem: el 2% de los 1.860 de ese traslado son ~37 kg. */
const OPEN_WOOD_TOLERANCE =
  'Tolerancia esperada para Madera de embalaje: ±2% (~37 kg) · histórico general por tipo de residuo.';

/** Rótulo de estado de la pastilla del panel. Nodo `3081:7934`. */
export const WASTE_SIDREP_FOLIO_OPEN_STATUS = 'Abierto';

/** Rótulo del botón del pie del panel. Nodo `3081:7980`. */
export const WASTE_SIDREP_OPEN_FOLIO_ACTION = 'Registrar cierre';

/**
 * Aviso ámbar del pie del cuerpo del panel — nodo `3081:7971`.
 *
 * ES CONSTANTE Y NO POR FOLIO: no describe este traslado, describe qué significa que
 * un folio esté abierto. El nodo nombra a las DOS empresas ("ICB/Resiter") en el panel
 * de un folio que lleva sólo Resiter, así que el texto es genérico a propósito y no se
 * interpola el transportista del folio.
 */
export const WASTE_SIDREP_OPEN_FOLIO_NOTICE =
  'Aún no se ha confirmado el cierre del SIDREP en la plataforma oficial del Ministerio. Verifica con ICB/Resiter el estado de la recepción en destino.';

export const WASTE_SIDREP_OPEN_FOLIOS: WasteSidrepOpenFolio[] = [
  {
    /* El único folio cuyo PANEL dibuja el nodo, y el único fuera de plazo. */
    id: '2026-SD-04812',
    folio: '2026-SD-04812',
    wasteType: 'Baterías de plomo-ácido',
    isHazardous: true,
    carrier: 'Resiter S.A.',
    dispatchedKg: '610',
    plate: 'HTFR-22',
    destination: 'KDM Tratamiento',
    generatedAt: '12 jul, 14:30',
    elapsedLabel: '4 días',
    openedFor: '4 días',
    openedForCaption: 'sobre 3 días',
    carrierAcceptance: 'Confirmada en plataforma oficial',
    overSla: true,
    slaLabel: '3 días',
    /*
     * LA ÚNICA LECTURA QUE SALE DEL NODO, y coincide exactamente con el folio homónimo de
     * la lista de CERRADOS: 610 despachados, 590 recibidos, brecha de 20 kg = 3,3% sobre una
     * tolerancia de ~12 kg. Es la maqueta diciendo que registrar este cierre es lo que
     * convierte este folio en aquél.
     */
    declarationReading: {
      receptionTicket: 'TR-04812',
      receivedKg: '590',
      gap: {
        kg: '20',
        percentage: '3,3%',
        tolerance:
          'Tolerancia esperada para Baterías de plomo: ±2% (~12 kg) · histórico general por tipo de residuo.',
        qualifier: 'sobre tolerancia',
        exceedsTolerance: true,
      },
    },
  },
  {
    /*
     * EL ÚNICO TRASLADO QUE NO SALE DE LA MAQUETA DEL `3081:7463`, y el que hace alcanzable
     * toda la rama no peligrosa: el panel `6854:5707` y el cierre `4230:14038`. Los tres del
     * nodo son RESPEL por el DS 148 —baterías de plomo-ácido, aceite lubricante usado y
     * envases contaminados—, así que sin éste no había desde dónde abrirla. Chatarra metálica
     * es el mismo residuo con el que el `4327:35730` prueba la variante de "Cerrados".
     *
     * SIN `folio`, y la unión lo PROHÍBE en esta rama. El `2026-SD-04807` que tuvo mientras el
     * modelo era plano era un número de folio SIDREP inventado para un traslado que no declara
     * en SIDREP. El `id` es clave interna —nunca se muestra— y por eso no imita un folio.
     *
     * VA SEGUNDO PORQUE LA LISTA ESTÁ ORDENADA POR ANTIGÜEDAD —4 días, 1 día, recién
     * generado—, y sus 2 días caen ahí. Con el endpoint el orden lo da la consulta.
     */
    id: 'open-nh-chatarra-metalica',
    wasteType: 'Chatarra metálica',
    isHazardous: false,
    carrier: 'ICB Ingeniería',
    dispatchedKg: '2.640',
    plate: 'JCVR-18',
    destination: 'KDM Tratamiento',
    generatedAt: '14 jul, 11:40',
    elapsedLabel: '2 días',
    openedFor: '2 días',
    openedForCaption: 'dentro de plazo',
    carrierAcceptance: 'Confirmada en plataforma oficial',
    overSla: false,
    slaLabel: null,
    /*
     * Maqueta: 2.640 despachados contra 2.615 recibidos son 25 kg = 0,9%, dentro de los ~53
     * que tolera la chatarra. El ticket de recepción final transcribe los mismos dos datos
     * que transcribe una declaración SIDREP —el nodo `4230:14038` dibuja las mismas dos
     * cajas— así que la lectura tiene la misma forma en las dos variantes.
     */
    declarationReading: {
      receptionTicket: 'TR-26-0412',
      receivedKg: '2.615',
      gap: {
        kg: '25',
        percentage: '0,9%',
        tolerance: OPEN_SCRAP_TOLERANCE,
        qualifier: 'normal',
        exceedsTolerance: false,
      },
    },
  },
  {
    /*
     * SEGUNDO TRASLADO NO PELIGROSO, también de maqueta. Con uno solo la rama se recorría pero
     * no se leía como una bandeja: era un caso aislado entre tres RESPEL. Con dos se ve que la
     * variante es un tipo de traslado y no una excepción, y que sus filas comparten la forma
     * —transportista solo, sin "· Folio …"—.
     *
     * OTRO RESIDUO Y OTROS DATOS A PROPÓSITO: repitiendo chatarra y destinatario las dos filas
     * se leían como el mismo traslado duplicado.
     *
     * VA ACÁ, detrás de la chatarra, porque los dos llevan 2 días y la lista está ordenada por
     * antigüedad. Y va DENTRO DE PLAZO porque el `find((f) => f.overSla)` con el que entra la
     * vista tiene que seguir cayendo en el `2026-SD-04812`, el folio cuyo panel dibuja el nodo
     * `3081:7463`. Tampoco hay nodo de un traslado no peligroso fuera de plazo.
     */
    id: 'open-nh-madera-embalaje',
    wasteType: 'Madera de embalaje',
    isHazardous: false,
    carrier: 'Resiter S.A.',
    dispatchedKg: '1.860',
    plate: 'KLRS-91',
    destination: 'KDM Tratamiento',
    generatedAt: '14 jul, 08:15',
    elapsedLabel: '2 días',
    openedFor: '2 días',
    openedForCaption: 'dentro de plazo',
    carrierAcceptance: 'Confirmada en plataforma oficial',
    overSla: false,
    slaLabel: null,
    /* Maqueta: 1.860 despachados contra 1.845 recibidos son 15 kg = 0,8%, dentro de los ~37. */
    declarationReading: {
      receptionTicket: 'TR-26-0398',
      receivedKg: '1.845',
      gap: {
        kg: '15',
        percentage: '0,8%',
        tolerance: OPEN_WOOD_TOLERANCE,
        qualifier: 'normal',
        exceedsTolerance: false,
      },
    },
  },
  {
    /*
     * De acá abajo, sólo la FILA sale del nodo (`3081:7888`): residuo, peso,
     * transportista, folio, "1 día" y "dentro de plazo". El resto es maqueta.
     */
    id: '2026-SD-04803',
    folio: '2026-SD-04803',
    wasteType: 'Aceite lubricante usado',
    isHazardous: true,
    carrier: 'Resiter S.A.',
    dispatchedKg: '1.020',
    plate: 'GXPT-45',
    destination: 'Hidronor Chile S.A.',
    generatedAt: '15 jul, 09:05',
    elapsedLabel: '1 día',
    openedFor: '1 día',
    openedForCaption: 'dentro de plazo',
    carrierAcceptance: 'Confirmada en plataforma oficial',
    overSla: false,
    slaLabel: null,
    /* Maqueta: 1.020 despachados contra 1.005 recibidos son 15 kg = 1,5%, DENTRO de los ~20
     * que tolera el aceite, así que su modal completo no muestra el recuadro ámbar. */
    declarationReading: {
      receptionTicket: 'TR-04803',
      receivedKg: '1.005',
      gap: {
        kg: '15',
        percentage: '1,5%',
        tolerance: OPEN_OIL_TOLERANCE,
        qualifier: 'normal',
        exceedsTolerance: false,
      },
    },
  },
  {
    /* Fila del nodo `3081:7904`. El panel es maqueta. */
    id: '2026-SD-04798',
    folio: '2026-SD-04798',
    wasteType: 'Envases contaminados',
    isHazardous: true,
    carrier: 'ICB Ingeniería',
    dispatchedKg: '210',
    plate: 'MTKD-63',
    destination: 'Hidronor Chile S.A.',
    generatedAt: '16 jul, 08:20',
    /*
     * "Menos de 1 día" y no "0 días": la grilla escribe una duración legible, y un
     * folio de tres horas de antigüedad no lleva ningún día abierto.
     */
    elapsedLabel: 'Menos de 1 día',
    openedFor: 'Recién generado',
    openedForCaption: 'hace 3 horas',
    /*
     * Coherente con la antigüedad: a tres horas de generado el transportista todavía
     * no aceptó el traslado en la plataforma. Es lo que hace visible que el campo
     * varía; el nodo sólo dibuja el caso confirmado.
     */
    carrierAcceptance: 'Pendiente de confirmación',
    overSla: false,
    slaLabel: null,
    /* Maqueta: 2 kg sobre 210 son 1,0%, dentro de los ~6 que tolera este residuo. */
    declarationReading: {
      receptionTicket: 'TR-04798',
      receivedKg: '208',
      gap: {
        kg: '2',
        percentage: '1,0%',
        tolerance: OPEN_CONTAINER_TOLERANCE,
        qualifier: 'normal',
        exceedsTolerance: false,
      },
    },
  },
];

/**
 * Fila de la lista maestra — nodos `3081:7872`, `3081:7888` y `3081:7904`.
 *
 * Las TRES filas llevan la casilla ámbar con el camión (`inTransit`), porque las tres
 * son traslados en curso: acá el tono de la casilla no distingue folios entre sí, lo
 * hace el tono del dato destacado. Es lo contrario de la pestaña "Cerrados", donde el
 * estado va siempre teal y la casilla es la que cambia.
 */
export function openFolioListRow(folio: WasteSidrepOpenFolio): WasteFolioListRow {
  return {
    id: folio.id,
    title: `${folio.wasteType} — ${folio.dispatchedKg} kg`,
    /*
     * LA FILA NO PELIGROSA ESCRIBE SÓLO EL TRANSPORTISTA — nodo `6854:5367`, donde las tres
     * filas dicen "Resiter S.A." / "ICB Ingeniería" a secas donde la peligrosa (`3081:7879`)
     * dice "Resiter S.A. · Folio 2026-SD-04812". No hay folio que nombrar.
     */
    subtitle: folio.isHazardous ? `${folio.carrier} · Folio ${folio.folio}` : folio.carrier,
    highlight: folio.openedFor,
    caption: folio.openedForCaption,
    tone: 'inTransit',
    highlightTone: folio.overSla ? 'late' : 'calm',
  };
}

/**
 * Subtítulo del panel de detalle — nodo `3081:7932`.
 *
 * NO LLEVA EL TIPO DE RESIDUO, y no es un olvido: el título del panel ya lo dice, y
 * este nodo escribe sólo folio y transportista. El subtítulo de la pestaña "Cerrados"
 * (`3440:3378`) sí lo repite —"Folio SIDREP … · Baterías de plomo-ácido · Resiter
 * S.A."—, así que son dos textos distintos y cada uno se reproduce como está.
 */
export function openFolioDetailSubtitle(folio: WasteSidrepOpenFolio): string {
  /* Nodo `6854:5713`: en el traslado no peligroso el subtítulo es el transportista y nada más. */
  if (!folio.isHazardous) return folio.carrier;

  return `Folio SIDREP ${folio.folio} · ${folio.carrier}`;
}

/**
 * Subtítulo de la cabecera del modal de cierre — nodo `4230:13279`.
 *
 * ÉSTE SÍ LLEVA EL TIPO DE RESIDUO, al contrario de `openFolioDetailSubtitle`. Y no es
 * inconsistencia del diseño: el panel de detalle tiene el residuo en su propio título, así
 * que repetirlo en el subtítulo sobra; el modal se abre encima y su título es la acción
 * ("Registrar cierre de folio"), así que el residuo tiene que estar acá o no está en
 * ninguna parte. Es la misma forma que el subtítulo del respaldo de un folio cerrado.
 */
export function openFolioCloseSubtitle(folio: WasteSidrepOpenFolio): string {
  /*
   * SIN FOLIO EN EL NO PELIGROSO, y esto NO sale de un nodo: el `4230:14038` escribe "Folio
   * SIDREP 2026-SD-04812 · Baterías de plomo-ácido · Resiter S.A." porque está relleno con el
   * contenido de la maqueta PELIGROSA, como se anotó en ese componente. Se deriva de la regla
   * que sí está dibujada tres veces en el `6854:5707`: si el traslado no tiene folio, la
   * cabecera del modal no puede nombrarlo. Quedan el residuo y el transportista, que son los
   * otros dos datos de ese subtítulo.
   */
  if (!folio.isHazardous) return `${folio.wasteType} · ${folio.carrier}`;

  return `Folio SIDREP ${folio.folio} · ${folio.wasteType} · ${folio.carrier}`;
}

/**
 * Cuál de las dos formas del modal de cierre le corresponde a este folio — `4230:13273` con
 * la declaración SIDREP, `4230:14038` con el ticket de recepción final.
 *
 * ES UNA FUNCIÓN Y NO UN TERNARIO EN LA VISTA, igual que `folioSupportVariant` en los folios
 * cerrados: es la regla de negocio —qué documento respalda el cierre de un traslado— y vive
 * junto al campo que la decide, no repetida en cada lugar que abra el modal.
 */
export function openFolioCloseVariant(folio: WasteSidrepOpenFolio): WasteFolioCloseVariant {
  return folio.isHazardous ? 'hazardous' : 'nonHazardous';
}

/**
 * Mensaje del snackbar que confirma el cierre — nodo `3083:9723`.
 *
 * EL NODO TRAE EL TEXTO PARTIDO EN DOS SPANS, `"Folio "` y `"Resiter S.A. · Folio
 * 2026-SD-04812 cerrado exitosamente"`, con el mismo estilo los dos. Leídos juntos dirían
 * "Folio" dos veces, y el ANCHO MEDIDO de la instancia descarta que se rendericen los dos:
 * sus 525px menos el padding, el check de 24, los dos `gap-[8px]` y la X de 16 dejan 445px
 * de texto, que es lo que mide el segundo span solo; con el prefijo harían falta unos 490 y
 * la caja mediría cerca de 570. Así que el primero es un resto de la plantilla del UI Kit y
 * no se reproduce.
 */
export function openFolioClosedMessage(folio: WasteSidrepOpenFolio): string {
  /*
   * TAMPOCO SALE DE UN NODO —el `3083:9723` es el del cierre peligroso— y se compone con la
   * misma forma menos el folio: lo que se cerró es el traslado, y nombrarlo por un folio que
   * la pantalla nunca mostró dejaría al aprobador leyendo un número que no vio en ningún lado.
   */
  if (!folio.isHazardous) {
    return `${folio.carrier} · Traslado de ${folio.wasteType} cerrado exitosamente`;
  }

  return `${folio.carrier} · Folio ${folio.folio} cerrado exitosamente`;
}

/**
 * Alerta de SLA del panel — nodo `3081:7926`, o `null` cuando el folio va en plazo.
 *
 * SE COMPONE Y NO SE GUARDA COMO TEXTO para que la frase no pueda contradecir a los
 * datos que la rodean: el "4 días" es el mismo `elapsedLabel` que muestra la grilla,
 * el "3 días" el mismo plazo que la leyenda de la fila, y el transportista el mismo del
 * subtítulo. Con la frase escrita a mano, cambiar los días dejaba la alerta hablando
 * de otro folio.
 */
export function openFolioSlaAlert(folio: WasteSidrepOpenFolio): string | null {
  if (!folio.overSla || !folio.slaLabel) return null;

  return `Este folio lleva ${folio.elapsedLabel} abierto — sobre el plazo de ${folio.slaLabel}. Se recomienda solicitar justificación a ${folio.carrier}.`;
}

/**
 * Los seis datos de la grilla del panel, en el orden del nodo `3081:7936`.
 *
 * NINGUNO SE COLOREA. El nodo pinta los seis valores en `#131313`, incluidos los "4
 * días" del folio fuera de plazo: acá la señal ya la dan la alerta de arriba y el rojo
 * del dato de la fila, así que el dato de la grilla es un dato y no una alarma. Es la
 * diferencia con `folioFacts` de la pestaña "Cerrados", donde "Diferencia de peso" sí
 * va en `#6b3a1f` cuando se pasa de la tolerancia.
 *
 * NO SE SOLAPA con la grilla de los cerrados más que en la destinataria y la fecha de
 * generación: ésta describe un traslado EN CURSO —patente, días abiertos, aceptación
 * del transportista— y aquélla el cierre —peso recibido, brecha, fecha de cierre—.
 */
export function openFolioFacts(folio: WasteSidrepOpenFolio): WasteDefinitionItem[] {
  return [
    { label: 'Peso neto despachado', value: `${folio.dispatchedKg} kg` },
    { label: 'Patente vehículo', value: folio.plate },
    { label: 'Empresa destinataria', value: folio.destination },
    { label: 'Fecha de generación', value: folio.generatedAt },
    { label: 'Días transcurridos', value: folio.elapsedLabel },
    { label: 'Aceptación transportista', value: folio.carrierAcceptance },
  ];
}
