import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import {
  InspectionAnswerValue,
  InspectionType,
  type CompanyResponse,
  type InspectionChecklistItem,
  type InspectionChecklistTemplateResponse,
  type InspectionFindingSeverityResponse,
  type InspectionFindingTypeResponse,
  type UserResponse,
} from '@aurelia/contracts';
import { BotBubble } from '../../shared/components/chat/BotBubble';
import { UserBubble } from '../../shared/components/chat/UserBubble';
import { TypingIndicator } from '../../shared/components/chat/TypingIndicator';
import { ChipRow } from '../../shared/components/chat/ChipRow';
import { QuickOpts } from '../../shared/components/chat/QuickOpts';
import { CompanySuggestionCard } from '../../shared/components/chat/CompanySuggestionCard';
import { PersonnelPicker } from '../../shared/components/chat/PersonnelPicker';
import { PhotoStepWidget } from '../../shared/components/chat/PhotoStepWidget';
import { ErrorBubble } from '../../shared/components/chat/ErrorBubble';
import { ChatLocationWidget } from '../../shared/components/chat/ChatLocationWidget';
import { AiProposalCard } from '../../shared/components/chat/AiProposalCard';
import { SlaConfirmWidget } from '../../shared/components/chat/SlaConfirmWidget';
import { ChatHeader } from '../../shared/components/layout/ChatHeader';
import { ChatInput } from '../../shared/components/layout/ChatInput';
import { getMobileBootstrapLocalFirst } from '../../shared/offline/local-catalogs';
import { localStorageDriver } from '../../shared/storage/local-storage';
import { colors, fontSize, fontWeight, radius, spacing } from '../../shared/theme/tokens';
import { fetchAreas, fetchSectors, type AreaResponse, type SectorResponse } from '../../shared/services/api/organization.api';
import { fetchInspectionTypes, type InspectionTypeResponse } from '../../shared/services/api/inspection-types.api';
import {
  fetchInspectionFindingSeveritiesLocalFirst,
  fetchInspectionFindingTypesLocalFirst,
} from '../../shared/services/api/inspection-finding-catalogs.api';
import {
  fetchResponsibleCompaniesLocalFirst,
  fetchResponsibleUsersLocalFirst,
} from '../../shared/services/api/inspection-responsibles.api';
import { suggestCompany, suggestCorrectiveMeasure } from '../../shared/services/api/ai.api';
import { useManualConnectivityStatus } from './useManualConnectivityStatus';
import { useManualInspectionDraft } from './manualInspection.store';
import { useManualInspectionLocation } from './useManualInspectionLocation';
import { useInspectionChecklistTemplates } from './hooks/useInspectionChecklistTemplates';
import { useSaveManualInspectionOffline } from './hooks/useSaveManualInspectionOffline';
import { useSaveManualFindingInspectionOffline } from './hooks/useSaveManualFindingInspectionOffline';
import {
  getActiveManualInspectionDraftId,
  listIncompleteManualInspectionDrafts,
  getManualInspectionDraftById,
  markManualInspectionDraftCompleted,
  removeManualInspectionDraft,
  saveManualInspectionDraftSnapshot,
} from './manualInspectionDrafts.storage';
import type { ManualFindingObservationDraft } from './manualInspection.store';
import type { PersistedManualInspectionDraft } from './manualInspectionDrafts.storage';

type Row = InspectionChecklistItem & { index: number; sectionTitle: string };
type MsgType =
  | 'bot'
  | 'user'
  | 'typing'
  | 'error'
  | 'resume'
  | 'resumeDraftPick'
  | 'areas'
  | 'sectors'
  | 'types'
  | 'dates'
  | 'loc'
  | 'templatePick'
  | 'templates'
  | 'generalPhoto'
  | 'question'
  | 'itemPhoto'
  | 'findingTypes'
  | 'findingPhoto'
  | 'aiMeasure'
  | 'criticality'
  | 'sla'
  | 'findingNext'
  | 'companyPick'
  | 'companies'
  | 'people'
  | 'summary';

type Msg = { id: string; t: MsgType; data?: unknown };

interface AiMeasureData {
  observationId: string;
  suggestion: string;
  fallback: boolean;
}

interface CriticalityData {
  observationId: string;
  severities: InspectionFindingSeverityResponse[];
}

interface SlaData {
  observationId: string;
  initialDays: number;
}

interface FindingNextData {
  observationId: string;
}

interface CompanyPickData {
  companies: CompanyResponse[];
  company: CompanyResponse;
  reason: string;
}

interface PeopleData {
  users: UserResponse[];
  suggestedUserId: string | null;
}

interface ResumeDraftPickData {
  drafts: Array<{ id: string; label: string }>;
}

const areaKey = ['areas'] as const;
const typeKey = ['inspection-types'] as const;
const findingTypeKey = ['finding-types'] as const;
const findingSeverityKey = ['finding-severities'] as const;
const sectorKey = (id: string) => ['sectors', id] as const;
const peopleKey = (id: string) => ['responsibles', id] as const;
const CHAT_STATE_KEY = 'inspection_chat_session:v1';

let sequence = 0;

function nextId() {
  sequence += 1;
  return String(sequence);
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function dateText(d: Date) {
  return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
}

function dates() {
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date();
    day.setDate(day.getDate() - i);
    return dateText(day);
  });
}

function rowsOf(template: InspectionChecklistTemplateResponse | null): Row[] {
  if (!template) return [];
  return template.sections
    .slice()
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .flatMap((section) => section.items
      .slice()
      .sort((left, right) => left.sortOrder - right.sortOrder)
      .map((item) => ({ ...item, sectionTitle: section.title, index: 0 })))
    .map((item, index) => ({ ...item, index }));
}

function checklistTypeId(types: InspectionTypeResponse[]) {
  return types.find((item) => item.code === InspectionType.REGULATORY)?.id ?? null;
}

function asset(uri: string, fallbackName: string) {
  const name = uri.split('/').pop();
  return {
    uri,
    name: name && name.includes('.') ? name : fallbackName,
  };
}

function answerLabel(value?: InspectionAnswerValue) {
  if (value === InspectionAnswerValue.COMPLIANT) return 'SÍ';
  if (value === InspectionAnswerValue.NOT_COMPLIANT) return 'NO';
  if (value === InspectionAnswerValue.NOT_APPLICABLE) return 'N/A';
  return 'Pendiente';
}

function defaultSlaLabel(days: number) {
  return `${days} Días`;
}

function nowTimeLabel() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

function photoReceiptMeta(fileName: string) {
  return `${fileName} · GPS ✓ · ${nowTimeLabel()}`;
}

function suggestResponsibleUser(
  users: Array<{ id: string; position?: string | null }>,
) {
  const supervisor = users.find((user) => (user.position ?? '').toLowerCase().includes('supervisor'));
  return supervisor ?? users[0] ?? null;
}

function parseSlaDays(label: string | null | undefined, fallback = 7): number {
  if (!label) return fallback;
  const value = Number(label.match(/(\d+)/)?.[1]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function shouldPersistDraft(draft: ReturnType<typeof useManualInspectionDraft.getState>) {
  return Boolean(
    draft.areaId ||
    draft.sectorId ||
    draft.locationCaptured ||
    draft.findingObservations.length > 0 ||
    draft.templateId ||
    Object.keys(draft.answersByItemId).length > 0 ||
    draft.findingCompanyId ||
    draft.findingResponsibleIds.length > 0,
  );
}

interface PersistedChatState {
  draftId: string;
  messages: Msg[];
  resolvedMessageIds: string[];
  confirmedPeopleMessageIds: string[];
  photoReceiptByMessageId: Record<string, { title: string; sub: string }>;
  waiting: string | null;
  step: number;
}

function chatStateKey(draftId: string) {
  return `${CHAT_STATE_KEY}:${draftId}`;
}

function syncMessageSequence(messages: Msg[]) {
  const maxId = messages.reduce((max, message) => {
    const parsed = Number(message.id);
    return Number.isFinite(parsed) ? Math.max(max, parsed) : max;
  }, 0);
  if (maxId > sequence) sequence = maxId;
}

function draftLabel(record: PersistedManualInspectionDraft) {
  const type = record.draft.findingTypeLabel ?? record.draft.inspectionTypeLabel;
  const area = record.draft.areaName ?? 'Sin área';
  return `${type} · ${area}`;
}

export function InspectionChatScreenV2() {
  const draft = useManualInspectionDraft();
  const queryClient = useQueryClient();
  const scrollRef = useRef<ScrollView>(null);
  const retries = useRef<Map<string, () => void>>(new Map());
  const loadedUsersByCompany = useRef<Map<string, Array<{ id: string; fullName: string }>>>(new Map());

  const [messages, setMessages] = useState<Msg[]>([]);
  const [resolvedMessages, setResolvedMessages] = useState<Set<string>>(new Set());
  const [confirmedPeople, setConfirmedPeople] = useState<Set<string>>(new Set());
  const [photoReceiptByMessageId, setPhotoReceiptByMessageId] = useState<Record<string, { title: string; sub: string }>>({});
  const [availableDrafts, setAvailableDrafts] = useState<PersistedManualInspectionDraft[]>([]);
  const [selectedResumeDraftId, setSelectedResumeDraftId] = useState<string | null>(null);
  const [waiting, setWaiting] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [booted, setBooted] = useState(false);
  const [resuming, setResuming] = useState(false);

  const { online, hasSession } = useManualConnectivityStatus();
  const { captureLocation, capturing, locationError } = useManualInspectionLocation();
  const templatesQuery = useInspectionChecklistTemplates();
  const checklistSave = useSaveManualInspectionOffline();
  const findingSave = useSaveManualFindingInspectionOffline();

  const templates = templatesQuery.data ?? [];
  const activeTemplate = useMemo(
    () => templates.find((item) => item.id === draft.templateId) ?? null,
    [templates, draft.templateId],
  );
  const checklistRows = useMemo(() => rowsOf(activeTemplate), [activeTemplate]);

  const saving = checklistSave.isPending || findingSave.isPending;
  const activeSummaryMessage = useMemo(
    () => [...messages].reverse().find((message) => message.t === 'summary') ?? null,
    [messages],
  );

  function push(type: MsgType, data?: unknown) {
    const message = { id: nextId(), t: type, data };
    setMessages((prev) => [...prev, message]);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    return message.id;
  }

  function clearTyping() {
    setMessages((prev) => prev.filter((message) => message.t !== 'typing'));
  }

  function markResolved(messageId: string) {
    setResolvedMessages((prev) => new Set(prev).add(messageId));
  }

  function pushError(message: string, retry?: () => void) {
    const messageId = push('error', { message });
    if (retry) retries.current.set(messageId, retry);
  }

  async function persistDraft(stepValue: number, waitingValue: string | null) {
    const state = useManualInspectionDraft.getState();
    if (!shouldPersistDraft(state)) return;

    const saved = await saveManualInspectionDraftSnapshot({
      draftId: state.draftId,
      mode: 'chat',
      draft: state,
      currentStep: Math.max(1, Math.min(stepValue + 1, 6)),
    });

    if (state.draftId !== saved.draftId) {
      useManualInspectionDraft.getState().setDraftId(saved.draftId);
      setSelectedResumeDraftId(saved.draftId);
    }

    const draftId = saved.draftId;
    const persistedChatState: PersistedChatState = {
      draftId,
      messages,
      resolvedMessageIds: Array.from(resolvedMessages),
      confirmedPeopleMessageIds: Array.from(confirmedPeople),
      photoReceiptByMessageId,
      waiting: waitingValue,
      step: stepValue,
    };
    await localStorageDriver.set(chatStateKey(draftId), persistedChatState);
  }

  useEffect(() => {
    if (!booted) return;
    const timer = setTimeout(() => {
      void persistDraft(step, waiting);
    }, 250);
    return () => clearTimeout(timer);
  }, [draft, step, waiting, booted, messages, resolvedMessages, confirmedPeople, photoReceiptByMessageId]);

  useEffect(() => {
    async function bootstrap() {
      if (booted || resuming) return;
      setResuming(true);

      const drafts = await listIncompleteManualInspectionDrafts();
      if (drafts.length > 0) {
        const activeDraftId = await getActiveManualInspectionDraftId();
        const ordered = activeDraftId
          ? [
            ...drafts.filter((item) => item.draftId === activeDraftId),
            ...drafts.filter((item) => item.draftId !== activeDraftId),
          ]
          : drafts;

        setAvailableDrafts(ordered);
        setSelectedResumeDraftId(ordered[0]?.draftId ?? null);
        push('bot', 'Encontré un borrador en curso. ¿Deseas continuar donde quedaste o iniciar un chat nuevo?');
        push('resume', null);
        setBooted(true);
        setResuming(false);
        return;
      }

      startFresh();
      setBooted(true);
      setResuming(false);
    }

    void bootstrap();
  }, [booted, resuming]);

  function startFresh() {
    retries.current.clear();
    useManualInspectionDraft.getState().reset();
    setAvailableDrafts([]);
    setSelectedResumeDraftId(null);
    setMessages([]);
    setResolvedMessages(new Set());
    setConfirmedPeople(new Set());
    setPhotoReceiptByMessageId({});
    setWaiting(null);
    setStep(0);
    void beginAreaSelection();
  }

  async function continueWithDraftId(draftId: string) {
    const persisted = await getManualInspectionDraftById(draftId);
    if (!persisted || persisted.status !== 'IN_PROGRESS') {
      pushError('El borrador seleccionado ya no está disponible.');
      return;
    }

    setSelectedResumeDraftId(draftId);
    useManualInspectionDraft.getState().hydrate(persisted.draft);

    const stateByDraft = await localStorageDriver.get<PersistedChatState>(chatStateKey(draftId));
    const legacy = await localStorageDriver.get<PersistedChatState>(CHAT_STATE_KEY);
    const snapshot = stateByDraft
      ?? ((legacy?.draftId === draftId || (!legacy?.draftId && availableDrafts.length <= 1)) ? legacy : null);

    if (snapshot && snapshot.messages.length > 0) {
      syncMessageSequence(snapshot.messages);
      setMessages(snapshot.messages);
      setResolvedMessages(new Set(snapshot.resolvedMessageIds));
      setConfirmedPeople(new Set(snapshot.confirmedPeopleMessageIds));
      setPhotoReceiptByMessageId(snapshot.photoReceiptByMessageId ?? {});
      setStep(snapshot.step);
      setWaiting(snapshot.waiting);
      return;
    }

    setStep(Math.max(0, persisted.currentStep - 1));
    setWaiting(null);
    await continueFromDraft();
  }

  async function handleResumeRequest() {
    if (availableDrafts.length > 1) {
      push('bot', 'Tienes más de un borrador. ¿Cuál deseas continuar?');
      push('resumeDraftPick', {
        drafts: availableDrafts.map((draftRecord) => ({ id: draftRecord.draftId, label: draftLabel(draftRecord) })),
      } as ResumeDraftPickData);
      return;
    }

    const selected = selectedResumeDraftId ?? availableDrafts[0]?.draftId;
    if (!selected) {
      startFresh();
      return;
    }
    await continueWithDraftId(selected);
  }

  async function continueFromDraft() {
    const state = useManualInspectionDraft.getState();
    if (!state.areaId) {
      await beginAreaSelection();
      return;
    }

    if (!state.sectorId) {
      await beginSectorSelection(state.areaId);
      return;
    }

    if (!state.inspectionDateSelected) {
      setStep(0);
      push('bot', 'Selecciona la fecha de inspección.');
      push('dates', dates());
      return;
    }

    if (!state.locationCaptured) {
      setStep(0);
      push('bot', 'Capturemos la ubicación obligatoria.');
      push('loc');
      return;
    }

    if (state.inspectionType === InspectionType.ENVIRONMENTAL) {
      await continueFindingFromDraft();
      return;
    }

    await continueChecklistFromDraft();
  }

  async function continueChecklistFromDraft() {
    const state = useManualInspectionDraft.getState();
    setStep(1);

    if (!state.templateId) {
      await askChecklistTemplate();
      return;
    }

    let template = templates.find((item) => item.id === state.templateId) ?? null;
    if (!template) {
      try {
        const bootstrap = await getMobileBootstrapLocalFirst();
        template = bootstrap.catalogs.inspectionTemplates.find((item) => item.id === state.templateId) ?? null;
      } catch {
        template = null;
      }
    }

    if (!template) {
      pushError('No pude recuperar la plantilla guardada. Selecciona una nuevamente.');
      await askChecklistTemplate();
      return;
    }

    const rows = rowsOf(template);

    if (!state.generalPhoto) {
      push('bot', 'Adjunta la foto general obligatoria.');
      push('generalPhoto');
      return;
    }

    const pendingNo = rows.find((row) => {
      if (state.answersByItemId[row.id] !== InspectionAnswerValue.NOT_COMPLIANT) return false;
      const detail = state.detailsByItemId[row.id] ?? {};
      return !detail.detectedCondition?.trim() || !detail.correctiveAction?.trim() || !detail.evidence;
    });

    if (pendingNo) {
      const detail = state.detailsByItemId[pendingNo.id] ?? {};
      if (!detail.detectedCondition?.trim()) {
        push('bot', 'Retomemos el ítem pendiente. Describe la condición detectada.');
        setWaiting(`check-cond:${pendingNo.id}`);
        return;
      }
      if (!detail.correctiveAction?.trim()) {
        push('bot', 'Retomemos el ítem pendiente. Indica la medida correctiva propuesta.');
        setWaiting(`check-measure:${pendingNo.id}`);
        return;
      }
      push('bot', 'Retomemos el ítem pendiente. Adjunta foto para este hallazgo.');
      push('itemPhoto', pendingNo);
      return;
    }

    const next = rows.find((row) => !state.answersByItemId[row.id]);
    if (next) {
      push('bot', `Retomemos: responderemos ${rows.length} ítems.`);
      push('question', next);
      return;
    }

    await finishChecklistItems(rows);
  }

  async function continueFindingFromDraft() {
    const state = useManualInspectionDraft.getState();
    setStep(5);

    if (!state.findingTypeId) {
      await askFindingType();
      return;
    }

    const active = state.findingObservations.find((item) => !item.saved) ?? null;
    if (active) {
      await resumeActiveFindingObservation(active);
      return;
    }

    const saved = state.findingObservations.filter((item) => item.saved);
    if (saved.length === 0) {
      await startFindingObservation();
      return;
    }

    if (!state.findingCompanyId) {
      await askCompanyForFinding();
      return;
    }

    if (state.findingResponsibleIds.length === 0) {
      await askResponsiblePeople(state.findingCompanyId);
      return;
    }

    await showSummary();
  }

  async function resumeActiveFindingObservation(observation: ManualFindingObservationDraft) {
    if (!observation.detectedCondition.trim()) {
      push('bot', 'Retomemos el borrador. Describe la condición detectada.');
      setWaiting(`finding-cond:${observation.id}`);
      return;
    }

    if (!observation.evidence) {
      push('bot', 'Retomemos el borrador. Adjunta la fotografía del hallazgo.');
      push('findingPhoto', { observationId: observation.id });
      return;
    }

    if (!observation.correctiveAction.trim()) {
      push('bot', 'Retomemos el borrador. Escribe o confirma la medida correctiva.');
      setWaiting(`finding-measure:${observation.id}`);
      return;
    }

    if (!observation.severityId) {
      push('bot', 'Retomemos el borrador. Define criticidad para esta observación.');
      push('criticality', { observationId: observation.id });
      return;
    }

    push('bot', 'Retomemos el borrador. Confirma el SLA para esta observación.');
    push('sla', {
      observationId: observation.id,
      initialDays: parseSlaDays(observation.severityClosureTimeLabel, 7),
    } as SlaData);
  }

  async function beginAreaSelection() {
    push('typing');
    try {
      const areas = await queryClient.fetchQuery({
        queryKey: areaKey,
        queryFn: fetchAreas,
        staleTime: 300000,
      });
      clearTyping();
      push('bot', 'Hola, soy AurelIA. ¿En qué área estás hoy?');
      push('areas', areas);
    } catch {
      clearTyping();
      pushError('No pude cargar áreas.', () => {
        void beginAreaSelection();
      });
    }
  }

  async function beginSectorSelection(areaId: string) {
    push('typing');
    try {
      const sectors = await queryClient.fetchQuery({
        queryKey: sectorKey(areaId),
        queryFn: () => fetchSectors(areaId),
        staleTime: 300000,
      });
      clearTyping();
      push('bot', 'Selecciona el sector.');
      push('sectors', sectors);
    } catch {
      clearTyping();
      pushError('No pude cargar sectores.', () => {
        void beginSectorSelection(areaId);
      });
    }
  }

  async function selectArea(area: AreaResponse, messageId: string) {
    markResolved(messageId);
    draft.setArea(area.id, area.name);
    push('user', area.name);
    await beginSectorSelection(area.id);
  }

  async function selectSector(sector: SectorResponse, messageId: string) {
    markResolved(messageId);
    draft.setSector(sector.id, sector.name);
    push('user', sector.name);

    push('typing');
    try {
      const types = await queryClient.fetchQuery({
        queryKey: typeKey,
        queryFn: fetchInspectionTypes,
        staleTime: 300000,
      });
      clearTyping();
      setStep(0);
      push('bot', 'Selecciona el tipo de inspección.');
      push('types', [
        {
          value: InspectionType.ENVIRONMENTAL,
          label: 'Hallazgo',
          icon: 'search',
          inspectionTypeId: types.find((item) => item.code === InspectionType.ENVIRONMENTAL)?.id ?? null,
        },
        {
          value: InspectionType.REGULATORY,
          label: 'Checklist normativo',
          icon: 'clipboard-check',
          inspectionTypeId: checklistTypeId(types),
        },
      ]);
    } catch {
      clearTyping();
      pushError('No pude cargar tipos.', () => {
        void selectSector(sector, messageId);
      });
    }
  }

  async function selectInspectionType(value: InspectionType, inspectionTypeId: string | null, label: string, messageId: string) {
    markResolved(messageId);
    draft.setInspectionType(value, label);
    push('user', label);

    if (!inspectionTypeId) {
      pushError('No se encontró este tipo de inspección en catálogo.');
      return;
    }

    await sleep(200);
    push('bot', 'Selecciona la fecha de inspección.');
    push('dates', dates());
  }

  async function selectInspectionDate(value: string, messageId: string) {
    markResolved(messageId);
    draft.setInspectionDate(value);
    push('user', value);
    await sleep(200);
    push('bot', 'Capturemos la ubicación obligatoria.');
    push('loc');
  }

  async function captureChatLocation(messageId: string) {
    const ok = await captureLocation();
    if (!ok) {
      pushError(locationError ?? 'No se pudo capturar la ubicación.', () => {
        void captureChatLocation(messageId);
      });
      return;
    }

    markResolved(messageId);
    push('user', `Ubicación capturada · ${useManualInspectionDraft.getState().locationAccuracyLabel}`);

    if (useManualInspectionDraft.getState().inspectionType === InspectionType.ENVIRONMENTAL) {
      await askFindingType();
    } else {
      await askChecklistTemplate();
    }
  }

  async function askChecklistTemplate() {
    push('typing');
    try {
      const bootstrap = await getMobileBootstrapLocalFirst();
      const availableTemplates = bootstrap.catalogs.inspectionTemplates;
      clearTyping();

      if (!availableTemplates.length) {
        pushError('No hay plantillas normativas disponibles. Sincroniza catálogos.');
        return;
      }

      setStep(1);
      push('bot', 'Te sugiero esta plantilla normativa.');
      push('templatePick', {
        template: availableTemplates[0],
        templates: availableTemplates,
      });
    } catch {
      clearTyping();
      pushError('No pude cargar plantillas normativas.', () => {
        void askChecklistTemplate();
      });
    }
  }

  async function selectChecklistTemplate(template: InspectionChecklistTemplateResponse, messageId: string) {
    markResolved(messageId);
    draft.setTemplate({
      id: template.id,
      name: template.name,
      code: template.code,
      itemsCount: template.sections.reduce((count, section) => count + section.items.length, 0),
    });
    push('user', template.name);
    await sleep(200);
    push('bot', 'Adjunta la foto general obligatoria.');
    push('generalPhoto');
  }

  function openChecklistTemplates(templatesList: InspectionChecklistTemplateResponse[], messageId: string) {
    markResolved(messageId);
    push('bot', 'Elige una plantilla.');
    push('templates', templatesList);
  }

  async function handleChecklistGeneralPhoto(uri: string, messageId: string) {
    const picked = asset(uri, 'foto_general.jpg');
    setPhotoReceiptByMessageId((prev) => ({
      ...prev,
      [messageId]: {
        title: 'Foto adjunta ✓',
        sub: photoReceiptMeta(picked.name),
      },
    }));
    markResolved(messageId);
    draft.setGeneralPhoto(picked);
    push('user', 'Foto general registrada');

    await sleep(200);
    const state = useManualInspectionDraft.getState();
    const template = templates.find((item) => item.id === state.templateId) ?? null;
    const rows = rowsOf(template);
    const first = rows[0];
    if (!first) {
      pushError('La plantilla seleccionada no tiene ítems.');
      return;
    }

    setStep(1);
    push('bot', `Responderemos ${rows.length} ítems.`);
    push('question', first);
  }

  async function answerChecklistItem(row: Row, value: InspectionAnswerValue, messageId: string) {
    markResolved(messageId);
    draft.setAnswer(row.id, value);
    push('user', `${row.code}: ${answerLabel(value)}`);

    if (value === InspectionAnswerValue.NOT_COMPLIANT) {
      await sleep(200);
      push('bot', 'Describe la condición detectada.');
      setWaiting(`check-cond:${row.id}`);
      return;
    }

    await goToNextChecklistQuestion(row.index);
  }

  async function handleChecklistCondition(text: string, itemId: string) {
    draft.setItemDetail(itemId, { detectedCondition: text });
    push('user', text);
    await sleep(200);
    push('bot', 'Indica la medida correctiva propuesta.');
    setWaiting(`check-measure:${itemId}`);
  }

  async function handleChecklistMeasure(text: string, itemId: string) {
    draft.setItemDetail(itemId, { correctiveAction: text });
    push('user', text);

    const row = checklistRows.find((item) => item.id === itemId);
    if (!row) return;

    await sleep(200);
    push('bot', 'Adjunta foto para este hallazgo.');
    push('itemPhoto', row);
    setWaiting(null);
  }

  async function handleChecklistItemPhoto(uri: string, row: Row, messageId: string) {
    const picked = asset(uri, `foto_obs${row.index + 1}.jpg`);
    setPhotoReceiptByMessageId((prev) => ({
      ...prev,
      [messageId]: {
        title: 'Foto adjunta ✓',
        sub: photoReceiptMeta(picked.name),
      },
    }));
    markResolved(messageId);
    draft.setItemDetail(row.id, { evidence: picked });
    push('user', `Foto registrada · ${row.code}`);
    await goToNextChecklistQuestion(row.index);
  }

  async function goToNextChecklistQuestion(index: number) {
    await sleep(200);
    const template = templates.find((item) => item.id === useManualInspectionDraft.getState().templateId) ?? null;
    const rows = rowsOf(template);
    const next = rows[index + 1];
    if (next) {
      push('question', next);
      return;
    }

    await finishChecklistItems(rows);
  }

  async function finishChecklistItems(rows: Row[]) {
    const state = useManualInspectionDraft.getState();
    const hasFindings = rows.some((row) => state.answersByItemId[row.id] === InspectionAnswerValue.NOT_COMPLIANT);

    if (!hasFindings) {
      setStep(5);
      push('bot', 'Checklist completo sin hallazgos. Se cerrará automáticamente al guardar.');
      await showSummary();
      return;
    }

    setStep(4);
    if (state.findingCompanyId) {
      if (state.findingResponsibleIds.length === 0) {
        await askResponsiblePeople(state.findingCompanyId);
        return;
      }
      await showSummary();
      return;
    }

    push('bot', 'Hay ítems no conformes. Debemos asignar empresa y responsables.');
    await askCompanyForChecklist();
  }

  async function askCompanyForChecklist() {
    push('typing');
    try {
      const companies = await queryClient.fetchQuery({
        queryKey: ['responsible-companies-checklist'],
        queryFn: fetchResponsibleCompaniesLocalFirst,
        staleTime: 300000,
      });
      clearTyping();

      if (!companies.length) {
        pushError('No hay empresas contratistas disponibles en catálogos.');
        return;
      }

      const state = useManualInspectionDraft.getState();
      const normalizeCompany = (value: string) => value
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      let reason = 'Recomendación basada en el área, sector y empresas disponibles.';
      let suggestedCompany = companies[0];

      try {
        const ai = await suggestCompany({
          area: state.areaName ?? '',
          sector: state.sectorName ?? '',
          availableCompanies: companies.map((item) => item.name),
        });
        reason = ai.suggestion;
        const normalizedSuggestion = normalizeCompany(ai.suggestion);
        const match = companies.find((item) => {
          const normalizedName = normalizeCompany(item.name);
          return normalizedSuggestion.includes(normalizedName) || normalizedName.includes(normalizedSuggestion);
        });
        if (match) suggestedCompany = match;
      } catch {
        // Keep the deterministic local-first fallback when AI is unavailable.
      }

      setStep(4);
      push('bot', 'Te sugiero una empresa responsable según el área, sector y empresas disponibles.');
      push('companyPick', { companies, company: suggestedCompany, reason } as CompanyPickData);
    } catch {
      clearTyping();
      pushError('No pude cargar empresas responsables.', () => {
        void askCompanyForChecklist();
      });
    }
  }

  async function askFindingType() {
    push('typing');
    try {
      const findingTypes = await queryClient.fetchQuery({
        queryKey: findingTypeKey,
        queryFn: fetchInspectionFindingTypesLocalFirst,
        staleTime: 300000,
      });
      clearTyping();

      if (!findingTypes.length) {
        pushError('No hay tipos de hallazgo en catálogos.');
        return;
      }

      setStep(1);
      push('bot', 'Selecciona el tipo de hallazgo.');
      push('findingTypes', findingTypes);
    } catch {
      clearTyping();
      pushError('No pude cargar tipos de hallazgo.', () => {
        void askFindingType();
      });
    }
  }

  async function selectFindingType(type: InspectionFindingTypeResponse, messageId: string) {
    markResolved(messageId);
    draft.setFindingType(type.id, type.name);
    push('user', type.name);
    await startFindingObservation();
  }

  async function startFindingObservation() {
    setStep(1);
    const observationId = draft.addFindingObservation();
    await sleep(200);
    push('bot', 'Describe la condición detectada.');
    setWaiting(`finding-cond:${observationId}`);
  }

  async function handleFindingCondition(text: string, observationId: string) {
    draft.updateFindingObservation(observationId, { detectedCondition: text });
    push('user', text);
    await sleep(200);
    push('bot', 'Adjunta fotografía del hallazgo.');
    push('findingPhoto', { observationId });
    setWaiting(null);
  }

  function rejectFindingPhotoSkip() {
    Alert.alert('Foto requerida', 'Para registrar un hallazgo en chat, la evidencia fotográfica es obligatoria.');
  }

  async function handleFindingPhoto(uri: string, observationId: string, messageId: string) {
    const picked = asset(uri, `foto_obs${useManualInspectionDraft.getState().findingObservations.length}.jpg`);
    setPhotoReceiptByMessageId((prev) => ({
      ...prev,
      [messageId]: {
        title: 'Foto adjunta ✓',
        sub: photoReceiptMeta(picked.name),
      },
    }));
    markResolved(messageId);
    draft.updateFindingObservation(observationId, {
      evidence: picked,
    });
    push('user', 'Foto del hallazgo registrada');

    const state = useManualInspectionDraft.getState();
    const observation = state.findingObservations.find((item) => item.id === observationId);
    if (!observation) return;

    push('typing');
    let suggestion = 'Corregir la condición identificada y registrar evidencia de cierre para validación.';
    let fallback = true;

    try {
      const response = await suggestCorrectiveMeasure({
        area: state.areaName ?? '',
        sector: state.sectorName ?? '',
        description: observation.detectedCondition,
      });
      suggestion = response.suggestion;
      fallback = response.fallback;
    } catch {
      // Keep fallback suggestion
    }

    clearTyping();
    push('bot', 'Analicé el contexto del hallazgo. Te propongo una medida correctiva.');
    push('aiMeasure', { observationId, suggestion, fallback } as AiMeasureData);
  }

  async function acceptAiMeasure(messageId: string, data: AiMeasureData) {
    markResolved(messageId);
    draft.updateFindingObservation(data.observationId, {
      correctiveAction: data.suggestion,
      correctiveActionSource: 'ai',
    });
    push('user', '✓ Medida aceptada');
    await askFindingCriticality(data.observationId);
  }

  function editAiMeasure(messageId: string, data: AiMeasureData) {
    markResolved(messageId);
    push('bot', 'Escribe la medida correctiva que aplicarás.');
    setWaiting(`finding-measure:${data.observationId}`);
  }

  async function handleFindingMeasure(text: string, observationId: string) {
    draft.updateFindingObservation(observationId, {
      correctiveAction: text,
      correctiveActionSource: 'manual',
    });
    push('user', text);
    await askFindingCriticality(observationId);
  }

  async function askFindingCriticality(observationId: string) {
    setStep(2);
    let severities: InspectionFindingSeverityResponse[] = [];
    try {
      severities = await queryClient.fetchQuery({
        queryKey: findingSeverityKey,
        queryFn: fetchInspectionFindingSeveritiesLocalFirst,
        staleTime: 300000,
      });
    } catch {
      severities = [];
    }

    if (!severities.length) {
      pushError('No hay criticidades en catálogos para continuar.');
      return;
    }

    await sleep(200);
    push('bot', 'Definamos la criticidad del hallazgo.');
    push('criticality', { observationId, severities } as CriticalityData);
  }

  async function completeFindingCriticality(observationId: string, severity: InspectionFindingSeverityResponse, messageId: string) {
    markResolved(messageId);

    draft.updateFindingObservation(observationId, {
      severityId: severity.id,
      severityLabel: severity.name,
      severityDescription: severity.description,
      severityClosureTimeLabel: severity.closureTimeLabel,
      probability: null,
      consequence: null,
    });

    await sleep(200);
    push('bot', 'Confirma el SLA para esta observación.');
    push('sla', {
      observationId,
      initialDays: parseSlaDays(severity.closureTimeLabel, 7),
    } as SlaData);
  }

  async function saveFindingObservation(messageId: string, data: SlaData, days: number) {
    markResolved(messageId);

    const state = useManualInspectionDraft.getState();
    const target = state.findingObservations.find((item) => item.id === data.observationId);
    if (!target) return;

    if (!target.detectedCondition.trim() || !target.correctiveAction.trim() || !target.evidence || !target.severityId) {
      pushError('La observación está incompleta. Debe incluir condición, medida, foto y criticidad.');
      return;
    }

    draft.updateFindingObservation(data.observationId, {
      severityClosureTimeLabel: defaultSlaLabel(days),
      saved: true,
    });

    push('user', `✓ Observación guardada (SLA ${days} días)`);
    await sleep(200);
    setStep(3);
    push('bot', '¿Deseas agregar otra observación o continuar con empresa y personal?');
    push('findingNext', { observationId: data.observationId } as FindingNextData);
  }

  async function findingDecision(value: 'add' | 'continue', messageId: string) {
    markResolved(messageId);
    if (value === 'add') {
      await startFindingObservation();
      return;
    }

    await askCompanyForFinding();
  }

  async function askCompanyForFinding() {
    push('typing');
    try {
      const companies = await queryClient.fetchQuery({
        queryKey: ['responsible-companies-finding'],
        queryFn: fetchResponsibleCompaniesLocalFirst,
        staleTime: 300000,
      });
      clearTyping();

      if (!companies.length) {
        pushError('No hay empresas contratistas disponibles en catálogos.');
        return;
      }

      const state = useManualInspectionDraft.getState();
      let reason = 'Recomendación basada en historial operativo de la faena.';
      let suggestedCompany = companies[0];

      try {
        const ai = await suggestCompany({
          area: state.areaName ?? '',
          sector: state.sectorName ?? '',
          availableCompanies: companies.map((item) => item.name),
        });
        reason = ai.suggestion;

        const match = companies.find((item) => ai.suggestion.toLowerCase().includes(item.name.toLowerCase()));
        if (match) suggestedCompany = match;
      } catch {
        // Keep default suggestion when AI is unavailable.
      }

      setStep(4);
      push('bot', 'Te sugiero una empresa responsable para este hallazgo.');
      push('companyPick', { companies, company: suggestedCompany, reason } as CompanyPickData);
    } catch {
      clearTyping();
      pushError('No pude cargar empresas responsables.', () => {
        void askCompanyForFinding();
      });
    }
  }

  function openCompanyList(messageId: string, companies: CompanyPickData['companies']) {
    markResolved(messageId);
    push('bot', 'Selecciona empresa responsable.');
    push('companies', companies);
  }

  async function selectCompany(company: CompanyResponse, messageId: string) {
    markResolved(messageId);
    draft.setFindingCompany(company.id, company.name);
    push('user', `${company.name} confirmada`);
    await askResponsiblePeople(company.id);
  }

  async function askResponsiblePeople(companyId: string) {
    push('typing');
    try {
      const users = await queryClient.fetchQuery({
        queryKey: peopleKey(companyId),
        queryFn: () => fetchResponsibleUsersLocalFirst(companyId),
        staleTime: 300000,
      });
      loadedUsersByCompany.current.set(companyId, users.map((item) => ({ id: item.id, fullName: item.fullName })));
      clearTyping();

      if (!users.length) {
        pushError('No hay personal asociado a la empresa seleccionada. Elige otra empresa.');
        push('bot', 'Selecciona otra empresa para continuar.');
        const companies = await fetchResponsibleCompaniesLocalFirst();
        push('companies', companies);
        return;
      }

      const suggested = suggestResponsibleUser(users);
      const state = useManualInspectionDraft.getState();
      push('bot', `Para ${state.findingCompanyName ?? 'la empresa seleccionada'} en ${state.areaName ?? 'el área inspeccionada'}, sugiero este personal. Selecciona uno o más:`);
      push('people', { users, suggestedUserId: suggested?.id ?? null } as PeopleData);
    } catch {
      clearTyping();
      pushError('No pude cargar personal.', () => {
        void askResponsiblePeople(companyId);
      });
    }
  }

  async function confirmPeople(users: UserResponse[], messageId: string) {
    setConfirmedPeople((prev) => new Set(prev).add(messageId));

    if (users.length === 0) {
      pushError('Debes seleccionar al menos un responsable.');
      return;
    }

    draft.setFindingResponsibles(users.map((item) => item.id));
    push('user', `Personal: ${users.map((item) => item.fullName).join(', ')}`);
    await showSummary();
  }

  async function showSummary() {
    setStep(5);
    await sleep(200);
    push('bot', '¡Listo! Revisa el resumen antes de guardar:');
    push('summary');
  }

  async function submitInspection(messageId: string) {
    markResolved(messageId);
    const state = useManualInspectionDraft.getState();

    if (state.inspectionType === InspectionType.ENVIRONMENTAL) {
      if (!state.findingTypeId) {
        pushError('Falta tipo de hallazgo.');
        return;
      }

      if (state.findingObservations.filter((item) => item.saved).length === 0) {
        pushError('Debes registrar al menos una observación guardada.');
        return;
      }

      if (!state.findingCompanyId || state.findingResponsibleIds.length === 0) {
        pushError('Debes definir empresa y responsables antes de guardar.');
        return;
      }

      push('typing');
      try {
        const result = await findingSave.mutateAsync({
          draft: state,
          trySyncNow: online && hasSession,
        });

        useManualInspectionDraft.getState().setLastSavedResult(result);
        clearTyping();

        if (state.draftId) {
          await markManualInspectionDraftCompleted(state.draftId);
        }
        await localStorageDriver.remove(CHAT_STATE_KEY);

        const selectedUsers = loadedUsersByCompany.current.get(state.findingCompanyId ?? '') ?? [];
        const selectedNames = selectedUsers
          .filter((user) => state.findingResponsibleIds.includes(user.id))
          .map((user) => user.fullName);

        router.replace({
          pathname: '/inspection/success',
          params: {
            inspectionId: result.inspectionId,
            findingsCount: String(result.noCount),
            evidencesCount: String(result.noCount),
            areaName: state.areaName ?? '',
            sectorName: state.sectorName ?? '',
            companyName: state.findingCompanyName ?? '',
            personnelNames: selectedNames.join(', '),
            criticalCount: String(state.findingObservations.filter((item) => (item.severityLabel ?? '').toLowerCase().includes('crít')).length),
          },
        });
      } catch {
        clearTyping();
        pushError('Error al guardar hallazgo.', () => {
          void submitInspection(messageId);
        });
      }

      return;
    }

    const template = templates.find((item) => item.id === state.templateId) ?? null;
    if (!template) {
      pushError('Falta plantilla de checklist.');
      return;
    }

    const checklistItems = rowsOf(template);
    if (!state.generalPhoto) {
      pushError('La fotografía general es obligatoria.');
      return;
    }

    const unanswered = checklistItems.find((item) => !state.answersByItemId[item.id]);
    if (unanswered) {
      pushError(`Falta responder el ítem ${unanswered.code}.`);
      return;
    }

    const incompleteNo = checklistItems.find((item) => {
      if (state.answersByItemId[item.id] !== InspectionAnswerValue.NOT_COMPLIANT) return false;
      const detail = state.detailsByItemId[item.id] ?? {};
      return !detail.detectedCondition?.trim() || !detail.correctiveAction?.trim() || !detail.evidence;
    });
    if (incompleteNo) {
      pushError(`El ítem ${incompleteNo.code} debe incluir condición, medida correctiva y fotografía.`);
      return;
    }

    const hasChecklistFindings = checklistItems.some(
      (item) => state.answersByItemId[item.id] === InspectionAnswerValue.NOT_COMPLIANT,
    );
    if (hasChecklistFindings && (!state.findingCompanyId || state.findingResponsibleIds.length === 0)) {
      pushError('Debes definir empresa y responsables para los ítems no conformes.');
      return;
    }

    push('typing');
    try {
      const result = await checklistSave.mutateAsync({
        draft: state,
        template,
        items: rowsOf(template),
        trySyncNow: online && hasSession,
      });

      useManualInspectionDraft.getState().setLastSavedResult(result);
      clearTyping();

      if (state.draftId) {
        await markManualInspectionDraftCompleted(state.draftId);
      }
      await localStorageDriver.remove(CHAT_STATE_KEY);

      router.replace({
        pathname: '/inspection/success',
        params: {
          inspectionId: result.inspectionId,
          findingsCount: String(result.noCount),
          evidencesCount: String(1 + result.noCount),
          areaName: state.areaName ?? '',
          sectorName: state.sectorName ?? '',
          companyName: state.findingCompanyName ?? state.inspectorCompanyName,
          personnelNames: state.findingResponsibleIds.length ? `${state.findingResponsibleIds.length} responsables seleccionados` : '',
          criticalCount: '0',
        },
      });
    } catch (error) {
      clearTyping();
      const message = error instanceof Error ? error.message : 'Error al guardar checklist.';
      pushError(message, () => {
        void submitInspection(messageId);
      });
    }
  }

  function sendText(text: string) {
    if (!waiting) return;

    if (waiting.startsWith('check-cond:')) {
      const itemId = waiting.replace('check-cond:', '');
      setWaiting(null);
      void handleChecklistCondition(text, itemId);
      return;
    }

    if (waiting.startsWith('check-measure:')) {
      const itemId = waiting.replace('check-measure:', '');
      setWaiting(null);
      void handleChecklistMeasure(text, itemId);
      return;
    }

    if (waiting.startsWith('finding-cond:')) {
      const observationId = waiting.replace('finding-cond:', '');
      setWaiting(null);
      void handleFindingCondition(text, observationId);
      return;
    }

    if (waiting.startsWith('finding-measure:')) {
      const observationId = waiting.replace('finding-measure:', '');
      setWaiting(null);
      void handleFindingMeasure(text, observationId);
    }
  }

  function renderSummary(message: Msg) {
    const state = useManualInspectionDraft.getState();
    const responsibleNames = (loadedUsersByCompany.current.get(state.findingCompanyId ?? '') ?? [])
      .filter((user) => state.findingResponsibleIds.includes(user.id))
      .map((user) => user.fullName)
      .join(', ');
    const responsibleValue = responsibleNames || (
      state.findingResponsibleIds.length ? `${state.findingResponsibleIds.length} seleccionados` : '—'
    );

    if (state.inspectionType === InspectionType.ENVIRONMENTAL) {
      const observations = state.findingObservations.filter((item) => item.saved);
      return (
        <View key={message.id} style={styles.summaryWrap}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryHead}>
              <Text style={styles.summaryHeadText}>Datos generales</Text>
              <Text style={styles.summaryPill}>Hallazgo</Text>
            </View>
            <SummaryRow label="Inspector" value={state.inspectorName} />
            <SummaryRow label="Área · Sector" value={[state.areaName, state.sectorName].filter(Boolean).join(' · ')} />
            <SummaryRow label="Empresa EECC" value={state.findingCompanyName ?? '—'} />
            <SummaryRow label="Responsables" value={responsibleValue} />
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryHead}>
              <Text style={styles.summaryHeadText}>{observations.length} Observaciones</Text>
            </View>
            <View style={styles.summaryItems}>
              {observations.map((obs, index) => (
                <View key={obs.id} style={styles.summaryObservationRow}>
                  <View style={styles.summaryObservationTop}>
                    <Text style={styles.summaryObservationTitle}>Obs. {index + 1}</Text>
                    <View style={styles.summaryObservationBadges}>
                      <Text style={styles.summarySeverityBadge}>{obs.severityLabel ?? 'Sin criticidad'}</Text>
                      <Text style={styles.summarySourceBadge}>{obs.correctiveActionSource === 'ai' ? 'IA' : 'Manual'}</Text>
                    </View>
                  </View>
                  <Text numberOfLines={2} style={styles.summaryObservationCondition}>{obs.detectedCondition}</Text>
                  <Text style={styles.summaryObservationMeta}>SLA: {parseSlaDays(obs.severityClosureTimeLabel, 7)} días</Text>
                </View>
              ))}
            </View>
          </View>

        </View>
      );
    }

    const noCount = checklistRows.filter((row) => state.answersByItemId[row.id] === InspectionAnswerValue.NOT_COMPLIANT).length;

    return (
      <View key={message.id} style={styles.summaryWrap}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryHead}>
            <Text style={styles.summaryHeadText}>Datos generales</Text>
            <Text style={styles.summaryPill}>Checklist</Text>
          </View>
          <SummaryRow label="Inspector" value={state.inspectorName} />
          <SummaryRow label="Área · Sector" value={[state.areaName, state.sectorName].filter(Boolean).join(' · ')} />
          <SummaryRow label="Fecha" value={state.inspectionDate} />
          <SummaryRow label="Ubicación" value={state.locationLabel} />
          <SummaryRow label="Registro" value={state.templateName ?? '—'} />
          <SummaryRow label="Empresa EECC" value={state.findingCompanyName ?? (noCount ? 'Pendiente' : 'No aplica')} />
          <SummaryRow label="Responsables" value={noCount ? responsibleValue : 'No aplica'} />
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryHead}>
            <Text style={styles.summaryHeadText}>{checklistRows.length} Ítems · {noCount} hallazgos</Text>
          </View>
          <View style={styles.summaryItems}>
            {checklistRows.map((row) => (
              <View key={row.id} style={styles.summaryRowInline}>
                <Text style={styles.summaryItemText}>{row.index + 1}. {row.code}</Text>
                <Text style={styles.summaryItemAnswer}>{answerLabel(state.answersByItemId[row.id])}</Text>
              </View>
            ))}
          </View>
        </View>

      </View>
    );
  }

  function renderQuestion(message: Msg, resolved: boolean) {
    const row = message.data as Row;
    const selected = draft.answersByItemId[row.id];

    const options = [
      { value: InspectionAnswerValue.COMPLIANT, label: 'SÍ' },
      { value: InspectionAnswerValue.NOT_COMPLIANT, label: 'NO' },
      { value: InspectionAnswerValue.NOT_APPLICABLE, label: 'N/A' },
    ];

    return (
      <View key={message.id} style={styles.questionCard}>
        <View style={styles.questionHead}>
          <Text style={styles.questionSection}>{row.sectionTitle}</Text>
          <Text style={styles.questionCode}>{row.code}</Text>
        </View>
        <View style={styles.questionBody}>
          <View style={styles.questionTitleRow}>
            <Text style={styles.questionIndex}>{row.index + 1}</Text>
            <Text style={styles.questionText}>{row.question}</Text>
          </View>
          {row.guidance ? <Text style={styles.questionGuidance}>{row.guidance}</Text> : null}
          <View style={styles.questionActions}>
            {options.map((option) => {
              const isSelected = selected === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  disabled={resolved || Boolean(selected)}
                  activeOpacity={0.75}
                  onPress={() => {
                    void answerChecklistItem(row, option.value, message.id);
                  }}
                  style={[styles.questionButton, isSelected && styles.questionButtonSelected, selected && !isSelected && styles.questionButtonMuted]}
                >
                  <Text style={[styles.questionButtonText, isSelected && styles.questionButtonTextSelected]}>{option.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    );
  }

  function renderMessage(message: Msg) {
    const resolved = resolvedMessages.has(message.id);

    if (message.t === 'bot') return <BotBubble key={message.id} text={String(message.data ?? '')} />;
    if (message.t === 'user') return <UserBubble key={message.id} text={String(message.data ?? '')} />;
    if (message.t === 'typing') return <TypingIndicator key={message.id} />;

    if (message.t === 'error') {
      const data = message.data as { message: string };
      return <ErrorBubble key={message.id} message={data.message} onRetry={retries.current.get(message.id)} />;
    }

    if (message.t === 'resume') {
      return (
        <QuickOpts
          key={message.id}
          options={[
            { value: 'resume', label: 'Continuar borrador', icon: 'arrow-right' },
            { value: 'restart', label: 'Iniciar desde cero', icon: 'list' },
          ]}
          onSelect={(value) => {
            markResolved(message.id);
            if (value === 'resume') {
              push('user', 'Continuar borrador');
              void handleResumeRequest();
              return;
            }
            push('user', 'Iniciar desde cero');
            const selected = selectedResumeDraftId ?? availableDrafts[0]?.draftId ?? null;
            if (selected) void removeManualInspectionDraft(selected);
            startFresh();
          }}
        />
      );
    }

    if (message.t === 'resumeDraftPick') {
      const data = message.data as ResumeDraftPickData;
      return (
        <ChipRow
          key={message.id}
          chips={data.drafts.map((item) => item.label)}
          selected={resolved ? data.drafts.find((item) => item.id === selectedResumeDraftId)?.label ?? null : null}
          onSelect={(label) => {
            if (resolved) return;
            const selected = data.drafts.find((item) => item.label === label);
            if (!selected) return;
            setSelectedResumeDraftId(selected.id);
            markResolved(message.id);
            push('user', label);
            void continueWithDraftId(selected.id);
          }}
          variant="gold"
        />
      );
    }

    if (message.t === 'areas') {
      const areas = message.data as AreaResponse[];
      return (
        <ChipRow
          key={message.id}
          chips={areas.map((item) => item.name)}
          selected={resolved ? draft.areaName : null}
          onSelect={(name) => {
            if (resolved) return;
            const area = areas.find((item) => item.name === name);
            if (area) void selectArea(area, message.id);
          }}
        />
      );
    }

    if (message.t === 'sectors') {
      const sectors = message.data as SectorResponse[];
      return (
        <ChipRow
          key={message.id}
          chips={sectors.map((item) => item.name)}
          selected={resolved ? draft.sectorName : null}
          onSelect={(name) => {
            if (resolved) return;
            const sector = sectors.find((item) => item.name === name);
            if (sector) void selectSector(sector, message.id);
          }}
        />
      );
    }

    if (message.t === 'types') {
      const options = message.data as Array<{ value: InspectionType; label: string; icon: string; inspectionTypeId: string | null }>;
      return (
        <QuickOpts
          key={message.id}
          options={options.map((item) => ({ value: item.value, label: item.label, icon: item.icon }))}
          selected={resolved ? draft.inspectionType : null}
          onSelect={(value) => {
            if (resolved) return;
            const option = options.find((item) => item.value === value);
            if (option) {
              void selectInspectionType(option.value, option.inspectionTypeId, option.label, message.id);
            }
          }}
        />
      );
    }

    if (message.t === 'dates') {
      const values = message.data as string[];
      return (
        <QuickOpts
          key={message.id}
          options={values.map((value) => ({ value, label: value }))}
          selected={resolved ? draft.inspectionDate : null}
          onSelect={(value) => {
            if (!resolved) void selectInspectionDate(value, message.id);
          }}
        />
      );
    }

    if (message.t === 'loc') {
      return (
        <ChatLocationWidget
          key={message.id}
          captured={draft.locationCaptured}
          label={draft.locationLabel}
          accuracy={draft.locationAccuracyLabel}
          capturing={capturing}
          resolved={resolved}
          onCapture={() => {
            void captureChatLocation(message.id);
          }}
        />
      );
    }

    if (message.t === 'templatePick') {
      const data = message.data as { template: InspectionChecklistTemplateResponse; templates: InspectionChecklistTemplateResponse[] };
      return (
        <QuickOpts
          key={message.id}
          options={[
            { value: 'confirm', label: `Confirmar ${data.template.name}`, icon: 'check' },
            { value: 'other', label: 'Elegir otra', icon: 'list' },
          ]}
          selected={resolved ? 'confirm' : null}
          onSelect={(value) => {
            if (value === 'confirm') void selectChecklistTemplate(data.template, message.id);
            if (value === 'other') openChecklistTemplates(data.templates, message.id);
          }}
        />
      );
    }

    if (message.t === 'templates') {
      const list = message.data as InspectionChecklistTemplateResponse[];
      return (
        <ChipRow
          key={message.id}
          chips={list.map((item) => item.name)}
          selected={resolved ? draft.templateName : null}
          onSelect={(name) => {
            if (resolved) return;
            const template = list.find((item) => item.name === name);
            if (template) void selectChecklistTemplate(template, message.id);
          }}
          variant="navy"
        />
      );
    }

    if (message.t === 'generalPhoto') {
      const receipt = photoReceiptByMessageId[message.id];
      return (
        <PhotoStepWidget
          key={message.id}
          resolved={resolved}
          resolvedTitle={receipt?.title}
          resolvedSub={receipt?.sub}
          onCapture={(uri) => {
            if (!resolved) void handleChecklistGeneralPhoto(uri, message.id);
          }}
          onSkip={() => {
            Alert.alert('Foto requerida', 'La foto general es obligatoria para checklist normativo.');
          }}
        />
      );
    }

    if (message.t === 'question') {
      return renderQuestion(message, resolved);
    }

    if (message.t === 'itemPhoto') {
      const row = message.data as Row;
      const receipt = photoReceiptByMessageId[message.id];
      return (
        <PhotoStepWidget
          key={message.id}
          resolved={resolved}
          resolvedTitle={receipt?.title}
          resolvedSub={receipt?.sub}
          onCapture={(uri) => {
            if (!resolved) void handleChecklistItemPhoto(uri, row, message.id);
          }}
          onSkip={() => {
            Alert.alert('Foto requerida', 'La evidencia fotográfica es obligatoria para ítems NO conformes.');
          }}
        />
      );
    }

    if (message.t === 'findingTypes') {
      const types = message.data as InspectionFindingTypeResponse[];
      return (
        <ChipRow
          key={message.id}
          chips={types.map((item) => item.name)}
          selected={resolved ? draft.findingTypeLabel : null}
          onSelect={(name) => {
            if (resolved) return;
            const found = types.find((item) => item.name === name);
            if (found) void selectFindingType(found, message.id);
          }}
          variant="navy"
        />
      );
    }

    if (message.t === 'findingPhoto') {
      const data = message.data as { observationId: string };
      const receipt = photoReceiptByMessageId[message.id];
      return (
        <PhotoStepWidget
          key={message.id}
          resolved={resolved}
          resolvedTitle={receipt?.title}
          resolvedSub={receipt?.sub}
          onCapture={(uri) => {
            if (!resolved) void handleFindingPhoto(uri, data.observationId, message.id);
          }}
          onSkip={rejectFindingPhotoSkip}
        />
      );
    }

    if (message.t === 'aiMeasure') {
      const data = message.data as AiMeasureData;
      return (
        <AiProposalCard
          key={message.id}
          suggestion={data.suggestion}
          fallback={data.fallback}
          accepted={resolved}
          onAccept={() => {
            if (!resolved) void acceptAiMeasure(message.id, data);
          }}
          onEdit={() => {
            if (!resolved) editAiMeasure(message.id, data);
          }}
        />
      );
    }

    if (message.t === 'criticality') {
      const data = message.data as CriticalityData;
      return (
        <View key={message.id} style={styles.criticalityCard}>
          <Text style={styles.criticalityTitle}>Criticidad</Text>
          <View style={styles.criticalityOptions}>
            {data.severities
              .slice()
              .sort((left, right) => left.sortOrder - right.sortOrder)
              .map((severity) => (
                <TouchableOpacity
                  key={severity.id}
                  activeOpacity={0.75}
                  disabled={resolved}
                  onPress={() => {
                    if (!resolved) void completeFindingCriticality(data.observationId, severity, message.id);
                  }}
                  style={[styles.criticalityOption, resolved && styles.criticalityOptionDisabled]}
                >
                  <Text style={styles.criticalityOptionName}>{severity.name}</Text>
                  <Text style={styles.criticalityOptionDesc}>{severity.description}</Text>
                </TouchableOpacity>
              ))}
          </View>
        </View>
      );
    }

    if (message.t === 'sla') {
      const data = message.data as SlaData;
      return (
        <SlaConfirmWidget
          key={message.id}
          observationNumber={useManualInspectionDraft.getState().findingObservations.filter((item) => item.saved).length + 1}
          initialDays={data.initialDays}
          resolved={resolved}
          onSave={(days) => {
            if (!resolved) {
              void saveFindingObservation(message.id, data, days);
            }
          }}
        />
      );
    }

    if (message.t === 'findingNext') {
      return (
        <QuickOpts
          key={message.id}
          options={[
            { value: 'add', label: 'Agregar otra observación', icon: 'plus' },
            { value: 'continue', label: 'Continuar con empresa', icon: 'arrow-right' },
          ]}
          onSelect={(value) => {
            if (!resolved) {
              void findingDecision(value as 'add' | 'continue', message.id);
            }
          }}
        />
      );
    }

    if (message.t === 'companyPick') {
      const data = message.data as CompanyPickData;
      return (
        <CompanySuggestionCard
          key={message.id}
          company={data.company}
          reason={data.reason}
          disabled={resolved}
          onConfirm={() => {
            if (!resolved) {
              void selectCompany(data.company, message.id);
            }
          }}
          onChooseOther={() => {
            if (!resolved) {
              openCompanyList(message.id, data.companies);
            }
          }}
        />
      );
    }

    if (message.t === 'companies') {
      const companies = message.data as CompanyResponse[];
      return (
        <ChipRow
          key={message.id}
          chips={companies.map((item) => item.name)}
          selected={resolved ? draft.findingCompanyName : null}
          onSelect={(name) => {
            if (resolved) return;
            const company = companies.find((item) => item.name === name);
            if (company) {
              void selectCompany(company, message.id);
            }
          }}
          variant="gold"
        />
      );
    }

    if (message.t === 'people') {
      const payload = message.data as PeopleData | UserResponse[];
      const users = Array.isArray(payload) ? payload : payload.users;
      const suggestedUserId = Array.isArray(payload) ? null : payload.suggestedUserId;
      return (
        <PersonnelPicker
          key={message.id}
          users={users}
          suggestedUserId={suggestedUserId}
          confirmed={confirmedPeople.has(message.id)}
          onConfirm={(selected) => {
            void confirmPeople(selected, message.id);
          }}
        />
      );
    }

    if (message.t === 'summary') return renderSummary(message);

    return null;
  }

  return (
    <SafeAreaProvider>
      <View style={styles.screen}>
        <ChatHeader currentStep={step} agentStatus={saving ? 'thinking' : 'active'} />
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            ref={scrollRef}
            style={styles.flex}
            contentContainerStyle={styles.chat}
            showsVerticalScrollIndicator={false}
          >
            {messages.map(renderMessage)}
          </ScrollView>
          {activeSummaryMessage ? (
            <SummarySaveFooter
              saving={saving}
              onSave={() => {
                void submitInspection(activeSummaryMessage.id);
              }}
            />
          ) : (
            <ChatInput onSend={sendText} disabled={waiting === null} />
          )}
        </KeyboardAvoidingView>
      </View>
    </SafeAreaProvider>
  );
}

function SummarySaveFooter({ saving, onSave }: { saving: boolean; onSave: () => void }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.summaryFooter, { paddingBottom: insets.bottom + spacing.xs }]}>
      <TouchableOpacity
        activeOpacity={0.8}
        disabled={saving}
        onPress={onSave}
        style={[styles.summaryFooterButton, saving && styles.summaryFooterButtonDisabled]}
      >
        <Text style={styles.summaryFooterText}>{saving ? 'Guardando…' : '✓ Guardar inspección'}</Text>
      </TouchableOpacity>
      <View style={styles.summaryFooterHomeIndicatorBar}>
        <View style={styles.summaryFooterHomeIndicator} />
      </View>
    </View>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryLine}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value || '—'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  flex: { flex: 1 },
  chat: {
    padding: spacing.md,
    gap: spacing.sm + 2,
    paddingBottom: spacing.xl,
  },
  summaryWrap: {
    marginLeft: 33,
    marginRight: 12,
    gap: spacing.sm,
  },
  summaryCard: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  summaryHead: {
    alignItems: 'center',
    backgroundColor: colors.navy,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
  },
  summaryHeadText: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  summaryPill: {
    backgroundColor: '#78D8CC',
    borderRadius: 4,
    color: colors.white,
    fontSize: 9,
    fontWeight: fontWeight.bold,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  summaryLine: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  summaryLabel: {
    color: colors.muted,
    fontSize: fontSize.xs,
    width: 92,
  },
  summaryValue: {
    color: colors.primary,
    flex: 1,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    textAlign: 'right',
  },
  summaryItems: {
    gap: 6,
    padding: spacing.md,
  },
  summaryRowInline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  summaryItemText: {
    color: colors.primary,
    flex: 1,
    fontSize: fontSize.xs,
  },
  summaryItemAnswer: {
    color: colors.navy,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  summaryObservationRow: {
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
  },
  summaryObservationTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  summaryObservationTitle: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    color: '#0D3862',
    fontSize: 10,
    fontWeight: fontWeight.bold,
    backgroundColor: '#E6F3FF',
    borderRadius: 5,
  },
  summaryObservationBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  summarySeverityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    color: '#463100',
    fontSize: 9,
    fontWeight: fontWeight.bold,
    backgroundColor: '#FFEAB8',
    borderRadius: 4,
  },
  summarySourceBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    color: '#8E6E3E',
    fontSize: 9,
    fontWeight: fontWeight.bold,
    backgroundColor: '#FDF3E3',
    borderRadius: 4,
  },
  summaryObservationCondition: {
    marginTop: 6,
    color: colors.primary,
    fontSize: fontSize.sm,
    lineHeight: 17,
  },
  summaryObservationMeta: {
    marginTop: 4,
    color: colors.muted,
    fontSize: fontSize.xs,
  },
  saveButton: {
    alignItems: 'center',
    backgroundColor: colors.ok,
    borderRadius: radius.md + 4,
    height: 48,
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  summaryFooter: {
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.white,
    borderTopColor: colors.border,
    borderTopWidth: 1,
  },
  summaryFooterButton: {
    width: '100%',
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#35A137',
    borderRadius: 12,
    shadowColor: '#35A137',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  summaryFooterButtonDisabled: {
    opacity: 0.7,
  },
  summaryFooterText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: fontWeight.bold,
  },
  summaryFooterHomeIndicatorBar: {
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryFooterHomeIndicator: {
    width: 120,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderMid,
  },
  questionCard: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    marginLeft: 33,
    marginRight: spacing.md,
    overflow: 'hidden',
  },
  questionHead: {
    alignItems: 'center',
    backgroundColor: colors.navy,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    gap: spacing.sm,
  },
  questionSection: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    flex: 1,
  },
  questionCode: {
    color: colors.white,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  questionBody: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  questionTitleRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  questionIndex: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    textAlign: 'center',
    lineHeight: 22,
    color: colors.white,
    backgroundColor: colors.navyDark,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  questionText: {
    flex: 1,
    color: colors.primary,
    fontSize: fontSize.md,
    lineHeight: 19,
    fontWeight: fontWeight.semibold,
  },
  questionGuidance: {
    color: colors.muted,
    fontSize: fontSize.xs,
    lineHeight: 16,
  },
  questionActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  questionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.borderMid,
    borderRadius: radius.full,
    height: 36,
    backgroundColor: colors.white,
  },
  questionButtonSelected: {
    backgroundColor: colors.navyDark,
    borderColor: colors.navyDark,
  },
  questionButtonMuted: {
    opacity: 0.45,
  },
  questionButtonText: {
    color: colors.blueLink,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  questionButtonTextSelected: {
    color: colors.white,
  },
  criticalityCard: {
    marginLeft: 33,
    marginRight: spacing.md,
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  criticalityTitle: {
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    color: colors.muted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.5,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    textTransform: 'uppercase',
  },
  criticalityOptions: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  criticalityOption: {
    borderColor: colors.border,
    borderRadius: radius.sm + 2,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: 3,
    backgroundColor: colors.white,
  },
  criticalityOptionDisabled: {
    opacity: 0.55,
  },
  criticalityOptionName: {
    color: colors.primary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  criticalityOptionDesc: {
    color: colors.body,
    fontSize: fontSize.md,
    lineHeight: 22,
  },
});