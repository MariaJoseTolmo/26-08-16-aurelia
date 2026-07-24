import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSprParameters } from '../../shared/hooks/useSprParameters';
import { useSprMonthlyRecords } from '../../shared/hooks/useSprMonthlyRecords';
import { useSprRecordApprovals } from '../../shared/hooks/useSprRecordApprovals';
import { useSprCycleCorrectionHistory } from '../../shared/hooks/useSprCycleCorrectionHistory';
import { useSessionStore } from '../../shared/stores/session.store';
import { SprAutomaticAreaStatusView } from './components/SprAutomaticAreaStatusView';
import { SprKpiReviewView } from './SprKpiReviewView';
import { SprDiscrepancyCorrectionView } from './SprDiscrepancyCorrectionView';
import { SprMonthlyEntryView } from './SprMonthlyEntryView';
import { SprSubmittedStatusView } from './SprSubmittedStatusView';
import {
  SPR_FORM_DEMO_CORRECTION_REQUESTED_STATE,
  SPR_FORM_DEMO_CORRECTION_RESUBMITTED_STATE,
  SPR_FORM_DEMO_DISCREPANCY_CORRECTION_VIEW,
  SPR_FORM_DEMO_DISCREPANCY_QUERY,
  SPR_FORM_DEMO_KPI_REVIEW_VIEW,
  SPR_FORM_DEMO_KPI_VALIDATION_STATE,
  SPR_FORM_DEMO_KPI_VALIDATION_SUBMITTED_STATE,
  SPR_FORM_DEMO_MODAL_QUERY,
  SPR_FORM_DEMO_REVIEW_PRESET_QUERY,
  SPR_FORM_DEMO_STATE_QUERY,
  SPR_FORM_DEMO_VIEW_QUERY,
  SPR_RESPONSIBLE_CORRECTION_RESUBMITTED_STATUS,
} from './spr.constants';
import { resolveSprFormCycle, SPR_FORM_CYCLE_QUERY } from './sprFormCycles';
import {
  getSprFormAreaCatalog,
  isSprFormAreaAutomatic,
  resolveSprFormAreaKey,
} from './sprFormFlow.constants';
import { findSprRejectedRecordId, resolveSprRejectionContext } from './sprRejectedContext';
import {
  getSprCycleRecordIds,
  resolveSprFormDisplayMode,
  resolveSprManagerApprovalDateLabel,
  resolveSprProcessStatusVariant,
  resolveSprSignDateLabel,
} from './sprSubmittedStatus';

export function SprFormView() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const areaName = useSessionStore((state) => state.user?.areaName ?? null);
  const areaId = useSessionStore((state) => state.user?.areaId ?? null);
  const areaCatalog = getSprFormAreaCatalog(resolveSprFormAreaKey(areaName));
  const isAutomaticArea = isSprFormAreaAutomatic(areaName);
  const cycle = resolveSprFormCycle(searchParams.get(SPR_FORM_CYCLE_QUERY));
  const demoState = searchParams.get(SPR_FORM_DEMO_STATE_QUERY);
  const demoView = searchParams.get(SPR_FORM_DEMO_VIEW_QUERY);
  const isDemoKpiValidation = demoState === SPR_FORM_DEMO_KPI_VALIDATION_STATE;
  const isDemoKpiValidationSubmitted = demoState === SPR_FORM_DEMO_KPI_VALIDATION_SUBMITTED_STATE;
  const isDemoCorrectionRequested = demoState === SPR_FORM_DEMO_CORRECTION_REQUESTED_STATE;
  const isDemoCorrectionResubmitted = demoState === SPR_FORM_DEMO_CORRECTION_RESUBMITTED_STATE;
  const isDiscrepancyCorrectionView =
    isDemoCorrectionRequested && demoView === SPR_FORM_DEMO_DISCREPANCY_CORRECTION_VIEW;
  const isDemoKpiValidationFlow = isDemoKpiValidation || isDemoKpiValidationSubmitted;
  const isKpiReviewView = isDemoKpiValidation && demoView === SPR_FORM_DEMO_KPI_REVIEW_VIEW;
  const [isCorrectingRejectedForm, setIsCorrectingRejectedForm] = useState(false);
  const parametersQuery = useSprParameters(areaId);
  const recordsQuery = useSprMonthlyRecords({
    periodYear: cycle.periodYear,
    periodMonth: cycle.periodMonth,
    areaId: areaId ?? undefined,
  });

  const totalParameterCount = parametersQuery.data?.length ?? 0;
  const displayMode = useMemo(
    () =>
      resolveSprFormDisplayMode(recordsQuery.data, totalParameterCount, {
        periodYear: cycle.periodYear,
        periodMonth: cycle.periodMonth,
      }),
    [cycle.periodMonth, cycle.periodYear, recordsQuery.data, totalParameterCount],
  );
  const signDateLabel = useMemo(
    () =>
      resolveSprSignDateLabel(recordsQuery.data, {
        periodYear: cycle.periodYear,
        periodMonth: cycle.periodMonth,
      }),
    [cycle.periodMonth, cycle.periodYear, recordsQuery.data],
  );
  const managerApprovalDateLabel = useMemo(
    () =>
      resolveSprManagerApprovalDateLabel(recordsQuery.data, {
        periodYear: cycle.periodYear,
        periodMonth: cycle.periodMonth,
      }),
    [cycle.periodMonth, cycle.periodYear, recordsQuery.data],
  );
  const cycleRecordIds = useMemo(
    () =>
      getSprCycleRecordIds(recordsQuery.data, {
        periodYear: cycle.periodYear,
        periodMonth: cycle.periodMonth,
      }),
    [cycle.periodMonth, cycle.periodYear, recordsQuery.data],
  );
  const needsCorrectionHistory =
    displayMode === 'pending_approval' ||
    displayMode === 'manager_approved' ||
    isDemoKpiValidationFlow;
  const correctionHistoryQuery = useSprCycleCorrectionHistory(cycleRecordIds, needsCorrectionHistory);
  const processVariant = useMemo(
    () => resolveSprProcessStatusVariant(displayMode, correctionHistoryQuery.hasCorrectionHistory),
    [correctionHistoryQuery.hasCorrectionHistory, displayMode],
  );
  const rejectedRecordId = useMemo(() => findSprRejectedRecordId(recordsQuery.data), [recordsQuery.data]);
  const approvalsQuery = useSprRecordApprovals(
    displayMode === 'rejected' && isCorrectingRejectedForm ? rejectedRecordId : null,
  );
  const rejectionContext = useMemo(
    () => (displayMode === 'rejected' && isCorrectingRejectedForm ? resolveSprRejectionContext(approvalsQuery.data) : null),
    [approvalsQuery.data, displayMode, isCorrectingRejectedForm],
  );

  const kpiValidationProcessVariant = useMemo(() => {
    if (correctionHistoryQuery.isLoading) return 'kpi_validation' as const;
    return correctionHistoryQuery.hasCorrectionHistory ? ('kpi_validation_corrected' as const) : ('kpi_validation' as const);
  }, [correctionHistoryQuery.hasCorrectionHistory, correctionHistoryQuery.isLoading]);

  const kpiReviewSubmittedProcessVariant = useMemo(() => {
    if (isDemoKpiValidationSubmitted) return 'kpi_validation_submitted_corrected' as const;
    if (correctionHistoryQuery.isLoading) return 'kpi_validation_submitted' as const;
    return correctionHistoryQuery.hasCorrectionHistory
      ? ('kpi_validation_submitted_corrected' as const)
      : ('kpi_validation_submitted' as const);
  }, [correctionHistoryQuery.hasCorrectionHistory, correctionHistoryQuery.isLoading, isDemoKpiValidationSubmitted]);

  const openKpiReview = () => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set(SPR_FORM_DEMO_STATE_QUERY, SPR_FORM_DEMO_KPI_VALIDATION_STATE);
    nextParams.set(SPR_FORM_DEMO_VIEW_QUERY, SPR_FORM_DEMO_KPI_REVIEW_VIEW);
    navigate(`/spr?${nextParams.toString()}`);
  };

  const backFromKpiReview = () => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set(SPR_FORM_DEMO_STATE_QUERY, SPR_FORM_DEMO_KPI_VALIDATION_STATE);
    nextParams.delete(SPR_FORM_DEMO_VIEW_QUERY);
    navigate(`/spr?${nextParams.toString()}`);
  };

  const finishKpiReview = () => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set(SPR_FORM_DEMO_STATE_QUERY, SPR_FORM_DEMO_KPI_VALIDATION_SUBMITTED_STATE);
    nextParams.delete(SPR_FORM_DEMO_VIEW_QUERY);
    nextParams.delete(SPR_FORM_DEMO_DISCREPANCY_QUERY);
    nextParams.delete(SPR_FORM_DEMO_REVIEW_PRESET_QUERY);
    nextParams.delete(SPR_FORM_DEMO_MODAL_QUERY);
    navigate(`/spr?${nextParams.toString()}`);
  };

  const openDiscrepancyCorrection = () => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set(SPR_FORM_DEMO_STATE_QUERY, SPR_FORM_DEMO_CORRECTION_REQUESTED_STATE);
    nextParams.set(SPR_FORM_DEMO_VIEW_QUERY, SPR_FORM_DEMO_DISCREPANCY_CORRECTION_VIEW);
    navigate(`/spr?${nextParams.toString()}`);
  };

  useEffect(() => {
    if (displayMode !== 'rejected') {
      setIsCorrectingRejectedForm(false);
    }
  }, [displayMode]);

  if (!isDemoKpiValidationFlow && !isDemoCorrectionRequested && !isDemoCorrectionResubmitted && (parametersQuery.isLoading || recordsQuery.isLoading)) {
    return (
      <div className="flex h-[calc(100vh-56px)] w-full items-center justify-center bg-[#f7f7f7]">
        <p className="font-['Inter:Regular',sans-serif] text-[12px] text-[#646464]">Cargando formulario SPR…</p>
      </div>
    );
  }

  if (displayMode === 'rejected' && isCorrectingRejectedForm) {
    return <SprMonthlyEntryView cycle={cycle} correctionMode rejectionContext={rejectionContext} />;
  }

  if (displayMode === 'rejected' && !isCorrectingRejectedForm) {
    return (
      <SprSubmittedStatusView
        signDateLabel={signDateLabel}
        variant="rejected"
        processVariant="rejected"
        onStartCorrections={() => setIsCorrectingRejectedForm(true)}
      />
    );
  }

  if (isKpiReviewView) {
    return <SprKpiReviewView onBack={backFromKpiReview} onFinalize={finishKpiReview} />;
  }

  if (isDemoCorrectionResubmitted) {
    return (
      <SprSubmittedStatusView
        signDateLabel={SPR_RESPONSIBLE_CORRECTION_RESUBMITTED_STATUS.resubmittedDateFallback}
        variant="correction_resubmitted"
        processVariant="correction_resubmitted"
        onStartKpiReview={openKpiReview}
      />
    );
  }

  if (isDiscrepancyCorrectionView) {
    return <SprDiscrepancyCorrectionView />;
  }

  if (isDemoCorrectionRequested) {
    return (
      <SprSubmittedStatusView
        signDateLabel={signDateLabel}
        variant="correction_requested"
        processVariant="correction_requested"
        onStartDiscrepancyCorrection={openDiscrepancyCorrection}
      />
    );
  }

  if (isDemoKpiValidationSubmitted) {
    return (
      <SprSubmittedStatusView
        signDateLabel={signDateLabel}
        managerApprovalDateLabel={managerApprovalDateLabel}
        variant="kpi_review_submitted"
        processVariant={kpiReviewSubmittedProcessVariant}
      />
    );
  }

  if (isDemoKpiValidation) {
    return (
      <SprSubmittedStatusView
        signDateLabel={signDateLabel}
        managerApprovalDateLabel={managerApprovalDateLabel}
        variant="kpi_validation_pending"
        processVariant={kpiValidationProcessVariant}
        onStartKpiReview={openKpiReview}
      />
    );
  }

  if (displayMode === 'manager_approved') {
    return (
      <SprSubmittedStatusView
        signDateLabel={signDateLabel}
        managerApprovalDateLabel={managerApprovalDateLabel}
        variant="completed"
        processVariant={correctionHistoryQuery.isLoading ? 'approved' : processVariant}
      />
    );
  }

  if (displayMode === 'pending_approval') {
    return (
      <SprSubmittedStatusView
        signDateLabel={signDateLabel}
        variant="pending_approval"
        processVariant={correctionHistoryQuery.isLoading ? 'initial' : processVariant}
      />
    );
  }

  // Figma 2606:5127 — áreas automáticas: el responsable no llena formulario.
  if (isAutomaticArea) {
    return (
      <SprAutomaticAreaStatusView
        areaLabel={areaCatalog.label}
        automaticSource={areaCatalog.automaticSource ?? areaCatalog.sources[0] ?? ''}
      />
    );
  }

  return <SprMonthlyEntryView cycle={cycle} />;
}

