import type {
  AreaResponse,
  EvidenceResponse,
  SprMonthlyRecordResponse,
  SprParameterAreaAssignmentResponse,
  SprParameterResponse,
} from '@aurelia/contracts';
import { SprRecordStatus } from '@aurelia/contracts';
import { SPR_ACTIVE_CYCLE, type SprReportAreaDetailData } from './spr.constants';
import { SPR_REPORT_AREA_CATALOG } from './sprReportDashboard.real';

const IN_CONSOLIDADO = new Set<string>([
  SprRecordStatus.SUBMITTED,
  SprRecordStatus.UNDER_REVIEW,
  SprRecordStatus.APPROVED,
]);

function formatNumericValue(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return 'Sin valor';
  const numeric = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(numeric)) return String(value);
  return new Intl.NumberFormat('es-CL', { maximumFractionDigits: 3 }).format(numeric);
}

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}-${month}-${year} · ${hours}:${minutes}`;
}

function formatEvidenceDocument(evidence: EvidenceResponse): { name: string; size: string } {
  return {
    name: evidence.title?.trim() || `Evidencia ${evidence.id.slice(0, 8)}`,
    // PLACEHOLDER: EvidenceResponse aún no expone size_bytes del file.
    size: '—',
  };
}

/**
 * Detalle de área en estado En consolidado (Figma 1560:4724).
 * Solo aplica si hay records en consolidado y aún no están todos approved.
 * PLACEHOLDER: fuente declarada (dataSource), recordatorio al Gerente, tamaño de evidencia.
 */
export function buildSprReportAreaConsolidatingDetail(input: {
  areaSlug: string;
  areas: AreaResponse[] | undefined;
  parameters: SprParameterResponse[] | undefined;
  assignments: SprParameterAreaAssignmentResponse[] | undefined;
  records: SprMonthlyRecordResponse[] | undefined;
  evidences?: EvidenceResponse[] | undefined;
  cycleLabel?: string;
}): { areaName: string; detail: SprReportAreaDetailData } | null {
  const meta = SPR_REPORT_AREA_CATALOG.find((area) => area.slug === input.areaSlug);
  if (!meta) return null;

  const area = (input.areas ?? []).find((row) => row.code === meta.code);
  if (!area) return null;

  const areaAssignments = (input.assignments ?? []).filter(
    (assignment) => assignment.areaId === area.id && assignment.status === 'active',
  );
  const assignedParameterIds = new Set(areaAssignments.map((assignment) => assignment.parameterId));
  const parameters = (input.parameters ?? [])
    .filter((parameter) => assignedParameterIds.has(parameter.id))
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const recordsByParameterId = new Map<string, SprMonthlyRecordResponse>();
  for (const record of input.records ?? []) {
    if (record.areaId !== area.id || !assignedParameterIds.has(record.parameterId)) continue;
    recordsByParameterId.set(record.parameterId, record);
  }

  const consolidatingRecords = [...recordsByParameterId.values()].filter((record) =>
    IN_CONSOLIDADO.has(record.status),
  );
  if (consolidatingRecords.length === 0) return null;

  const allApproved =
    parameters.length > 0 &&
    parameters.every((parameter) => recordsByParameterId.get(parameter.id)?.status === SprRecordStatus.APPROVED);
  // Completa se maneja aparte; este builder es solo En consolidado.
  if (allApproved) return null;

  const submittedAtCandidates = consolidatingRecords
    .map((record) => record.submittedAt)
    .filter((value): value is string => Boolean(value))
    .sort();
  const earliestSubmittedAt = submittedAtCandidates[0] ?? null;
  const submittedLabel = formatDateTime(earliestSubmittedAt);
  const completedCount = consolidatingRecords.length;
  const parameterCount = parameters.length;
  const responsibleLabel =
    consolidatingRecords.find((record) => record.submittedByFullName)?.submittedByFullName ?? 'Responsable de área';
  const periodLabel = input.cycleLabel ?? SPR_ACTIVE_CYCLE.label;

  const documentsById = new Map<string, { name: string; size: string }>();
  for (const evidence of input.evidences ?? []) {
    if (documentsById.has(evidence.id)) continue;
    documentsById.set(evidence.id, formatEvidenceDocument(evidence));
  }
  const documents = [...documentsById.values()];

  return {
    areaName: area.name,
    detail: {
      viewMode: 'filled',
      headerBadge: 'En consolidado · Gte. pendiente',
      headerBadgeTone: 'pending',
      statusLabel: null,
      statusLabelTone: 'success',
      // PLACEHOLDER: integración con notificaciones al Gerente.
      reminderLabel: 'Recordatorio al Gerente',
      showParameterSoxBadges: true,
      historicalAlertCountLabel: (count: number) =>
        count === 1 ? '1 valor fuera del rango histórico' : `${count} valores fuera del rango histórico`,
      traceabilityLabel: 'Ver trazabilidad',
      historicalAlertTitle: 'Valor fuera del rango histórico',
      historicalAlertDescription:
        'Desviación superior al 10% respecto al promedio de 6 meses. El Gerente revisará la nota del Responsable.',
      pendingManagerNotice: {
        title: 'Aprobación del Gerente de Área pendiente',
        description: `Los datos ya están en el consolidado desde el ${submittedLabel}. La aprobación del Gerente es informativa — no bloquea el consolidado ni el envío al SAC.`,
      },
      estimateNotice: null,
      parametersSidebarAlert: null,
      emptyDocumentsLabel: 'Sin documentos adjuntos',
      documentsDropzone: null,
      emptyState: null,
      emptyNoteTitle: 'Sin nota',
      emptyNoteHelper: 'El Responsable no dejó comentarios adicionales.',
      footerNotice:
        'Si el Gerente rechaza el formulario, el Responsable deberá hacer correcciones y reenviar. Los datos actualizados reemplazarán los del consolidado automáticamente.',
      processStatusTitle: 'Estado del proceso',
      parametersTitle: 'Parámetros reportados',
      documentsTitle: 'Documentación adjunta',
      processRows: [
        { label: 'Estado', value: 'En consolidado', tone: 'blue' },
        { label: 'Responsable envió', value: submittedLabel, tone: 'default' },
        { label: 'Consolidado desde', value: submittedLabel, tone: 'teal' },
        { label: 'Gerente de Área', value: 'Pendiente', tone: 'default' },
        {
          label: 'Parámetros',
          value: `${completedCount} de ${parameterCount} en consolidado`,
          tone: 'default',
        },
      ],
      documents,
      parameters: parameters.map((parameter) => {
        const record = recordsByParameterId.get(parameter.id);
        const inConsolidado = record ? IN_CONSOLIDADO.has(record.status) : false;
        const valueLabel = record ? formatNumericValue(record.numericValue) : 'Sin valor';
        const statusLabel = !record
          ? 'Sin envío'
          : record.status === SprRecordStatus.APPROVED
            ? 'Aprobado por Gerente'
            : record.status === SprRecordStatus.SUBMITTED || record.status === SprRecordStatus.UNDER_REVIEW
              ? 'Incluido · Gte. pendiente'
              : record.status;

        return {
          id: parameter.id,
          name: parameter.name,
          subtitle: `Área ${area.name} · Solo lectura`,
          valueLabel,
          // PLACEHOLDER: dataSource aún no persiste (Plan B Carlo).
          dataSource: 'Fuente declarada pendiente',
          isSox: parameter.isSox,
          needsHistoricalReview: false,
          note: record?.notes ?? null,
          historical: null,
          detailRows: [
            { label: 'Fuente declarada', value: 'Pendiente de persistencia', tone: 'default' },
            { label: 'Período reportado', value: periodLabel, tone: 'default' },
            {
              label: 'Estado en consolidado',
              value: inConsolidado
                ? `${statusLabel}${record?.submittedAt ? ` · ${formatDateTime(record.submittedAt)}` : ''}`
                : statusLabel,
              tone: inConsolidado ? 'teal' : 'default',
            },
            {
              label: 'Fecha de ingreso del Responsable',
              value: formatDateTime(record?.submittedAt),
              tone: 'default',
            },
            {
              label: 'Enviado por',
              value: record?.submittedByFullName ?? responsibleLabel,
              tone: 'default',
            },
          ],
        };
      }),
      signatures: [
        {
          roleLabel: 'Responsable de Área',
          helperPrefix: submittedLabel !== '—' ? `Firmó y envió el ${submittedLabel}` : 'Formulario enviado',
          helperHighlight: null,
          badge: 'Enviado ✓',
          badgeTone: 'success',
          avatarTone: 'blue',
        },
        {
          roleLabel: 'Gerente de Área',
          helperPrefix: 'Pendiente de revisión',
          helperHighlight: null,
          badge: 'Pendiente →',
          badgeTone: 'pending',
          avatarTone: 'muted',
          muted: true,
        },
      ],
    },
  };
}
