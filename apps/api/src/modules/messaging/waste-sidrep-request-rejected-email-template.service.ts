import { Injectable } from '@nestjs/common';
import {
  EMAIL_SHELL_METRICS_ROOMY,
  escapeHtml,
  renderEmailShell,
  requireEmail,
  requireHttpUrl,
  requireText,
  type EmailShellPill,
} from './email-shell';
import { RenderedEmail } from './messaging.types';

/**
 * Correo "Solicitud de retiro rechazada" — nodo Figma `4278:21437`.
 *
 * ES EL CORREO DEL RECHAZO, el que le llega a QUIEN PIDIÓ EL RETIRO cuando Medio
 * Ambiente devuelve la solicitud para corrección. No confundir con
 * `WasteSidrepRequestCorrectedEmailTemplateService`, que es el paso siguiente del mismo
 * circuito: aquél sale DE VUELTA AL APROBADOR una vez corregida, es verde y lleva a la
 * bandeja de pendientes. Este es rojo y lleva al formulario.
 *
 * EL NODO ES EL CORREO DE SPR DUPLICADO, y los NOMBRES DE CAPA lo prueban —Figma congela
 * el nombre con el texto del momento en que se creó la capa, así que comparar nombre
 * contra contenido muestra qué reescribió el diseñador—:
 *
 *   `4278:21481`  " SPR · Formulario rechazado "                       → RESIDUOS · SOLICITUD RECHAZADA
 *   `4278:21483`  "Tu formulario SPR fue rechazado — Se requiere corr"  → "Tu solicitud de retiro…"
 *   `4278:21491`  "Tu Gerente de Área revisó el formulario SPR del ci"  → "Medio ambiente revisó…"
 *   `4278:21524`  "Una vez corrijas el formulario y lo reenvíes, tu G"  → "…Medio Ambiente recibirá…"
 *
 * O sea el contenido YA está reescrito para residuos; lo que quedó del original son los
 * dos restos marcados abajo ("lo devolvió" y "el formulario").
 *
 * EL ARMAZÓN —cabecera, tarjeta, botón, pie— vive en `email-shell.ts`. Las medidas son
 * las `ROOMY`, las mismas del correo de observación rechazada, y coinciden con el nodo en
 * once de los trece valores: cuerpo `40px 48px 36px`, bajada 13/19.5 a 6px, línea a 24,
 * saludo a 24, párrafo 14/23.1 a 12 y botón a 28.
 *
 * LOS DOS QUE NO, MEDIDOS SOBRE EL NODO:
 *
 *   EL SALUDO NO LLEVA COMA. `ROOMY` cierra con "Hola, X," y el nodo `4278:21489` escribe
 *   "Hola, [Nombre y apellido]" a secas —se verificó sobre el render del nodo, no sobre su
 *   nombre de capa—. Se pasa `greetingSuffix: ''`, que es la prop opcional que el armazón
 *   expone justamente para esto; ver su nota en `EmailShellInput`.
 *
 *   EL MARGEN BAJO EL BOTÓN. El nodo deja 8px (`4278:21526` termina en 73 sobre los 81 de
 *   su contenedor) y `ROOMY` deja 0. Acá NO se agrega prop: son 8px de aire al final del
 *   cuerpo, no cambian qué dice el correo ni dónde se hace clic, y `EmailShellMetrics`
 *   existe justamente para que estas divergencias del sistema de diseño se vean juntas en
 *   un lugar en vez de multiplicarse. Queda anotado para resolverlo con diseño.
 *
 * LOS COLORES SON EL PAR ROJO DEL SISTEMA, verificados sobre el render del nodo píxel a
 * píxel: pastilla y recuadro `#ffd0db`, punto `#bd3b5b`, borde del recuadro `#f0a0b0`,
 * tarjeta blanca con borde `#e3e3e3`. Son los mismos que ya usa el correo de observación
 * rechazada, así que no se agrega ninguna constante de color nueva.
 */

/** Pastilla `4278:21479`, la roja del sistema de diseño. */
const REJECTED_PILL: EmailShellPill = {
  label: 'RESIDUOS · SOLICITUD RECHAZADA',
  background: '#ffd0db',
  dot: '#bd3b5b',
  color: '#570b1d',
};

/** Titular `4278:21483`. */
const HEADING = 'Tu solicitud de retiro fue rechazada — Se requiere corrección';

/**
 * Párrafo `4278:21491`.
 *
 * DICE "LO DEVOLVIÓ" Y NO "LA DEVOLVIÓ": es un resto del correo de SPR, donde el
 * pronombre concordaba con "el formulario". Se reproduce el texto del nodo —es el que
 * diseño escribió y el que va a revisar— y queda anotado como corrección de copy a
 * pedir; cambiarlo por cuenta propia haría que el correo enviado y el nodo dejen de
 * coincidir sin que nadie se enterara.
 */
const BODY_PARAGRAPH =
  'Medio ambiente revisó tu solicitud de retiro y lo devolvió para corrección. Por favor revisa el motivo indicado a continuación y reenvía el formulario corregido.';

/**
 * Párrafo de cierre `4278:21524`.
 *
 * TAMBIÉN DICE "EL FORMULARIO" para hablar de la solicitud, mismo resto que el anterior.
 */
const CLOSING_PARAGRAPH =
  'Una vez corrijas el formulario y lo reenvíes, Medio Ambiente recibirá una nueva notificación para revisarlo.';

/** Rótulo del botón `4278:21527`. */
const CTA_LABEL = 'Ir a corregir formulario';

/**
 * Destino del botón `4278:21525`: la vista "Histórico de retiros de residuos" de la web,
 * que es la de las solicitudes de retiro.
 *
 * ES ESTA PANTALLA Y NO `/waste/historico`, aunque las dos se llamen parecido. Acá está
 * TODO lo que el correo le pide al transportista:
 *
 *   el aviso "Rechazadas · N solicitud(es)"   nodo `4278:17632`
 *   la pastilla "Rechazado" en Folio SIDREP   nodo `4278:18460`
 *   el link "Corregir" de la fila             nodo `4278:18538`
 *
 * `/waste/historico` es otra vista —el histórico del aprobador, con sus diecinueve
 * columnas de pesos y responsables— y no dibuja ninguna de las tres: mandar ahí al
 * transportista lo dejaba sin manera de encontrar la solicitud rechazada.
 *
 * POR ESO EL RÓTULO CIERRA: el botón dice "Ir a corregir formulario" y el destino tiene un
 * "Corregir" en la fila rechazada, que es lo que sigue después del clic.
 *
 * ES UNA CONSTANTE Y SE VALIDA, en vez de confiar en que cada llamador ponga la ruta
 * correcta: el correo tiene UN destino y es este. El error de apuntar a otra pantalla se
 * vería recién en la bandeja de alguien.
 *
 * LO QUE VARÍA ES EL HOST, no la ruta —hay un dominio por ambiente—, así que se sigue
 * recibiendo la URL completa en `actionUrl` como en los otros tres correos y lo que se
 * comprueba es que el `pathname` sea éste.
 */
export const WASTE_SIDREP_REJECTED_EMAIL_ACTION_PATH = '/waste/solicitud-retiro';

/**
 * Área del revisor, en la fila "RECHAZADO POR" del nodo `4278:21516`.
 *
 * ES UNA CONSTANTE Y NO UN PARÁMETRO, al revés que en el correo de observación rechazada
 * —que recibe `rejectedByProfile`—: en residuos el único que rechaza una solicitud de
 * retiro es Medio Ambiente, y el cuerpo del correo lo afirma en dos párrafos ("Medio
 * ambiente revisó tu solicitud", "Medio Ambiente recibirá una nueva notificación"). Un
 * parámetro dejaría poner otro área en la tabla y el correo se contradiría solo.
 */
const REVIEWER_AREA = 'Medio Ambiente';

export type WasteSidrepRequestRejectedEmailParams = {
  /** Quien pidió el retiro y tiene que corregirlo. Va en negrita tras "Hola, ". */
  recipientName: string;
  recipientEmail: string;
  /**
   * Número de la solicitud: "SR-2026-0847".
   *
   * NO ESTÁ EN EL NODO —el correo dibujado no lo muestra— y se pide igual porque el
   * ASUNTO tampoco está dibujado: Figma no dibuja asuntos. Un correo cuyo asunto no
   * distinga una solicitud de otra se apila en un solo hilo en la bandeja, así que el
   * número entra ahí y en el preheader, no en el cuerpo.
   */
  requestNumber: string;
  /** Motivo tal como lo escribió el revisor. Nodo `4278:21497`; admite saltos de línea. */
  rejectionReason: string;
  /** Revisor de Medio Ambiente que rechazó. Nodos `4278:21497` y `4278:21516`. */
  rejectedByName: string;
  /** Fecha del rechazo YA FORMATEADA como la dibuja el nodo `4278:21504`: "18-08-2026". */
  rejectedAtLabel: string;
  /**
   * Destino del botón `4278:21525`, con el host del ambiente y el path
   * `WASTE_SIDREP_REJECTED_EMAIL_ACTION_PATH`: "https://…/waste/solicitud-retiro".
   *
   * Es la URL directa de la vista y no un deep-link firmado, igual que en los otros tres
   * correos. La ruta se valida; ver la nota de la constante.
   */
  actionUrl: string;
};

@Injectable()
export class WasteSidrepRequestRejectedEmailTemplateService {
  render(params: WasteSidrepRequestRejectedEmailParams): RenderedEmail {
    const input = this.validate(params);
    const subject = `AurelIA · Solicitud de retiro rechazada · ${input.requestNumber}`;
    const rejectedBy = `${input.rejectedByName} · ${REVIEWER_AREA}`;

    return {
      subject,
      html: renderEmailShell({
        metrics: EMAIL_SHELL_METRICS_ROOMY,
        documentTitle: 'Solicitud de retiro rechazada',
        preheader: `Medio ambiente devolvió la solicitud ${escapeHtml(input.requestNumber)} para corrección.`,
        pill: REJECTED_PILL,
        heading: escapeHtml(HEADING),
        subheading: 'AurelIA · Sistema de Gestión Ambiental · Salares Norte',
        recipientName: escapeHtml(input.recipientName),
        greetingSuffix: '',
        paragraphs: [escapeHtml(BODY_PARAGRAPH)],
        /*
         * Recuadro rojo `4278:21493`. El "⚠" va como carácter y no como imagen, igual que
         * en los otros correos: así lo dibuja el nodo (`4278:21495` es un texto de 15px) y
         * un glifo no depende de que el cliente cargue imágenes remotas.
         */
        notice: {
          background: '#ffd0db',
          border: '#f0a0b0',
          color: '#570b1d',
          iconCellWidth: 16,
          paddingY: 13,
          fontSize: 13,
          lineHeight: 20.15,
          iconCellStyle: 'color:#570b1d;font-size:15px;line-height:23px;',
          iconHtml: '⚠',
          bodyHtml: `<strong>Motivo del rechazo · ${escapeHtml(input.rejectedByName)}</strong><br>${this.renderReason(input.rejectionReason)}`,
        },
        extraBlocksHtml: this.renderBody({ rejectedAtLabel: input.rejectedAtLabel, rejectedBy }),
        ctaLabel: CTA_LABEL,
        ctaUrl: escapeHtml(input.actionUrl),
      }),
      text: this.renderText({ ...input, subject, rejectedBy }),
    };
  }

  /**
   * Motivo del recuadro, ENTRE COMILLAS TIPOGRÁFICAS porque así lo dibuja el nodo: el
   * texto de `4278:21497` abre y cierra con “ ”, que es lo que lo marca como cita del
   * revisor y no como texto del sistema.
   *
   * EL CORREO DE OBSERVACIÓN RECHAZADA NO LAS LLEVA, y la diferencia es del diseño, no de
   * la implementación: se sigue el nodo de este correo. Si diseño unifica, se borra acá.
   *
   * Los saltos de línea del motivo se convierten a `<br>`: un `\n` dentro de una celda de
   * tabla no se ve, y el motivo lo escribe una persona en un `textarea`.
   */
  private renderReason(reason: string): string {
    return `“${escapeHtml(reason).replace(/\r?\n/g, '<br>')}”`;
  }

  /**
   * Tarjeta de detalle `4278:21499`: dos filas, "FECHA" y "RECHAZADO POR".
   *
   * LA LÍNEA VA SÓLO ENTRE LAS DOS FILAS, no debajo de la última —lo dibuja `4278:21505`,
   * el único separador del nodo— y el alto lo confirma: 17 + 16 + 10 + 1 + 10 + 16 + 17 =
   * 87, que es lo que mide la tarjeta.
   *
   * Las filas van en una tabla ANIDADA, igual que en el correo de solicitud corregida: el
   * radio y el relleno de 16 × 18 son de la TARJETA, así que con una sola tabla la línea
   * llegaría hasta el borde en vez de respetar el relleno.
   *
   * NO SE COMPARTE EL `detailRow` DEL CORREO DE OBSERVACIÓN RECHAZADA aunque las dos
   * tablas se parezcan: aquélla pone el relleno en cada celda (`10px 12px`) y sus valores
   * van en 13/18; ésta es una tarjeta con relleno propio y filas de 16px de alto. Son dos
   * componentes distintos del sistema de diseño.
   */
  private renderBody(input: { rejectedAtLabel: string; rejectedBy: string }): string {
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;margin-top:20px;border:1px solid #e3e3e3;border-radius:8px;background:#ffffff;">
                <tr>
                  <td style="padding:16px 18px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;">
                      ${detailRow('fecha', input.rejectedAtLabel, 'first')}
                      ${detailRow('Rechazado por', input.rejectedBy, 'last')}
                    </table>
                  </td>
                </tr>
              </table>
              <p style="margin:20px 0 0;font-size:14px;line-height:23.1px;color:#333333;">${escapeHtml(CLOSING_PARAGRAPH)}</p>`;
  }

  private validate(
    params: WasteSidrepRequestRejectedEmailParams,
  ): WasteSidrepRequestRejectedEmailParams {
    return {
      recipientName: requireText(params.recipientName, 'recipientName'),
      recipientEmail: requireEmail(params.recipientEmail, 'recipientEmail'),
      requestNumber: requireText(params.requestNumber, 'requestNumber'),
      rejectionReason: requireText(params.rejectionReason, 'rejectionReason'),
      rejectedByName: requireText(params.rejectedByName, 'rejectedByName'),
      rejectedAtLabel: requireDdMmYyyy(params.rejectedAtLabel, 'rejectedAtLabel'),
      actionUrl: requireActionUrl(params.actionUrl, 'actionUrl'),
    };
  }

  /** Versión en texto plano, para los clientes que no muestran HTML. */
  private renderText(
    input: WasteSidrepRequestRejectedEmailParams & { subject: string; rejectedBy: string },
  ): string {
    return [
      input.subject,
      '',
      `Hola, ${input.recipientName}`,
      '',
      BODY_PARAGRAPH,
      '',
      `Motivo del rechazo · ${input.rejectedByName}`,
      input.rejectionReason,
      '',
      `Fecha: ${input.rejectedAtLabel}`,
      `Rechazado por: ${input.rejectedBy}`,
      '',
      CLOSING_PARAGRAPH,
      '',
      `${CTA_LABEL}: ${input.actionUrl}`,
      '',
      'AURELIA · Sistema de Gestión Ambiental · Gold Fields Salares Norte',
      'Este es un correo generado de forma automática, por favor no responder este mensaje.',
      'Si tienes dudas, contacta a tu Especialista de Sustentabilidad.',
    ].join('\n');
  }
}

/**
 * Fila de la tarjeta de detalle — nodos `4278:21500` y `4278:21512`.
 *
 * El relleno es ASIMÉTRICO a propósito: los 16px de arriba y de abajo los pone la tarjeta
 * y los 10px de separación de la línea los ponen las filas, así que la primera sólo lleva
 * relleno abajo y la última sólo arriba. Con relleno simétrico la tarjeta mediría 107 y no
 * los 87 del nodo.
 *
 * `text-transform:uppercase` en el rótulo porque el nodo lo declara como ESTILO y no como
 * texto escrito: los contenidos son "fecha" y "Rechazado por".
 */
function detailRow(label: string, value: string, position: 'first' | 'last'): string {
  const cell =
    position === 'first'
      ? 'padding:0 0 10px;border-bottom:1px solid #f0f0f0;'
      : 'padding:10px 0 0;';
  const font = 'font-family:Inter,Arial,sans-serif;';
  return `<tr><td style="${cell}${font}color:#acacac;font-size:11px;line-height:16px;font-weight:700;letter-spacing:.77px;text-transform:uppercase;">${escapeHtml(label)}</td><td align="right" style="${cell}${font}color:#131313;font-size:13px;line-height:16px;font-weight:600;text-align:right;">${escapeHtml(value)}</td></tr>`;
}

/**
 * URL del botón: `http(s)` —lo que ya exige el armazón— y apuntando a la vista de
 * solicitudes de retiro.
 *
 * Se compara el `pathname` y no la URL entera para no atarse al host ni a lo que traiga
 * detrás: una barra final o un `?utm=…` siguen llevando a la misma pantalla, y rechazarlos
 * sería rigor de más. Lo que no puede pasar es que el botón apunte a OTRA vista.
 */
function requireActionUrl(value: string, field: string): string {
  const normalized = requireHttpUrl(value, field);
  const { pathname } = new URL(normalized);
  if (pathname.replace(/\/$/, '') !== WASTE_SIDREP_REJECTED_EMAIL_ACTION_PATH) {
    throw new TypeError(`${field} must point to ${WASTE_SIDREP_REJECTED_EMAIL_ACTION_PATH}`);
  }
  return normalized;
}

/**
 * La fecha llega YA FORMATEADA y se valida el formato en vez de confiar: el nodo dibuja
 * `dd-mm-aaaa` y un ISO que se filtrara desde el backend ("2026-08-18") pasaría
 * desapercibido hasta verlo en la bandeja de alguien.
 */
function requireDdMmYyyy(value: string, field: string): string {
  const normalized = requireText(value, field);
  if (!/^\d{2}-\d{2}-\d{4}$/.test(normalized)) {
    throw new TypeError(`${field} must be formatted as dd-mm-yyyy`);
  }
  return normalized;
}
