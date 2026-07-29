import { Injectable } from '@nestjs/common';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
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
  private readonly logoDataUri = this.loadLogoDataUri();

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

    return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <title>Observación rechazada</title>
  <style>
    body { margin:0 !important; padding:0 !important; background:#e8eef5; }
    table { border-collapse:collapse; border-spacing:0; }
    img { border:0; display:block; line-height:100%; outline:none; text-decoration:none; }
    a { text-decoration:none; }
    @media only screen and (max-width:680px) {
      .email-shell { width:100% !important; max-width:640px !important; }
      .email-padding { padding-left:24px !important; padding-right:24px !important; }
      .detail-value { width:58% !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#e8eef5;">
  <div style="display:none;max-height:0;max-width:0;overflow:hidden;opacity:0;color:#e8eef5;font-size:1px;line-height:1px;">Observación rechazada en la inspección #${inspectionNumber}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;background:#e8eef5;">
    <tr>
      <td align="center" style="padding:16px;">
        <table role="presentation" class="email-shell" width="640" cellpadding="0" cellspacing="0" style="width:640px;max-width:640px;background:#ffffff;border-radius:4px;box-shadow:0 4px 24px rgba(0,0,0,.10);overflow:hidden;">
          <tr>
            <td align="center" style="padding:27px 24px;background:#012659;">
              <img src="${this.logoDataUri}" width="174" height="57" alt="Gold Fields AurelIA" style="width:174px;height:57px;max-width:100%;">
            </td>
          </tr>
          <tr>
            <td class="email-padding" style="padding:40px 48px 36px;background:#f6faff;font-family:Inter,Arial,sans-serif;color:#131313;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 13px;">
                <tr>
                  <td style="padding:5px 10px;border-radius:20px;background:#ffd0db;color:#570b1d;font-size:10px;line-height:15px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">
                    <span style="display:inline-block;width:6px;height:6px;margin-right:6px;border-radius:3px;background:#bd3b5b;vertical-align:1px;"></span>INSPECCIONES · OBSERVACIÓN RECHAZADA
                  </td>
                </tr>
              </table>
              <h1 style="margin:0;font-size:22px;line-height:27.5px;font-weight:700;color:#131313;">Una observación de la inspección #${inspectionNumber} ha sido rechazada.</h1>
              <p style="margin:6px 0 0;font-size:13px;line-height:19.5px;color:#646464;">AurelIA · Sistema de Gestión Ambiental · Salares Norte</p>
              <div style="height:1px;margin:24px 0 0;background:#e3e3e3;line-height:1px;">&nbsp;</div>
              <p style="margin:24px 0 0;font-size:14px;line-height:20px;color:#333333;">Hola, <strong>${recipientName}</strong>,</p>
              <p style="margin:12px 0 0;font-size:14px;line-height:23.1px;color:#333333;">${rejectedByName} revisó las observaciones para la inspección <strong>#${inspectionNumber}</strong> y la devolvió para corrección. Por favor revisa el motivo indicado a continuación y reenvía el formulario corregido.</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;margin-top:16px;border:1px solid #f0a0b0;border-radius:8px;background:#ffd0db;">
                <tr>
                  <td width="16" valign="top" style="padding:13px 0 13px 15px;color:#570b1d;font-size:15px;line-height:23px;">⚠</td>
                  <td style="padding:13px 15px 13px 10px;color:#570b1d;font-size:13px;line-height:20.15px;">
                    <strong>Motivo del rechazo · ${rejectedByName}</strong><br>${rejectionReason}
                  </td>
                </tr>
              </table>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;margin-top:20px;border:1px solid #e3e3e3;border-radius:8px;background:#ffffff;">
                ${detailRow('ÁREA · SECTOR', areaSector)}
                ${detailRow('TIPO', inspectionMode)}
                ${detailRow('Nº DE LA OBSERVACIÓN', observationNumber)}
                ${detailRow('RECHAZADO POR', rejectedBy, true)}
              </table>
              <p style="margin:20px 0 0;font-size:14px;line-height:23.1px;color:#333333;">Una vez corrijas la observación y la reenvíes, el Admin GF recibirá una nueva notificación para revisarla.</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;margin-top:28px;">
                <tr>
                  <td align="center" bgcolor="#c8a064" style="height:45px;border-radius:8px;background:#c8a064;">
                    <a href="${actionUrl}" target="_blank" rel="noopener noreferrer" style="display:block;padding:13px 20px;color:#ffffff;font-size:14px;line-height:19px;font-weight:700;letter-spacing:.42px;text-align:center;">Ejecutar observación</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="email-padding" align="center" style="padding:21px 48px 20px;border-top:1px solid #e3e3e3;background:#ffffff;font-family:Inter,Arial,sans-serif;">
              <p style="margin:0;color:#d1d1d1;font-size:10px;line-height:14px;font-weight:700;letter-spacing:1.5px;">AUREL<span style="color:#c8a064;">IA</span> · Sistema de Gestión Ambiental · Gold Fields Salares Norte</p>
              <p style="margin:8px 0 0;color:#acacac;font-size:12px;line-height:19.2px;">Este es un correo generado de forma automática, por favor no responder este mensaje.<br>Si tienes dudas, contacta a tu Especialista de Sustentabilidad.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  private loadLogoDataUri(): string {
    const logoPath = join(__dirname, 'assets', 'aurelia-email-logo.svg');
    const svg = readFileSync(logoPath, 'utf8');
    return `data:image/svg+xml;base64,${Buffer.from(svg, 'utf8').toString('base64')}`;
  }
}

function detailRow(label: string, value: string, last = false): string {
  const border = last ? '' : 'border-bottom:1px solid #f0f0f0;';
  return `<tr><td style="padding:10px 12px;${border}color:#acacac;font-family:Inter,Arial,sans-serif;font-size:11px;line-height:16px;font-weight:700;letter-spacing:.77px;text-transform:uppercase;">${label}</td><td class="detail-value" width="64%" align="right" style="padding:10px 12px;${border}color:#131313;font-family:Inter,Arial,sans-serif;font-size:13px;line-height:18px;font-weight:600;">${value}</td></tr>`;
}

function requireText(value: string, field: string): string {
  const normalized = value?.trim();
  if (!normalized) throw new TypeError(`${field} is required`);
  return normalized;
}

function requireEmail(value: string, field: string): string {
  const normalized = requireText(value, field);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) throw new TypeError(`${field} is invalid`);
  return normalized;
}

function requireHttpUrl(value: string, field: string): string {
  const normalized = requireText(value, field);
  let parsed: URL;
  try {
    parsed = new URL(normalized);
  } catch {
    throw new TypeError(`${field} must be a valid URL`);
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new TypeError(`${field} must use http or https`);
  }
  return parsed.toString();
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

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
