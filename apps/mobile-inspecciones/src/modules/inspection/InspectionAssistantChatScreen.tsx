import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getMobileBootstrapLocalFirst } from '../../shared/offline/local-catalogs';
import { localStorageDriver } from '../../shared/storage/local-storage';
import { useMobileInspectionAssignmentScope } from '../../shared/stores/mobileInspectionAssignmentScope.store';
import { useMobileSession } from '../auth/mobileSession.store';
import { InspectionChatScreenV2 } from './InspectionChatScreenV2';
import {
  getActiveManualInspectionDraftId,
  getManualInspectionDraftById,
} from './manualInspectionDrafts.storage';
import { useManualInspectionDraft } from './manualInspection.store';

const CHAT_STATE_KEY = 'inspection_chat_session:v1';

type PersistedChatMessage = {
  t?: string;
  data?: unknown;
};

type PersistedChatState = {
  draftId?: string;
  messages?: PersistedChatMessage[];
};

function hasAreaChoices(snapshot: PersistedChatState | null) {
  return snapshot?.messages?.some((message) => (
    message.t === 'areas'
    && Array.isArray(message.data)
    && message.data.length > 0
  )) ?? false;
}

function hasResumeControl(snapshot: PersistedChatState | null) {
  return snapshot?.messages?.some((message) => (
    message.t === 'resume' || message.t === 'resumeDraftPick'
  )) ?? false;
}

function hasAreaPrompt(snapshot: PersistedChatState | null) {
  return snapshot?.messages?.some((message) => {
    if (message.t !== 'bot' || typeof message.data !== 'string') return false;
    const text = message.data
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
    return text.includes('area') && (text.includes('hoy') || text.includes('estas'));
  }) ?? false;
}

function isBrokenInitialAreaSnapshot(snapshot: PersistedChatState | null) {
  const messages = snapshot?.messages ?? [];
  if (messages.length === 0 || hasResumeControl(snapshot)) return false;
  return hasAreaPrompt(snapshot) && !hasAreaChoices(snapshot);
}

async function repairBrokenInitialAreaSession() {
  const activeDraftId = await getActiveManualInspectionDraftId();
  if (!activeDraftId) return;

  const draftRecord = await getManualInspectionDraftById(activeDraftId);
  if (!draftRecord || draftRecord.status !== 'IN_PROGRESS' || draftRecord.draft.areaId) return;

  const scopedKey = `${CHAT_STATE_KEY}:${activeDraftId}`;
  const scopedSnapshot = await localStorageDriver.get<PersistedChatState>(scopedKey);
  const legacySnapshot = await localStorageDriver.get<PersistedChatState>(CHAT_STATE_KEY);

  if (isBrokenInitialAreaSnapshot(scopedSnapshot)) {
    await localStorageDriver.remove(scopedKey);
  }

  const legacyBelongsToActiveDraft = !legacySnapshot?.draftId || legacySnapshot.draftId === activeDraftId;
  if (legacyBelongsToActiveDraft && isBrokenInitialAreaSnapshot(legacySnapshot)) {
    await localStorageDriver.remove(CHAT_STATE_KEY);
  }
}

export function InspectionAssistantChatScreen() {
  const queryClient = useQueryClient();
  const user = useMobileSession((state) => state.user);
  const loaded = useMobileInspectionAssignmentScope((state) => state.loaded);
  const inspectorCompanyName = useMobileInspectionAssignmentScope((state) => state.inspectorCompanyName);
  const hydrate = useMobileInspectionAssignmentScope((state) => state.hydrate);
  const setInspectorIdentity = useManualInspectionDraft((state) => state.setInspectorIdentity);
  const [chatReady, setChatReady] = React.useState(false);

  React.useEffect(() => {
    void hydrate(user);
  }, [hydrate, user]);

  React.useEffect(() => {
    if (!loaded || !user) {
      setChatReady(false);
      return undefined;
    }

    let active = true;
    setChatReady(false);
    setInspectorIdentity(user.fullName, inspectorCompanyName ?? user.companyName ?? 'Sin empresa');

    async function prepareChat() {
      // Online refresca el bootstrap; offline utiliza el último catálogo local.
      // Así la primera pregunta nunca depende de una llamada separada a áreas.
      const bootstrap = await getMobileBootstrapLocalFirst();
      queryClient.setQueryData(['areas'], bootstrap.catalogs.areas);
      queryClient.setQueryData(['inspection-types'], bootstrap.catalogs.inspectionTypes);
      queryClient.setQueryData(['finding-types'], bootstrap.catalogs.findingTypes);
      queryClient.setQueryData(['finding-severities'], bootstrap.catalogs.findingSeverities);
      queryClient.setQueryData(['responsible-companies-checklist'], bootstrap.catalogs.companies);
      queryClient.setQueryData(['responsible-companies-finding'], bootstrap.catalogs.companies);

      bootstrap.catalogs.areas.forEach((area) => {
        const sectors = bootstrap.catalogs.sectors.filter((sector) => (
          (sector as { areaId?: string | null }).areaId === area.id
        ));
        if (sectors.length > 0) queryClient.setQueryData(['sectors', area.id], sectors);
      });

      await repairBrokenInitialAreaSession();
      if (active) setChatReady(true);
    }

    void prepareChat().catch(() => {
      // InspectionChatScreenV2 mantiene su carga online y el botón Reintentar.
      // Si el bootstrap completo falla, no dejamos bloqueada la navegación.
      if (active) setChatReady(true);
    });

    return () => {
      active = false;
    };
  }, [inspectorCompanyName, loaded, queryClient, setInspectorIdentity, user]);

  if (!loaded || !user || !chatReady) return null;
  return <InspectionChatScreenV2 />;
}
