import { useState } from 'react';
import {
  importLegacyInspections,
  previewLegacyInspections,
  type LegacyInspectionsImportResponse,
  type LegacyInspectionsPreviewResponse,
} from '../../shared/services/database-maintenance.service';

const CONFIRMATION = 'IMPORTAR_2308_INSPECCIONES_LEGACY';

export function LegacyInspectionsImportPanel() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<LegacyInspectionsPreviewResponse | null>(null);
  const [result, setResult] = useState<LegacyInspectionsImportResponse | null>(null);
  const [loading, setLoading] = useState<'preview' | 'import' | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handlePreview() {
    if (!file) {
      setError('Selecciona primero la planilla XLSX aprobada.');
      return;
    }

    setLoading('preview');
    setError(null);
    setResult(null);
    try {
      setPreview(await previewLegacyInspections(file));
    } catch (previewError) {
      setPreview(null);
      setError(previewError instanceof Error ? previewError.message : 'No se pudo verificar el archivo legacy');
    } finally {
      setLoading(null);
    }
  }

  async function handleImport() {
    if (!file || !preview) {
      setError('Verifica primero la planilla antes de importarla.');
      return;
    }

    const confirmation = window.prompt(
      `Esta acción importará las inspecciones históricas en la base actual. Escribe ${CONFIRMATION} para confirmar.`,
    );
    if (confirmation !== CONFIRMATION) {
      setError('Confirmación inválida. No se ejecutó la importación.');
      return;
    }

    setLoading('import');
    setError(null);
    try {
      setResult(await importLegacyInspections(file, confirmation));
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : 'No se pudo importar el archivo legacy');
    } finally {
      setLoading(null);
    }
  }

  return (
    <section style={{ marginTop: 18, borderRadius: 20, background: '#ffffff', border: '1px solid rgba(12, 31, 56, 0.08)', boxShadow: '0 12px 30px rgba(12, 31, 56, 0.05)', padding: 20 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ maxWidth: 760 }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: '#24588b' }}>Restauración histórica</p>
          <h2 style={{ margin: '8px 0 6px', fontSize: 22, color: '#001e39' }}>Importar inspecciones legacy desde este navegador</h2>
          <p style={{ margin: 0, color: '#617183', fontSize: 14, lineHeight: 1.6 }}>
            Carga la planilla aprobada directamente. El backend valida nombre lógico, tamaño, SHA-256, hoja, cabeceras y totales antes de habilitar la importación. No requiere montar archivos ni cambiar variables del servidor.
          </p>
        </div>
        <span style={{ borderRadius: 999, padding: '8px 12px', background: '#eef8f5', color: '#007f6b', fontSize: 12, fontWeight: 800 }}>
          Sólo administradores
        </span>
      </div>

      <div style={{ display: 'grid', gap: 12, marginTop: 18, gridTemplateColumns: 'minmax(260px, 1fr) auto auto', alignItems: 'end' }}>
        <label style={{ display: 'grid', gap: 7 }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: '#001e39' }}>Planilla XLSX aprobada</span>
          <input
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={(event) => {
              setFile(event.target.files?.[0] ?? null);
              setPreview(null);
              setResult(null);
              setError(null);
            }}
            style={{ minHeight: 44, borderRadius: 12, border: '1px solid rgba(12, 31, 56, 0.14)', padding: '9px 12px', background: '#fbfdff' }}
          />
        </label>
        <button
          type="button"
          onClick={handlePreview}
          disabled={!file || loading !== null}
          style={{ height: 44, padding: '0 16px', borderRadius: 12, border: '1px solid rgba(36, 88, 139, 0.2)', background: '#f4f8fc', color: '#24588b', fontWeight: 800, cursor: 'pointer' }}
        >
          {loading === 'preview' ? 'Verificando...' : 'Verificar archivo'}
        </button>
        <button
          type="button"
          onClick={handleImport}
          disabled={!preview || loading !== null}
          style={{ height: 44, padding: '0 18px', borderRadius: 12, border: 'none', background: preview ? 'linear-gradient(135deg, #00b398 0%, #24588b 100%)' : '#dce5ee', color: '#ffffff', fontWeight: 800, cursor: preview ? 'pointer' : 'not-allowed' }}
        >
          {loading === 'import' ? 'Importando...' : 'Importar en esta base'}
        </button>
      </div>

      {file ? <p style={{ margin: '10px 0 0', fontSize: 12, color: '#617183' }}>{file.name} · {Math.round(file.size / 1024)} KB</p> : null}
      {error ? <p style={{ margin: '12px 0 0', borderRadius: 12, background: '#fff5f7', border: '1px solid rgba(196, 54, 90, 0.18)', padding: 12, color: '#a42f4e', fontSize: 13 }}>{error}</p> : null}

      {preview ? (
        <div style={{ marginTop: 16, display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          <Metric label="Filas verificadas" value={String(preview.totalRows)} />
          <Metric label="Observaciones" value={String(preview.totals.findingsCount)} />
          <Metric label="Cerradas" value={String(preview.totals.closedFindingsCount)} />
          <Metric label="Pendientes" value={String(preview.totals.openFindingsCount)} />
          <Metric label="Advertencias" value={String(preview.dispositions.WARNING)} />
          <Metric label="Cuarentena" value={String(preview.dispositions.QUARANTINE)} />
          <div style={{ gridColumn: '1 / -1', borderRadius: 12, background: '#f7fbff', border: '1px solid rgba(12, 31, 56, 0.08)', padding: 12 }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.8, color: '#6a7f95' }}>SHA-256 verificado</p>
            <p style={{ margin: '6px 0 0', fontFamily: 'Consolas, monospace', fontSize: 12, color: '#001e39', wordBreak: 'break-all' }}>{preview.sourceSha256}</p>
          </div>
        </div>
      ) : null}

      {result ? (
        <div style={{ marginTop: 16, borderRadius: 14, background: '#eef8f5', border: '1px solid rgba(0, 179, 152, 0.22)', padding: 14, color: '#006b5b' }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 800 }}>Importación finalizada</p>
          <p style={{ margin: '6px 0 0', fontSize: 13, lineHeight: 1.6 }}>
            {result.importedRows} inspecciones importadas y {result.alreadyImportedRows} ya existentes. Total procesado: {result.totalRows}.
          </p>
        </div>
      ) : null}

      <p style={{ margin: '14px 0 0', color: '#617183', fontSize: 12, lineHeight: 1.55 }}>
        El archivo se mantiene sólo durante la solicitud y se elimina del almacenamiento temporal al terminar. La operación es idempotente: repetirla no crea duplicados.
      </p>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ borderRadius: 12, background: '#f7fbff', border: '1px solid rgba(12, 31, 56, 0.08)', padding: 12 }}>
      <p style={{ margin: 0, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.8, color: '#6a7f95' }}>{label}</p>
      <p style={{ margin: '6px 0 0', fontSize: 22, fontWeight: 800, color: '#001e39' }}>{value}</p>
    </div>
  );
}
