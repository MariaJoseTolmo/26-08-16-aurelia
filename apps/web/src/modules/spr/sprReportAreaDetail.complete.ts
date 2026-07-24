import type {
  AreaResponse,
  EvidenceResponse,
  SprMonthlyRecordResponse,
  SprParameterAreaAssignmentResponse,
  SprParameterResponse,
  SprUnitResponse,
} from '@aurelia/contracts';
import { SprRecordStatus } from '@aurelia/contracts';
import { SPR_ACTIVE_CYCLE, type SprReportAreaDetailData } from './spr.constants';
import { SPR_REPORT_AREA_CATALOG } from './sprReportDashboard.real';

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
 * Detalle de área en estado Completa (Figma 1560:3294).
 * Solo aplica si TODOS los assignments activos tienen record approved en el ciclo.
 *
 * PLACEHOLDER:
 * - fuente declarada (dataSource)
 * - promedio 6 meses / desviación histórica
 * - envío al SAC / timeline / trazabilidad
 * - firma de Sustentabilidad y cierre de ciclo (no van en este nodo de área)
 */
export function buildSprReportAreaCompleteDetail(input: {
  areaSlug: string;
  areas: AreaResponse[] | undefined;
  parameters: SprParameterResponse[] | undefined;
  assignments: SprParameterAreaAssignmentResponse[] | undefined;
  records: SprMonthlyRecordResponse[] | undefined;
  units: SprUnitResponse[] | undefined;
  evidences: EvidenceResponse[] | undefined;
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

  if (parameters.length === 0) return null;

  const recordsByParameterId = new Map<string, SprMonthlyRecordResponse>();
  for (const record of input.records ?? []) {
    if (record.areaId !== area.id || !assignedParameterIds.has(record.parameterId)) continue;
    recordsByParameterId.set(record.parameterId, record);
  }

  const allApproved = parameters.every(
    (parameter) => recordsByParameterId.get(parameter.id)?.status === SprRecordStatus.APPROVED,
  );
  if (!allApproved) return null;

  const approvedRecords = parameters
    .map((parameter) => recordsByParameterId.get(parameter.id))
    .filter((record): record is SprMonthlyRecordResponse => Boolean(record));

  const unitSymbolById = new Map<string, string>();
  for (const unit of input.units ?? []) {
    if (unit.symbol) unitSymbolById.set(unit.id, unit.symbol);
  }

  const submittedAtCandidates = approvedRecords
    .map((record) => record.submittedAt)
    .filter((value): value is string => Boolean(value))
    .sort();
  const approvedAtCandidates = approvedRecords
    .map((record) => record.approvedAt)
    .filter((value): value is string => Boolean(value))
    .sort();

  const earliestSubmittedAt = submittedAtCandidates[0] ?? null;
  const latestApprovedAt = approvedAtCandidates[approvedAtCandidates.length - 1] ?? null;
  const submittedLabel = formatDateTime(earliestSubmittedAt);
  const approvedLabel = formatDateTime(latestApprovedAt);

  const responsibleName =
    approvedRecords.find((record) => record.submittedByFullName)?.submittedByFullName ?? 'Responsable de área';
  const managerName =
    approvedRecords.find((record) => record.approvedByFullName)?.approvedByFullName ?? 'Gerente de área';

  const parameterCount = parameters.length;
  const completedCount = approvedRecords.length;
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
      headerBadge: 'Completa · Resp. ✓ · Gte. ✓ · Consolidado ✓',
      headerBadgeTone: 'complete',
      statusLabel: 'En consolidado · Aprobado por Gerente',
      statusLabelTone: 'success',
      reminderLabel: null,
      showParameterSoxBadges: true,
      // PLACEHOLDER: promedio histórico real aún no existe en API.
      historicalAlertCountLabel: (count: number) =>
        count === 1 ? '1 valor fuera del rango histórico' : `${count} valores fuera del rango histórico`,
      // PLACEHOLDER: trazabilidad / timeline de ciclo.
      traceabilityLabel: 'Ver trazabilidad',
      historicalAlertTitle: 'Valor fuera del rango histórico',
      historicalAlertDescription:
        'Desviación superior al 10% respecto al promedio de 6 meses. El Gerente aprobó revisando la nota del Responsable.',
      pendingManagerNotice: null,
      estimateNotice: null,
      parametersSidebarAlert: null,
      emptyDocumentsLabel: 'Sin documentos adjuntos',
      documentsDropzone: null,
      emptyState: null,
      emptyNoteTitle: 'Sin nota',
      emptyNoteHelper: 'El Responsable no dejó comentarios adicionales.',
      // PLACEHOLDER: envío al SAC / cierre de ciclo.
      footerNotice: null,
      processStatusTitle: 'Estado del proceso',
      parametersTitle: 'Parámetros reportados',
      documentsTitle: 'Documentación adjunta',
      processRows: [
        { label: 'Estado', value: 'Completa', tone: 'default' },
        { label: 'Responsable envió', value: submittedLabel, tone: 'default' },
        {
          label: '→ Consolidado desde',
          value: submittedLabel !== '—' ? `${submittedLabel} · Automático` : 'Automático',
          tone: 'teal',
        },
        { label: 'Gerente aprobó', value: approvedLabel, tone: 'default' },
        {
          label: 'Parámetros',
          value: `${completedCount} de ${parameterCount} completados`,
          tone: 'default',
        },
      ],
      documents,
      parameters: parameters.map((parameter) => {
        const record = recordsByParameterId.get(parameter.id)!;
        const unitSymbol = parameter.unitId ? unitSymbolById.get(parameter.unitId) : undefined;
        const numericLabel = formatNumericValue(record.numericValue);
        const valueLabel = unitSymbol ? `${numericLabel} ${unitSymbol}` : numericLabel;
        const recordSubmitted = formatDateTime(record.submittedAt);
        const recordApproved = formatDateTime(record.approvedAt);

        return {
          id: parameter.id,
          name: parameter.name,
          subtitle: parameter.isSox
            ? `Área ${area.name} · Referencia SOX en SAC`
            : `Área ${area.name} · Solo lectura`,
          valueLabel,
          // PLACEHOLDER: dataSource aún no persiste (Plan B Carlo).
          dataSource: 'Fuente declarada pendiente',
          isSox: parameter.isSox,
          // PLACEHOLDER: no marcar alerta histórica hasta exista promedio real.
          needsHistoricalReview: false,
          note: record.notes ?? null,
          historical: null,
          detailRows: [
            {
              label: 'Ingresado al consolidado',
              value:
                recordSubmitted !== '—'
                  ? `${recordSubmitted} · Al recibir formulario del Responsable`
                  : 'Al recibir formulario del Responsable',
              tone: 'teal',
            },
            { label: 'Aprobado por Gerente', value: recordApproved, tone: 'default' },
            {
              label: 'Enviado por',
              value: record.submittedByFullName ?? responsibleName,
              tone: 'default',
            },
            {
              label: 'Aprobado por',
              value: record.approvedByFullName ?? managerName,
              tone: 'default',
            },
            // PLACEHOLDER: copy SOX / SAC informativo (sin integración SAC).
            {
              label: 'Referencia SOX en SAC',
              value: parameter.isSox
                ? 'Este dato alimenta un control SOX en el SAC'
                : 'No aplica',
              tone: parameter.isSox ? 'sox' : 'default',
            },
            {
              label: 'Fuente declarada',
              value: 'Pendiente de persistencia',
              tone: 'default',
            },
            { label: 'Período reportado', value: periodLabel, tone: 'default' },
          ],
        };
      }),
      signatures: [
        {
          roleLabel: 'Responsable de Área',
          helperPrefix:
            submittedLabel !== '—'
              ? `${responsibleName} · ${submittedLabel} · `
              : `${responsibleName} · `,
          helperHighlight: 'Consolidado al firmar',
          badge: 'Firmado ✓',
          badgeTone: 'success',
          avatarTone: 'blue',
        },
        {
          roleLabel: 'Gerente de Área',
          helperPrefix:
            approvedLabel !== '—' ? `${managerName} · ${approvedLabel}` : managerName,
          helperHighlight: null,
          badge: 'Aprobado ✓',
          badgeTone: 'success',
          avatarTone: 'green',
        },
        // PLACEHOLDER: firma Sustentabilidad / cierre de ciclo — fuera de este detalle de área.
      ],
    },
  };
}
