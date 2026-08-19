import { useEffect, type ComponentProps } from 'react';
import { clearNewInspectionDraftSnapshot, useNewInspectionDraftStore, type NewInspectionCorrectiveActionSource, type NewInspectionFindingObservationDraft } from '../state/newInspectionDraft.store';
import { AssistantChatStep as AssistantChatStepV7 } from './AssistantChatStepV7';

type AssistantChatStepProps = ComponentProps<typeof AssistantChatStepV7>;

type StoreApiPatch = typeof useNewInspectionDraftStore & {
  setState: (state: Partial<ReturnType<typeof useNewInspectionDraftStore.getState>>) => void;
  __aureliaAiSourcePatch?: boolean;
};

function correctiveActionSourceFromStack(): NewInspectionCorrectiveActionSource {
  const stack = new Error().stack ?? '';
  if (stack.includes('acceptAiMeasure')) return 'ai';
  if (stack.includes('handleFindingMeasure')) return 'manual';
  return 'manual';
}

function applyAiSourcePatch() {
  const store = useNewInspectionDraftStore as StoreApiPatch;
  if (store.__aureliaAiSourcePatch) return;
  const originalUpdate = store.getState().updateFindingObservation;
  store.setState({
    updateFindingObservation: (id, patch) => {
      const nextPatch: Partial<Omit<NewInspectionFindingObservationDraft, 'id'>> = { ...patch };
      if ('correctiveAction' in patch && !('correctiveActionSource' in patch)) {
        nextPatch.correctiveActionSource = correctiveActionSourceFromStack();
      }
      originalUpdate(id, nextPatch);
    },
  });
  store.__aureliaAiSourcePatch = true;
}

function syncAiBadges() {
  const savedObservations = useNewInspectionDraftStore.getState().findingObservations.filter((item) => item.saved);
  const badges = Array.from(document.querySelectorAll('.new-inspection-modal-panel span')).filter((node) => node.textContent?.trim() === 'IA') as HTMLElement[];
  badges.forEach((badge, index) => {
    const observation = savedObservations[index];
    badge.style.display = observation?.correctiveActionSource === 'ai' ? '' : 'none';
  });
}

function scheduleAiBadgeSync() {
  window.setTimeout(syncAiBadges, 0);
  window.setTimeout(syncAiBadges, 120);
  window.setTimeout(syncAiBadges, 360);
  window.setTimeout(syncAiBadges, 720);
}

export function AssistantChatStep(props: AssistantChatStepProps) {
  applyAiSourcePatch();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const state = useNewInspectionDraftStore.getState();
      if (!props.resumeFromDraft && state.flowMode !== 'assistant') state.setFlowMode('assistant');
    }, 0);
    return () => window.clearTimeout(timer);
  }, [props.resumeFromDraft]);

  useEffect(() => {
    scheduleAiBadgeSync();
    const unsubscribe = useNewInspectionDraftStore.subscribe(scheduleAiBadgeSync);
    return unsubscribe;
  }, []);

  function handleCancelInspection() {
    clearNewInspectionDraftSnapshot();
    props.onCancelInspection();
  }

  return <AssistantChatStepV7 {...props} onCancelInspection={handleCancelInspection} />;
}
