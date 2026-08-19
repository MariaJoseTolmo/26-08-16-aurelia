import type {
  AreaResponse,
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

/**
 * Detalle de área en estado Pendiente (Figma 1560:5830).
 * Parámetros y conteos desde assignments del catálogo; empty state fijo del diseño.
 * PLACEHOLDER: recordatorio manual, nombre de responsable (assignments aún sin user enrich),
 * fecha límite (SPR_ACTIVE_CYCLE mock hasta exista ciclo de reporte).
 */
export function buildSprReportAreaPendingDetail(input: {
  areaSlug: string;
  areas: AreaResponse[] | undefined;
  parameters: SprParameterResponse[] | undefined;
  assignments: SprParameterAreaAssignmentResponse[] | undefined;
  records: SprMonthlyRecordResponse[] | undefined;
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

  const periodRecords = (input.records ?? []).filter(
    (record) =>
      record.areaId === area.id &&
      assignedParameterIds.has(record.parameterId) &&
      IN_CONSOLIDADO.has(record.status),
  );

  // Solo construir vista Pendiente si no hay datos en consolidado.
  if (periodRecords.length > 0) return null;

  const parameterCount = parameters.length;
  const daysRemainingLabel = SPR_ACTIVE_CYCLE.deadlineHelper.replace(/\s*restantes\s*$/i, '').trim();
  const deadlineLabel = `${SPR_ACTIVE_CYCLE.deadlineLabel} · ${daysRemainingLabel}`;

  return {
    areaName: area.name,
    detail: {
      viewMode: 'empty',
      headerBadge: 'Pendiente · Sin datos · Fecha límite hoy',
      headerBadgeTone: 'danger',
      statusLabel: 'El Responsable no ha enviado datos · Sin datos en consolidado',
      statusLabelTone: 'danger',
      reminderLabel: null,
      showParameterSoxBadges: false,
      historicalAlertCountLabel: () => '',
      traceabilityLabel: 'Ver trazabilidad',
      historicalAlertTitle: '',
      historicalAlertDescription: '',
      pendingManagerNotice: null,
      estimateNotice: null,
      parametersSidebarAlert: `El responsable no ha iniciado el ingreso de datos. Quedan ${daysRemainingLabel} para el cierre.`,
      emptyDocumentsLabel: 'Sin documentos adjuntos',
      documentsDropzone: null,
      emptyState: {
        title: 'Sin datos enviados',
        description:
          'El Responsable no ha enviado el formulario. No hay datos disponibles para el consolidado. Si no se reciben antes del día 9, AurelIA usará el promedio de los últimos 6 meses como estimación.',
        ctaLabel: 'Enviar recordatorio manual',
      },
      emptyNoteTitle: 'Sin nota',
      emptyNoteHelper: 'El Responsable no dejó comentarios adicionales.',
      footerNotice: null,
      processStatusTitle: 'Estado del proceso',
      parametersTitle: 'Parámetros por completar',
      documentsTitle: 'Documentación adjunta',
      processRows: [
        { label: 'Estado', value: 'Pendiente', tone: 'danger' },
        { label: 'Fecha límite', value: deadlineLabel, tone: 'danger' },
        {
          label: 'Parámetros',
          value: `0 de ${parameterCount} completados`,
          tone: 'default',
        },
        // PLACEHOLDER: assignments.responsibleUserId aún no viene enriquecido con nombre.
        { label: 'Responsable', value: 'Sin asignar', tone: 'default' },
      ],
      documents: [],
      parameters: parameters.map((parameter) => ({
        id: parameter.id,
        name: parameter.name,
        subtitle: '',
        valueLabel: 'Sin valor',
        dataSource: '',
        isSox: parameter.isSox,
        needsHistoricalReview: false,
        note: null,
        historical: null,
        detailRows: [],
      })),
      signatures: [],
    },
  };
}
