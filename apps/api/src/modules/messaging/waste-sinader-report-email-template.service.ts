import { Injectable } from '@nestjs/common';
import {
  WasteSinaderConstraints,
  isWithinWasteSinaderDeclarationWindow,
} from '@aurelia/contracts';
import {
  escapeHtml,
  loadEmailAssetDataUri,
  EMAIL_SHELL_METRICS_COMPACT,
  renderEmailShell,
  requireEmail,
  requireHttpUrl,
  requireText,
  type EmailShellNotice,
  type EmailShellPill,
} from './email-shell';
import { RenderedEmail } from './messaging.types';

/**
 * Correos del Reporte SINADER — nodos Figma `4304:31237` y `4304:31354`.
 *
 * UNA SOLA PLANTILLA CON DOS VARIANTES, no dos plantillas. Los dos nodos son el
 * mismo componente del sistema de diseño y sólo cambian de contenido; lo que los
 * distingue cabe en una pastilla, un titular, dos párrafos y un recuadro:
 *
 *   `available` `4304:31237`  días 1 a 7 · pastilla verde · recuadro azul
 *                             "Reporte SINADER disponible"
 *   `overdue`   `4304:31354`  día 8 en adelante · pastilla roja · recuadro rojo
 *                             "El reporte SINADER debe ser declarado" · SLA vencido
 *
 * El armazón —cabecera, tarjeta, botón, pie— vive una sola vez en `email-shell.ts`
 * y lo comparten todos los correos de la app.
 *
 * CUÁNDO SALE CADA UNO:
 *
 *   días 1 a 7            `available`, todos los días
 *   día 8 en adelante     `overdue`, todos los días, HASTA QUE SE DECLARE
 *
 * O sea que la ventana de `available` está acotada por el calendario y la de
 * `overdue` por un hecho de la base. Esa asimetría es real y por eso
 * `resolveWasteSinaderReminderVariant` recibe las dos cosas: el día del mes y si
 * el período ya fue declarado.
 *
 * QUÉ NO DECIDE ESTA PLANTILLA: cuándo sale. Renderizar es una cosa y programar es
 * otra, y el planificador todavía no existe —no hay `@nestjs/schedule` ni cron en
 * el repo—. La regla vive acá por ser del dominio del correo; quien la consulte
 * será el job.
 */

/**
 * Plazo de declaración y ventana de recordatorios.
 *
 * VIVEN EN `@aurelia/contracts` (`schemas/waste.constraints.ts`), no acá: la misma
 * regla la evalúa la vista web —para habilitar "Marcar como declarado" y para
 * mostrar el recuadro de plazo vencido— y tienen que coincidir en el borde. Con el
 * número duplicado bastaba que un lado usara `>=` donde el otro usa `>` para que el
 * día 7 recibiera a la vez el correo de "último día" y el cartel de vencido.
 *
 * Se reexportan con su nombre anterior para no obligar a cambiar los sitios que ya
 * los importaban desde este módulo.
 */
export const WASTE_SINADER_DECLARATION_DEADLINE_DAY =
  WasteSinaderConstraints.declarationDeadlineDay;
export const WASTE_SINADER_REMINDER_FIRST_DAY = WasteSinaderConstraints.declarationFirstDay;

export type WasteSinaderEmailVariant = 'available' | 'overdue';

/**
 * Qué correo corresponde hoy, o `null` si no corresponde ninguno.
 *
 * Las dos condiciones se evalúan juntas porque una sola no alcanza: el calendario
 * dice si estamos dentro o fuera de plazo, y la base dice si todavía hay algo que
 * reclamar. Un período declarado no recibe correo ningún día.
 */
export function resolveWasteSinaderReminderVariant(input: {
  dayOfMonth: number;
  isDeclared: boolean;
}): WasteSinaderEmailVariant | null {
  if (input.isDeclared) return null;
  if (!Number.isInteger(input.dayOfMonth) || input.dayOfMonth < WASTE_SINADER_REMINDER_FIRST_DAY) {
    return null;
  }
  return isWithinWasteSinaderDeclarationWindow(input.dayOfMonth) ? 'available' : 'overdue';
}

export type WasteSinaderReportEmailParams = {
  recipientName: string;
  recipientEmail: string;
  /** Ciclo del reporte, ya escrito: "Agosto 2026". */
  periodLabel: string;
  /**
   * Día del mes en que sale este envío, 1–31.
   *
   * Con la variante `available` decide el asunto —el día 1 anuncia, del 2 al 6
   * recuerda y el 7 avisa que es el último—. Con `overdue` decide cuántos días de
   * atraso se nombran.
   */
  reminderDay: number;
  /**
   * Destino del botón "Ir a Reporte SINADER".
   *
   * POR AHORA ES LA URL DIRECTA DE LA VISTA (`/waste/reporte-sinader`) y no un
   * deep-link firmado como el de `InspectionRejectionEmailTemplateService`. Cuando
   * el módulo de notificaciones cubra residuos, acá entra el token y el parámetro
   * no cambia de forma.
   */
  actionUrl: string;
};

/** Pastilla `4304:31281`. */
const AVAILABLE_PILL: EmailShellPill = {
  label: 'RESIDUOS · REPORTE SINADER',
  background: '#e0ffd3',
  dot: '#00b398',
  color: '#2a5c16',
};

/** Pastilla `4304:31518`: mismo rótulo, paleta de alerta. */
const OVERDUE_PILL: EmailShellPill = {
  label: 'RESIDUOS · REPORTE SINADER',
  background: '#ffd0db',
  dot: '#bd3b5b',
  color: '#570b1d',
};

@Injectable()
export class WasteSinaderReportEmailTemplateService {
  /** Correo de los días 1 a 7 — nodo `4304:31237`. */
  renderAvailable(params: WasteSinaderReportEmailParams): RenderedEmail {
    const input = this.validate(params);

    const subject =
      input.reminderDay === WASTE_SINADER_REMINDER_FIRST_DAY
        ? `AurelIA · Reporte SINADER disponible · ${input.periodLabel}`
        : input.reminderDay >= WASTE_SINADER_DECLARATION_DEADLINE_DAY
          ? `AurelIA · Último día para declarar el Reporte SINADER · ${input.periodLabel}`
          : `AurelIA · Reporte SINADER pendiente de declarar · ${input.periodLabel} · día ${input.reminderDay}`;

    const paragraphs = [
      'Los datos para el reporte SINADER ya están disponibles en AurelIA.',
      'Recuerda. Este reporte no reemplaza la declaración oficial. Medio Ambiente debe ingresar estos mismos totales manualmente en la Ventanilla Única del RETC.',
      'No es el reporte final.',
    ];
    const noticeText = `Declara el reporte SINADER antes del día ${WASTE_SINADER_DECLARATION_DEADLINE_DAY}. AurelIA te notificará si el reporte aún no ha sido declarado.`;

    return {
      subject,
      html: renderEmailShell({
        metrics: EMAIL_SHELL_METRICS_COMPACT,
        documentTitle: 'Reporte SINADER disponible',
        preheader: `El consolidado de residuos no peligrosos de ${escapeHtml(input.periodLabel)} ya está disponible para declarar.`,
        pill: AVAILABLE_PILL,
        heading: 'Reporte SINADER disponible',
        subheading: `Ciclo ${escapeHtml(input.periodLabel)} · AurelIA · Sistema de Gestión Ambiental`,
        recipientName: escapeHtml(input.recipientName),
        paragraphs: paragraphs.map(escapeHtml),
        notice: {
          background: '#e6f3ff',
          border: '#c5d8f0',
          color: '#0d3862',
          iconCellWidth: 11,
          paddingY: 12,
          fontSize: 11.5,
          lineHeight: 17.25,
          iconHtml: `<img src="${loadEmailAssetDataUri('waste-sinader-notice-icon.svg')}" width="11" height="11" alt="" style="width:11.5px;height:11.5px;margin-top:3px;">`,
          bodyHtml: escapeHtml(noticeText),
        },
        ctaLabel: 'Ir a Reporte SINADER',
        ctaUrl: escapeHtml(input.actionUrl),
      }),
      text: this.renderText({ subject, ...input, paragraphs, noticeLines: [noticeText] }),
    };
  }

  /**
   * Correo del día 8 en adelante — nodo `4304:31354`.
   *
   * El recuadro nombra los días de atraso, que el nodo no puede escribir porque
   * está dibujado sobre un día concreto. Es el dato que cambia entre un envío y el
   * siguiente y el único que distingue el correo del día 8 del correo del día 20;
   * sin él, veinte recordatorios idénticos se leen como uno solo repetido.
   */
  renderOverdue(params: WasteSinaderReportEmailParams): RenderedEmail {
    const input = this.validate(params);
    const daysLate = Math.max(1, input.reminderDay - WASTE_SINADER_DECLARATION_DEADLINE_DAY);
    const lateLabel = daysLate === 1 ? '1 día' : `${daysLate} días`;

    const subject = `AurelIA · Reporte SINADER sin declarar · ${input.periodLabel} · ${lateLabel} de atraso`;

    const paragraphs = [
      'Recuerda declarar el reporte SINADER en Ventanilla Única del RETC.',
      'Si ya lo hiciste, debes dejarlo como declarado presionando el botón “Marcar como declarado” dentro de la plataforma AurelIA.',
    ];
    const noticeTitle = 'SLA vencido';
    const noticeText = `Este reporte tuvo que haberse declarado el día ${WASTE_SINADER_DECLARATION_DEADLINE_DAY} de este mes. Procura declararlo lo antes posible.`;

    return {
      subject,
      html: renderEmailShell({
        metrics: EMAIL_SHELL_METRICS_COMPACT,
        documentTitle: 'El reporte SINADER debe ser declarado',
        preheader: `El reporte SINADER de ${escapeHtml(input.periodLabel)} lleva ${lateLabel} sin declarar.`,
        pill: OVERDUE_PILL,
        heading: 'El reporte SINADER debe ser declarado',
        subheading: `Ciclo ${escapeHtml(input.periodLabel)} · AurelIA · Sistema de Gestión Ambiental`,
        recipientName: escapeHtml(input.recipientName),
        paragraphs: paragraphs.map(escapeHtml),
        notice: this.overdueNotice(noticeTitle, noticeText),
        ctaLabel: 'Ir a Reporte SINADER',
        ctaUrl: escapeHtml(input.actionUrl),
      }),
      text: this.renderText({
        subject,
        ...input,
        paragraphs,
        noticeLines: [noticeTitle, noticeText],
      }),
    };
  }

  /**
   * Recuadro rojo `4304:31526`. El "⚠" va como carácter y no como imagen, igual
   * que en `InspectionRejectionEmailTemplateService`: así lo dibuja el nodo
   * (`4304:31528` es un texto de 15px) y no depende de que el cliente cargue
   * imágenes.
   *
   * El título va en negrita y en 13px, un punto y medio más grande que el cuerpo
   * de los otros recuadros: es lo que declara `4304:31530`.
   */
  private overdueNotice(title: string, body: string): EmailShellNotice {
    return {
      background: '#ffd0db',
      border: '#f0a0b0',
      color: '#570b1d',
      iconCellWidth: 16,
      paddingY: 13,
      fontSize: 11.5,
      lineHeight: 17.25,
      iconCellStyle: 'color:#570b1d;font-size:15px;line-height:23.25px;',
      iconHtml: '⚠',
      bodyHtml: `<strong style="font-size:13px;line-height:20.15px;">${escapeHtml(title)}</strong><br><span style="font-size:13px;line-height:20.15px;">${escapeHtml(body)}</span>`,
    };
  }

  private validate(params: WasteSinaderReportEmailParams): WasteSinaderReportEmailParams {
    return {
      recipientName: requireText(params.recipientName, 'recipientName'),
      recipientEmail: requireEmail(params.recipientEmail, 'recipientEmail'),
      periodLabel: requireText(params.periodLabel, 'periodLabel'),
      reminderDay: requireDayOfMonth(params.reminderDay, 'reminderDay'),
      actionUrl: requireHttpUrl(params.actionUrl, 'actionUrl'),
    };
  }

  /** Versión en texto plano, para los clientes que no muestran HTML. */
  private renderText(input: {
    subject: string;
    recipientName: string;
    paragraphs: string[];
    noticeLines: string[];
    actionUrl: string;
  }): string {
    return [
      input.subject,
      '',
      `Hola, ${input.recipientName}`,
      '',
      ...input.paragraphs,
      '',
      ...input.noticeLines,
      '',
      `Ir a Reporte SINADER: ${input.actionUrl}`,
      '',
      'AURELIA · Sistema de Gestión Ambiental · Gold Fields Salares Norte',
      'Este es un correo generado de forma automática, por favor no responder este mensaje.',
      'Si tienes dudas, contacta a tu Especialista de Sustentabilidad.',
    ].join('\n');
  }
}

function requireDayOfMonth(value: number, field: string): number {
  if (!Number.isInteger(value) || value < 1 || value > 31) {
    throw new TypeError(`${field} must be an integer between 1 and 31`);
  }
  return value;
}
