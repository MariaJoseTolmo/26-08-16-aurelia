import { useEffect } from 'react';
import { useMobileInspectionAssignmentScope } from '../../../shared/stores/mobileInspectionAssignmentScope.store';
import { useMobileSession } from '../../auth/mobileSession.store';
import { useManualInspectionDraft } from '../manualInspection.store';
import { useManualInspectionFlowStore } from '../manualInspectionFlow.store';
import { saveManualInspectionDraftSnapshot } from '../manualInspectionDrafts.storage';

function shouldPersistDraft(payload: ReturnType<typeof useManualInspectionDraft.getState>): boolean {
  return Boolean(
    payload.areaId ||
    payload.sectorId ||
    payload.locationCaptured ||
    payload.findingObservations.length > 0 ||
    payload.templateId ||
    Object.keys(payload.answersByItemId).length > 0,
  );
}

export function usePersistManualInspectionDraft() {
  const draft = useManualInspectionDraft();
  const user = useMobileSession((state) => state.user);
  const setDraftId = useManualInspectionDraft((state) => state.setDraftId);
  const setInspectorIdentity = useManualInspectionDraft((state) => state.setInspectorIdentity);
  const setFindingCompany = useManualInspectionDraft((state) => state.setFindingCompany);
  const currentStep = useManualInspectionFlowStore((state) => state.currentStep);
  const scopeLoaded = useMobileInspectionAssignmentScope((state) => state.loaded);
  const canSelectCompany = useMobileInspectionAssignmentScope((state) => state.canSelectCompany);
  const assignedCompanyId = useMobileInspectionAssignmentScope((state) => state.companyId);
  const assignedCompanyName = useMobileInspectionAssignmentScope((state) => state.companyName);
  const inspectorCompanyName = useMobileInspectionAssignmentScope((state) => state.inspectorCompanyName);
  const hydrateScope = useMobileInspectionAssignmentScope((state) => state.hydrate);

  useEffect(() => {
    void hydrateScope(user);
  }, [hydrateScope, user]);

  useEffect(() => {
    if (!scopeLoaded || !user) return;
    const resolvedInspectorCompanyName = inspectorCompanyName ?? user.companyName ?? 'Sin empresa';
    if (draft.inspectorName !== user.fullName || draft.inspectorCompanyName !== resolvedInspectorCompanyName) {
      setInspectorIdentity(user.fullName, resolvedInspectorCompanyName);
    }
    if (!canSelectCompany && assignedCompanyId && assignedCompanyName && draft.findingCompanyId !== assignedCompanyId) {
      setFindingCompany(assignedCompanyId, assignedCompanyName);
    }
  }, [assignedCompanyId, assignedCompanyName, canSelectCompany, draft.findingCompanyId, draft.inspectorCompanyName, draft.inspectorName, inspectorCompanyName, scopeLoaded, setFindingCompany, setInspectorIdentity, user]);

  useEffect(() => {
    if (!shouldPersistDraft(draft)) return;

    const timeoutId = setTimeout(() => {
      void saveManualInspectionDraftSnapshot({ draftId: draft.draftId, mode: 'manual', draft, currentStep }).then((saved) => {
        if (!draft.draftId) setDraftId(saved.draftId);
      });
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [currentStep, draft, setDraftId]);
}
