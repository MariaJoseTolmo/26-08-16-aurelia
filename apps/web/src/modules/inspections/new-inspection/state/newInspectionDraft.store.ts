import { create } from 'zustand';
import { InspectionAnswerValue, InspectionType } from '@aurelia/contracts';

const NEW_INSPECTION_DRAFT_STORAGE_KEY = 'aurelia:new-inspection-draft:v1';
const NEW_INSPECTION_DRAFT_QUEUE_STORAGE_KEY = 'aurelia:new-inspection-drafts:v1';
const ACTIVE_NEW_INSPECTION_DRAFT_STORAGE_KEY = 'aurelia:active-new-inspection-draft-id';

interface NewInspectionLocationInput {
  label: string;
  accuracy: string;
  latitude: number;
  longitude: number;
  altitude: number | null;
}

export interface NewInspectionPickedAsset {
  name: string;
  file?: File;
}

export interface NewInspectionChecklistItemDetail {
  comment?: string;
  detectedCondition?: string;
  correctiveAction?: string;
  evidence?: NewInspectionPickedAsset | null;
  severityId?: string | null;
  severityLabel?: string | null;
  severityClosureTimeLabel?: string | null;
  slaLabel?: string | null;
}

export type NewInspectionCorrectiveActionSource = 'ai' | 'manual' | null;
export type NewInspectionFlowMode = 'assistant' | 'manual' | null;

export interface NewInspectionFindingObservationDraft {
  id: string;
  detectedCondition: string;
  correctiveAction: string;
  correctiveActionSource: NewInspectionCorrectiveActionSource;
  evidence: NewInspectionPickedAsset | null;
  severityId: string | null;
  severityLabel: string | null;
  severityClosureTimeLabel: string | null;
  saved: boolean;
}

export interface NewInspectionDraft {
  flowMode: NewInspectionFlowMode;
  inspectorName: string;
  inspectorCompanyName: string;
  areaId: string | null;
  areaName: string | null;
  sectorId: string | null;
  sectorName: string | null;
  inspectionDate: string;
  inspectionDateSelected: boolean;
  locationLabel: string;
  locationAccuracyLabel: string;
  locationCaptured: boolean;
  latitude: number | null;
  longitude: number | null;
  altitude: number | null;
  locationCapturedAt: string | null;
  inspectionType: InspectionType;
  inspectionTypeLabel: string;
  inspectionTypeSelected: boolean;
  findingTypeId: string | null;
  findingTypeLabel: string | null;
  findingObservations: NewInspectionFindingObservationDraft[];
  templateId: string | null;
  templateName: string | null;
  templateCode: string | null;
  templateItemsCount: number | null;
  answersByItemId: Record<string, InspectionAnswerValue>;
  detailsByItemId: Record<string, NewInspectionChecklistItemDetail>;
  generalPhoto: NewInspectionPickedAsset | null;
  findingCompanyId: string | null;
  findingCompanyName: string | null;
  findingResponsibleIds: string[];
}

export interface NewInspectionDraftSnapshot {
  id: string;
  savedAt: string;
  draft: NewInspectionDraft;
}

interface NewInspectionDraftState extends NewInspectionDraft {
  setFlowMode: (mode: NewInspectionFlowMode) => void;
  setInspector: (name: string, companyName: string) => void;
  setArea: (id: string, name: string) => void;
  setSector: (id: string, name: string) => void;
  setInspectionDate: (value: string) => void;
  setLocation: (input: NewInspectionLocationInput) => void;
  setInspectionType: (type: InspectionType, label: string) => void;
  setFindingType: (id: string | null, label: string | null) => void;
  addFindingObservation: () => string;
  updateFindingObservation: (id: string, patch: Partial<Omit<NewInspectionFindingObservationDraft, 'id'>>) => void;
  removeFindingObservation: (id: string) => void;
  setTemplate: (input: { id: string; name: string; code: string; itemsCount: number }) => void;
  setAnswer: (itemId: string, value: InspectionAnswerValue) => void;
  setItemDetail: (itemId: string, detail: Partial<NewInspectionChecklistItemDetail>) => void;
  setGeneralPhoto: (asset: NewInspectionPickedAsset | null) => void;
  setFindingCompany: (id: string | null, name: string | null) => void;
  setFindingResponsibles: (ids: string[]) => void;
  hydrate: (draft: NewInspectionDraft) => void;
  reset: () => void;
}

type NewInspectionDraftStoreHook = {
  (): NewInspectionDraftState;
  <T>(selector: (state: NewInspectionDraftState) => T): T;
  getState: () => NewInspectionDraftState;
  subscribe: (listener: (state: NewInspectionDraftState) => void) => () => void;
};

function newObservationId() {
  return `finding-observation-${Date.now()}-${Math.round(Math.random() * 10000)}`;
}

function newDraftSnapshotId() {
  return `inspection-draft-${Date.now()}-${Math.round(Math.random() * 100000)}`;
}

function currentDateLabel() {
  return new Intl.DateTimeFormat('es-CL').format(new Date());
}

const initialDraft: NewInspectionDraft = {
  flowMode: null,
  inspectorName: 'Karen Opazo S.',
  inspectorCompanyName: 'Gold Fields',
  areaId: null,
  areaName: null,
  sectorId: null,
  sectorName: null,
  inspectionDate: currentDateLabel(),
  inspectionDateSelected: false,
  locationLabel: 'Ubicacion no capturada',
  locationAccuracyLabel: 'Sin precision',
  locationCaptured: false,
  latitude: null,
  longitude: null,
  altitude: null,
  locationCapturedAt: null,
  inspectionType: InspectionType.REGULATORY,
  inspectionTypeLabel: 'Checklist normativo',
  inspectionTypeSelected: false,
  findingTypeId: null,
  findingTypeLabel: null,
  findingObservations: [],
  templateId: null,
  templateName: null,
  templateCode: null,
  templateItemsCount: null,
  answersByItemId: {},
  detailsByItemId: {},
  generalPhoto: null,
  findingCompanyId: null,
  findingCompanyName: null,
  findingResponsibleIds: [],
};

function stripAsset(asset: NewInspectionPickedAsset | null | undefined): NewInspectionPickedAsset | null {
  if (!asset?.name) return null;
  return { name: asset.name };
}

function normalizeFindingObservation(observation: Partial<NewInspectionFindingObservationDraft> & { id: string }): NewInspectionFindingObservationDraft {
  return {
    id: observation.id,
    detectedCondition: observation.detectedCondition ?? '',
    correctiveAction: observation.correctiveAction ?? '',
    correctiveActionSource: observation.correctiveActionSource ?? null,
    evidence: stripAsset(observation.evidence),
    severityId: observation.severityId ?? null,
    severityLabel: observation.severityLabel ?? null,
    severityClosureTimeLabel: observation.severityClosureTimeLabel ?? null,
    saved: observation.saved ?? false,
  };
}

function hasTypedContent(draft: NewInspectionDraft) {
  return Boolean(
    draft.findingTypeId ||
    draft.findingObservations.length > 0 ||
    draft.templateId ||
    Object.keys(draft.answersByItemId).length > 0 ||
    draft.generalPhoto ||
    draft.findingCompanyId ||
    draft.findingResponsibleIds.length > 0,
  );
}

function serializableDraft(draft: NewInspectionDraft): NewInspectionDraft {
  const normalizedObservations = draft.findingObservations.map(normalizeFindingObservation);
  const normalizedDraft = {
    ...initialDraft,
    ...draft,
    flowMode: draft.flowMode ?? null,
    inspectionTypeSelected: draft.inspectionTypeSelected ?? hasTypedContent(draft),
    inspectionDateSelected: draft.inspectionDateSelected ?? Boolean(draft.locationCaptured || hasTypedContent(draft)),
    generalPhoto: stripAsset(draft.generalPhoto),
    detailsByItemId: Object.fromEntries(
      Object.entries(draft.detailsByItemId ?? {}).map(([itemId, detail]) => [
        itemId,
        {
          ...detail,
          evidence: stripAsset(detail.evidence),
        },
      ]),
    ),
    findingObservations: normalizedObservations,
  };
  return normalizedDraft;
}

export function hasNewInspectionDraftProgress(draft: NewInspectionDraft): boolean {
  return Boolean(
    draft.areaId ||
    draft.sectorId ||
    draft.locationCaptured ||
    draft.findingTypeId ||
    draft.findingObservations.length > 0 ||
    draft.templateId ||
    Object.keys(draft.answersByItemId).length > 0 ||
    draft.generalPhoto ||
    draft.findingCompanyId ||
    draft.findingResponsibleIds.length > 0,
  );
}

function normalizeSnapshot(input: Partial<NewInspectionDraftSnapshot> | null | undefined): NewInspectionDraftSnapshot | null {
  if (!input?.savedAt || !input.draft) return null;
  const draft = serializableDraft(input.draft);
  if (!hasNewInspectionDraftProgress(draft)) return null;
  return { id: input.id || newDraftSnapshotId(), savedAt: input.savedAt, draft };
}

function readDraftQueue(): NewInspectionDraftSnapshot[] {
  if (typeof window === 'undefined') return [];
  const rawQueue = window.localStorage.getItem(NEW_INSPECTION_DRAFT_QUEUE_STORAGE_KEY);
  if (rawQueue) {
    try {
      const parsed = JSON.parse(rawQueue) as Partial<NewInspectionDraftSnapshot>[];
      if (Array.isArray(parsed)) return parsed.map(normalizeSnapshot).filter((item): item is NewInspectionDraftSnapshot => Boolean(item)).sort((a, b) => a.savedAt.localeCompare(b.savedAt));
    } catch {
      return [];
    }
  }
  const rawLegacy = window.localStorage.getItem(NEW_INSPECTION_DRAFT_STORAGE_KEY);
  if (!rawLegacy) return [];
  try {
    const parsed = JSON.parse(rawLegacy) as { savedAt?: string; draft?: NewInspectionDraft };
    const snapshot = normalizeSnapshot({ id: 'legacy-new-inspection-draft', savedAt: parsed.savedAt, draft: parsed.draft });
    return snapshot ? [snapshot] : [];
  } catch {
    return [];
  }
}

function writeDraftQueue(queue: NewInspectionDraftSnapshot[]) {
  if (typeof window === 'undefined') return;
  const normalized = queue.map(normalizeSnapshot).filter((item): item is NewInspectionDraftSnapshot => Boolean(item)).sort((a, b) => a.savedAt.localeCompare(b.savedAt));
  if (normalized.length === 0) window.localStorage.removeItem(NEW_INSPECTION_DRAFT_QUEUE_STORAGE_KEY);
  else window.localStorage.setItem(NEW_INSPECTION_DRAFT_QUEUE_STORAGE_KEY, JSON.stringify(normalized));
  window.localStorage.removeItem(NEW_INSPECTION_DRAFT_STORAGE_KEY);
}

function getActiveDraftSnapshotId() {
  if (typeof window === 'undefined') return null;
  return window.sessionStorage.getItem(ACTIVE_NEW_INSPECTION_DRAFT_STORAGE_KEY);
}

export function beginNewInspectionDraftSession() {
  if (typeof window === 'undefined') return '';
  const id = newDraftSnapshotId();
  window.sessionStorage.setItem(ACTIVE_NEW_INSPECTION_DRAFT_STORAGE_KEY, id);
  return id;
}

export function activateNewInspectionDraftSnapshot(id: string) {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(ACTIVE_NEW_INSPECTION_DRAFT_STORAGE_KEY, id);
}

export function clearActiveNewInspectionDraftSession() {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(ACTIVE_NEW_INSPECTION_DRAFT_STORAGE_KEY);
}

export function saveNewInspectionDraftSnapshot(draft: NewInspectionDraft) {
  if (typeof window === 'undefined') return;
  if (!hasNewInspectionDraftProgress(draft)) return;
  const queue = readDraftQueue();
  const activeId = getActiveDraftSnapshotId() || beginNewInspectionDraftSession();
  const index = queue.findIndex((snapshot) => snapshot.id === activeId);
  const savedAt = index >= 0 ? queue[index]?.savedAt ?? new Date().toISOString() : new Date().toISOString();
  const nextSnapshot = { id: activeId, savedAt, draft: serializableDraft(draft) };
  if (index >= 0) queue[index] = nextSnapshot;
  else queue.push(nextSnapshot);
  writeDraftQueue(queue);
}

export function loadNewInspectionDraftSnapshot(): NewInspectionDraftSnapshot | null {
  return readDraftQueue()[0] ?? null;
}

export function clearNewInspectionDraftSnapshot() {
  if (typeof window === 'undefined') return;
  const activeId = getActiveDraftSnapshotId();
  const queue = readDraftQueue();
  if (activeId) writeDraftQueue(queue.filter((snapshot) => snapshot.id !== activeId));
  else writeDraftQueue(queue.slice(1));
  clearActiveNewInspectionDraftSession();
}

export function hasNewInspectionDraftSnapshot() {
  return loadNewInspectionDraftSnapshot() !== null;
}

export const useNewInspectionDraftStore = create<NewInspectionDraftState>((set) => ({
  ...initialDraft,
  setFlowMode: (flowMode) => set({ flowMode }),
  setInspector: (inspectorName, inspectorCompanyName) => set({ inspectorName, inspectorCompanyName }),
  setArea: (areaId, areaName) => set({ areaId, areaName, sectorId: null, sectorName: null }),
  setSector: (sectorId, sectorName) => set({ sectorId, sectorName }),
  setInspectionDate: (inspectionDate) => set({ inspectionDate, inspectionDateSelected: true }),
  setLocation: ({ label, accuracy, latitude, longitude, altitude }) =>
    set({
      locationLabel: label,
      locationAccuracyLabel: accuracy,
      locationCaptured: true,
      latitude,
      longitude,
      altitude,
      locationCapturedAt: new Date().toISOString(),
    }),
  setInspectionType: (inspectionType, inspectionTypeLabel) =>
    set({
      inspectionType,
      inspectionTypeLabel,
      inspectionTypeSelected: true,
      findingTypeId: null,
      findingTypeLabel: null,
      findingObservations: [],
      templateId: null,
      templateName: null,
      templateCode: null,
      templateItemsCount: null,
      answersByItemId: {},
      detailsByItemId: {},
      generalPhoto: null,
      findingCompanyId: null,
      findingCompanyName: null,
      findingResponsibleIds: [],
    }),
  setFindingType: (findingTypeId, findingTypeLabel) => set({ findingTypeId, findingTypeLabel }),
  addFindingObservation: () => {
    const id = newObservationId();
    set((state) => ({
      findingObservations: [
        ...state.findingObservations,
        {
          id,
          detectedCondition: '',
          correctiveAction: '',
          correctiveActionSource: null,
          evidence: null,
          severityId: null,
          severityLabel: null,
          severityClosureTimeLabel: null,
          saved: false,
        },
      ],
    }));
    return id;
  },
  updateFindingObservation: (id, patch) =>
    set((state) => ({
      findingObservations: state.findingObservations.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    })),
  removeFindingObservation: (id) =>
    set((state) => ({ findingObservations: state.findingObservations.filter((item) => item.id !== id) })),
  setTemplate: ({ id, name, code, itemsCount }) =>
    set({
      templateId: id,
      templateName: name,
      templateCode: code,
      templateItemsCount: itemsCount,
      answersByItemId: {},
      detailsByItemId: {},
      generalPhoto: null,
      findingCompanyId: null,
      findingCompanyName: null,
      findingResponsibleIds: [],
    }),
  setAnswer: (itemId, value) =>
    set((state) => ({ answersByItemId: { ...state.answersByItemId, [itemId]: value } })),
  setItemDetail: (itemId, detail) =>
    set((state) => ({
      detailsByItemId: {
        ...state.detailsByItemId,
        [itemId]: {
          ...state.detailsByItemId[itemId],
          ...detail,
        },
      },
    })),
  setGeneralPhoto: (generalPhoto) => set({ generalPhoto }),
  setFindingCompany: (findingCompanyId, findingCompanyName) =>
    set({ findingCompanyId, findingCompanyName, findingResponsibleIds: [] }),
  setFindingResponsibles: (findingResponsibleIds) => set({ findingResponsibleIds }),
  hydrate: (draft) => set(serializableDraft(draft)),
  reset: () => set(initialDraft),
})) as NewInspectionDraftStoreHook;
