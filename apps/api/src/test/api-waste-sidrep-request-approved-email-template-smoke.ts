import assert from 'node:assert/strict';
import { WasteSidrepRequestApprovedEmailTemplateService } from '../modules/messaging/waste-sidrep-request-approved-email-template.service';
import { WasteSidrepRequestCorrectedEmailTemplateService } from '../modules/messaging/waste-sidrep-request-corrected-email-template.service';

const BASE = {
  recipientName: 'Juan Pérez Soto',
  recipientEmail: 'juan.perez@resiter.cl',
  requestNumber: 'SR-2026-0847',
  periodLabel: 'Mayo 2026',
  approvedByName: 'Karen Opazo Soto',
  approvedAtLabel: '05-06-2026 · 19:03',
  sidrepCode: '2026-SD-04821',
};

function main(): void {
  const service = new WasteSidrepRequestApprovedEmailTemplateService();
  const rendered = service.render(BASE);

  // ── Armazón compartido y medidas COMPACT ────────────────────────────────────
  assert.match(rendered.html, /width="640"/);
  assert.match(rendered.html, /background:#e8eef5/);
  assert.match(rendered.html, /background:#012659/);
  assert.match(rendered.html, /background:#f6faff/);
  assert.match(rendered.html, /padding:36px 44px 32px/);
  assert.match(rendered.html, /data:image\/svg\+xml;base64,/);
  assert.match(rendered.html, /no responder este mensaje/);

  // ── Contenido estricto del nodo 4288:22019 ──────────────────────────────────
  assert.equal(rendered.subject, 'AurelIA · Solicitud de retiro aprobada · SR-2026-0847');
  assert.match(rendered.html, /RESIDUOS · SOLICITUD APROBADA/);
  assert.match(rendered.html, /Tu solicitud de retiro fue aprobada/);
  assert.match(rendered.html, /Ciclo Mayo 2026 · AurelIA · Sistema de Gestión Ambiental/);
  assert.match(rendered.html, /Hola, <strong>Juan Pérez Soto<\/strong>/);
  assert.match(rendered.html, /<strong>Karen Opazo Soto aprobó tu solicitud<\/strong>/);
  assert.match(rendered.html, /El folio SIDREP fue generado y ya está disponible/);
  assert.match(rendered.html, /Estado actual de tu solicitud “Abierto”/);

  // El nodo no dibuja CTA: después de la tarjeta viene directamente el pie.
  assert.doesNotMatch(rendered.html, /bgcolor="#c8a064"/);
  assert.doesNotMatch(rendered.html, /<a href=/);

  // ── Recuadro verde ──────────────────────────────────────────────────────────
  assert.match(rendered.html, /margin-top:14px;border:1px solid #a8dfa8/);
  assert.match(rendered.html, /padding:12px 0 12px 14px/);
  assert.match(rendered.html, /padding:12px 14px 12px 9px/);
  assert.match(rendered.html, /✓/);

  // ── Tarjeta de detalle: tres filas y línea bajo cada una ─────────────────────
  for (const label of ['Fecha de aprobación', 'Aprobado por', 'Folio SIDREP']) {
    assert.ok(rendered.html.includes(`>${label}</td>`), `falta el rótulo "${label}"`);
  }
  assert.match(rendered.html, /05-06-2026 · 19:03/);
  assert.match(rendered.html, /Karen Opazo Soto · Medio Ambiente/);
  assert.match(rendered.html, /2026-SD-04821/);
  assert.equal(rendered.html.match(/border-bottom:1px solid #f0f0f0/g)?.length, 6);
  assert.equal(rendered.html.match(/text-transform:uppercase/g)?.length, 4);

  // ── Texto plano, validación y escape ────────────────────────────────────────
  assert.match(rendered.text, /Folio SIDREP: 2026-SD-04821/);
  assert.doesNotMatch(rendered.text, /https?:\/\//);
  assert.throws(() => service.render({ ...BASE, recipientEmail: 'nope' }), /recipientEmail is invalid/);
  assert.throws(
    () => service.render({ ...BASE, approvedAtLabel: '2026-06-05 19:03' }),
    /approvedAtLabel must be formatted as dd-mm-yyyy · HH:mm/,
  );
  const escaped = service.render({ ...BASE, approvedByName: '<script>x</script>' });
  assert.doesNotMatch(escaped.html, /<script>/);

  // Un correo existente conserva su botón al volver opcional la CTA del armazón.
  const corrected = new WasteSidrepRequestCorrectedEmailTemplateService().render({
    recipientName: 'Karen Opazo Soto',
    recipientEmail: 'karen.opazo@goldfields.com',
    requestNumber: BASE.requestNumber,
    correctedByName: BASE.recipientName,
    periodLabel: BASE.periodLabel,
    wasteType: 'Aceite lubricante usado',
    netWeightLabel: '870 kg',
    carrier: 'Resiter S.A.',
    plate: 'RLVZ-57',
    driver: BASE.recipientName,
    actionUrl: 'https://aurelia.goldfields.cl/waste/folios-sidrep',
  });
  assert.match(corrected.html, /bgcolor="#c8a064"/);
  assert.match(corrected.html, /Ir a formularios pendientes/);

  console.log('OK · plantilla de correo "Solicitud de retiro aprobada" (nodo 4288:22019)');
}

main();
