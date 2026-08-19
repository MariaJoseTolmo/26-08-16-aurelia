import assert from 'node:assert/strict';
import {
  WASTE_SINADER_DECLARATION_DEADLINE_DAY,
  WasteSinaderReportEmailTemplateService,
  resolveWasteSinaderReminderVariant,
} from '../modules/messaging/waste-sinader-report-email-template.service';

const BASE = {
  recipientName: 'Karen Opazo Soto',
  recipientEmail: 'karen.opazo@goldfields.com',
  periodLabel: 'Agosto 2026',
  actionUrl: 'https://aurelia.goldfields.cl/waste/reporte-sinader',
};

function main(): void {
  const service = new WasteSinaderReportEmailTemplateService();

  // ── Qué correo corresponde cada día ──────────────────────────────────────────
  const variant = (dayOfMonth: number, isDeclared = false) =>
    resolveWasteSinaderReminderVariant({ dayOfMonth, isDeclared });

  assert.equal(variant(1), 'available');
  assert.equal(variant(WASTE_SINADER_DECLARATION_DEADLINE_DAY), 'available');
  assert.equal(variant(WASTE_SINADER_DECLARATION_DEADLINE_DAY + 1), 'overdue');
  assert.equal(variant(31), 'overdue');
  assert.equal(variant(0), null, 'no hay día 0');
  // Un período declarado no recibe correo NINGÚN día, ni dentro ni fuera de plazo.
  assert.equal(variant(3, true), null);
  assert.equal(variant(25, true), null);

  // ── Armazón compartido: los dos correos lo dibujan igual ─────────────────────
  const available = service.renderAvailable({ ...BASE, reminderDay: 1 });
  const overdue = service.renderOverdue({ ...BASE, reminderDay: 8 });

  for (const rendered of [available, overdue]) {
    assert.match(rendered.html, /width="640"/);
    assert.match(rendered.html, /background:#e8eef5/);
    assert.match(rendered.html, /background:#012659/);
    assert.match(rendered.html, /background:#f6faff/);
    assert.match(rendered.html, /background:#c8a064/);
    assert.match(rendered.html, /Ir a Reporte SINADER/);
    assert.match(rendered.html, /no responder este mensaje/);
    assert.match(rendered.html, /Hola, <strong>Karen Opazo Soto<\/strong>/);
    // El logo va embebido: un correo no puede depender de una URL viva.
    assert.match(rendered.html, /data:image\/svg\+xml;base64,/);
  }

  // ── Lo propio de "disponible" (nodo 4304:31237) ──────────────────────────────
  assert.equal(available.subject, 'AurelIA · Reporte SINADER disponible · Agosto 2026');
  assert.match(available.html, /background:#e0ffd3/);
  assert.match(available.html, /Reporte SINADER disponible/);
  assert.match(available.html, /Ventanilla Única del RETC/);
  assert.match(available.html, /background:#e6f3ff/);
  assert.doesNotMatch(available.html, /SLA vencido/);
  // Dos data URI: el logo y el círculo de información.
  assert.equal(available.html.match(/data:image\/svg\+xml;base64,/g)?.length, 2);

  // El asunto cambia cada día para que los recordatorios no se apilen en un hilo.
  assert.match(
    service.renderAvailable({ ...BASE, reminderDay: 4 }).subject,
    /pendiente de declarar .* día 4$/,
  );
  assert.match(service.renderAvailable({ ...BASE, reminderDay: 7 }).subject, /Último día/);

  // ── Lo propio de "vencido" (nodo 4304:31354) ─────────────────────────────────
  assert.match(overdue.html, /background:#ffd0db/);
  assert.match(overdue.html, /El reporte SINADER debe ser declarado/);
  assert.match(overdue.html, /SLA vencido/);
  assert.match(overdue.html, /Marcar como declarado/);
  assert.match(overdue.html, /⚠/);
  // El "⚠" es un carácter, no una imagen: sólo el logo va embebido acá.
  assert.equal(overdue.html.match(/data:image\/svg\+xml;base64,/g)?.length, 1);

  // Los días de atraso se cuentan desde el plazo, y el asunto los nombra.
  assert.match(overdue.subject, /1 día de atraso$/);
  assert.match(service.renderOverdue({ ...BASE, reminderDay: 9 }).subject, /2 días de atraso$/);
  assert.match(service.renderOverdue({ ...BASE, reminderDay: 20 }).subject, /13 días de atraso$/);

  // ── Los datos de entrada se escapan ──────────────────────────────────────────
  for (const render of [
    service.renderAvailable.bind(service),
    service.renderOverdue.bind(service),
  ]) {
    const escaped = render({
      ...BASE,
      recipientName: '<script>alert(1)</script>',
      periodLabel: '<b>Agosto</b> 2026',
      reminderDay: 10,
    });
    assert.doesNotMatch(escaped.html, /<script>/);
    assert.match(escaped.html, /&lt;script&gt;/);
    assert.doesNotMatch(escaped.html, /Ciclo <b>Agosto<\/b>/);
  }

  // ── Entradas inválidas no producen un correo a medio armar ───────────────────
  assert.throws(
    () => service.renderAvailable({ ...BASE, recipientName: '  ', reminderDay: 1 }),
    /recipientName is required/,
  );
  assert.throws(
    () => service.renderAvailable({ ...BASE, recipientEmail: 'no-es-un-mail', reminderDay: 1 }),
    /recipientEmail is invalid/,
  );
  assert.throws(
    () => service.renderOverdue({ ...BASE, actionUrl: 'javascript:alert(1)', reminderDay: 8 }),
    /actionUrl must use http or https/,
  );

  console.log('Waste SINADER report email template smoke test passed.');
}

main();
