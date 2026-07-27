import { create } from 'zustand';
import { InspectionAnswerValue, InspectionType } from '@aurelia/contracts';

export type ManualChecklistAnswers = Record<string, InspectionAnswerValue>;

export interface ManualPickedAsset {
  uri: string;
  name: string;
}

export interface ManualChecklistItemDetail {
  comment?: string;
  detectedCondition?: string;
  correctiveAction?: string;
  evidence?: ManualPickedAsset | null;
}

export interface ManualFindingObservationDraft {
  id: string;
  detectedCondition: string;
  correctiveAction: string;
  correctiveActionSource: 'ai' | 'manual' | null;
  evidence: ManualPickedAsset | null;
  severityId: string | null;
  severityLabel: string | null;
  severityDescription: string | null;
  severityClosureTimeLabel: string | null;
  probability: string | null;
  consequence: string | null;
  saved: boolean;
}

export interface ManualSavedInspectionResult {
  mode: 'checklist' | 'finding';
  inspectionId: string;
  totalCount: number;
  yesCount: number;
  noCount: number;
  naCount: number;
  closed: boolean;
}

export interface ManualInspectionDraft {
  draftId: string | null;
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
  findingObservations: ManualFindingObservationDraft[];
  templateId: string | null;
  templateName: string | null;
  templateCode: string | null;
  templateItemsCount: number | null;
  answersByItemId: ManualChecklistAnswers;
  detailsByItemId: Record<string, ManualChecklistItemDetail>;
  generalPhoto: ManualPickedAsset | null;
  findingCompanyId: string | null;
  findingCompanyName: string | null;
  findingResponsibleIds: string[];
  lastSavedResult: ManualSavedInspectionResult | null;
}

type HydratableManualInspectionDraft = Partial<ManualInspectionDraft> &
  Pick<ManualInspectionDraft, 'inspectionType' | 'inspectionTypeLabel'>;

interface ManualInspectionLocationInput {
  label: string;
  accuracy: string;
  latitude: number;
  longitude: number;
  altitude: number | null;
}

interface ManualInspectionState extends ManualInspectionDraft {
  setDraftId: (draftId: string | null) => void;
  setInspectorIdentity: (name: string, companyName: string) => void;
  setArea: (id: string, name: string) => void;
  setSector: (id: string, name: string) => void;
  setInspectionDate: (value: string) => void;
  setLocation: (input: ManualInspectionLocationInput) => void;
  setInspectionType: (type: InspectionType, label: string) => void;
  setFindingType: (id: string | null, label: string | null) => void;
  addFindingObservation: () => string;
  updateFindingObservation: (id: string, patch: Partial<Omit<ManualFindingObservationDraft, 'id'>>) => void;
  removeFindingObservation: (id: string) => void;
  setTemplate: (input: { id: string; name: string; code: string; itemsCount: number }) => void;
  setAnswer: (itemId: string, value: InspectionAnswerValue) => void;
  setItemDetail: (itemId: string, detail: Partial<ManualChecklistItemDetail>) => void;
  setGeneralPhoto: (asset: ManualPickedAsset | null) => void;
  setFindingCompany: (id: string | null, name: string | null) => void;
  setFindingResponsibles: (ids: string[]) => void;
  setLastSavedResult: (result: ManualSavedInspectionResult) => void;
  hydrate: (draft: ManualInspectionDraft) => void;
  reset: () => void;
}

const initialDraft: ManualInspectionDraft = {
  draftId: null,
  inspectorName: 'Karen Opazo S.',
  inspectorCompanyName: 'Gold Fields',
  areaId: null,
  areaName: null,
  sectorId: null,
  sectorName: null,
  inspectionDate: '',
  inspectionDateSelected: false,
  locationLabel: 'Ubicación no capturada',
  locationAccuracyLabel: 'Sin precisión',
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
  lastSavedResult: null,
};

function hasTypedContent(draft: Partial<ManualInspectionDraft>) {
  return Boolean(
    draft.findingTypeId ||
    (draft.findingObservations?.length ?? 0) > 0 ||
    draft.templateId ||
    Object.keys(draft.answersByItemId ?? {}).length > 0 ||
    draft.generalPhoto ||
    draft.findingCompanyId ||
    (draft.findingResponsibleIds?.length ?? 0) > 0,
  );
}

function normalizeChecklistAnswers(
  answers: ManualChecklistAnswers,
  details: Record<string, ManualChecklistItemDetail>,
): ManualChecklistAnswers {
  const normalized = { ...answers };

  Object.entries(normalized).forEach(([itemId, answer]) => {
    if (answer !== InspectionAnswerValue.NOT_COMPLIANT) return;
    const detail = details[itemId];
    const complete = Boolean(
      detail?.detectedCondition?.trim() &&
      detail.correctiveAction?.trim() &&
      detail.evidence,
    );

    // El flujo conversacional siempre debe retomar un NO incompleto antes de avanzar.
    // Al dejarlo pendiente, la misma tarjeta SÍ / NO / N/A vuelve a conducir al detalle requerido.
    if (!complete) delete normalized[itemId];
  });

  return normalized;
}

function normalizeDraft(draft: HydratableManualInspectionDraft): ManualInspectionDraft {
  const legacyTypedContent = hasTypedContent(draft);
  const inspectionTypeSelected = draft.inspectionTypeSelected ?? legacyTypedContent;
  const inspectionDateSelected = draft.inspectionDateSelected ?? Boolean(draft.locationCaptured || legacyTypedContent);
  const detailsByItemId = draft.detailsByItemId ?? {};
  const answersByItemId = normalizeChecklistAnswers(draft.answersByItemId ?? {}, detailsByItemId);

  return {
    ...initialDraft,
    ...draft,
    inspectionTypeSelected,
    inspectionDateSelected,
    inspectionDate: inspectionDateSelected ? (draft.inspectionDate ?? '') : '',
    findingObservations: (draft.findingObservations ?? []).map((item) => ({
      ...item,
      correctiveActionSource: item.correctiveActionSource ?? null,
    })),
    answersByItemId,
    detailsByItemId,
    findingResponsibleIds: draft.findingResponsibleIds ?? [],
  };
}

function newObservationId() {
  return `finding-observation-${Date.now()}-${Math.round(Math.random() * 10000)}`;
}

export const useManualInspectionDraft = create<ManualInspectionState>((set) => ({
  ...initialDraft,
  setDraftId: (draftId) => set({ draftId }),
  setInspectorIdentity: (inspectorName, inspectorCompanyName) => set({ inspectorName, inspectorCompanyName }),
  setArea: (id, name) => set({ areaId: id, areaName: name, sectorId: null, sectorName: null }),
  setSector: (id, name) => set({ sectorId: id, sectorName: name }),
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
          severityDescription: null,
          severityClosureTimeLabel: null,
          probability: null,
          consequence: null,
          saved: false,
        },
      ],
    }));
    return id;
  },
  updateFindingObservation: (id, patch) =>
    set((state) => ({ findingObservations: state.findingObservations.map((item) => (item.id === id ? { ...item, ...patch } : item)) })),
  removeFindingObservation: (id) => set((state) => ({ findingObservations: state.findingObservations.filter((item) => item.id !== id) })),
  setTemplate: ({ id, name, code, itemsCount }) =>
    set({ templateId: id, templateName: name, templateCode: code, templateItemsCount: itemsCount, answersByItemId: {}, detailsByItemId: {}, generalPhoto: null }),
  setAnswer: (itemId, value) => set((state) => ({ answersByItemId: { ...state.answersByItemId, [itemId]: value } })),
  setItemDetail: (itemId, detail) =>
    set((state) => ({ detailsByItemId: { ...state.detailsByItemId, [itemId]: { ...state.detailsByItemId[itemId], ...detail } } })),
  setGeneralPhoto: (generalPhoto) => set({ generalPhoto }),
  setFindingCompany: (findingCompanyId, findingCompanyName) => set({ findingCompanyId, findingCompanyName, findingResponsibleIds: [] }),
  setFindingResponsibles: (findingResponsibleIds) => set({ findingResponsibleIds }),
  setLastSavedResult: (lastSavedResult) => set({ lastSavedResult }),
  hydrate: (draft) =>
    set((state) => ({
      ...normalizeDraft(draft),
      inspectorName: state.inspectorName,
      inspectorCompanyName: state.inspectorCompanyName,
    })),
  reset: () => set((state) => ({ ...initialDraft, inspectorName: state.inspectorName, inspectorCompanyName: state.inspectorCompanyName })),
}));