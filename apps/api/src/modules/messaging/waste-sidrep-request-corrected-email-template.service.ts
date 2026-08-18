import { Injectable } from '@nestjs/common';
import {
  escapeHtml,
  EMAIL_SHELL_METRICS_COMPACT,
  renderEmailShell,
  requireEmail,
  requireHttpUrl,
  requireText,
  type EmailShellPill,
} from './email-shell';
import { RenderedEmail } from './messaging.types';

/**
 * Correo "Solicitud de retiro corregida" — nodo Figma `4295:25088`.
 *
 * QUÉ CORREO ES, PORQUE EL NOMBRE DEL NODO ENGAÑA. Este no es el correo del RECHAZO:
 * es el que cierra el circuito UN PASO DESPUÉS. El aprobador rechaza una solicitud con
 * un motivo, el transportista la corrige, y entonces sale este correo DE VUELTA AL
 * APROBADOR para que la revise otra vez. Lo dice todo su contenido: la pastilla es
 * VERDE ("Residuos · solicitud corregida"), el recuadro es verde con un tilde
 * ("[transportista] corrigió la solicitud"), el párrafo tutea al aprobador ("Puedes
 * revisar nuevamente la solicitud realizada, aprobarla o rechazarla") y el botón lleva
 * a la bandeja de pendientes. Un correo de rechazo diría lo contrario y sería rojo.
 *
 * EL NODO ES UN CORREO DE SPR DUPLICADO, y los NOMBRES DE CAPA lo prueban: `4295:25132`
 * se llama " SPR · Confirmación · Formulario aprobado ", `4295:25134` "Tu formulario SPR
 * fue rechazado — Se requiere corr" y `4295:25146` "Francisco Villalobos Rosales aprobó y
 * firmó el for". Figma congela el nombre de capa con el texto del momento en que se creó,
 * así que comparar el nombre contra el contenido actual muestra qué reescribió el
 * diseñador y qué quedó sin tocar. Ver los dos textos marcados abajo.
 *
 * EL ARMAZÓN —cabecera, tarjeta, botón, pie— vive en `email-shell.ts` y lo comparten
 * todos los correos de la app. Las medidas son las `COMPACT` y coinciden con el nodo en
 * los trece valores: `36px 44px 32px` de cuerpo, pastilla `py-4`, bajada 12.5/18.75 a
 * 5px, línea a 20, saludo a 20 con `font-weight:500` y sin coma, párrafo 13.5/22.275 a
 * 14, botón a 28 con 8 abajo.
 *
 * EL RECUADRO VA ANTES DEL PÁRRAFO en este correo, al revés que en los otros tres: el
 * armazón emite saludo → párrafos → recuadro → bloques propios → botón, así que el
 * párrafo y la tabla viajan juntos en `extraBlocksHtml` y `paragraphs` va vacío. Es el
 * hueco que el armazón ya tenía para esto, no una excepción nueva.
 */

/** Pastilla `4295:25130`, la verde del sistema de diseño. */
const CORRECTED_PILL: EmailShellPill = {
  label: 'RESIDUOS · SOLICITUD CORREGIDA',
  background: '#e0ffd3',
  dot: '#00b398',
  color: '#2a5c16',
};

export type WasteSidrepRequestCorrectedEmailParams = {
  /** Aprobador que recibe el correo. Va en negrita tras "Hola, ". */
  recipientName: string;
  recipientEmail: string;
  /**
   * Número de la solicitud: "SR-2026-0847".
   *
   * NO ESTÁ EN EL NODO —el correo dibujado no lo muestra en ningún lado— y se pide igual
   * porque el ASUNTO tampoco está dibujado: Figma no dibuja asuntos. Un correo cuyo
   * asunto no distinga una solicitud de otra se apila en un solo hilo en la bandeja, así
   * que el número entra ahí y en el preheader, no en el cuerpo.
   */
  requestNumber: string;
  /** Quien corrigió la solicitud, del lado del transportista. Nodo `4295:25146`. */
  correctedByName: string;
  /**
   * Ciclo de la bajada `4295:25136`: "Mayo 2026".
   *
   * ES TEXTO SIN TOCAR DEL CORREO DE SPR. El nombre de capa —"Ciclo Mayo 2026 · AurelIA ·
   * Sistema de Gestión Amb"— es idéntico al contenido, o sea que el diseñador reescribió
   * todo lo demás del correo y esta línea no. Y una solicitud de retiro no pertenece a un
   * ciclo: los ciclos son de SPR, y en residuos el período sólo existe para el Reporte
   * SINADER. Se reproduce como está y queda anotado; el reemplazo natural sería el número
   * de solicitud, que es lo que identifica a este correo.
   */
  periodLabel: string;
  /** Tipo de residuo de la fila "Residuo": "Aceite lubricante usado". */
  wasteType: string;
  /** Peso neto ya formateado con unidad: "870 kg". */
  netWeightLabel: string;
  /** Empresa transportista. Nodo `4295:25161`. */
  carrier: string;
  /** Patente del vehículo: "RLVZ-57". */
  plate: string;
  /** Conductor declarado en la solicitud. */
  driver: string;
  /**
   * Destino del botón "Ir a formularios pendientes".
   *
   * Por ahora es la URL directa de la vista (`/waste/folios-sidrep`) y no un deep-link
   * firmado, igual que en `WasteSinaderReportEmailTemplateService`.
   */
  actionUrl: string;
};

/** Párrafo `4295:25148`, tal como lo escribe el nodo —sin punto final incluido—. */
const BODY_PARAGRAPH =
  'Puedes revisar nuevamente la solicitud realizada, aprobarla o rechazarla si es necesario. La solicitud en cuestión es la siguiente';

/**
 * Rótulo del botón `4304:25187`.
 *
 * DICE "FORMULARIOS" Y NO "SOLICITUDES", que es otro resto del correo de SPR: en
 * residuos la bandeja a la que lleva se llama "Pendientes de revisión" y lo que lista
 * son solicitudes de retiro. Se reproduce el texto del nodo y queda anotado.
 */
const CTA_LABEL = 'Ir a formularios pendientes';

@Injectable()
export class WasteSidrepRequestCorrectedEmailTemplateService {
  render(params: WasteSidrepRequestCorrectedEmailParams): RenderedEmail {
    const input = this.validate(params);

    const subject = `AurelIA · Solicitud de retiro corregida · ${input.requestNumber}`;
    const noticeText = `${input.correctedByName} corrigió la solicitud`;

    return {
      subject,
      html: renderEmailShell({
        metrics: EMAIL_SHELL_METRICS_COMPACT,
        documentTitle: 'Solicitud de retiro corregida',
        preheader: `${escapeHtml(input.correctedByName)} corrigió la solicitud ${escapeHtml(input.requestNumber)} y quedó lista para revisar.`,
        pill: CORRECTED_PILL,
        heading: 'Solicitud de retiro corregida',
        subheading: `Ciclo ${escapeHtml(input.periodLabel)} · AurelIA · Sistema de Gestión Ambiental`,
        recipientName: escapeHtml(input.recipientName),
        /*
         * VACÍO A PROPÓSITO: en este nodo el párrafo va DEBAJO del recuadro, así que
         * viaja en `extraBlocksHtml` junto con la tabla. Ver el docblock de arriba.
         */
        paragraphs: [],
        /*
         * Recuadro verde `4295:25142`. El "✓" va como carácter y no como imagen, igual
         * que el "⚠" de los otros dos correos: así lo dibuja el nodo (`4295:25144` es un
         * texto de 15px) y no depende de que el cliente cargue imágenes remotas.
         */
        notice: {
          background: '#e0ffd3',
          border: '#a8dfa8',
          color: '#2a5c16',
          iconCellWidth: 14,
          paddingY: 12,
          marginTop: 14,
          paddingX: 14,
          gap: 9,
          fontSize: 13,
          lineHeight: 20.15,
          iconCellStyle: 'color:#2a5c16;font-size:15px;line-height:23.25px;',
          iconHtml: '✓',
          bodyHtml: `<strong>${escapeHtml(noticeText)}</strong>`,
        },
        extraBlocksHtml: this.renderBody(input),
        ctaLabel: CTA_LABEL,
        ctaUrl: escapeHtml(input.actionUrl),
      }),
      text: this.renderText({ subject, ...input, noticeText }),
    };
  }

  /**
   * Párrafo `4295:25147` y tarjeta de detalle `4295:25150`.
   *
   * LA TARJETA NO ES LA DEL CORREO DE RECHAZO DE INSPECCIONES, y por eso no se comparte
   * el `detailRow` de aquél: aquélla pone el relleno en cada celda (`10px 12px`) y los
   * rótulos en 11px con `letter-spacing:.77px`; ésta es una tarjeta con `15px 17px`
   * propios y filas de `6px` adentro, rótulos de 10.5px con `letter-spacing:.63px` y
   * valores de 13px. Son dos componentes distintos del sistema de diseño.
   *
   * LA LÍNEA VA TAMBIÉN DESPUÉS DE LA ÚLTIMA FILA. Lo dibuja el nodo `4295:25168`, y el
   * alto lo confirma: 15 + 4 × (28 + 1) + 15 = 146, que es lo que mide `4295:25150`.
   *
   * Las filas van en una tabla ANIDADA en vez de meterle el relleno a la de afuera
   * porque el borde redondeado y el `padding` de la tarjeta son de la tarjeta, no de las
   * filas: con una sola tabla, la línea de cada fila llegaría hasta el borde en vez de
   * respetar los 17px.
   */
  private renderBody(input: WasteSidrepRequestCorrectedEmailParams): string {
    const rows = [
      ['Residuo', `${input.wasteType} — ${input.netWeightLabel}`],
      ['empresa transportista', input.carrier],
      ['patente', input.plate],
      ['conductor', input.driver],
    ] as const;

    return `<p style="margin:14px 0 0;font-size:13.5px;line-height:22.275px;color:#333333;">${escapeHtml(BODY_PARAGRAPH)}</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;margin-top:16px;border:1px solid #e3e3e3;border-radius:8px;background:#ffffff;">
                <tr>
                  <td style="padding:15px 17px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;">
                      ${rows.map(([label, value]) => detailRow(label, value)).join('\n                      ')}
                    </table>
                  </td>
                </tr>
              </table>`;
  }

  private validate(
    params: WasteSidrepRequestCorrectedEmailParams,
  ): WasteSidrepRequestCorrectedEmailParams {
    return {
      recipientName: requireText(params.recipientName, 'recipientName'),
      recipientEmail: requireEmail(params.recipientEmail, 'recipientEmail'),
      requestNumber: requireText(params.requestNumber, 'requestNumber'),
      correctedByName: requireText(params.correctedByName, 'correctedByName'),
      periodLabel: requireText(params.periodLabel, 'periodLabel'),
      wasteType: requireText(params.wasteType, 'wasteType'),
      netWeightLabel: requireText(params.netWeightLabel, 'netWeightLabel'),
      carrier: requireText(params.carrier, 'carrier'),
      plate: requireText(params.plate, 'plate'),
      driver: requireText(params.driver, 'driver'),
      actionUrl: requireHttpUrl(params.actionUrl, 'actionUrl'),
    };
  }

  /** Versión en texto plano, para los clientes que no muestran HTML. */
  private renderText(
    input: WasteSidrepRequestCorrectedEmailParams & { subject: string; noticeText: string },
  ): string {
    return [
      input.subject,
      '',
      `Hola, ${input.recipientName}`,
      '',
      input.noticeText,
      '',
      BODY_PARAGRAPH,
      '',
      `Residuo: ${input.wasteType} — ${input.netWeightLabel}`,
      `Empresa transportista: ${input.carrier}`,
      `Patente: ${input.plate}`,
      `Conductor: ${input.driver}`,
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
 * Fila de la tarjeta de detalle — nodos `4295:25151`, `4295:25157`, `4295:25163` y
 * `4295:25179`, cada una con su línea debajo.
 *
 * El `line-height:16px` de las dos celdas es lo que da los 28px de la fila con el
 * `padding` de 6: el rótulo de 10.5px y el valor de 13px caben en la misma caja y así
 * las cuatro filas miden lo mismo aunque el rótulo sea más chico.
 *
 * `text-transform:uppercase` en el rótulo porque el nodo lo declara como estilo y no
 * como texto escrito: los contenidos son "Residuo", "empresa transportista", "patente"
 * y "conductor", en minúscula.
 */
function detailRow(label: string, value: string): string {
  const cell = 'padding:6px 0;border-bottom:1px solid #f0f0f0;font-family:Inter,Arial,sans-serif;';
  return `<tr><td style="${cell}color:#acacac;font-size:10.5px;line-height:16px;font-weight:700;letter-spacing:.63px;text-transform:uppercase;">${escapeHtml(label)}</td><td align="right" style="${cell}color:#131313;font-size:13px;line-height:16px;font-weight:600;text-align:right;">${escapeHtml(value)}</td></tr>`;
}
