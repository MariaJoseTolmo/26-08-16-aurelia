import type { WasteFolioAttachment } from './components/WasteFolioAttachmentsSection';
import type { WasteDefinitionItem } from './components/WasteDefinitionGrid';
import type {
  WasteFolioListRow,
  WasteFolioListRowHighlightTone,
} from './components/WasteFolioListCard';
/*
 * La bandeja de pendientes IMPORTA EL ESTADO DE LA DE ABIERTOS, y en un solo sentido: el
 * aviso verde del modal de aprobación promete que la solicitud pasará a "Abierto", que es
 * exactamente la pastilla de aquella pestaña. No hay ciclo —`wasteSidrepOpenFolios` sólo
 * mira a `wasteSidrepFolios`— y la dependencia es la que el dominio ya tiene: aprobar una
 * solicitud es lo que la convierte en folio abierto.
 */
import { WASTE_SIDREP_FOLIO_OPEN_STATUS } from './wasteSidrepOpenFolios';

/**
 * Solicitudes de la pestaña "Pendientes de revisión" — nodo `3073:5688`.
 *
 * ACÁ TODAVÍA NO HAY FOLIO, y es la diferencia que ordena todo el archivo. Un folio
 * SIDREP existe recién cuando el aprobador dice que sí: lo que esta bandeja lista son
 * SOLICITUDES de retiro —`#SR-2026-0847`— esperando esa decisión. Por eso el pie del
 * panel dice "Aprobar y generar folio" y no "Guardar", por eso la fila se identifica
 * por conductor y patente en vez de por número de folio, y por eso el modelo se llama
 * `WasteSidrepPendingRequest` y no `…Folio`.
 *
 * DE AHÍ SALE TAMBIÉN QUÉ MIDE LA PESTAÑA. "Cerrados" mide pesos, "Abiertos" mide días
 * y ésta mide HORAS: el SLA de revisión es de 6 horas desde el ingreso —lo dice la
 * bajada de la vista, nodo `3073:5900`— así que el dato destacado de cada fila es
 * cuánto queda, y el nodo lo pinta en tres tramos (ver `pendingRequestListRow`).
 *
 * ES EL MISMO PATRÓN QUE `wasteSidrepFolios.ts` y `wasteSidrepOpenFolios.ts`: un modelo
 * por solicitud y las proyecciones que la pantalla necesita —la fila de la lista
 * maestra, la grilla del panel, el aviso de SLA y el de verificación—. Los nodos
 * escriben la misma solicitud con distinto recorte y acá se escribe una sola vez.
 *
 * TODO ESTO ES MAQUETA y desaparece cuando exista el endpoint: pasa a un hook de
 * TanStack Query y estas proyecciones quedan como los formateadores que ya son.
 *
 * EL NODO SÓLO DIBUJA EL PANEL DE LA PRIMERA SOLICITUD (`3073:5971`). De las otras dos
 * sale únicamente la FILA —residuo, peso, transportista, patente, conductor y el
 * tiempo de SLA—; contenedores, destinataria, fecha, resolución sanitaria y adjuntos
 * se completan de forma coherente para que la vista sea navegable. No son datos del
 * diseño y no se deben tomar como tales.
 */

/**
 * Cuánto dura el SLA de revisión, tal como lo escribe la bajada de la vista (nodo
 * `3073:5900`) y lo repite la alerta del panel (`3073:5976`).
 *
 * VIVE ACÁ Y NO EN LA PÁGINA porque es lo que las dos frases tienen en común: la
 * bajada lo enuncia ("El SLA de revisión es de 6 horas desde el ingreso") y la alerta
 * lo usa de referencia ("del SLA de 6 horas"). Con el endpoint lo manda el backend,
 * que es quien conoce el SLA vigente.
 */
export const WASTE_SIDREP_REVIEW_SLA = '6 horas';

/** Rótulo de la pastilla de estado del panel. Nodo `3073:5984`. */
export const WASTE_SIDREP_REQUEST_PENDING_STATUS = 'Pendiente';

/** Rótulos de los dos botones del pie del panel. Nodos `3073:6087` y `3073:6091`. */
export const WASTE_SIDREP_REQUEST_REJECT_ACTION = 'Rechazar';
export const WASTE_SIDREP_REQUEST_APPROVE_ACTION = 'Aprobar y generar folio';

/**
 * En qué tramo del SLA está la solicitud. Es lo que decide el color del dato destacado
 * de la fila, y los tres salen del nodo:
 *
 *   `onTime`   `3073:5933`  "4h 20m"        #006153
 *   `atRisk`   `3073:5949`  "1h 05m"        #e8720c
 *   `overdue`  `3073:5965`  "Vencido · 40m" var(--red/500_cta, #bd3b5b)
 *
 * ES UN CAMPO Y NO UNA COMPARACIÓN sobre `slaRemaining`: ese campo es prosa formateada
 * —"4h 20m", "Vencido · 40m"—, no una duración. Con el endpoint el tramo lo resuelve el
 * backend, que conoce el instante de ingreso y el SLA vigente. Mismo criterio que
 * `overSla` en `wasteSidrepOpenFolios.ts`.
 */
export type WasteSidrepRequestSlaStage = 'onTime' | 'atRisk' | 'overdue';

const SLA_STAGE_TONE: Record<WasteSidrepRequestSlaStage, WasteFolioListRowHighlightTone> = {
  onTime: 'calm',
  atRisk: 'warning',
  overdue: 'late',
};

export interface WasteSidrepPendingRequest {
  /** N° de solicitud de retiro: "SR-2026-0847". Nodo `3073:5982`. Todavía NO es un folio. */
  request: string;
  wasteType: string;
  /** Empresa transportista: "Resiter S.A.". Nodo `3073:5930`. */
  carrier: string;
  /** Peso neto en kg, ya formateado con separador de miles: "870". Nodo `3073:5996`. */
  netKg: string;
  /** Cantidad de contenedores, ya formateada: "4". Nodo `3073:5991`. */
  containers: string;
  /** Patente del vehículo: "RLVZ-57". Nodo `3073:6001`. */
  plate: string;
  /** Conductor a cargo del traslado: "Juan Pérez Soto". Nodo `3073:6006`. */
  driver: string;
  /** Empresa destinataria: "Hidronor Chile S.A.". Nodo `3073:6011`. */
  destination: string;
  /** Fecha y hora de ingreso de la solicitud: "16 jul, 09:12". Nodo `3073:6016`. */
  requestedAt: string;
  /**
   * Lo que queda —o lo que se pasó— del SLA, ya formateado: "4h 20m", "Vencido · 40m".
   * Nodos `3073:5933`, `3073:5949` y `3073:5965`.
   */
  slaRemaining: string;
  slaStage: WasteSidrepRequestSlaStage;
  /**
   * Resolución sanitaria del transportista contra la que se verificó la solicitud:
   * "Resolución Exenta N°10171/2022". Nodo `3073:6021`.
   */
  sanitaryResolution: string;
  /** Respaldos que llegaron con la solicitud — nodos `3073:6027` y hermanos. */
  attachments: WasteFolioAttachment[];
}

/**
 * Los siete respaldos de la primera solicitud, en el orden del nodo `3073:6026`.
 *
 * LOS NOMBRES SE REPRODUCEN TAL CUAL, con el guion corto pegado al rótulo que escriben
 * los siete nodos ("Ticket de pesaje- ticket_pesaje_0847.pdf"). Ver
 * `WasteFolioAttachment`.
 *
 * LOS TAMAÑOS SON MAQUETA. El nodo escribe "XX KB" en las siete filas —Figma no conoce
 * el peso de un archivo—, así que acá van cifras verosímiles en vez de shippear el
 * marcador a la pantalla. Con el endpoint los manda el backend.
 */
const OIL_REQUEST_ATTACHMENTS: WasteFolioAttachment[] = [
  { name: 'Ticket de pesaje- ticket_pesaje_0847.pdf', size: '184 KB' },
  { name: 'Guía de despacho RESPEL- guia_respel-2204.pdf', size: '212 KB' },
  { name: 'HDST- hdst_aceite_lubricante_v4.pdf', size: '96 KB' },
  { name: 'Fotografía frontal- foto_1.jpg', size: '1,4 MB' },
  { name: 'Fotografía posterior- foto_2.jpg', size: '1,2 MB' },
  { name: 'Fotografía lateral izquierda- foto_3.jpg', size: '1,5 MB' },
  { name: 'Fotografía lateral derecha- foto_4.jpg', size: '1,3 MB' },
];

export const WASTE_SIDREP_PENDING_REQUESTS: WasteSidrepPendingRequest[] = [
  {
    /* La única solicitud cuyo PANEL dibuja el nodo (`3073:5971`). */
    request: 'SR-2026-0847',
    wasteType: 'Aceite lubricante usado',
    carrier: 'Resiter S.A.',
    netKg: '870',
    containers: '4',
    plate: 'RLVZ-57',
    driver: 'Juan Pérez Soto',
    destination: 'Hidronor Chile S.A.',
    requestedAt: '16 jul, 09:12',
    slaRemaining: '4h 20m',
    slaStage: 'onTime',
    sanitaryResolution: 'Resolución Exenta N°10171/2022',
    attachments: OIL_REQUEST_ATTACHMENTS,
  },
  {
    /*
     * De acá abajo, sólo la FILA sale del nodo (`3073:5938`): residuo, peso,
     * transportista, patente, conductor y "1h 05m / restantes". El resto es maqueta.
     */
    request: 'SR-2026-0851',
    wasteType: 'Baterías de plomo-ácido',
    carrier: 'ICB Ingeniería',
    netKg: '320',
    containers: '2',
    plate: 'HTFR-22',
    driver: 'Marcos Díaz',
    destination: 'KDM Tratamiento',
    requestedAt: '16 jul, 12:35',
    slaRemaining: '1h 05m',
    slaStage: 'atRisk',
    /* Otra empresa, otra resolución: la del transportista y no la del generador. */
    sanitaryResolution: 'Resolución Exenta N°8842/2023',
    attachments: [
      { name: 'Ticket de pesaje- ticket_pesaje_0851.pdf', size: '176 KB' },
      { name: 'Guía de despacho RESPEL- guia_respel-2211.pdf', size: '205 KB' },
      { name: 'HDST- hdst_baterias_plomo_v2.pdf', size: '104 KB' },
      { name: 'Fotografía frontal- foto_1.jpg', size: '1,1 MB' },
      { name: 'Fotografía posterior- foto_2.jpg', size: '1,0 MB' },
    ],
  },
  {
    /* Fila del nodo `3073:5954`, la única VENCIDA. El panel es maqueta. */
    request: 'SR-2026-0839',
    wasteType: 'Envases contaminados',
    carrier: 'Resiter S.A.',
    netKg: '145',
    containers: '6',
    plate: 'JKBV-90',
    driver: 'Pedro Salas',
    destination: 'Hidronor Chile S.A.',
    requestedAt: '15 jul, 17:48',
    slaRemaining: 'Vencido · 40m',
    slaStage: 'overdue',
    /* Mismo transportista que la primera, así que la MISMA resolución. */
    sanitaryResolution: 'Resolución Exenta N°10171/2022',
    attachments: [
      { name: 'Ticket de pesaje- ticket_pesaje_0839.pdf', size: '168 KB' },
      { name: 'Guía de despacho RESPEL- guia_respel-2198.pdf', size: '198 KB' },
      { name: 'HDST- hdst_envases_contaminados_v1.pdf', size: '88 KB' },
      { name: 'Fotografía frontal- foto_1.jpg', size: '1,2 MB' },
    ],
  },
];

/**
 * Fila de la lista maestra — nodos `3073:5922`, `3073:5938` y `3073:5954`.
 *
 * LAS TRES LLEVAN LA CASILLA ÁMBAR CON EL GLIFO "PELIGROSO" (`pendingReview`): las tres son solicitudes de retiro
 * de residuo PELIGROSO esperando decisión, así que acá la casilla no distingue una de
 * otra —lo hace el tono del dato destacado, que es el tramo del SLA—. Es lo mismo que
 * pasa en "Abiertos" con el camión, y lo contrario de "Cerrados", donde el estado va
 * siempre teal y la casilla es la que cambia.
 *
 * EL SUBTÍTULO NO LLEVA NÚMERO DE FOLIO, al revés que en las otras dos pestañas, y no
 * es un olvido: no hay folio todavía. El nodo escribe transportista, patente y
 * conductor, que es con lo que se identifica un traslado que aún no fue aprobado.
 *
 * LA LEYENDA CAMBIA CON EL TRAMO y sale de los nodos: "restantes" mientras queda SLA
 * (`3073:5935`, `3073:5951`) y "sobre SLA" cuando venció (`3073:5967`). No se deduce
 * del texto del dato destacado, así que se decide acá y no en el componente.
 */
export function pendingRequestListRow(request: WasteSidrepPendingRequest): WasteFolioListRow {
  return {
    id: request.request,
    title: `${request.wasteType} — ${request.netKg} kg`,
    subtitle: `${request.carrier} · Patente ${request.plate} · ${request.driver}`,
    highlight: request.slaRemaining,
    caption: request.slaStage === 'overdue' ? 'sobre SLA' : 'restantes',
    tone: 'pendingReview',
    highlightTone: SLA_STAGE_TONE[request.slaStage],
  };
}

/**
 * Subtítulo del panel de detalle — nodo `3073:5982`.
 *
 * NÚMERO DE SOLICITUD Y TRANSPORTISTA, con el "#" que el nodo escribe pegado. No lleva
 * el tipo de residuo porque el título del panel ya lo dice, igual que en "Abiertos".
 */
export function pendingRequestDetailSubtitle(request: WasteSidrepPendingRequest): string {
  return `Solicitud #${request.request} · ${request.carrier}`;
}

/**
 * Alerta de SLA que abre el panel — nodo `3073:5976`.
 *
 * SE COMPONE Y NO SE GUARDA COMO TEXTO, mismo criterio que `openFolioSlaAlert`: el
 * "4h 20m" es el mismo `slaRemaining` que muestra la fila y el "6 horas" el mismo SLA
 * que enuncia la bajada de la vista. Con la frase escrita a mano, cambiar el tiempo
 * dejaba la alerta hablando de otra solicitud.
 *
 * EL NODO SÓLO DIBUJA LA FORMA "QUEDAN …". La solicitud vencida no tiene panel dibujado,
 * y "Quedan Vencido · 40m del SLA" no es una frase: por eso el tramo `overdue` arma la
 * suya, con el mismo esqueleto y el mismo SLA de referencia. Es maqueta coherente, no
 * un texto del diseño.
 */
export function pendingRequestSlaAlert(request: WasteSidrepPendingRequest): string {
  if (request.slaStage === 'overdue') {
    return `Esta solicitud superó el SLA de ${WASTE_SIDREP_REVIEW_SLA} para responder — ${request.slaRemaining.replace('Vencido · ', '')} sobre el plazo.`;
  }

  return `Quedan ${request.slaRemaining} del SLA de ${WASTE_SIDREP_REVIEW_SLA} para responder esta solicitud.`;
}

/**
 * Aviso verde de verificación del cuerpo del panel — nodo `3073:6021`.
 *
 * DICE QUE LA PLATAFORMA YA CRUZÓ LOS DATOS, y es la razón por la que el aprobador
 * puede decidir mirando esta pantalla: la patente y el tipo de residuo se contrastaron
 * contra la resolución sanitaria VIGENTE del transportista. Se compone —resolución y
 * transportista salen de la solicitud— para que no pueda contradecir a la grilla que
 * tiene arriba.
 */
export function pendingRequestVerification(request: WasteSidrepPendingRequest): string {
  return `Patente y tipo de residuo verificados contra la ${request.sanitaryResolution} de ${request.carrier} — vigente.`;
}

/**
 * Los seis datos de la grilla del panel, en el orden del nodo `3073:5986`.
 *
 * NINGUNO SE COLOREA: el nodo pinta los seis valores en `#131313`. La señal de esta
 * pestaña ya la dan la alerta de SLA de arriba y el tono del dato de la fila.
 *
 * NO SE SOLAPA con las grillas de las otras dos pestañas más que en la patente y la
 * destinataria: ésta describe una solicitud —contenedores, conductor, fecha de
 * ingreso—, "Abiertos" un traslado en curso y "Cerrados" un cierre.
 */
export function pendingRequestFacts(request: WasteSidrepPendingRequest): WasteDefinitionItem[] {
  return [
    { label: 'Cantidad de contenedores', value: request.containers },
    { label: 'Peso neto', value: `${request.netKg} kg` },
    { label: 'Patente vehículo', value: request.plate },
    { label: 'Conductor', value: request.driver },
    { label: 'Empresa destinataria', value: request.destination },
    { label: 'Fecha de solicitud', value: request.requestedAt },
  ];
}

/**
 * Textos del modal de rechazo — nodo `4295:24214`, el que abre "Rechazar" del pie del
 * panel.
 *
 * EL NODO ES LA PANTALLA DE SPR DUPLICADA. Los nombres de capa lo delatan: `4295:24218`
 * se llama "El Responsable de Área recibirá una notificación c" y `4295:24223` "Describe
 * qué debe corregir Felipe Núñez González.", que son textuales de `SPR_AREA_REJECT_MODAL`
 * (nodo `1399:14360`). Lo que se reproduce acá es el CONTENIDO ACTUAL del nodo de
 * residuos, ya reescrito: la bajada habla del "Responsable de esta solicitud" y perdió la
 * cláusula del plazo de cierre, que en SPR venía con un aviso rojo que este nodo no
 * dibuja.
 *
 * EL PLACEHOLDER SE TOMA COMO PLACEHOLDER Y NO COMO VALOR ESCRITO. El nodo lo pinta en
 * `#646464`, el mismo gris de la bajada y no el `#131313` con el que el módulo dibuja los
 * valores tipeados; y un modal que abriera con un motivo de rechazo ya redactado invita a
 * enviarlo sin leerlo, que es justo lo que este diálogo existe para evitar. El texto va
 * verbatim, comillas incluidas: es un EJEMPLO de qué tan específico tiene que ser el
 * motivo, y por eso está redactado en primera persona y entre comillas.
 *
 * SE CORRIGE UN SOLO CARÁCTER respecto del nodo: "asegurese" va con tilde. El nodo escribe
 * "nítida" con tilde dos palabras después, así que es un desliz de tipeo del diseño y no
 * una convención sin acentos.
 */
export const WASTE_SIDREP_REJECT_MODAL = {
  /** Texto del nodo `4295:24216`. */
  title: 'Rechazar solicitud',
  /** Texto del nodo `4295:24218`. */
  description:
    'El Responsable de esta solicitud recibirá una notificación con tu motivo y podrá corregir el formulario desde AurelIA.',
  /** Texto del nodo `4295:24220`, sin el asterisco: ese lo dibuja el campo. */
  reasonLabel: 'Motivo del rechazo',
  /** Texto del nodo `4295:24223`. */
  reasonPlaceholder:
    '“La fotografía frontal del camión está demasiado borrosa. Por favor asegúrese de que la patente se vea nítida”.',
  /** Texto del nodo `4295:24232`. */
  cancelLabel: 'Cancelar',
  /** Texto del nodo `4295:24236`. */
  submitLabel: 'Enviar rechazo',
} as const;

/**
 * Mensaje del snackbar que confirma el rechazo.
 *
 * EL SNACKBAR NO ES LA CONFIRMACIÓN PRINCIPAL —eso lo hace la franja roja del panel, que
 * queda—, sino el acuse de que el envío salió. Por eso habla del ENVÍO y no del estado:
 * el estado ya está dibujado en la pantalla, atrás del snackbar.
 *
 * NOMBRA AL TRANSPORTISTA Y NO AL RESIDUO, igual que el del cierre de folio: quien queda
 * esperando la corrección es la empresa, y es el dato con el que se la busca después.
 */
export function pendingRequestRejectedMessage(request: WasteSidrepPendingRequest): string {
  return `${request.carrier} · Rechazo de la solicitud ${request.request} enviado exitosamente`;
}

/**
 * Qué queda registrado cuando se envía un rechazo — nodo `4295:24658`, la franja roja que
 * corona el panel de la solicitud rechazada.
 *
 * NO ES UN `boolean` NI UN NÚMERO DE SOLICITUD SUELTO: la franja dibuja el motivo tipeado
 * y el instante del envío, así que rechazar produce un REGISTRO y no un flag. Cuando
 * exista el endpoint, esto es lo que devuelve el backend.
 */
export interface WasteSidrepRequestRejection {
  /** N° de la solicitud rechazada: "SR-2026-0847". */
  request: string;
  /** El motivo tal como se escribió en el modal `4295:24214`, ya sin espacios sobrantes. */
  reason: string;
  /** Instante del envío. Es lo que fecha el titular de la franja. */
  rejectedAt: Date;
}

/** Texto de la pastilla del nodo `4295:24656`, en la fila de la lista. */
export const WASTE_SIDREP_REQUEST_REJECTED_STATUS = 'Rechazado';

/**
 * Cierre del nodo `4295:24665`, la línea en semi negrita al pie de la cita.
 *
 * VA VERBATIM, guion pegado incluido: el nodo escribe "-A la espera de correcciones." sin
 * espacio después del guion, y el guion es lo que la despega visualmente de la cita.
 */
export const WASTE_SIDREP_REQUEST_REJECTED_NOTE = '-A la espera de correcciones.';

const TWO_DIGITS = (value: number): string => String(value).padStart(2, '0');

/**
 * Titular de la franja de rechazo — nodo `4295:24663`.
 *
 * EL NODO ESCRIBE "Formulario rechazado. · dd-mm-aaaa · XX:XX", O SEA UN FORMATO Y NO UN
 * VALOR. "dd-mm-aaaa" y "XX:XX" son marcadores —Figma no conoce el instante en que se va
 * a rechazar—, así que lo que se reproduce es la FORMA que declaran: día, mes y año con
 * cero a la izquierda separados por guiones, y hora de 24 con dos puntos. Shippear los
 * marcadores a la pantalla habría sido calcar la maqueta en vez del diseño.
 *
 * DICE "FORMULARIO" Y ACÁ NO HAY FORMULARIOS. Es el tercer resto de SPR de esta pantalla,
 * y como los otros dos se reproduce tal cual y se deja anotado: en residuos lo que se
 * rechaza es una SOLICITUD de retiro —así la nombra el resto de la vista, empezando por
 * el título del propio modal, "Rechazar solicitud"—. El nombre de la capa del nodo lo
 * confirma: se llama "Formulario rechazado por Francisco Villalobos R. ·", que es
 * textual de SPR, o sea que el diseñador reescribió la frase y le dejó la primera palabra.
 * El reemplazo natural es "Solicitud rechazada.".
 */
export function pendingRequestRejectionHeading(rejection: WasteSidrepRequestRejection): string {
  const at = rejection.rejectedAt;
  const date = `${TWO_DIGITS(at.getDate())}-${TWO_DIGITS(at.getMonth() + 1)}-${at.getFullYear()}`;
  const time = `${TWO_DIGITS(at.getHours())}:${TWO_DIGITS(at.getMinutes())}`;

  return `Formulario rechazado. · ${date} · ${time}`;
}

/**
 * La cita de la franja — nodo `4295:24665`, primera línea.
 *
 * LAS COMILLAS Y EL PUNTO LOS PONE ESTA FUNCIÓN Y NO QUIEN ESCRIBE. El nodo dibuja el
 * motivo entre comillas tipográficas y con el punto final AFUERA de la comilla de cierre
 * —«“…nítida”.»—, que es la forma que el propio placeholder del modal muestra como
 * ejemplo. Dejarlo a cargo de quien tipea significaba que la franja saliera con la forma
 * del nodo sólo cuando alguien se acordara de las comillas.
 */
export function pendingRequestRejectionQuote(reason: string): string {
  return `“${reason}”.`;
}

/**
 * Textos del modal "Aprobar y generar folio SIDREP" — nodo `3087:17238`,
 * el diálogo que abre el botón `3073:6088` del pie del panel de esta misma bandeja.
 *
 * ES EL DIÁLOGO QUE FALTABA PARA CERRAR LA BANDEJA. Hasta acá "Aprobar y generar folio"
 * entraba deshabilitado porque su nodo no existía; con éste, las dos salidas de una
 * solicitud —el sí y el no— quedan dibujadas y conectadas.
 *
 * EL MODAL NO GENERA EL FOLIO: LO REGISTRA. Es lo que dice su propio aviso azul, y ordena
 * todo lo demás. El SIDREP se emite en la Ventanilla Única del RETC, que es una plataforma
 * del Ministerio y está fuera de AurelIA; lo que el aprobador hace acá es TRANSCRIBIR el
 * número que aquella le devolvió, para que el traslado se pueda seguir de este lado. Por
 * eso el campo pide un folio ya existente en vez de ofrecer un botón que lo emita, y por
 * eso el aviso nombra la solicitud con la que hay que ir: son los datos a copiar allá.
 *
 * LA LÍNEA DEL MEDIO DEL AVISO ES EL MISMO TEXTO QUE EL SUBTÍTULO de la cabecera —el nodo
 * escribe "Solicitud #SR-2026-0847 · Resiter S.A." en los dos lugares— y por eso las dos
 * salen de `pendingRequestDetailSubtitle`, la misma proyección que ya usa el panel. No es
 * repetición del diseño por descuido: arriba nombra QUÉ se está aprobando y en el aviso es
 * el dato a copiar en la otra plataforma.
 *
 * EL PLACEHOLDER SE TOMA DEL DESIGN CONTEXT Y NO DEL NOMBRE DE LA CAPA. La capa se llama
 * "Ej. 2026-SD-04821" y el texto vigente dice "Ej. 2026-SD-01234": Figma congela el nombre
 * con el texto que tenía al crearse, así que el nombre es la versión vieja. Manda el design
 * context, igual que en `WASTE_FOLIO_CLOSE_NOTICE`.
 */
export const WASTE_SIDREP_APPROVE_MODAL = {
  /** Texto del nodo `3087:17242`. */
  title: 'Aprobar y generar folio SIDREP',
  /** Primera línea del aviso azul — nodo `3087:17252`. */
  noticeLead: 'Genera el SIDREP en la Ventanilla Única del RETC con estos datos:',
  /** Tercera línea del mismo aviso, con "AurelIA" tal como el nodo lo capitaliza. */
  noticeTail: 'Y luego registra el N° de folio aquí para continuar el seguimiento en AurelIA.',
  /** Texto del nodo `3087:17255`. */
  folioLabel: 'N° de Folio SIDREP',
  /** Texto del nodo `3087:17257`. */
  folioPlaceholder: 'Ej. 2026-SD-01234',
  /** Texto del nodo `3087:17260`. */
  dateLabel: 'Fecha de generación',
  /** Texto del nodo `3087:17267`. */
  cancelLabel: 'Cancelar',
  /** Texto del nodo `3087:17271`. */
  submitLabel: 'Confirmar y notificar',
  /**
   * Primera mitad de la primera línea del aviso VERDE — nodo `3087:17714`.
   *
   * Va partido en tres porque el nodo le pone Inter Bold al nombre del estado y deja el
   * resto en regular. Los espacios entre las partes los escribe el JSX con `{' '}` en vez
   * de quedar colgando al final de estas constantes, donde son invisibles y el primero que
   * las toque se los come.
   */
  outcomeLead: 'Al confirmar, la solicitud pasará a estado',
  /** Segunda línea del mismo aviso — nodo `3087:17714`. */
  outcomeNote:
    'La aceptación del SIDREP por parte del transportista ocurre directamente en la plataforma oficial del Ministerio.',
} as const;

/**
 * El estado al que pasa la solicitud, en NEGRITA dentro del aviso verde.
 *
 * SALE DE `WASTE_SIDREP_FOLIO_OPEN_STATUS` Y NO DE UN LITERAL, y ésa es toda la gracia: es
 * literalmente la pastilla que va a llevar el folio en la pestaña "Abiertos" cuando esta
 * aprobación termine. Con "Abierto" escrito a mano acá, el día que el diseño renombre el
 * estado la promesa del modal y la pastilla del panel dirían cosas distintas.
 */
export const WASTE_SIDREP_APPROVE_OUTCOME_STATUS = WASTE_SIDREP_FOLIO_OPEN_STATUS;

/**
 * Cierre de la primera línea del aviso verde — nodo `3087:17714`.
 *
 * NOMBRA AL TRANSPORTISTA porque es a quien se notifica, y por eso se compone en vez de
 * guardarse como texto: el nodo escribe "Resiter S.A." porque es la solicitud que dibuja.
 */
export function pendingRequestApprovalOutcome(request: WasteSidrepPendingRequest): string {
  return `y se notificará automáticamente a ${request.carrier}.`;
}

/**
 * Mensaje del snackbar que confirma la aprobación.
 *
 * MISMA FORMA QUE `openFolioClosedMessage`, el del cierre de folio: transportista, folio y
 * el verbo en participio. Los tres avisos de la vista comparten instancia —ver
 * `WasteSidrepFoliosPage`—, así que compartir la forma es lo que hace que se lean como el
 * mismo sistema y no como tres frases sueltas.
 *
 * NOMBRA EL FOLIO RECIÉN TRANSCRIPTO Y NO LA SOLICITUD, y ahí se separa del mensaje de
 * rechazo: aprobar es justamente el acto que convierte una en el otro, así que el número
 * que queda vigente después del clic es el del folio.
 */
export function pendingRequestApprovedMessage(
  request: WasteSidrepPendingRequest,
  folio: string,
): string {
  return `${request.carrier} · Folio ${folio} generado exitosamente`;
}
