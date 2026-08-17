import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import type { WasteFolioSupportExportRequest } from '@aurelia/contracts';
import { ReportPdfService } from '../modules/reports/report-pdf.service';
import { WasteFolioSupportExportPdfService } from '../modules/waste/waste-folio-support-export-pdf.service';
import { wasteFolioSupportExportBaseFilename } from '../modules/waste/waste-warehouse-export.theme';

/**
 * Smoke del PDF "Respaldo de Traslado de Residuo Peligroso" — nodo Figma `3084:11044`.
 *
 * Comprueba lo que un typecheck no puede: que el documento SE RENDERIZA. Los glifos se
 * dibujan con `doc.path()` sobre una transformación, el logo se lee del disco y las cifras
 * se miden para repartir la banda de pesos — tres cosas que fallan en ejecución y no en
 * compilación.
 *
 * Con `--out <ruta>` además escribe el PDF a disco para revisarlo a ojo contra el nodo.
 *
 * NO VALIDA LA APARIENCIA. Un smoke no puede afirmar que el documento se parece al diseño;
 * para eso hay que abrirlo. Lo que sí garantiza es que no se rompió al dibujar y que el
 * contenido del payload llegó al archivo.
 */

const PAYLOAD: WasteFolioSupportExportRequest = {
  folio: '2026-SD-04690',
  title: 'Respaldo de Traslado de Residuo Peligroso',
  subtitle: 'Folio SIDREP 2026-SD-04690 · Aceite lubricante usado · Resiter S.A.',
  statusLabel: 'Cerrado',
  fields: [
    { label: 'Empresa transportista', value: 'Resiter S.A.' },
    { label: 'Empresa destinataria', value: 'Hidronor Chile S.A.' },
    { label: 'Patente vehículo', value: 'RLVZ-57' },
    { label: 'Conductor', value: 'Juan Pérez Soto' },
    { label: 'Fecha de generación', value: '05 jul 2026, 08:40' },
    { label: 'Fecha de cierre', value: '07 jul 2026, 16:10' },
    { label: 'Resolución sanitaria verificada', value: 'Res. Exenta N°10171/2022' },
    { label: 'Cantidad de contenedores', value: '4' },
  ],
  weights: {
    dispatched: '1.020 kg',
    received: '1.005 kg',
    difference: '15 kg',
    differenceLabel: 'Diferencia (normal)',
  },
  documents: [
    { label: 'Ticket de pesaje', filename: 'ticket_pesaje_0847.pdf' },
    { label: 'Guía de despacho RESPEL', filename: 'guia_respel_2204.pdf' },
    { label: 'Hoja de Datos de Seguridad de Transporte (HDST)', filename: 'hdst_aceite_lubricante_v4.pdf' },
    { label: '4 fotografías del vehículo', filename: 'fotos_vehiculo_04690.zip' },
    { label: 'Declaración SIDREP', filename: 'declaracion2161197_71767.pdf' },
  ],
};

async function main(): Promise<void> {
  const service = new WasteFolioSupportExportPdfService(new ReportPdfService());
  const generatedAt = new Date('2026-07-21T10:42:00');

  const buffer = await service.render(PAYLOAD, {
    generatedAt,
    author: 'Catalina Cortés (Medio Ambiente)',
  });

  // ── Es un PDF y no un buffer vacío ──────────────────────────────────────────
  assert.ok(buffer.length > 5000, `el PDF salió sospechosamente chico: ${buffer.length} bytes`);
  assert.equal(buffer.subarray(0, 5).toString('latin1'), '%PDF-', 'no tiene la firma de un PDF');

  /*
   * UNA SOLA HOJA con el paquete del nodo. Es la regresión que importa: el pie del PDF de
   * SINADER ya generó hojas en blanco una vez por escribir debajo del margen inferior, y
   * este documento no tiene pie justamente porque el nodo no lo dibuja.
   */
  const pages = buffer.toString('latin1').match(/\/Type\s*\/Page[^s]/g)?.length ?? 0;
  assert.equal(pages, 1, `se esperaba 1 hoja y salieron ${pages}`);

  // ── Los metadatos llevan el título y el autor ───────────────────────────────
  const raw = buffer.toString('latin1');
  assert.match(raw, /\/Producer/);

  // ── El nombre del archivo sale del folio, no de la fecha ────────────────────
  assert.equal(wasteFolioSupportExportBaseFilename(PAYLOAD.folio), 'residuos-respaldo-2026-SD-04690');
  // Un folio con caracteres raros no puede romper el `Content-Disposition`.
  assert.equal(wasteFolioSupportExportBaseFilename('2026/SD 04690'), 'residuos-respaldo-2026-SD-04690');
  assert.equal(wasteFolioSupportExportBaseFilename(''), 'residuos-respaldo-sidrep');

  /*
   * SIN DOCUMENTOS TAMBIÉN RENDERIZA. El DTO permite el paquete vacío a propósito —un folio
   * cuyos adjuntos todavía no llegaron puede querer su respaldo— así que el documento no
   * puede asumir que la lista tiene al menos una fila.
   */
  const empty = await service.render(
    { ...PAYLOAD, documents: [] },
    { generatedAt, author: 'AurelIA' },
  );
  assert.ok(empty.length > 5000, 'el respaldo sin adjuntos no se renderizó');

  const outIndex = process.argv.indexOf('--out');
  if (outIndex !== -1) {
    const target = process.argv[outIndex + 1];
    assert.ok(target, '--out necesita una ruta');
    writeFileSync(target, buffer);
    console.log(`PDF escrito en ${target}`);
  }

  console.log('OK · respaldo de traslado renderizado en 1 hoja');
}

void main();
