import { useMemo, useState } from 'react';
import type { SprMonthlyRecordResponse, SprParameterResponse, SprUnitResponse } from '@aurelia/contracts';
import { useApproveSprMonthlyRecord } from '../../shared/hooks/useApproveSprMonthlyRecord';
import { useRejectSprMonthlyRecord } from '../../shared/hooks/useRejectSprMonthlyRecord';
import { useSprLatestCycleRejection } from '../../shared/hooks/useSprLatestCycleRejection';
import { useSprParameters } from '../../shared/hooks/useSprParameters';
import { useSprUnits } from '../../shared/hooks/useSprUnits';
import { useSprMonthlyRecords } from '../../shared/hooks/useSprMonthlyRecords';
import { useSprRecordEvidences } from '../../shared/hooks/useSprRecordEvidences';
import { useSessionStore } from '../../shared/stores/session.store';
import { SprAreaKpiHeader } from './components/SprAreaKpiHeader';
import { SprAreaReviewFooter } from './components/SprAreaReviewFooter';
import { SprAreaReviewParameterDetail } from './components/SprAreaReviewParameterDetail';
import { SprAreaReviewSubheader } from './components/SprAreaReviewSubheader';
import { SprAutomaticEmissionReadyBanner } from './components/SprAutomaticEmissionReadyBanner';
import { SprDocumentsSection } from './components/SprDocumentsSection';
import { SprManagerCorrectionBanner } from './components/SprManagerCorrectionBanner';
import { SprParametersList } from './components/SprParametersList';
import { SPR_ACTIVE_CYCLE } from './spr.constants';
import { findSprActionableRecordIds, resolveSprAreaReviewContext } from './sprAreaReview';
import { evaluateHistoricalRange } from './sprHistoricalRange';
import { resolveSprManagerCorrectionBanner } from './sprRejectedContext';
import type { SprParameterRow } from './spr.types';
import { getSprCycleRecordIds } from './sprSubmittedStatus';

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

function buildReviewRow(
  parameter: SprParameterResponse,
  record: SprMonthlyRecordResponse | null,
  unitSymbol: string | null,
): SprParameterRow {
  const notApplicable = looksNotApplicable(record?.textValue);
  const completed = notApplicable || recordHasValue(record);
  const completion = notApplicable ? 'not-applicable' : completed ? 'completed' : 'pending';

  let valueLabel = 'Sin valor';
  if (notApplicable) {
    valueLabel = 'No aplica';
  } else if (record?.numericValue !== null && record?.numericValue !== undefined) {
    valueLabel = unitSymbol ? `${formatNumber(record.numericValue)} ${unitSymbol}` : formatNumber(record.numericValue);
  } else if (record?.textValue) {
    valueLabel = record.textValue;
  }

  const effectiveValue =
    record?.numericValue !== null && record?.numericValue !== undefined
      ? String(record.numericValue).replace('.', ',')
      : record?.textValue ?? '';
  const historicalRange = notApplicable ? null : evaluateHistoricalRange(parameter.code, effectiveValue);
  const needsHistoricalReview = Boolean(historicalRange?.isOutOfRange);

  return {
    parameter,
    record,
    unitSymbol,
    completion,
    valueLabel,
    needsHistoricalReview,
    historicalRange,
    isEstimated: false,
  };
}

// Pantalla de revision del gerente (Figma 1399:13951 / post-corrección 1672:8997).
// Áreas automáticas (Figma 2606:5127): banner de notificación "listo para firmar".
export function SprAreaReviewView({
  automaticEmission = false,
  automaticAreaLabel,
  automaticSource,
  showManagerCorrectionBanner = false,
}: {
  automaticEmission?: boolean;
  automaticAreaLabel?: string;
  automaticSource?: string;
  /** Tras 8268 → 8997: banner con motivo real del rechazo previo. */
  showManagerCorrectionBanner?: boolean;
} = {}) {
  const areaId = useSessionStore((state) => state.user?.areaId ?? null);
  const parametersQuery = useSprParameters(areaId);
  const unitsQuery = useSprUnits();
  const recordsQuery = useSprMonthlyRecords({
    periodYear: SPR_ACTIVE_CYCLE.periodYear,
    periodMonth: SPR_ACTIVE_CYCLE.periodMonth,
    areaId: areaId ?? undefined,
  });
  const approveMutation = useApproveSprMonthlyRecord();
  const rejectMutation = useRejectSprMonthlyRecord();
  const currentUserId = useSessionStore((state) => state.user?.id ?? null);

  const [selectedParameterId, setSelectedParameterId] = useState<string | null>(null);
  const [actionErrorMessage, setActionErrorMessage] = useState<string | null>(null);
  const [correctionBannerDismissed, setCorrectionBannerDismissed] = useState(false);

  const unitSymbolMap = useMemo(() => buildUnitSymbolMap(unitsQuery.data), [unitsQuery.data]);
  const recordMap = useMemo(() => buildRecordMap(recordsQuery.data), [recordsQuery.data]);
  const reviewContext = useMemo(() => resolveSprAreaReviewContext(recordsQuery.data), [recordsQuery.data]);
  const cycleRecordIds = useMemo(() => getSprCycleRecordIds(recordsQuery.data), [recordsQuery.data]);
  const cycleRejectionQuery = useSprLatestCycleRejection(cycleRecordIds, showManagerCorrectionBanner);
  const managerCorrectionBanner = useMemo(() => {
    if (!showManagerCorrectionBanner || correctionBannerDismissed || !cycleRejectionQuery.rejection) return null;
    return resolveSprManagerCorrectionBanner([cycleRejectionQuery.rejection]);
  }, [correctionBannerDismissed, cycleRejectionQuery.rejection, showManagerCorrectionBanner]);

  const rows = useMemo<SprParameterRow[]>(() => {
    const parameters = [...(parametersQuery.data ?? [])].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'es'));
    return parameters.map((parameter) => {
      const record = recordMap.get(parameter.id) ?? null;
      const unitSymbol = parameter.unitId ? unitSymbolMap.get(parameter.unitId) ?? null : null;
      return buildReviewRow(parameter, record, unitSymbol);
    });
  }, [parametersQuery.data, recordMap, unitSymbolMap]);

  const totalCount = rows.length;
  const completedCount = rows.filter((row) => row.completion !== 'pending').length;
  const historicalAlertCount = rows.filter((row) => row.needsHistoricalReview).length;
  const soxParameterCount = rows.filter((row) => row.parameter.isSox).length;
  const defaultParameterId =
    rows.find((row) => row.needsHistoricalReview)?.parameter.id ?? rows[0]?.parameter.id ?? null;
  const activeParameterId = selectedParameterId ?? defaultParameterId;
  const selectedRow = rows.find((row) => row.parameter.id === activeParameterId) ?? null;
  const selectedRecordId = selectedRow?.record?.id ?? null;
  const selectedEvidencesQuery = useSprRecordEvidences(selectedRecordId);
  const actionableRecordIds = useMemo(() => findSprActionableRecordIds(recordsQuery.data), [recordsQuery.data]);
  const canAct = actionableRecordIds.length > 0;

  const actionError =
    actionErrorMessage ??
    (approveMutation.error instanceof Error
      ? approveMutation.error.message
      : rejectMutation.error instanceof Error
        ? rejectMutation.error.message
        : null);

  async function handleConfirmApprove() {
    if (!canAct || approveMutation.isPending || rejectMutation.isPending) return;
    setActionErrorMessage(null);

    for (const recordId of actionableRecordIds) {
      await approveMutation.mutateAsync({
        recordId,
        payload: { approverUserId: currentUserId },
      });
    }
  }

  async function handleConfirmReject(comments: string) {
    // Emisión automática: solo firmar (Alexis). No llamar reject aunque se force el handler.
    if (automaticEmission) return;
    if (!canAct || approveMutation.isPending || rejectMutation.isPending) return;
    setActionErrorMessage(null);

    for (const recordId of actionableRecordIds) {
      await rejectMutation.mutateAsync({
        recordId,
        payload: {
          approverUserId: currentUserId,
          comments,
        },
      });
    }
  }

  const rejectErrorMessage = rejectMutation.error instanceof Error ? rejectMutation.error.message : null;

  if (parametersQuery.isLoading || unitsQuery.isLoading || recordsQuery.isLoading) {
    return (
      <div className="flex h-[calc(100vh-56px)] w-full items-center justify-center bg-[#f7f7f7]">
        <p className="font-['Inter:Regular',sans-serif] text-[12px] text-[#646464]">Cargando formulario para revisión…</p>
      </div>
    );
  }

  if (parametersQuery.isError || unitsQuery.isError || recordsQuery.isError) {
    return (
      <div className="flex h-[calc(100vh-56px)] w-full items-center justify-center bg-[#f7f7f7] px-[22px]">
        <p className="font-['Inter:Regular',sans-serif] text-[12px] text-[#bd3b5b]">
          No se pudo cargar el formulario SPR para revisión. Intenta recargar la página.
        </p>
      </div>
    );
  }

  if (totalCount === 0) {
    return (
      <div className="flex h-[calc(100vh-56px)] w-full flex-col bg-[#f7f7f7]">
        {automaticEmission ? (
          <SprAutomaticEmissionReadyBanner
            areaLabel={automaticAreaLabel}
            automaticSource={automaticSource}
          />
        ) : null}
        <div className="flex flex-1 items-center justify-center px-[22px]">
          <p className="font-['Inter:Regular',sans-serif] text-[12px] text-[#646464]">
            {automaticEmission
              ? 'AurelIA notificó que el formulario está listo. Cuando existan registros del ciclo podrás revisarlos y firmar aquí.'
              : 'No hay parámetros disponibles para revisar en este período.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-56px)] w-full flex-col bg-[#f7f7f7]">
      {automaticEmission ? (
        <SprAutomaticEmissionReadyBanner
          areaLabel={automaticAreaLabel}
          automaticSource={automaticSource}
        />
      ) : null}
      {managerCorrectionBanner ? (
        <SprManagerCorrectionBanner
          context={managerCorrectionBanner}
          onDismiss={() => setCorrectionBannerDismissed(true)}
        />
      ) : null}
      <SprAreaKpiHeader
        completedParameterCount={completedCount}
        totalParameterCount={totalCount}
        receivedDateLabel={reviewContext.receivedDateLabel}
        responsibleLabel={automaticEmission ? 'AurelIA (emisión automática)' : reviewContext.responsibleLabel}
        signedDateTimeLabel={reviewContext.signedDateTimeLabel}
      />

      <SprAreaReviewSubheader
        responsibleLabel={reviewContext.responsibleLabel}
        historicalAlertCount={historicalAlertCount}
      />

      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[minmax(240px,272px)_1fr]">
        <aside className="min-h-0 overflow-y-auto border-b border-[#e3e3e3] bg-white lg:border-b-0 lg:border-r">
          <SprParametersList
            rows={rows}
            selectedParameterId={activeParameterId}
            isLoading={parametersQuery.isLoading}
            isError={parametersQuery.isError}
            onSelect={setSelectedParameterId}
            title="Parámetros reportados"
            listVariant="review"
          />
          <SprDocumentsSection
            recordId={selectedRecordId}
            requiresEvidence={false}
            evidences={selectedEvidencesQuery.data ?? []}
            isLoading={selectedEvidencesQuery.isLoading}
            isUploading={false}
            uploadErrorMessage={null}
            onUpload={() => undefined}
            readOnly
          />
        </aside>

        <section className="min-h-0 overflow-y-auto bg-[#fafbfc]">
          <SprAreaReviewParameterDetail row={selectedRow} reviewContext={reviewContext} />
        </section>
      </div>

      <SprAreaReviewFooter
        isApproving={approveMutation.isPending}
        isRejecting={rejectMutation.isPending}
        canAct={canAct}
        allowReject={!automaticEmission}
        actionErrorMessage={actionError}
        responsibleLabel={reviewContext.responsibleLabel}
        rejectErrorMessage={rejectErrorMessage}
        approveSummary={{
          completedCount,
          totalCount,
          attachmentCount: selectedEvidencesQuery.data?.length ?? 0,
          soxParameterCount,
        }}
        onRejectConfirm={handleConfirmReject}
        onApproveConfirm={handleConfirmApprove}
      />
    </div>
  );
}
