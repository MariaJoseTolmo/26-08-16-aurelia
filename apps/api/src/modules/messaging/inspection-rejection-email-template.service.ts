import { Injectable } from '@nestjs/common';
import {
  EMAIL_SHELL_METRICS_ROOMY,
  escapeHtml,
  renderEmailShell,
  requireEmail,
  requireHttpUrl,
  requireText,
} from './email-shell';
import { RenderedEmail } from './messaging.types';

export type InspectionFindingRejectedEmailParams = {
  recipientName: string;
  recipientEmail: string;
  inspectionNumber: string;
  observationNumber: string;
  rejectionReason: string;
  rejectedByName: string;
  rejectedByProfile: string;
  areaName: string | null;
  sectorName: string | null;
  inspectionMode: 'Hallazgo' | 'Checklist';
  actionUrl: string;
};

@Injectable()
export class InspectionRejectionEmailTemplateService {
  render(params: InspectionFindingRejectedEmailParams): RenderedEmail {
    const recipientName = requireText(params.recipientName, 'recipientName');
    requireEmail(params.recipientEmail, 'recipientEmail');
    const inspectionNumber = stripNumberPrefix(requireText(params.inspectionNumber, 'inspectionNumber'));
    const observationNumber = stripNumberPrefix(requireText(params.observationNumber, 'observationNumber'));
    const rejectionReason = requireText(params.rejectionReason, 'rejectionReason');
    const rejectedByName = requireText(params.rejectedByName, 'rejectedByName');
    const rejectedByProfile = requireText(params.rejectedByProfile, 'rejectedByProfile');
    const inspectionMode = params.inspectionMode;
    if (inspectionMode !== 'Hallazgo' && inspectionMode !== 'Checklist') {
      throw new TypeError('inspectionMode must be Hallazgo or Checklist');
    }
    const actionUrl = requireHttpUrl(params.actionUrl, 'actionUrl');
    const areaSector = formatAreaSector(params.areaName, params.sectorName);
    const rejectedBy = `${rejectedByName} · ${rejectedByProfile}`;
    const subject = `AurelIA · Observación rechazada · Inspección #${inspectionNumber}`;

    return {
      subject,
      html: this.renderHtml({
        recipientName,
        inspectionNumber,
        observationNumber,
        rejectionReason,
        rejectedByName,
        rejectedBy,
        areaSector,
        inspectionMode,
        actionUrl,
      }),
      text: [
        subject,
        '',
        `Hola, ${recipientName},`,
        '',
        `${rejectedByName} revisó las observaciones para la inspección #${inspectionNumber} y devolvió una observación para corrección.`,
        '',
        `Motivo del rechazo · ${rejectedByName}`,
        rejectionReason,
        '',
        `Área · sector: ${areaSector}`,
        `Tipo: ${inspectionMode}`,
        `Nº de la observación: ${observationNumber}`,
        `Rechazado por: ${rejectedBy}`,
        '',
        'Una vez corrijas la observación y la reenvíes, el revisor recibirá una nueva notificación para revisarla.',
        '',
        `Ejecutar observación: ${actionUrl}`,
        '',
        'AURELIA · Sistema de Gestión Ambiental · Gold Fields Salares Norte',
        'Este es un correo generado de forma automática, por favor no responder este mensaje.',
        'Si tienes dudas, contacta a tu Especialista de Sustentabilidad.',
      ].join('\n'),
    };
  }

  /**
   * Delega el armazón —cabecera, tarjeta, botón, pie— en `email-shell.ts`, que lo
   * comparte con los correos de residuos. Acá queda sólo lo propio de este correo:
   * su pastilla, su recuadro de motivo y su tabla de detalle.
   *
   * Usa las medidas `ROOMY` porque este nodo se dibujó con la especificación
   * anterior, un poco más holgada que la de los correos de SINADER. La diferencia
   * se preserva a propósito; ver `EmailShellMetrics`.
   */
  private renderHtml(input: {
    recipientName: string;
    inspectionNumber: string;
    observationNumber: string;
    rejectionReason: string;
    rejectedByName: string;
    rejectedBy: string;
    areaSector: string;
    inspectionMode: 'Hallazgo' | 'Checklist';
    actionUrl: string;
  }): string {
    const recipientName = escapeHtml(input.recipientName);
    const inspectionNumber = escapeHtml(input.inspectionNumber);
    const observationNumber = escapeHtml(input.observationNumber);
    const rejectionReason = escapeHtml(input.rejectionReason).replace(/\r?\n/g, '<br>');
    const rejectedByName = escapeHtml(input.rejectedByName);
    const rejectedBy = escapeHtml(input.rejectedBy);
    const areaSector = escapeHtml(input.areaSector);
    const inspectionMode = escapeHtml(input.inspectionMode);
    const actionUrl = escapeHtml(input.actionUrl);

    return renderEmailShell({
      metrics: EMAIL_SHELL_METRICS_ROOMY,
      documentTitle: 'Observación rechazada',
      preheader: `Observación rechazada en la inspección #${inspectionNumber}`,
      extraCss: '      .detail-value { width:58% !important; }\n',
      pill: {
        label: 'INSPECCIONES · OBSERVACIÓN RECHAZADA',
        background: '#ffd0db',
        dot: '#bd3b5b',
        color: '#570b1d',
      },
      heading: `Una observación de la inspección #${inspectionNumber} ha sido rechazada.`,
      subheading: 'AurelIA · Sistema de Gestión Ambiental · Salares Norte',
      recipientName,
      paragraphs: [
        `${rejectedByName} revisó las observaciones para la inspección <strong>#${inspectionNumber}</strong> y la devolvió para corrección. Por favor revisa el motivo indicado a continuación y reenvía el formulario corregido.`,
      ],
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
        bodyHtml: `<strong>Motivo del rechazo · ${rejectedByName}</strong><br>${rejectionReason}`,
      },
      /*
       * La tabla de detalle y el párrafo de cierre son propios de este correo: el
       * armazón no conoce "observación" ni "área · sector", y no debería.
       */
      extraBlocksHtml: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;margin-top:20px;border:1px solid #e3e3e3;border-radius:8px;background:#ffffff;">
                ${detailRow('ÁREA · SECTOR', areaSector)}
                ${detailRow('TIPO', inspectionMode)}
                ${detailRow('Nº DE LA OBSERVACIÓN', observationNumber)}
                ${detailRow('RECHAZADO POR', rejectedBy, true)}
              </table>
              <p style="margin:20px 0 0;font-size:14px;line-height:23.1px;color:#333333;">Una vez corrijas la observación y la reenvíes, el Admin GF recibirá una nueva notificación para revisarla.</p>`,
      ctaLabel: 'Ejecutar observación',
      ctaUrl: actionUrl,
    });
  }

}

function detailRow(label: string, value: string, last = false): string {
  const border = last ? '' : 'border-bottom:1px solid #f0f0f0;';
  return `<tr><td style="padding:10px 12px;${border}color:#acacac;font-family:Inter,Arial,sans-serif;font-size:11px;line-height:16px;font-weight:700;letter-spacing:.77px;text-transform:uppercase;">${label}</td><td class="detail-value" width="64%" align="right" style="padding:10px 12px;${border}color:#131313;font-family:Inter,Arial,sans-serif;font-size:13px;line-height:18px;font-weight:600;">${value}</td></tr>`;
}




function stripNumberPrefix(value: string): string {
  return value.replace(/^#+\s*/, '');
}

function formatAreaSector(areaName: string | null, sectorName: string | null): string {
  const area = areaName?.trim();
  const sector = sectorName?.trim();
  if (area && sector) return `${area} · ${sector}`;
  return area || sector || 'Sin información';
}

