import { Injectable } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  CallToActionEmailParams,
  InspectionFindingAssignedEmailParams,
  RenderedEmail,
} from './messaging.types';

const EMAIL_BACKGROUND = '#F6FAFF';
const HEADER_BACKGROUND = '#012659';
const TEXT_COLOR = '#131313';
const CTA_BACKGROUND = '#C8A064';
const BORDER_COLOR = '#E3E3E3';

@Injectable()
export class EmailTemplateService {
  private readonly logoDataUri = this.loadLogoDataUri();

  renderInspectionFindingAssigned(params: InspectionFindingAssignedEmailParams): RenderedEmail {
    const recipientName = this.requireText(params.recipientName, 'recipientName');
    const companyName = this.requireText(params.companyName, 'companyName');
    const inspectionNumber = this.requireText(params.inspectionNumber, 'inspectionNumber');
    const observationCount = this.requireObservationCount(params.observationCount);
    const platformUrl = this.requireHttpUrl(params.platformUrl, 'platformUrl');
    const observationLabel = observationCount === 1 ? 'observación' : 'observaciones';
    const title = `AurelIA — Hallazgo asignado a ${companyName}`;

    return this.renderCallToAction({
      subject: title,
      title,
      greeting: `Estimado ${recipientName}`,
      paragraphs: [
        `Se le ha asignado el hallazgo ${inspectionNumber} con ${observationCount} ${observationLabel}.`,
        'Para acceder a la plataforma de gestión de hallazgos, ingrese presionando el botón “Ir a plataforma de hallazgos”.',
      ],
      actionLabel: 'Ir a plataforma de hallazgos',
      actionUrl: platformUrl,
      preheader: `Nuevo hallazgo ${inspectionNumber} asignado a ${companyName}.`,
    });
  }

  renderCallToAction(params: CallToActionEmailParams): RenderedEmail {
    const subject = this.requireText(params.subject, 'subject');
    const title = this.requireText(params.title, 'title');
    const greeting = this.requireText(params.greeting, 'greeting');
    const paragraphs = params.paragraphs.map((paragraph, index) =>
      this.requireText(paragraph, `paragraphs[${index}]`),
    );
    const actionLabel = this.requireText(params.actionLabel, 'actionLabel');
    const actionUrl = this.requireHttpUrl(params.actionUrl, 'actionUrl');
    const preheader = params.preheader?.trim() || subject;

    return {
      subject,
      html: this.renderResponsiveHtml({
        title,
        greeting,
        paragraphs,
        actionLabel,
        actionUrl,
        preheader,
      }),
      text: this.renderPlainText({ greeting, paragraphs, actionLabel, actionUrl }),
    };
  }

  private renderResponsiveHtml(input: {
    title: string;
    greeting: string;
    paragraphs: string[];
    actionLabel: string;
    actionUrl: string;
    preheader: string;
  }): string {
    const title = escapeHtml(input.title);
    const greeting = escapeHtml(input.greeting);
    const paragraphs = input.paragraphs
      .map((paragraph, index) => {
        const spacing = index === 0 ? '0' : '40px';
        return `<p class="email-paragraph" style="margin:${spacing} 0 0;font-family:Inter,Arial,sans-serif;font-size:16px;line-height:25.9px;letter-spacing:.32px;color:${TEXT_COLOR};text-align:center;">${escapeHtml(paragraph)}</p>`;
      })
      .join('');
    const actionLabel = escapeHtml(input.actionLabel);
    const actionUrl = escapeHtml(input.actionUrl);
    const preheader = escapeHtml(input.preheader);

    return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <title>${title}</title>
  <style>
    body { margin: 0 !important; padding: 0 !important; background: #ffffff; }
    table { border-collapse: collapse; border-spacing: 0; }
    img { border: 0; display: block; line-height: 100%; outline: none; text-decoration: none; }
    a { text-decoration: none; }
    .email-shell { width: 650px; max-width: 650px; }
    .email-header { height: 100px; }
    .email-logo { width: 174px; height: 57px; }
    .email-main { min-height: 600px; }
    .email-title-cell { padding: 31px 24px 0; }
    .email-title { font-size: 24px; line-height: 29px; letter-spacing: .48px; }
    .email-copy-cell { padding: 40px 24px 0; }
    .email-cta-cell { padding: 68px 100px 265px; }
    .email-button { width: 450px; }
    .email-footer { height: 100px; background: ${EMAIL_BACKGROUND}; }
    .email-footer-copy { font-size: 14px; line-height: 22.7px; letter-spacing: .28px; padding: 0 24px; }

    @media only screen and (max-width: 480px) {
      .email-shell { width: 100% !important; max-width: 360px !important; }
      .email-header { height: 70px !important; }
      .email-logo { width: 116px !important; height: 38px !important; }
      .email-main { min-height: 455px !important; }
      .email-title-cell { padding: 16px 32px 0 !important; }
      .email-title { font-size: 16px !important; line-height: 28px !important; letter-spacing: .32px !important; }
      .email-copy-cell { padding: 8px 32px 0 !important; }
      .email-paragraph { font-size: 14px !important; line-height: 24px !important; letter-spacing: .28px !important; }
      .email-cta-cell { padding: 105px 32px 61px !important; }
      .email-button { width: 100% !important; }
      .email-footer { height: 78px !important; background: #ffffff !important; }
      .email-footer-copy { font-size: 12px !important; line-height: 22.7px !important; letter-spacing: .24px !important; padding: 0 32px !important; }
    }
  </style>
</head>
<body>
  <div style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;background:#ffffff;">
    <tr>
      <td align="center" valign="top">
        <table role="presentation" class="email-shell" width="650" cellpadding="0" cellspacing="0" style="width:650px;max-width:650px;background:${EMAIL_BACKGROUND};">
          <tr>
            <td class="email-header" height="100" align="center" valign="middle" style="height:100px;background:${HEADER_BACKGROUND};">
              <img class="email-logo" src="${this.logoDataUri}" width="174" height="57" alt="Gold Fields AurelIA" style="width:174px;height:57px;">
            </td>
          </tr>
          <tr>
            <td class="email-main" valign="top" style="min-height:600px;background:${EMAIL_BACKGROUND};">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td class="email-title-cell" align="center" style="padding:31px 24px 0;">
                    <h1 class="email-title" style="margin:0;font-family:Inter,Arial,sans-serif;font-size:24px;line-height:29px;letter-spacing:.48px;font-weight:700;color:${TEXT_COLOR};text-align:center;">${title}</h1>
                  </td>
                </tr>
                <tr>
                  <td class="email-copy-cell" align="center" style="padding:40px 24px 0;">
                    <p class="email-paragraph" style="margin:0;font-family:Inter,Arial,sans-serif;font-size:16px;line-height:25.9px;letter-spacing:.32px;color:${TEXT_COLOR};text-align:center;">${greeting}</p>
                    ${paragraphs}
                  </td>
                </tr>
                <tr>
                  <td class="email-cta-cell" align="center" style="padding:68px 100px 265px;">
                    <table role="presentation" class="email-button" width="450" cellpadding="0" cellspacing="0" style="width:450px;max-width:100%;">
                      <tr>
                        <td align="center" bgcolor="${CTA_BACKGROUND}" style="height:39px;border-radius:8px;background:${CTA_BACKGROUND};">
                          <a href="${actionUrl}" target="_blank" rel="noopener noreferrer" style="display:block;padding:8px 16px;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:22.7px;letter-spacing:.28px;font-weight:700;color:#ffffff;text-align:center;">${actionLabel}</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="email-footer" height="100" align="center" valign="middle" style="height:100px;border-top:1px solid ${BORDER_COLOR};background:${EMAIL_BACKGROUND};">
              <p class="email-footer-copy" style="margin:0;padding:0 24px;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:22.7px;letter-spacing:.28px;font-weight:400;color:${TEXT_COLOR};text-align:center;">Este es un correo generado de forma automática, por favor no responder este mensaje.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  private renderPlainText(input: {
    greeting: string;
    paragraphs: string[];
    actionLabel: string;
    actionUrl: string;
  }): string {
    return [
      input.greeting,
      '',
      ...input.paragraphs.flatMap((paragraph) => [paragraph, '']),
      `${input.actionLabel}: ${input.actionUrl}`,
      '',
      'Este es un correo generado de forma automática, por favor no responder este mensaje.',
    ].join('\n');
  }

  private loadLogoDataUri(): string {
    const logoPath = join(__dirname, 'assets', 'aurelia-email-logo.svg');
    const svg = readFileSync(logoPath, 'utf8');
    return `data:image/svg+xml;base64,${Buffer.from(svg, 'utf8').toString('base64')}`;
  }

  private requireText(value: string, field: string): string {
    const normalized = value?.trim();
    if (!normalized) throw new TypeError(`${field} is required`);
    return normalized;
  }

  private requireObservationCount(value: number): number {
    if (!Number.isInteger(value) || value < 0) {
      throw new TypeError('observationCount must be a non-negative integer');
    }
    return value;
  }

  private requireHttpUrl(value: string, field: string): string {
    const normalized = this.requireText(value, field);
    let parsed: URL;
    try {
      parsed = new URL(normalized);
    } catch {
      throw new TypeError(`${field} must be a valid URL`);
    }
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      throw new TypeError(`${field} must use http or https`);
    }
    return parsed.toString();
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
