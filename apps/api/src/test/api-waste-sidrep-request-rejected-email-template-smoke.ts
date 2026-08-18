import assert from 'node:assert/strict';
import { InspectionRejectionEmailTemplateService } from '../modules/messaging/inspection-rejection-email-template.service';
import {
  WASTE_SIDREP_REJECTED_EMAIL_ACTION_PATH,
  WasteSidrepRequestRejectedEmailTemplateService,
} from '../modules/messaging/waste-sidrep-request-rejected-email-template.service';

const BASE = {
  recipientName: 'Juan Pérez Soto',
  recipientEmail: 'juan.perez@resiter.cl',
  requestNumber: 'SR-2026-0847',
  rejectionReason:
    'La fotografía frontal del camión está demasiado borrosa. Por favor asegurese de que la patente se vea nítida',
  rejectedByName: 'Karen Opazo Soto',
  rejectedAtLabel: '18-08-2026',
  actionUrl: 'https://aurelia.goldfields.cl/waste/historico',
};

function main(): void {
  const service = new WasteSidrepRequestRejectedEmailTemplateService();
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
  // Un solo data URI —el logo—: acá no hay iconos en SVG, el "⚠" es un carácter.
  assert.equal(rendered.html.match(/data:image\/svg\+xml;base64,/g)?.length, 1);

  // ── Medidas ROOMY, las mismas del correo de observación rechazada ────────────
  assert.match(rendered.html, /padding:40px 48px 36px/);
  assert.match(rendered.html, /font-size:14px;line-height:23\.1px/);
  /*
   * EL SALUDO VA SIN COMA aunque las medidas ROOMY la pongan: el nodo `4278:21489` escribe
   * "Hola, [Nombre y apellido]" a secas. Es el override `greetingSuffix` del armazón.
   */
  assert.match(rendered.html, /Hola, <strong>Juan Pérez Soto<\/strong><\/p>/);
  assert.match(rendered.text, /^Hola, Juan Pérez Soto$/m);

  // ── Lo propio del nodo 4278:21437 ────────────────────────────────────────────
  assert.equal(rendered.subject, 'AurelIA · Solicitud de retiro rechazada · SR-2026-0847');
  assert.match(rendered.html, /RESIDUOS · SOLICITUD RECHAZADA/);
  assert.match(rendered.html, /Tu solicitud de retiro fue rechazada — Se requiere corrección/);
  assert.match(rendered.html, /AurelIA · Sistema de Gestión Ambiental · Salares Norte/);
  assert.match(rendered.html, /Medio ambiente revisó tu solicitud de retiro y lo devolvió para corrección/);
  assert.match(rendered.html, /Ir a corregir formulario/);
  /*
   * EL BOTÓN `4278:21525` LLEVA AL HISTÓRICO DE RETIROS, que es donde la solicitud
   * rechazada vuelve a estar disponible para retomarla.
   */
  assert.equal(WASTE_SIDREP_REJECTED_EMAIL_ACTION_PATH, '/waste/historico');
  assert.match(rendered.html, /href="https:\/\/aurelia\.goldfields\.cl\/waste\/historico"/);
  assert.match(rendered.html, /Una vez corrijas el formulario y lo reenvíes, Medio Ambiente recibirá/);

  // El par ROJO del sistema, verificado píxel a píxel sobre el render del nodo.
  assert.match(rendered.html, /background:#ffd0db/);
  assert.match(rendered.html, /background:#bd3b5b/);
  assert.match(rendered.html, /border:1px solid #f0a0b0/);
  assert.match(rendered.html, /⚠/);

  // ── Recuadro del motivo: título en negrita y la cita entre comillas del nodo ──
  assert.match(rendered.html, /<strong>Motivo del rechazo · Karen Opazo Soto<\/strong><br>“/);
  assert.match(rendered.html, /la patente se vea nítida”/);
  // Los saltos de línea del motivo se ven: en una celda de tabla un \n no hace nada.
  const multiline = service.render({ ...BASE, rejectionReason: 'Primera línea\nSegunda línea' });
  assert.match(multiline.html, /Primera línea<br>Segunda línea/);

  // ── Tarjeta de detalle: dos filas y UNA sola línea, la de entre medio ─────────
  for (const label of ['fecha', 'Rechazado por']) {
    assert.ok(rendered.html.includes(`>${label}</td>`), `falta el rótulo "${label}"`);
  }
  assert.match(rendered.html, /18-08-2026/);
  assert.match(rendered.html, /Karen Opazo Soto · Medio Ambiente/);
  /*
   * Dos celdas llevan la línea —las de la primera fila—: sin las dos el trazo no cruza la
   * tarjeta entera, y con cuatro habría una línea colgando bajo la última fila que el nodo
   * no dibuja.
   */
  assert.equal(rendered.html.match(/border-bottom:1px solid #f0f0f0/g)?.length, 2);
  // 2 rótulos + la pastilla.
  assert.equal(rendered.html.match(/text-transform:uppercase/g)?.length, 3);

  // ── Versión en texto plano ───────────────────────────────────────────────────
  assert.match(rendered.text, /^AurelIA · Solicitud de retiro rechazada · SR-2026-0847/);
  assert.match(rendered.text, /Motivo del rechazo · Karen Opazo Soto/);
  assert.match(rendered.text, /Fecha: 18-08-2026/);
  assert.match(rendered.text, /Rechazado por: Karen Opazo Soto · Medio Ambiente/);
  assert.match(rendered.text, /https:\/\/aurelia\.goldfields\.cl\/waste\/historico/);

  // ── Validación de entrada ────────────────────────────────────────────────────
  assert.throws(() => service.render({ ...BASE, recipientName: '  ' }), /recipientName is required/);
  assert.throws(() => service.render({ ...BASE, recipientEmail: 'nope' }), /recipientEmail is invalid/);
  assert.throws(() => service.render({ ...BASE, rejectionReason: '' }), /rejectionReason is required/);
  assert.throws(() => service.render({ ...BASE, actionUrl: 'ftp://x.cl' }), /actionUrl must use http/);
  /*
   * EL DESTINO ES UNO SOLO: un llamador que apunte a otra pantalla deja al transportista
   * sin manera de encontrar la solicitud rechazada.
   */
  assert.throws(
    () => service.render({ ...BASE, actionUrl: 'https://aurelia.goldfields.cl/waste/solicitud-retiro' }),
    /actionUrl must point to \/waste\/historico/,
  );
  // La barra final y los parámetros de más siguen llevando a la misma pantalla.
  assert.doesNotThrow(() =>
    service.render({ ...BASE, actionUrl: 'https://aurelia.goldfields.cl/waste/historico/?utm=mail' }),
  );
  /*
   * La fecha llega formateada y se valida: un ISO filtrado desde el backend pasaría
   * desapercibido hasta verlo en la bandeja de alguien.
   */
  assert.throws(
    () => service.render({ ...BASE, rejectedAtLabel: '2026-08-18' }),
    /rejectedAtLabel must be formatted as dd-mm-yyyy/,
  );

  // El contenido se escapa: un motivo con HTML no puede inyectar marcado.
  const escaped = service.render({ ...BASE, rejectionReason: '<img src=x onerror=alert(1)>' });
  assert.doesNotMatch(escaped.html, /<img src=x/);
  assert.match(escaped.html, /&lt;img src=x/);

  /*
   * EL CORREO DE OBSERVACIÓN RECHAZADA NO CAMBIÓ. Comparten armazón, medidas ROOMY y par
   * de colores, así que esta es la prueba de que agregar este correo no movió aquél.
   */
  const inspection = new InspectionRejectionEmailTemplateService().render({
    recipientName: 'Juan Pérez Soto',
    recipientEmail: 'juan.perez@goldfields.com',
    inspectionNumber: '369',
    observationNumber: '1204',
    rejectionReason: 'La evidencia no permite verificar el cierre.',
    rejectedByName: 'Pedro Contreras Ríos',
    rejectedByProfile: 'Admin GF HSE',
    areaName: 'Planta',
    sectorName: 'Chancado',
    inspectionMode: 'Hallazgo',
    actionUrl: 'https://aurelia.goldfields.cl/inspecciones/369',
  });
  assert.match(inspection.html, /INSPECCIONES · OBSERVACIÓN RECHAZADA/);
  assert.match(inspection.html, /padding:10px 12px/);
  assert.match(inspection.html, /\.detail-value \{ width:58% !important; \}/);

  console.log('OK · plantilla de correo "Solicitud de retiro rechazada" (nodo 4278:21437)');
}

main();
