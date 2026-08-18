import assert from 'node:assert/strict';
import { WasteSidrepRequestCorrectedEmailTemplateService } from '../modules/messaging/waste-sidrep-request-corrected-email-template.service';
import { WasteSinaderReportEmailTemplateService } from '../modules/messaging/waste-sinader-report-email-template.service';

const BASE = {
  recipientName: 'Karen Opazo Soto',
  recipientEmail: 'karen.opazo@goldfields.com',
  requestNumber: 'SR-2026-0847',
  correctedByName: 'Juan Pérez Soto',
  periodLabel: 'Mayo 2026',
  wasteType: 'Aceite lubricante usado',
  netWeightLabel: '870 kg',
  carrier: 'Resiter S.A.',
  plate: 'RLVZ-57',
  driver: 'Juan Pérez Soto',
  actionUrl: 'https://aurelia.goldfields.cl/waste/folios-sidrep',
};

function main(): void {
  const service = new WasteSidrepRequestCorrectedEmailTemplateService();
  const rendered = service.render(BASE);

  // ── Armazón compartido (email-shell.ts) ──────────────────────────────────────
  assert.match(rendered.html, /width="640"/);
  assert.match(rendered.html, /background:#e8eef5/);
  assert.match(rendered.html, /background:#012659/);
  assert.match(rendered.html, /background:#f6faff/);
  assert.match(rendered.html, /background:#c8a064/);
  assert.match(rendered.html, /no responder este mensaje/);
  // El logo va embebido: un correo no puede depender de una URL viva.
  assert.match(rendered.html, /data:image\/svg\+xml;base64,/);

  // ── Medidas COMPACT, las mismas que los correos de SINADER ───────────────────
  assert.match(rendered.html, /padding:36px 44px 32px/);
  assert.match(rendered.html, /font-size:13\.5px;line-height:22\.275px/);

  // ── Lo propio del nodo 4295:25088 ────────────────────────────────────────────
  assert.equal(rendered.subject, 'AurelIA · Solicitud de retiro corregida · SR-2026-0847');
  assert.match(rendered.html, /Solicitud de retiro corregida/);
  assert.match(rendered.html, /RESIDUOS · SOLICITUD CORREGIDA/);
  assert.match(rendered.html, /Ciclo Mayo 2026 · AurelIA/);
  assert.match(rendered.html, /Hola, <strong>Karen Opazo Soto<\/strong>/);
  assert.match(rendered.html, /Ir a formularios pendientes/);

  // El recuadro es VERDE y lleva el tilde como carácter, no como imagen.
  assert.match(rendered.html, /background:#e0ffd3/);
  assert.match(rendered.html, /border:1px solid #a8dfa8/);
  assert.match(rendered.html, /✓/);
  assert.match(rendered.html, /<strong>Juan Pérez Soto corrigió la solicitud<\/strong>/);
  // Un solo data URI —el logo—: acá no hay iconos en SVG.
  assert.equal(rendered.html.match(/data:image\/svg\+xml;base64,/g)?.length, 1);

  // Medidas del recuadro que este nodo NO comparte con los otros correos.
  assert.match(rendered.html, /margin-top:14px;border:1px solid #a8dfa8/);
  assert.match(rendered.html, /padding:12px 0 12px 14px/);
  assert.match(rendered.html, /padding:12px 14px 12px 9px/);

  // ── El párrafo va DEBAJO del recuadro, no encima ─────────────────────────────
  const noticeAt = rendered.html.indexOf('corrigió la solicitud');
  const paragraphAt = rendered.html.indexOf('Puedes revisar nuevamente');
  assert.ok(noticeAt > 0 && paragraphAt > noticeAt, 'el párrafo va después del recuadro');

  // ── Tarjeta de detalle: cuatro filas, cada una con su línea ──────────────────
  /*
   * Los rótulos viajan EN MINÚSCULA y la mayúscula la pone el CSS, que es como lo declara
   * el nodo: los textos son "Residuo", "empresa transportista", "patente" y "conductor".
   */
  for (const label of ['Residuo', 'empresa transportista', 'patente', 'conductor']) {
    assert.ok(rendered.html.includes(`>${label}</td>`), `falta el rótulo "${label}"`);
  }
  assert.equal(rendered.html.match(/text-transform:uppercase/g)?.length, 5); // 4 rótulos + pastilla
  assert.match(rendered.html, /Aceite lubricante usado — 870 kg/);
  assert.match(rendered.html, /Resiter S\.A\./);
  assert.match(rendered.html, /RLVZ-57/);
  // Dos celdas por fila llevan la línea: sin las dos, el trazo no cruza la tarjeta entera.
  assert.equal(rendered.html.match(/border-bottom:1px solid #f0f0f0/g)?.length, 8);

  // ── Versión en texto plano ───────────────────────────────────────────────────
  assert.match(rendered.text, /^AurelIA · Solicitud de retiro corregida · SR-2026-0847/);
  assert.match(rendered.text, /Patente: RLVZ-57/);
  assert.match(rendered.text, /https:\/\/aurelia\.goldfields\.cl\/waste\/folios-sidrep/);

  // ── Validación de entrada ────────────────────────────────────────────────────
  assert.throws(() => service.render({ ...BASE, recipientName: '  ' }), /recipientName is required/);
  assert.throws(() => service.render({ ...BASE, recipientEmail: 'nope' }), /recipientEmail is invalid/);
  assert.throws(() => service.render({ ...BASE, actionUrl: 'ftp://x.cl' }), /actionUrl must use http/);

  // El contenido se escapa: un nombre con HTML no puede inyectar marcado.
  const escaped = service.render({ ...BASE, correctedByName: '<script>x</script>' });
  assert.doesNotMatch(escaped.html, /<script>/);

  /*
   * LOS CORREOS QUE YA SALEN NO CAMBIARON. Las tres medidas nuevas del recuadro son
   * opcionales y por omisión valen lo de antes (16 / 15 / 10); esta es la prueba de que
   * agregarlas no movió el HTML del correo de SINADER.
   */
  const sinader = new WasteSinaderReportEmailTemplateService().renderAvailable({
    recipientName: BASE.recipientName,
    recipientEmail: BASE.recipientEmail,
    periodLabel: 'Agosto 2026',
    reminderDay: 1,
    actionUrl: 'https://aurelia.goldfields.cl/waste/reporte-sinader',
  });
  assert.match(sinader.html, /margin-top:16px;border:1px solid #c5d8f0/);
  assert.match(sinader.html, /padding:12px 0 12px 15px/);
  assert.match(sinader.html, /padding:12px 15px 12px 10px/);

  console.log('OK · plantilla de correo "Solicitud de retiro corregida" (nodo 4295:25088)');
}

main();
