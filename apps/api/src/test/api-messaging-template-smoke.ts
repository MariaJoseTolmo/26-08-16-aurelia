import assert from 'node:assert/strict';
import { EmailTemplateService } from '../modules/messaging/email-template.service';

function main(): void {
  const service = new EmailTemplateService();
  const rendered = service.renderInspectionFindingAssigned({
    recipientName: 'Patricia Soto',
    companyName: 'GARDE CORPS',
    inspectionNumber: 'INS-2026-357',
    observationCount: 2,
    platformUrl: 'https://aurelia.goldfields.cl/inspections/INS-2026-357',
  });

  assert.equal(rendered.subject, 'AurelIA — Hallazgo asignado a GARDE CORPS');
  assert.match(rendered.html, /max-width: 360px/);
  assert.match(rendered.html, /width: 650px/);
  assert.match(rendered.html, /data:image\/svg\+xml;base64,/);
  assert.match(rendered.html, /INS-2026-357 con 2 observaciones/);
  assert.match(rendered.html, /Ir a plataforma de hallazgos/);
  assert.match(rendered.text, /Patricia Soto/);

  const escaped = service.renderInspectionFindingAssigned({
    recipientName: '<script>alert(1)</script>',
    companyName: 'Empresa & Asociados',
    inspectionNumber: 'INS-1',
    observationCount: 1,
    platformUrl: 'https://example.com/?a=1&b=2',
  });

  assert.doesNotMatch(escaped.html, /<script>/);
  assert.match(escaped.html, /&lt;script&gt;/);
  assert.match(escaped.html, /Empresa &amp; Asociados/);
  assert.match(escaped.html, /INS-1 con 1 observación/);

  console.log('Messaging email template smoke test passed.');
}

main();
