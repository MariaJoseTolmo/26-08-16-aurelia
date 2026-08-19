import { Injectable } from '@nestjs/common';
import {
  EMAIL_SHELL_METRICS_COMPACT,
  escapeHtml,
  renderEmailShell,
  requireEmail,
  requireText,
  type EmailShellPill,
} from './email-shell';
import type { RenderedEmail } from './messaging.types';

/**
 * Correo "Solicitud de retiro aprobada" — nodo Figma `4288:22019`.
 *
 * La plantilla usa el armazón compartido de AurelIA, las medidas COMPACT del nodo y
 * termina en la tarjeta de detalle: este correo es informativo y NO tiene botón.
 */
const APPROVED_PILL: EmailShellPill = {
  label: 'RESIDUOS · SOLICITUD APROBADA',
  background: '#e0ffd3',
  dot: '#00b398',
  color: '#2a5c16',
};

const APPROVER_AREA = 'Medio Ambiente';
const CURRENT_STATUS = 'Abierto';

export type WasteSidrepRequestApprovedEmailParams = {
  /** Solicitante que recibe la confirmación. */
  recipientName: string;
  recipientEmail: string;
  /** Identificador utilizado en el asunto y preheader. */
  requestNumber: string;
  /** Ciclo visible en la bajada del nodo: "Mayo 2026". */
  periodLabel: string;
  /** Usuario de Medio Ambiente que aprobó la solicitud. */
  approvedByName: string;
  /** Fecha y hora ya formateadas como "05-06-2026 · 19:03". */
  approvedAtLabel: string;
  /** Folio generado en la plataforma SIDREP: "2026-SD-04821". */
  sidrepCode: string;
};

@Injectable()
export class WasteSidrepRequestApprovedEmailTemplateService {
  render(params: WasteSidrepRequestApprovedEmailParams): RenderedEmail {
    const input = this.validate(params);
    const subject = `AurelIA · Solicitud de retiro aprobada · ${input.requestNumber}`;
    const approvedBy = `${input.approvedByName} · ${APPROVER_AREA}`;

    return {
      subject,
      html: renderEmailShell({
        metrics: EMAIL_SHELL_METRICS_COMPACT,
        documentTitle: 'Solicitud de retiro aprobada',
        preheader: `La solicitud ${escapeHtml(input.requestNumber)} fue aprobada y su folio SIDREP ya está disponible.`,
        pill: APPROVED_PILL,
        heading: 'Tu solicitud de retiro fue aprobada',
        subheading: `Ciclo ${escapeHtml(input.periodLabel)} · AurelIA · Sistema de Gestión Ambiental`,
        recipientName: escapeHtml(input.recipientName),
        /* El nodo ubica primero el recuadro verde y después el texto informativo. */
        paragraphs: [],
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
          bodyHtml: `<strong>${escapeHtml(input.approvedByName)} aprobó tu solicitud</strong><br>El folio SIDREP fue generado y ya está disponible en la plataforma oficial.`,
        },
        extraBlocksHtml: this.renderBody({
          approvedAtLabel: input.approvedAtLabel,
          approvedBy,
          sidrepCode: input.sidrepCode,
        }),
      }),
      text: this.renderText({ ...input, subject, approvedBy }),
    };
  }

  /** Texto posterior al aviso y tarjeta de tres filas de los nodos `4288:22080–22107`. */
  private renderBody(input: {
    approvedAtLabel: string;
    approvedBy: string;
    sidrepCode: string;
  }): string {
    const rows = [
      ['Fecha de aprobación', input.approvedAtLabel],
      ['Aprobado por', input.approvedBy],
      ['Folio SIDREP', input.sidrepCode],
    ] as const;

    return `<p style="margin:14px 0 0;font-size:13.5px;line-height:22.275px;color:#333333;">Ahora puedes acceder a la plataforma oficial a seguir con el proceso SIDREP y realizar el retiro de residuos.<br>Estado actual de tu solicitud “${CURRENT_STATUS}”</p>
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
    params: WasteSidrepRequestApprovedEmailParams,
  ): WasteSidrepRequestApprovedEmailParams {
    return {
      recipientName: requireText(params.recipientName, 'recipientName'),
      recipientEmail: requireEmail(params.recipientEmail, 'recipientEmail'),
      requestNumber: requireText(params.requestNumber, 'requestNumber'),
      periodLabel: requireText(params.periodLabel, 'periodLabel'),
      approvedByName: requireText(params.approvedByName, 'approvedByName'),
      approvedAtLabel: requireApprovalTimestamp(params.approvedAtLabel, 'approvedAtLabel'),
      sidrepCode: requireText(params.sidrepCode, 'sidrepCode'),
    };
  }

  /** Alternativa accesible para clientes de correo que no muestran HTML. */
  private renderText(
    input: WasteSidrepRequestApprovedEmailParams & { subject: string; approvedBy: string },
  ): string {
    return [
      input.subject,
      '',
      `Hola, ${input.recipientName}`,
      '',
      `${input.approvedByName} aprobó tu solicitud`,
      'El folio SIDREP fue generado y ya está disponible en la plataforma oficial.',
      '',
      'Ahora puedes acceder a la plataforma oficial a seguir con el proceso SIDREP y realizar el retiro de residuos.',
      `Estado actual de tu solicitud “${CURRENT_STATUS}”`,
      '',
      `Fecha de aprobación: ${input.approvedAtLabel}`,
      `Aprobado por: ${input.approvedBy}`,
      `Folio SIDREP: ${input.sidrepCode}`,
      '',
      'AURELIA · Sistema de Gestión Ambiental · Gold Fields Salares Norte',
      'Este es un correo generado de forma automática, por favor no responder este mensaje.',
      'Si tienes dudas, contacta a tu Especialista de Sustentabilidad.',
    ].join('\n');
  }
}

/** Fila compacta de la tarjeta; el nodo dibuja un separador bajo las tres filas. */
function detailRow(label: string, value: string): string {
  const cell =
    'padding:6px 0;border-bottom:1px solid #f0f0f0;font-family:Inter,Arial,sans-serif;';
  return `<tr><td style="${cell}color:#acacac;font-size:10.5px;line-height:16px;font-weight:700;letter-spacing:.63px;text-transform:uppercase;">${escapeHtml(label)}</td><td align="right" style="${cell}color:#131313;font-size:13px;line-height:16px;font-weight:600;text-align:right;">${escapeHtml(value)}</td></tr>`;
}

function requireApprovalTimestamp(value: string, field: string): string {
  const normalized = requireText(value, field);
  if (!/^\d{2}-\d{2}-\d{4} · \d{2}:\d{2}$/.test(normalized)) {
    throw new TypeError(`${field} must be formatted as dd-mm-yyyy · HH:mm`);
  }
  return normalized;
}
