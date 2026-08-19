import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { InspectionType } from '@aurelia/contracts';
import { getInspectionAssignmentScope } from '../../../shared/services/inspection-assignment-scope.service';
import { useSessionStore } from '../../../shared/stores/session.store';
import { StartStep } from './steps/StartStep';
import { AssistantChatStep } from './steps/AssistantChatStepV4';
import { IdentificationStep } from './steps/IdentificationStep';
import { TypeStep } from './steps/TypeStep';
import { FindingObservationsStep } from './steps/FindingObservationsStep';
import { ChecklistObservationsStep } from './steps/ChecklistObservationsStep';
import { SummaryStep } from './steps/SummaryStep';
import { SavedStep } from './steps/SavedStep';
import { useSubmitNewInspection } from './hooks/useSubmitNewInspection';
import {
  activateNewInspectionDraftSnapshot,
  beginNewInspectionDraftSession,
  clearActiveNewInspectionDraftSession,
  clearNewInspectionDraftSnapshot,
  loadNewInspectionDraftSnapshot,
  saveNewInspectionDraftSnapshot,
  type NewInspectionDraft,
  useNewInspectionDraftStore,
} from './state/newInspectionDraft.store';
import { useNewInspectionFlowStore } from './state/newInspectionFlow.store';
import './assistant-chat-visual-parity.css';
import './assistant-chat-fidelity-tweaks.css';

interface NewInspectionModalControllerProps {
  open: boolean;
  onClose: () => void;
}

const resumeDraftEventName = 'aurelia:resume-new-inspection-draft';
const resumeDraftStorageKey = 'aurelia:resume-new-inspection-draft';

function shouldResumeStoredDraft() {
  return typeof window !== 'undefined' && window.sessionStorage.getItem(resumeDraftStorageKey) === '1';
}

function clearResumeStoredDraft() {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(resumeDraftStorageKey);
}

function normalizeDraftForResume(draft: NewInspectionDraft): NewInspectionDraft {
  if (draft.flowMode === 'assistant' && !draft.inspectionTypeSelected) {
    return { ...draft, inspectionType: InspectionType.ENVIRONMENTAL, inspectionTypeLabel: '' };
  }
  return draft;
}

function CancelInspectionInfoIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <circle cx="16" cy="16" r="13" stroke="#245D91" strokeWidth="3" />
      <path d="M16 14.75v7" stroke="#245D91" strokeWidth="3" strokeLinecap="round" />
      <circle cx="16" cy="9.7" r="1.75" fill="#245D91" />
    </svg>
  );
}

function CancelInspectionCloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M1.5 1.5 14.5 14.5M14.5 1.5 1.5 14.5" stroke="#131313" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function CancelInspectionConfirmationDialog({ onConfirm, onReturn }: { onConfirm: () => void; onReturn: () => void }) {
  return (
    <div className="absolute inset-0 z-[20] flex items-center justify-center bg-[rgba(0,0,0,0.28)] p-[16px]" role="dialog" aria-modal="true" aria-labelledby="cancel-inspection-title">
      <div className="flex w-full flex-col items-start justify-center gap-[32px] rounded-[16px] bg-white p-[16px] shadow-[0_18px_50px_rgba(0,0,0,0.28)]">
        <div className="flex w-full items-center justify-between">
          <CancelInspectionInfoIcon />
          <button type="button" onClick={onReturn} className="flex h-[32px] w-[32px] items-center justify-center rounded-full" aria-label="Cerrar confirmación de cancelación">
            <CancelInspectionCloseIcon />
          </button>
        </div>
        <div className="flex w-full flex-col items-start gap-[8px] break-words">
          <p id="cancel-inspection-title" className="w-full text-[18px] font-bold leading-[22px] tracking-[0.36px] text-[#2A2A2A]">Cancelar</p>
          <div className="w-full whitespace-pre-wrap text-[14px] font-normal leading-[22.7px] tracking-[0.28px] text-[#131313]">
            <p className="mb-0">Usted está dando por cancelada esta inspección. Al hacer esto se borrarán todos los datos ingresados y la inspección desaparecerá. </p>
            <p>¿Estás de acuerdo?</p>
          </div>
        </div>
        <div className="flex w-full flex-col items-end justify-center gap-[12px]">
          <button type="button" onClick={onConfirm} className="flex h-[40px] w-full items-center justify-center rounded-[8px] bg-[#C8A064] px-[16px] py-[8px] text-[14px] font-bold leading-[22.7px] tracking-[0.28px] text-white">
            Cancelar inspección
          </button>
          <button type="button" onClick={onReturn} className="flex h-[40px] w-full items-center justify-center rounded-[8px] border border-[#C8A064] bg-white px-[16px] py-[8px] text-[14px] font-bold leading-[22.7px] tracking-[0.28px] text-[#C8A064]">
            Volver al formulario
          </button>
        </div>
      </div>
    </div>
  );
}

export function NewInspectionModalController({ open, onClose }: NewInspectionModalControllerProps) {
  const user = useSessionStore((state) => state.user);
  const assignmentScopeQuery = useQuery({
    queryKey: ['inspections', 'assignment-scope', user?.id],
    queryFn: getInspectionAssignmentScope,
    enabled: Boolean(open && user),
    staleTime: 300000,
  });
  const setInspector = useNewInspectionDraftStore((state) => state.setInspector);
  const setFlowMode = useNewInspectionDraftStore((state) => state.setFlowMode);
  const hydrateDraft = useNewInspectionDraftStore((state) => state.hydrate);
  const resetDraft = useNewInspectionDraftStore((state) => state.reset);
  const selectedInspectionType = useNewInspectionDraftStore((state) => state.inspectionType);
  const draft = useNewInspectionDraftStore();
  const routeStep = useNewInspectionFlowStore((state) => state.routeStep);
  const goToStart = useNewInspectionFlowStore((state) => state.goToStart);
  const goToAssistantChat = useNewInspectionFlowStore((state) => state.goToAssistantChat);
  const goToIdentification = useNewInspectionFlowStore((state) => state.goToIdentification);
  const goToType = useNewInspectionFlowStore((state) => state.goToType);
  const goToFindingObservations = useNewInspectionFlowStore((state) => state.goToFindingObservations);
  const goToChecklistObservations = useNewInspectionFlowStore((state) => state.goToChecklistObservations);
  const goToSummary = useNewInspectionFlowStore((state) => state.goToSummary);
  const goToSaved = useNewInspectionFlowStore((state) => state.goToSaved);
  const resetFlow = useNewInspectionFlowStore((state) => state.reset);
  const submitMutation = useSubmitNewInspection();
  const [initialized, setInitialized] = useState(false);
  const [resumeAssistantDraft, setResumeAssistantDraft] = useState(false);
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  const resumeDraftOnOpenRef = useRef(false);
  const handledOpenRef = useRef(false);
  const inspectorName = user?.fullName ?? '';
  const inspectorCompanyName = assignmentScopeQuery.data?.companyName
    ?? (user?.email.toLowerCase().endsWith('@goldfields.com') ? 'Gold Fields' : 'Sin empresa asignada');

  useEffect(() => {
    function requestDraftResume() {
      resumeDraftOnOpenRef.current = true;
    }
    window.addEventListener(resumeDraftEventName, requestDraftResume);
    return () => window.removeEventListener(resumeDraftEventName, requestDraftResume);
  }, []);

  useEffect(() => {
    if (!open) {
      handledOpenRef.current = false;
      setInitialized(false);
      setShowCancelConfirmation(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open || !initialized || routeStep === 'start') return undefined;
    return useNewInspectionDraftStore.subscribe((state) => saveNewInspectionDraftSnapshot(state));
  }, [initialized, open, routeStep]);

  function routeManualDraft(nextDraft: NewInspectionDraft) {
    if (!nextDraft.areaId || !nextDraft.sectorId) {
      goToIdentification();
      return;
    }
    if (!nextDraft.inspectionTypeSelected || (!nextDraft.findingTypeId && !nextDraft.templateId)) {
      goToType();
      return;
    }
    if (nextDraft.inspectionType === InspectionType.ENVIRONMENTAL) {
      if (nextDraft.findingObservations.length > 0 && nextDraft.findingCompanyId && nextDraft.findingResponsibleIds.length > 0) {
        goToSummary();
        return;
      }
      goToFindingObservations();
      return;
    }
    if (Object.keys(nextDraft.answersByItemId).length > 0 && nextDraft.findingCompanyId && nextDraft.findingResponsibleIds.length > 0) {
      goToSummary();
      return;
    }
    goToChecklistObservations();
  }

  function resetDraftForInspector() {
    resetDraft();
    setInspector(inspectorName, inspectorCompanyName);
  }

  useEffect(() => {
    if (!open || handledOpenRef.current || !user || assignmentScopeQuery.isLoading) return;
    handledOpenRef.current = true;
    const snapshot = loadNewInspectionDraftSnapshot();
    const shouldResumeDraft = resumeDraftOnOpenRef.current || shouldResumeStoredDraft();
    setResumeAssistantDraft(false);
    if (shouldResumeDraft && snapshot) {
      const nextDraft = {
        ...normalizeDraftForResume(snapshot.draft),
        inspectorName,
        inspectorCompanyName,
      };
      resumeDraftOnOpenRef.current = false;
      clearResumeStoredDraft();
      activateNewInspectionDraftSnapshot(snapshot.id);
      hydrateDraft(nextDraft);
      saveNewInspectionDraftSnapshot(nextDraft);
      submitMutation.reset();
      if (nextDraft.flowMode === 'assistant') {
        setResumeAssistantDraft(true);
        goToAssistantChat();
        setInitialized(true);
        return;
      }
      routeManualDraft(nextDraft);
      setInitialized(true);
      return;
    }
    resumeDraftOnOpenRef.current = false;
    clearResumeStoredDraft();
    clearActiveNewInspectionDraftSession();
    resetFlow();
    resetDraftForInspector();
    submitMutation.reset();
    goToStart();
    setInitialized(true);
  }, [
    assignmentScopeQuery.isLoading,
    goToAssistantChat,
    goToStart,
    hydrateDraft,
    inspectorCompanyName,
    inspectorName,
    open,
    resetDraft,
    resetFlow,
    setInspector,
    user,
  ]);

  function discardActiveDraft() {
    clearNewInspectionDraftSnapshot();
    clearResumeStoredDraft();
  }

  function handleClose() {
    if (routeStep !== 'start' || draft.flowMode !== null) discardActiveDraft();
    else clearResumeStoredDraft();
    onClose();
    resetFlow();
    resetDraft();
    submitMutation.reset();
  }

  function handleRequestCancelInspection() {
    setShowCancelConfirmation(true);
  }

  function handleReturnToInspection() {
    setShowCancelConfirmation(false);
  }

  function handleConfirmCancelInspection() {
    setShowCancelConfirmation(false);
    handleClose();
  }

  function handleAssistantBack() {
    if (resumeAssistantDraft) {
      discardActiveDraft();
      setResumeAssistantDraft(false);
      resetDraftForInspector();
      submitMutation.reset();
      goToStart();
      return;
    }
    goToStart();
  }

  function handleCreateAnother() {
    discardActiveDraft();
    resetDraftForInspector();
    submitMutation.reset();
    setResumeAssistantDraft(false);
    goToStart();
  }

  function handleStartAssistant() {
    clearResumeStoredDraft();
    beginNewInspectionDraftSession();
    resetDraftForInspector();
    setFlowMode('assistant');
    submitMutation.reset();
    setResumeAssistantDraft(false);
    goToAssistantChat();
  }

  function handleStartManual() {
    clearResumeStoredDraft();
    beginNewInspectionDraftSession();
    resetDraftForInspector();
    setFlowMode('manual');
    submitMutation.reset();
    setResumeAssistantDraft(false);
    goToIdentification();
  }

  function handleTypeNext() {
    if (selectedInspectionType === InspectionType.ENVIRONMENTAL) {
      goToFindingObservations();
      return;
    }
    goToChecklistObservations();
  }

  function handleSave() {
    submitMutation.mutate(draft, {
      onSuccess: () => {
        discardActiveDraft();
        setResumeAssistantDraft(false);
        goToSaved();
      },
    });
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1000] bg-[rgba(0,0,0,0.68)]">
      <div className="flex h-full w-full items-center justify-end px-[20px] py-[16px]">
        <div className="new-inspection-modal-panel relative flex h-[calc(100vh-32px)] max-h-[920px] w-[360px] max-w-[calc(100vw-40px)] flex-col overflow-hidden rounded-[22px] bg-white shadow-[0_24px_70px_rgba(0,0,0,0.35)]">
          {!initialized ? null : null}
          {initialized && routeStep === 'start' ? (
            <StartStep
              onStartAssistant={handleStartAssistant}
              onStartManual={handleStartManual}
              onCancelInspection={handleRequestCancelInspection}
            />
          ) : null}

          {initialized && routeStep === 'assistant-chat' ? (
            <AssistantChatStep
              onBack={handleAssistantBack}
              onSave={handleSave}
              onCancelInspection={handleRequestCancelInspection}
              saving={submitMutation.isPending}
              errorMessage={submitMutation.error instanceof Error ? submitMutation.error.message : null}
              resumeFromDraft={resumeAssistantDraft}
            />
          ) : null}

          {initialized && routeStep === 'identification' ? (
            <IdentificationStep onCancel={handleRequestCancelInspection} onNext={goToType} />
          ) : null}

          {initialized && routeStep === 'type' ? <TypeStep onBack={goToIdentification} onNext={handleTypeNext} /> : null}

          {initialized && routeStep === 'observations-finding' ? (
            <FindingObservationsStep onBack={goToType} onNext={goToSummary} />
          ) : null}

          {initialized && routeStep === 'observations-checklist' ? (
            <ChecklistObservationsStep onBack={goToType} onNext={goToSummary} />
          ) : null}

          {initialized && routeStep === 'summary' ? (
            <SummaryStep
              onBack={selectedInspectionType === InspectionType.ENVIRONMENTAL ? goToFindingObservations : goToChecklistObservations}
              onSave={handleSave}
              saving={submitMutation.isPending}
              errorMessage={submitMutation.error instanceof Error ? submitMutation.error.message : null}
            />
          ) : null}

          {initialized && routeStep === 'saved' ? <SavedStep onClose={handleClose} onCreateAnother={handleCreateAnother} /> : null}

          {showCancelConfirmation ? <CancelInspectionConfirmationDialog onConfirm={handleConfirmCancelInspection} onReturn={handleReturnToInspection} /> : null}
        </div>
      </div>
    </div>
  );
}
