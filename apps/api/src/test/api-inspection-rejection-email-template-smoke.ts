import assert from 'node:assert/strict';
import { InspectionRejectionEmailTemplateService } from '../modules/messaging/inspection-rejection-email-template.service';

function main(): void {
  const service = new InspectionRejectionEmailTemplateService();
  const rendered = service.render({
    recipientName: 'María Responsable',
    recipientEmail: 'maria.responsable@example.com',
    inspectionNumber: '369',
    observationNumber: '2',
    rejectionReason: 'La evidencia no permite verificar el cierre.',
    rejectedByName: 'Pedro Contreras Ríos',
    rejectedByProfile: 'Admin GF HSE',
    areaName: 'Planta de procesos',
    sectorName: 'Chancado',
    inspectionMode: 'Hallazgo',
    actionUrl: 'https://aurelia.goldfields.cl/notifications/open/token-firmado',
  });

  assert.equal(rendered.subject, 'AurelIA · Observación rechazada · Inspección #369');
  assert.match(rendered.html, /width="640"/);
  assert.match(rendered.html, /background:#012659/);
  assert.match(rendered.html, /background:#f6faff/);
  assert.match(rendered.html, /background:#ffd0db/);
  assert.match(rendered.html, /background:#c8a064/);
  assert.match(rendered.html, /data:image\/svg\+xml;base64,/);
  assert.match(rendered.html, /Hola, <strong>María Responsable<\/strong>/);
  assert.match(rendered.html, /La evidencia no permite verificar el cierre/);
  assert.match(rendered.html, /Pedro Contreras Ríos · Admin GF HSE/);
  assert.match(rendered.html, /Planta de procesos · Chancado/);
  assert.match(rendered.html, /Nº DE LA OBSERVACIÓN/);
  assert.match(rendered.html, />2<\/td>/);
  assert.match(rendered.html, /Ejecutar observación/);
  assert.match(rendered.html, /notifications\/open\/token-firmado/);
  assert.match(rendered.text, /maria.responsable@example.com|María Responsable/);

  const escaped = service.render({
    recipientName: '<script>alert(1)</script>',
    recipientEmail: 'safe@example.com',
    inspectionNumber: '#369',
    observationNumber: '#1',
    rejectionReason: '<img src=x onerror=alert(1)>',
    rejectedByName: 'Admin & Revisor',
    rejectedByProfile: 'Admin GF',
    areaName: null,
    sectorName: null,
    inspectionMode: 'Checklist',
    actionUrl: 'https://example.com/?finding=1&mode=rejected',
  });

  assert.doesNotMatch(escaped.html, /<script>/);
  assert.doesNotMatch(escaped.html, /<img src=x/);
  assert.match(escaped.html, /&lt;script&gt;/);
  assert.match(escaped.html, /&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.match(escaped.html, /Admin &amp; Revisor/);
  assert.match(escaped.html, /Sin información/);
  assert.match(escaped.html, /Checklist/);

  assert.throws(() => service.render({
    recipientName: 'Responsable',
    recipientEmail: 'correo-invalido',
    inspectionNumber: '369',
    observationNumber: '1',
    rejectionReason: 'Motivo',
    rejectedByName: 'Admin',
    rejectedByProfile: 'Admin GF',
    areaName: null,
    sectorName: null,
    inspectionMode: 'Hallazgo',
    actionUrl: 'https://example.com',
  }), /recipientEmail is invalid/);

  console.log('Inspection rejection email template smoke test passed.');
}

main();
