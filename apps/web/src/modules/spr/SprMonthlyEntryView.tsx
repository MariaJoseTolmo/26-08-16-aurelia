import { useEffect, useMemo, useState } from 'react';
import type {
  CreateSprMonthlyRecordRequest,
  SprMonthlyRecordResponse,
  SprParameterAreaAssignmentResponse,
  SprParameterResponse,
  SprUnitResponse,
  UpdateSprMonthlyRecordRequest,
} from '@aurelia/contracts';
import { SprRecordStatus } from '@aurelia/contracts';
import { useSprParameters } from '../../shared/hooks/useSprParameters';
import { useSprAssignments } from '../../shared/hooks/useSprAssignments';
import { useSprUnits } from '../../shared/hooks/useSprUnits';
import { useSprMonthlyRecords } from '../../shared/hooks/useSprMonthlyRecords';
import { useSaveSprMonthlyRecord } from '../../shared/hooks/useSaveSprMonthlyRecord';
import { useSubmitSprMonthlyRecord } from '../../shared/hooks/useSubmitSprMonthlyRecord';
import { useSprRecordEvidences } from '../../shared/hooks/useSprRecordEvidences';
import { useUploadSprRecordEvidence } from '../../shared/hooks/useUploadSprRecordEvidence';
import { getSprRecordEvidences } from '../../shared/services/spr.service';
import { useSessionStore } from '../../shared/stores/session.store';
import { SprCycleContextHeader } from './components/SprCycleContextHeader';
import { SprParametersList } from './components/SprParametersList';
import { SprParameterDetailForm } from './components/SprParameterDetailForm';
import { SprDocumentsSection } from './components/SprDocumentsSection';
import { SprFooterActions } from './components/SprFooterActions';
import { SprSubmitModal } from './components/SprSubmitModal';
import { SprHistoricalRangeBadge } from './components/SprHistoricalRangeBadge';
import { SprRejectionAlertBanner } from './components/SprRejectionAlertBanner';
import { SprEstimatesAlertBanner } from './components/SprEstimatesAlertBanner';
import { SprTraceabilityIcon } from './icons/SprIcons';
import { SPR_CORRECTION_MODE } from './spr.constants';
import {
  getSprFormMockEstimateValue,
  isSprFormCycleEstimatesMode,
  type SprFormCycle,
} from './sprFormCycles';
import { getSprFormDataSourcesForArea } from './sprFormFlow.constants';
import { parameterRequiresEvidence } from './sprEvidence';
import { evaluateHistoricalRange, hasSprHistoricalDeviationNote, parseSprNumericValue } from './sprHistoricalRange';
import { SPR_CYCLE_TRACEABILITY_ROUTE } from './sprCycleTraceability.constants';
import { useNavigate } from 'react-router-dom';
import type { SprRejectionContext } from './sprRejectedContext';
import { getSprFormEntry, useSprMonthlyFormStore, type SprParameterFormEntry } from './state/sprMonthlyForm.store';
import type { SprParameterRow } from './spr.types';

interface SprMonthlyEntryViewProps {
  cycle: SprFormCycle;
  correctionMode?: boolean;
  rejectionContext?: SprRejectionContext | null;
}

const numberFormatter = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 2 });

function formatNumber(value: number) {
  return numberFormatter.format(value);
}

function looksNotApplicable(text: string | null | undefined) {
  return Boolean(text && /no aplica/i.test(text));
}

function recordHasValue(record: SprMonthlyRecordResponse | null) {
  if (!record) return false;
  return record.numericValue !== null || (record.textValue !== null && record.textValue.trim() !== '');
}

function buildUnitSymbolMap(units: SprUnitResponse[] | undefined) {
  const map = new Map<string, string>();
  (units ?? []).forEach((unit) => {
    if (unit.symbol) map.set(unit.id, unit.symbol);
  });
  return map;
}

function buildRecordMap(records: SprMonthlyRecordResponse[] | undefined) {
  const map = new Map<string, SprMonthlyRecordResponse>();
  (records ?? []).forEach((record) => map.set(record.parameterId, record));
  return map;
}

function buildAssignmentMap(
  assignments: SprParameterAreaAssignmentResponse[] | undefined,
  areaId: string | null,
) {
  const map = new Map<string, SprParameterAreaAssignmentResponse>();
  (assignments ?? []).forEach((assignment) => {
    if (areaId && assignment.areaId !== areaId) return;
    // Solo una assignment por parámetro en el área del usuario (compartidos: Acetylene/LPG).
    if (!map.has(assignment.parameterId)) {
      map.set(assignment.parameterId, assignment);
    }
  });
  return map;
}

// Combina el borrador de UI (Zustand) con el registro persistido para mostrar el valor efectivo.
function resolveEntry(
  draft: SprParameterFormEntry,
  record: SprMonthlyRecordResponse | null,
  mockEstimateValue?: string,
): SprParameterFormEntry {
  const recordValue =
    record?.numericValue !== null && record?.numericValue !== undefined
      ? formatNumber(record.numericValue)
      : (record?.textValue ?? '');
  const fallbackValue = draft.value !== '' ? draft.value : recordValue || mockEstimateValue || '';
  return {
    value: fallbackValue,
    notApplicable: draft.notApplicable || looksNotApplicable(record?.textValue),
    source: draft.source,
    note: draft.note !== '' ? draft.note : (record?.notes ?? ''),
    estimateCleared: draft.estimateCleared,
  };
}

function buildRow(
  parameter: SprParameterResponse,
  record: SprMonthlyRecordResponse | null,
  unitSymbol: string | null,
  draft: SprParameterFormEntry,
  options?: { estimatesMode?: boolean; mockEstimateValue?: string },
): SprParameterRow {
  const estimatesMode = Boolean(options?.estimatesMode);
  const mockEstimateValue = options?.mockEstimateValue;
  const isEstimated = estimatesMode && !draft.estimateCleared;
  const notApplicable = draft.notApplicable || looksNotApplicable(record?.textValue);
  const hasDraftValue = draft.value.trim() !== '';
  const completed = notApplicable || hasDraftValue || recordHasValue(record) || (isEstimated && Boolean(mockEstimateValue));
  const completion = notApplicable ? 'not-applicable' : completed ? 'completed' : 'pending';

  let valueLabel = 'Sin completar';
  if (notApplicable) {
    valueLabel = 'No aplica';
  } else if (hasDraftValue) {
    valueLabel = unitSymbol ? `${draft.value} ${unitSymbol}` : draft.value;
  } else if (record?.numericValue !== null && record?.numericValue !== undefined) {
    valueLabel = unitSymbol ? `${formatNumber(record.numericValue)} ${unitSymbol}` : formatNumber(record.numericValue);
  } else if (record?.textValue) {
    valueLabel = record.textValue;
  } else if (isEstimated && mockEstimateValue) {
    valueLabel = unitSymbol ? `${mockEstimateValue} ${unitSymbol}` : mockEstimateValue;
  }

  const effectiveValue = hasDraftValue
    ? draft.value
    : record?.numericValue !== null && record?.numericValue !== undefined
      ? String(record.numericValue).replace('.', ',')
      : record?.textValue ?? (isEstimated ? mockEstimateValue ?? '' : '');

  const historicalRange = notApplicable || isEstimated ? null : evaluateHistoricalRange(parameter.code, effectiveValue);
  const needsHistoricalReview = Boolean(historicalRange?.isOutOfRange);

  return {
    parameter,
    record,
    unitSymbol,
    completion,
    valueLabel,
    needsHistoricalReview,
    historicalRange,
    isEstimated,
  };
}

function parseNumeric(value: string): number | null {
  return parseSprNumericValue(value);
}

export function SprMonthlyEntryView({
  cycle,
  correctionMode = false,
  rejectionContext = null,
}: SprMonthlyEntryViewProps) {
  const navigate = useNavigate();
  const estimatesMode = isSprFormCycleEstimatesMode(cycle);
  const areaName = useSessionStore((state) => state.user?.areaName ?? null);
  const areaId = useSessionStore((state) => state.user?.areaId ?? null);
  const currentUserId = useSessionStore((state) => state.user?.id ?? null);
  const dataSources = useMemo(() => getSprFormDataSourcesForArea(areaName), [areaName]);
  const parametersQuery = useSprParameters(areaId);
  const unitsQuery = useSprUnits();
  const assignmentsQuery = useSprAssignments(areaId);
  const recordsQuery = useSprMonthlyRecords({
    periodYear: cycle.periodYear,
    periodMonth: cycle.periodMonth,
    areaId: areaId ?? undefined,
  });

  const saveMutation = useSaveSprMonthlyRecord();
  const submitMutation = useSubmitSprMonthlyRecord();
  const uploadEvidenceMutation = useUploadSprRecordEvidence();
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [submitEvidenceError, setSubmitEvidenceError] = useState<string | null>(null);
  const [saveDraftErrorMessage, setSaveDraftErrorMessage] = useState<string | null>(null);
  const [rejectionBannerDismissed, setRejectionBannerDismissed] = useState(false);

  const selectedParameterId = useSprMonthlyFormStore((state) => state.selectedParameterId);
  const entries = useSprMonthlyFormStore((state) => state.entries);
  const selectParameter = useSprMonthlyFormStore((state) => state.selectParameter);
  const setValue = useSprMonthlyFormStore((state) => state.setValue);
  const setNotApplicable = useSprMonthlyFormStore((state) => state.setNotApplicable);
  const setSource = useSprMonthlyFormStore((state) => state.setSource);
  const setNote = useSprMonthlyFormStore((state) => state.setNote);
  const clearEstimate = useSprMonthlyFormStore((state) => state.clearEstimate);
  const resetForm = useSprMonthlyFormStore((state) => state.reset);

  useEffect(() => {
    resetForm();
  }, [cycle.id, resetForm]);

  const unitSymbolMap = useMemo(() => buildUnitSymbolMap(unitsQuery.data), [unitsQuery.data]);
  const recordMap = useMemo(() => buildRecordMap(recordsQuery.data), [recordsQuery.data]);
  const assignmentMap = useMemo(
    () => buildAssignmentMap(assignmentsQuery.data, areaId),
    [assignmentsQuery.data, areaId],
  );

  const rows = useMemo<SprParameterRow[]>(() => {
    const assignedParameterIds = new Set(assignmentMap.keys());
    const parameters = [...(parametersQuery.data ?? [])]
      .filter((parameter) => (areaId ? assignedParameterIds.has(parameter.id) : true))
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'es'));
    return parameters.map((parameter, index) => {
      const record = recordMap.get(parameter.id) ?? null;
      const unitSymbol = parameter.unitId ? unitSymbolMap.get(parameter.unitId) ?? null : null;
      const draft = getSprFormEntry(entries, parameter.id);
      return buildRow(parameter, record, unitSymbol, draft, {
        estimatesMode,
        mockEstimateValue: estimatesMode ? getSprFormMockEstimateValue(index) : undefined,
      });
    });
  }, [parametersQuery.data, recordMap, unitSymbolMap, entries, estimatesMode, assignmentMap, areaId]);

  const totalCount = rows.length;
  const completedCount = rows.filter((row) => row.completion !== 'pending').length;
  const estimatedRemainingCount = rows.filter((row) => row.isEstimated).length;
  const remainingCount = estimatesMode ? estimatedRemainingCount : Math.max(0, totalCount - completedCount);
  const historicalAlertCount = rows.filter((row) => row.needsHistoricalReview).length;
  const soxParameterCount = rows.filter((row) => row.parameter.isSox).length;

  const activeParameterId = selectedParameterId ?? rows[0]?.parameter.id ?? null;
  const selectedRow = rows.find((row) => row.parameter.id === activeParameterId) ?? null;
  const selectedDraft = getSprFormEntry(entries, activeParameterId);
  const selectedMockEstimate =
    estimatesMode && selectedRow
      ? getSprFormMockEstimateValue(rows.findIndex((row) => row.parameter.id === selectedRow.parameter.id))
      : undefined;
  const selectedEntry = selectedRow
    ? resolveEntry(selectedDraft, selectedRow.record, selectedRow.isEstimated ? selectedMockEstimate : undefined)
    : selectedDraft;
  const selectedRecordId = selectedRow?.record?.id ?? null;
  const selectedEvidencesQuery = useSprRecordEvidences(selectedRecordId);

  // Firmar y enviar: todos intervenidos (dato o No aplica) + notas obligatorias si hay desviación ±10%.
  const missingDeviationNoteCount = rows.filter((row) => {
    if (!row.needsHistoricalReview) return false;
    const entry = getSprFormEntry(entries, row.parameter.id);
    return !hasSprHistoricalDeviationNote(entry.note, row.record?.notes);
  }).length;

  const unsavedDeviationNoteCount = rows.filter((row) => {
    if (!row.needsHistoricalReview) return false;
    const entry = getSprFormEntry(entries, row.parameter.id);
    const draftNote = entry.note.trim();
    const persistedNote = row.record?.notes?.trim() ?? '';
    return draftNote !== '' && draftNote !== persistedNote;
  }).length;

  const canSubmit = estimatesMode
    ? totalCount > 0 &&
      estimatedRemainingCount === 0 &&
      missingDeviationNoteCount === 0 &&
      unsavedDeviationNoteCount === 0 &&
      rows.every((row) => {
        const entry = getSprFormEntry(entries, row.parameter.id);
        return (
          entry.notApplicable ||
          entry.value.trim() !== '' ||
          recordHasValue(row.record) ||
          looksNotApplicable(row.record?.textValue)
        );
      })
    : totalCount > 0 &&
      missingDeviationNoteCount === 0 &&
      unsavedDeviationNoteCount === 0 &&
      rows.every((row) => recordHasValue(row.record) || looksNotApplicable(row.record?.textValue));

  const saveErrorMessage = saveDraftErrorMessage
    ?? (saveMutation.error instanceof Error
      ? saveMutation.error.message
      : submitMutation.error instanceof Error
        ? submitMutation.error.message
        : uploadEvidenceMutation.error instanceof Error
          ? uploadEvidenceMutation.error.message
          : submitEvidenceError);

  useEffect(() => {
    setSaveDraftErrorMessage(null);
  }, [activeParameterId]);

  function isSprRecordEditable(record: SprMonthlyRecordResponse): boolean {
    return [SprRecordStatus.DRAFT, SprRecordStatus.REJECTED].includes(record.status);
  }

  function handleSaveDraft() {
    if (!selectedRow || !activeParameterId) return;
    setSaveDraftErrorMessage(null);

    if (selectedRow.record && !isSprRecordEditable(selectedRow.record)) {
      setSaveDraftErrorMessage(SPR_CORRECTION_MODE.nonEditableRecordMessage);
      return;
    }

    const entry = resolveEntry(
      getSprFormEntry(entries, activeParameterId),
      selectedRow.record,
      selectedRow.isEstimated ? selectedMockEstimate : undefined,
    );
    const numericValue = entry.notApplicable ? null : parseNumeric(entry.value);
    const textValue = entry.notApplicable ? 'No aplica' : numericValue === null && entry.value.trim() !== '' ? entry.value.trim() : null;
    const notes = entry.note.trim() === '' ? null : entry.note.trim();

    if (selectedRow.record) {
      const payload: UpdateSprMonthlyRecordRequest = { numericValue, textValue, notes };
      saveMutation.mutate(
        { mode: 'update', recordId: selectedRow.record.id, payload },
        {
          onSuccess: () => {
            clearEstimate(activeParameterId);
            setSaveDraftErrorMessage(null);
          },
        },
      );
      return;
    }

    const assignment = assignmentMap.get(activeParameterId) ?? null;
    const payload: CreateSprMonthlyRecordRequest = {
      parameterId: activeParameterId,
      areaId: assignment?.areaId ?? null,
      assignmentId: assignment?.id ?? null,
      periodYear: cycle.periodYear,
      periodMonth: cycle.periodMonth,
      numericValue,
      textValue,
      notes,
    };
    saveMutation.mutate(
      { mode: 'create', payload },
      {
        onSuccess: () => {
          clearEstimate(activeParameterId);
          setSaveDraftErrorMessage(null);
        },
      },
    );
  }

  function handleOpenSubmitModal() {
    if (!canSubmit || submitMutation.isPending) return;
    setSubmitModalOpen(true);
  }

  function handleUploadDocument(file: File) {
    if (!selectedRow?.record?.id) return;
    uploadEvidenceMutation.mutate({
      recordId: selectedRow.record.id,
      file,
      parameter: selectedRow.parameter,
    });
  }

  async function handleConfirmSubmit() {
    if (!canSubmit || submitMutation.isPending) return;
    setSubmitEvidenceError(null);

    const rowsMissingDeviationNote = rows.filter((row) => {
      if (!row.needsHistoricalReview) return false;
      return !hasSprHistoricalDeviationNote(undefined, row.record?.notes);
    });
    const firstMissingDeviationNote = rowsMissingDeviationNote[0];
    if (firstMissingDeviationNote) {
      setSubmitEvidenceError(
        `El parámetro "${firstMissingDeviationNote.parameter.name}" tiene desviación histórica y requiere notas justificando la diferencia antes de firmar y enviar.`,
      );
      return;
    }

    const rowsRequiringEvidence = rows.filter(
      (row) => parameterRequiresEvidence(row.parameter) && row.record?.id,
    );

    for (const row of rowsRequiringEvidence) {
      const recordId = row.record?.id;
      if (!recordId) continue;
      const evidences = await getSprRecordEvidences(recordId);
      if (evidences.length === 0) {
        setSubmitEvidenceError(
          `El parámetro "${row.parameter.name}" requiere al menos un documento vinculado antes de firmar y enviar.`,
        );
        return;
      }
    }

    const recordIds = rows
      .map((row) => row.record)
      .filter((record): record is SprMonthlyRecordResponse => Boolean(record))
      .filter((record) => [SprRecordStatus.DRAFT, SprRecordStatus.REJECTED].includes(record.status))
      .map((record) => record.id);
    if (recordIds.length === 0) return;

    try {
      for (const recordId of recordIds) {
        await submitMutation.mutateAsync({
          recordId,
          payload: { submittedByUserId: currentUserId },
        });
      }
      setSubmitModalOpen(false);
    } catch {
      // El error se muestra en el footer via submitMutation.error.
    }
  }

  return (
    <div className="flex h-[calc(100vh-56px)] w-full flex-col bg-[#f7f7f7]">
      {correctionMode && rejectionContext && !rejectionBannerDismissed ? (
        <SprRejectionAlertBanner context={rejectionContext} onDismiss={() => setRejectionBannerDismissed(true)} />
      ) : null}
      {estimatesMode ? <SprEstimatesAlertBanner /> : null}

      <SprCycleContextHeader
        cycleLabel={cycle.label}
        cycleRangeLabel={cycle.rangeLabel}
        deadlineLabel={cycle.deadlineLabel}
        deadlineHelper={cycle.deadlineHelper}
        completedCount={completedCount}
        totalCount={totalCount}
        isLoading={parametersQuery.isLoading}
        isError={parametersQuery.isError}
        variant={correctionMode ? 'rejected' : estimatesMode ? 'estimates' : 'draft'}
        rejectionContext={rejectionContext}
      />

      <div className="flex items-center justify-between border-b border-[#e3e3e3] bg-white px-[20px] py-[10px]">
        <p className="font-['Inter:Semi_Bold',sans-serif] text-[12px] font-semibold text-[#131313]">
          Ingresa los datos de tu área para el período {cycle.label}
          <span className="font-['Inter:Regular',sans-serif] text-[#acacac]"> · Todos los campos son obligatorios</span>
        </p>
        <div className="flex items-center gap-[8px]">
          <SprHistoricalRangeBadge count={historicalAlertCount} />
          <button
            type="button"
            onClick={() => navigate(SPR_CYCLE_TRACEABILITY_ROUTE)}
            className="flex h-[26px] items-center gap-[5px] rounded-[6px] border border-[#e3e3e3] bg-white px-[11px] font-['Inter:Semi_Bold',sans-serif] text-[10.5px] font-semibold text-[#24588b] hover:bg-[#fafafa]"
          >
            <SprTraceabilityIcon className="h-[11px] w-[13.75px] shrink-0" />
            Ver trazabilidad
          </button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[minmax(240px,268px)_1fr]">
        <aside className="min-h-0 overflow-y-auto border-b border-[#e3e3e3] bg-white lg:border-b-0 lg:border-r">
          <SprParametersList
            rows={rows}
            selectedParameterId={activeParameterId}
            isLoading={parametersQuery.isLoading}
            isError={parametersQuery.isError}
            onSelect={selectParameter}
          />
          <SprDocumentsSection
            recordId={selectedRecordId}
            requiresEvidence={selectedRow ? parameterRequiresEvidence(selectedRow.parameter) : false}
            evidences={selectedEvidencesQuery.data ?? []}
            isLoading={selectedEvidencesQuery.isLoading}
            isUploading={uploadEvidenceMutation.isPending}
            uploadErrorMessage={
              uploadEvidenceMutation.error instanceof Error ? uploadEvidenceMutation.error.message : null
            }
            onUpload={handleUploadDocument}
          />
        </aside>

        <section className="min-h-0 overflow-y-auto bg-[#fafbfc]">
          <SprParameterDetailForm
            row={selectedRow}
            entry={selectedEntry}
            dataSources={dataSources}
            onValueChange={(value) => activeParameterId && setValue(activeParameterId, value)}
            onNotApplicableChange={(value) => activeParameterId && setNotApplicable(activeParameterId, value)}
            onSourceChange={(value) => activeParameterId && setSource(activeParameterId, value)}
            onNoteChange={(value) => activeParameterId && setNote(activeParameterId, value)}
          />
        </section>
      </div>

      <SprFooterActions
        remainingCount={remainingCount}
        missingDeviationNoteCount={missingDeviationNoteCount}
        unsavedDeviationNoteCount={unsavedDeviationNoteCount}
        canSubmit={canSubmit}
        correctionMode={correctionMode}
        isSaving={saveMutation.isPending}
        isSubmitting={submitMutation.isPending}
        saveErrorMessage={saveErrorMessage}
        onSaveDraft={handleSaveDraft}
        onSubmit={handleOpenSubmitModal}
      />

      <SprSubmitModal
        open={submitModalOpen}
        variant={correctionMode ? 'correction' : 'initial'}
        summary={{
          completedCount,
          totalCount,
          attachmentCount: selectedEvidencesQuery.data?.length ?? 0,
          soxParameterCount,
        }}
        isSubmitting={submitMutation.isPending}
        onClose={() => setSubmitModalOpen(false)}
        onConfirm={handleConfirmSubmit}
      />
    </div>
  );
}
