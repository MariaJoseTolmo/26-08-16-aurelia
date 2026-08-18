import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Armazón compartido de los correos de AurelIA.
 *
 * Los nodos de Figma de todos los correos son EL MISMO componente del sistema de
 * diseño y sólo cambian de contenido: fondo `#e8eef5`, tarjeta de 640px con radio
 * 4 y sombra, cabecera `#012659` con el logo, cuerpo `#f6faff`, botón `#c8a064` de
 * 45px y pie blanco con la línea de "correo generado de forma automática".
 *
 * POR QUÉ EXISTE ESTE ARCHIVO. Antes cada plantilla repetía ese HTML entero. Con
 * dos correos el argumento a favor de duplicar se sostenía —el HTML de correo se
 * depura completo y cada cliente rompe algo distinto—, pero al llegar el tercero y
 * el cuarto el costo cambió de signo: un arreglo de compatibilidad hay que
 * aplicarlo en cada copia, y basta olvidar una para que los correos empiecen a
 * verse distinto entre sí.
 *
 * QUÉ NO HACE: no parte el HTML en fragmentos sueltos. Emite el documento COMPLETO
 * en una sola plantilla y recibe el contenido por parámetro, así que sigue
 * leyéndose de arriba abajo como lo ve Outlook. Lo que se parametriza es el
 * contenido, nunca la estructura.
 *
 * Tablas y estilos en línea, no flex ni clases. El `<style>` del `<head>` sólo
 * lleva el reset y la media query, que es lo único que los clientes respetan de
 * forma consistente.
 */

/**
 * Medidas del cuerpo. NO son un tema configurable: son dos especificaciones
 * distintas que conviven, y por eso están nombradas en vez de repartidas en diez
 * props sueltas.
 *
 * Los correos del sistema de diseño se dibujaron en dos momentos y las medidas no
 * coinciden. Al migrarlos a este armazón la diferencia salió a la luz —once
 * valores, ninguno mayor a 4px— y se decidió PRESERVARLA en vez de unificar por
 * cuenta propia: cambiar el espaciado de un correo que ya se está enviando es una
 * decisión de diseño, no una limpieza de código.
 *
 * Están acá, uno al lado del otro, justamente para que se vea que difieren y se
 * pueda resolver con quien corresponda. Cuando el sistema de diseño unifique, esto
 * vuelve a ser una sola constante y el tipo desaparece.
 */
export interface EmailShellMetrics {
  bodyPadding: string;
  pillPaddingY: number;
  subheadingMarginTop: number;
  subheadingFontSize: number;
  subheadingLineHeight: number;
  dividerMarginTop: number;
  greetingMarginTop: number;
  /** El correo de rechazo NO pone `font-weight` en el saludo; el de residuos sí. */
  greetingFontWeight: string;
  /** El de rechazo cierra el saludo con coma ("Hola, X,"); el de residuos no. */
  greetingSuffix: string;
  paragraphFirstMarginTop: number;
  paragraphFontSize: number;
  paragraphLineHeight: number;
  ctaMarginTop: number;
  ctaMarginBottom: number;
}

/** Reporte SINADER — nodos `4304:31237` y `4304:31354`. La especificación nueva. */
export const EMAIL_SHELL_METRICS_COMPACT: EmailShellMetrics = {
  bodyPadding: '36px 44px 32px',
  pillPaddingY: 4,
  subheadingMarginTop: 5,
  subheadingFontSize: 12.5,
  subheadingLineHeight: 18.75,
  dividerMarginTop: 20,
  greetingMarginTop: 20,
  greetingFontWeight: 'font-weight:500;',
  greetingSuffix: '',
  paragraphFirstMarginTop: 14,
  paragraphFontSize: 13.5,
  paragraphLineHeight: 22.275,
  ctaMarginTop: 28,
  ctaMarginBottom: 8,
};

/** Observación rechazada. La especificación anterior, más holgada. */
export const EMAIL_SHELL_METRICS_ROOMY: EmailShellMetrics = {
  bodyPadding: '40px 48px 36px',
  pillPaddingY: 5,
  subheadingMarginTop: 6,
  subheadingFontSize: 13,
  subheadingLineHeight: 19.5,
  dividerMarginTop: 24,
  greetingMarginTop: 24,
  greetingFontWeight: '',
  greetingSuffix: ',',
  paragraphFirstMarginTop: 12,
  paragraphFontSize: 14,
  paragraphLineHeight: 23.1,
  ctaMarginTop: 28,
  ctaMarginBottom: 0,
};

/**
 * Pastilla de contexto del encabezado, con su punto de color.
 *
 * Cada correo trae su par, y todos salen de un nodo:
 *
 *   verde `4304:31281`  bg #e0ffd3 · punto #00b398 · texto #2a5c16
 *   rojo  `4304:31518`  bg #ffd0db · punto #bd3b5b · texto #570b1d
 */
export interface EmailShellPill {
  label: string;
  background: string;
  dot: string;
  color: string;
}

/**
 * Recuadro de aviso, arriba del botón.
 *
 * `icon` es TEXTO y no una imagen: los nodos lo dibujan como glifo —el "⚠" de
 * `4304:31528`— y un carácter no depende de que el cliente cargue imágenes
 * remotas ni infla el correo con otro data URI. El único que usa un SVG es el
 * correo de disponibilidad, y para ése se pasa `iconHtml`.
 */
export interface EmailShellNotice {
  background: string;
  border: string;
  /**
   * Ancho de la celda del icono. Los dos nodos difieren —11 con el círculo de
   * información (`4304:31336`), 16 con el "⚠" (`4304:31527`)— porque un carácter
   * de 15px ocupa más que un SVG de 11.5.
   */
  iconCellWidth: number;
  /**
   * Relleno vertical del recuadro. También difiere: 12 en el azul (`4304:31335`)
   * y 13 en el rojo (`4304:31526`).
   */
  paddingY: number;
  /**
   * Separación entre el recuadro y lo que tiene encima. 16 en los nodos de SINADER
   * y de rechazo, 14 en el de solicitud corregida (`4295:25141`).
   *
   * Es la misma clase de divergencia que documenta `EmailShellMetrics` —dos momentos
   * del sistema de diseño, diferencias de pocos píxeles— y por eso se preserva en vez
   * de unificar por cuenta propia. Por omisión, los 16 de los correos que ya salen.
   */
  marginTop?: number;
  /**
   * Relleno horizontal del recuadro: `padding-left` de la celda del icono y
   * `padding-right` de la del cuerpo. 15 en los nodos de SINADER y de rechazo, 14 en
   * `4295:25142`. Por omisión, los 15 de los correos que ya salen.
   */
  paddingX?: number;
  /**
   * Separación entre el glifo y el cuerpo. 10 en los nodos de SINADER y de rechazo,
   * 9 en `4295:25142`. Por omisión, los 10 de los correos que ya salen.
   */
  gap?: number;
  /**
   * Glifo de la izquierda, ya como HTML y CON SUS PROPIOS ESTILOS. El armazón no
   * le impone color ni tipografía porque un `<img>` y un carácter no necesitan lo
   * mismo, y meterle estilos de texto a una imagen ensucia el HTML sin efecto.
   */
  iconHtml: string;
  /** Cuerpo del recuadro, ya como HTML: puede traer `<strong>` y `<br>`. */
  bodyHtml: string;
  /** Color del texto del cuerpo. */
  color: string;
  /** Tipografía del cuerpo: 11.5/17.25 en los de residuos, 13/20.15 en el de rechazo. */
  fontSize: number;
  lineHeight: number;
  /**
   * Estilos extra de la CELDA del icono, ya como CSS en línea.
   *
   * Opcional porque depende de qué sea el glifo: un `<img>` trae lo suyo y la celda
   * no necesita nada, mientras que un carácter "⚠" hereda de ella el color y el
   * alto de línea. Emitir estilos de texto alrededor de una imagen ensucia el HTML
   * sin efecto.
   */
  iconCellStyle?: string;
}

export interface EmailShellInput {
  metrics: EmailShellMetrics;
  /** `<title>` del documento y texto del preheader oculto. */
  documentTitle: string;
  /** Línea invisible que los clientes muestran junto al asunto en la bandeja. */
  preheader: string;
  pill: EmailShellPill;
  /** Titular grande, ya escapado. */
  heading: string;
  /** Línea gris bajo el titular, ya escapada. */
  subheading: string;
  /** Nombre del destinatario, ya escapado; va en negrita tras "Hola, ". */
  recipientName: string;
  /** Párrafos del cuerpo, ya escapados. */
  paragraphs: string[];
  notice: EmailShellNotice;
  ctaLabel: string;
  /** Destino del botón, ya escapado. */
  ctaUrl: string;
  /**
   * Reglas CSS extra para el `<style>` del `<head>`.
   *
   * Sólo las usa el correo de rechazo, para el ancho de la columna de su tabla de
   * detalle en pantallas chicas. Va por acá y no en el bloque fijo porque una regla
   * que apunta a una clase que sólo existe en un correo no tiene por qué viajar en
   * los otros.
   */
  extraCss?: string;
  /**
   * Bloques propios entre el recuadro de aviso y el botón, ya como HTML.
   *
   * El correo de rechazo mete ahí su tabla de detalle y un párrafo de cierre. Es un
   * hueco y no una lista de props: lo que va adentro es específico de un correo y
   * modelarlo obligaría al armazón a conocer conceptos —"observación", "área"— que
   * no son suyos.
   */
  extraBlocksHtml?: string;
}

/** Pie común, palabra por palabra igual en todos los nodos. */
export const EMAIL_SHELL_FOOTER_LINES = [
  'AURELIA · Sistema de Gestión Ambiental · Gold Fields Salares Norte',
  'Este es un correo generado de forma automática, por favor no responder este mensaje.',
  'Si tienes dudas, contacta a tu Especialista de Sustentabilidad.',
] as const;

export function renderEmailShell(input: EmailShellInput): string {
  const m = input.metrics;

  /*
   * El hueco de bloques propios arrastra su propio salto de línea y su sangría: si
   * se dejara la sangría fija en la plantilla, un correo sin bloques extra emitiría
   * catorce espacios de más antes del botón.
   */
  const extraBlocks = input.extraBlocksHtml ? `${input.extraBlocksHtml}\n              ` : '';

  /*
   * Medidas del recuadro que difieren entre nodos. Los valores por omisión son los
   * de los tres correos que ya salen, así que el HTML de aquéllos no cambia.
   */
  const noticeMarginTop = input.notice.marginTop ?? 16;
  const noticePaddingX = input.notice.paddingX ?? 15;
  const noticeGap = input.notice.gap ?? 10;

  /* Sólo el primer párrafo se despega del saludo; el resto van pegados entre sí. */
  const paragraphs = input.paragraphs
    .map(
      (text, index) =>
        `<p style="margin:${index === 0 ? `${m.paragraphFirstMarginTop}px 0 0` : '0'};font-size:${m.paragraphFontSize}px;line-height:${m.paragraphLineHeight}px;color:#333333;">${text}</p>`,
    )
    .join('\n              ');

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <title>${input.documentTitle}</title>
  <style>
    body { margin:0 !important; padding:0 !important; background:#e8eef5; }
    table { border-collapse:collapse; border-spacing:0; }
    img { border:0; display:block; line-height:100%; outline:none; text-decoration:none; }
    a { text-decoration:none; }
    @media only screen and (max-width:680px) {
      .email-shell { width:100% !important; max-width:640px !important; }
      .email-padding { padding-left:24px !important; padding-right:24px !important; }
${input.extraCss ?? ''}    }
  </style>
</head>
<body style="margin:0;padding:0;background:#e8eef5;">
  <div style="display:none;max-height:0;max-width:0;overflow:hidden;opacity:0;color:#e8eef5;font-size:1px;line-height:1px;">${input.preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;background:#e8eef5;">
    <tr>
      <td align="center" style="padding:16px;">
        <table role="presentation" class="email-shell" width="640" cellpadding="0" cellspacing="0" style="width:640px;max-width:640px;background:#ffffff;border-radius:4px;box-shadow:0 4px 24px rgba(0,0,0,.10);overflow:hidden;">
          <tr>
            <td align="center" style="padding:27px 24px;background:#012659;">
              <img src="${loadLogoDataUri()}" width="174" height="57" alt="Gold Fields AurelIA" style="width:174px;height:57px;max-width:100%;">
            </td>
          </tr>
          <tr>
            <td class="email-padding" style="padding:${m.bodyPadding};background:#f6faff;font-family:Inter,Arial,sans-serif;color:#131313;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 13px;">
                <tr>
                  <td style="padding:${m.pillPaddingY}px 10px;border-radius:20px;background:${input.pill.background};color:${input.pill.color};font-size:10px;line-height:15px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">
                    <span style="display:inline-block;width:6px;height:6px;margin-right:6px;border-radius:3px;background:${input.pill.dot};vertical-align:1px;"></span>${input.pill.label}
                  </td>
                </tr>
              </table>
              <h1 style="margin:0;font-size:22px;line-height:27.5px;font-weight:700;color:#131313;">${input.heading}</h1>
              <p style="margin:${m.subheadingMarginTop}px 0 0;font-size:${m.subheadingFontSize}px;line-height:${m.subheadingLineHeight}px;color:#646464;">${input.subheading}</p>
              <div style="height:1px;margin:${m.dividerMarginTop}px 0 0;background:#e3e3e3;line-height:1px;">&nbsp;</div>
              <p style="margin:${m.greetingMarginTop}px 0 0;font-size:14px;line-height:20px;${m.greetingFontWeight}color:#333333;">Hola, <strong>${input.recipientName}</strong>${m.greetingSuffix}</p>
              ${paragraphs}
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;margin-top:${noticeMarginTop}px;border:1px solid ${input.notice.border};border-radius:8px;background:${input.notice.background};">
                <tr>
                  <td width="${input.notice.iconCellWidth}" valign="top" style="padding:${input.notice.paddingY}px 0 ${input.notice.paddingY}px ${noticePaddingX}px;${input.notice.iconCellStyle ?? ''}">${input.notice.iconHtml}</td>
                  <td style="padding:${input.notice.paddingY}px ${noticePaddingX}px ${input.notice.paddingY}px ${noticeGap}px;color:${input.notice.color};font-size:${input.notice.fontSize}px;line-height:${input.notice.lineHeight}px;">
                    ${input.notice.bodyHtml}
                  </td>
                </tr>
              </table>
              ${extraBlocks}<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;margin-top:${m.ctaMarginTop}px;${m.ctaMarginBottom ? `margin-bottom:${m.ctaMarginBottom}px;` : ''}">
                <tr>
                  <td align="center" bgcolor="#c8a064" style="height:45px;border-radius:8px;background:#c8a064;">
                    <a href="${input.ctaUrl}" target="_blank" rel="noopener noreferrer" style="display:block;padding:13px 20px;color:#ffffff;font-size:14px;line-height:19px;font-weight:700;letter-spacing:.42px;text-align:center;">${input.ctaLabel}</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="email-padding" align="center" style="padding:21px 48px 20px;border-top:1px solid #e3e3e3;background:#ffffff;font-family:Inter,Arial,sans-serif;">
              <p style="margin:0;color:#d1d1d1;font-size:10px;line-height:14px;font-weight:700;letter-spacing:1.5px;">AUREL<span style="color:#c8a064;">IA</span> · Sistema de Gestión Ambiental · Gold Fields Salares Norte</p>
              <p style="margin:8px 0 0;color:#acacac;font-size:12px;line-height:19.2px;">${EMAIL_SHELL_FOOTER_LINES[1]}<br>${EMAIL_SHELL_FOOTER_LINES[2]}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Assets embebidos como data URI.
 *
 * Un correo no puede depender de una URL viva: los clientes bloquean imágenes
 * remotas por defecto y el archivo tiene que seguir viéndose igual dentro de cinco
 * años. Se leen una sola vez y se cachean, porque el proceso los relee en cada
 * render si no.
 */
const assetCache = new Map<string, string>();

export function loadEmailAssetDataUri(filename: string): string {
  const cached = assetCache.get(filename);
  if (cached) return cached;

  const svg = readFileSync(join(__dirname, 'assets', filename), 'utf8');
  const dataUri = `data:image/svg+xml;base64,${Buffer.from(svg, 'utf8').toString('base64')}`;
  assetCache.set(filename, dataUri);
  return dataUri;
}

function loadLogoDataUri(): string {
  return loadEmailAssetDataUri('aurelia-email-logo.svg');
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function requireText(value: string, field: string): string {
  const normalized = value?.trim();
  if (!normalized) throw new TypeError(`${field} is required`);
  return normalized;
}

export function requireEmail(value: string, field: string): string {
  const normalized = requireText(value, field);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) throw new TypeError(`${field} is invalid`);
  return normalized;
}

export function requireHttpUrl(value: string, field: string): string {
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
