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
 * dos —patente, destinataria, fecha, aceptación— se completan de forma coherente para
 * que la vista sea navegable. No son datos del diseño y no se deben tomar como tales.
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

export interface WasteSidrepOpenFolio {
  /** Número de folio SIDREP: "2026-SD-04812". */
  folio: string;
  wasteType: string;
  /**
   * Si el residuo es PELIGROSO (RESPEL).
   *
   * ES LO QUE DECIDE CÓMO SE CIERRA EL FOLIO: un traslado peligroso se cierra con el modal
   * `4230:13273`, que pide la declaración SIDREP, y uno no peligroso no la tiene —no la
   * genera— así que su cierre es otro formulario. Ver `WasteSidrepFoliosPage`.
   *
   * Es un campo plano y no una unión discriminada como en `wasteSidrepFolios.ts`: allá la
   * peligrosidad cambia QUÉ DATOS tiene el folio cerrado —resolución sanitaria, paquete de
   * respaldos— y acá no cambia ninguno, sólo con qué formulario se cierra. Una unión sin
   * campos distintos entre ramas es ceremonia.
   *
   * LOS TRES FOLIOS DEL NODO SON PELIGROSOS —baterías de plomo-ácido, aceite lubricante
   * usado y envases contaminados son los tres RESPEL por el DS 148—, así que la rama no
   * peligrosa no tiene muestra en esta pestaña. No se inventa un cuarto folio para
   * mostrarla: el nodo dibuja tres.
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
     * De acá abajo, sólo la FILA sale del nodo (`3081:7888`): residuo, peso,
     * transportista, folio, "1 día" y "dentro de plazo". El resto es maqueta.
     */
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
    id: folio.folio,
    title: `${folio.wasteType} — ${folio.dispatchedKg} kg`,
    subtitle: `${folio.carrier} · Folio ${folio.folio}`,
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
  return `Folio SIDREP ${folio.folio} · ${folio.wasteType} · ${folio.carrier}`;
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
