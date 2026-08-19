import { create } from 'zustand';

export type FlowStep =
  | 'area'
  | 'sector'
  | 'tipo'
  | 'obs_desc'
  | 'obs_foto'       // Mobile D: camera + upload
  | 'obs_ai_suggest'
  | 'obs_medida'
  | 'criticidad'
  | 'sla'
  | 'more_obs'
  | 'empresa'
  | 'personal'
  | 'resumen'
  | 'done';

export interface ObservacionDraft {
  desc: string | null;
  foto: boolean;
  fotoUri: string | null;  // local camera/gallery URI (Mobile D)
  fileId: string | null;   // uploaded file ID from /files/upload (Mobile D)
  medida: string | null;
  medidaOrigen: 'ia' | 'manual' | null;
  prob: number | null;
  cons: number | null;
  nivel: string | null;
  sla: number;
}

export interface InspectionFlowState {
  step: FlowStep;
  progressStep: number;

  // Identifiers (IDs for backend) + display names
  areaId: string | null;
  areaName: string | null;
  sectorId: string | null;
  sectorName: string | null;
  inspectionTypeId: string | null;
  inspectionTypeName: string | null;

  companyId: string | null;
  companyName: string | null;
  personnelIds: string[];
  personnelNames: string[];

  observaciones: ObservacionDraft[];
  currentObs: ObservacionDraft;

  aiSuggestion: string | null;
  aiLoading: boolean;
  aiFallback: boolean;

  // Actions
  setArea: (id: string, name: string) => void;
  setSector: (id: string, name: string) => void;
  setInspectionType: (id: string, name: string) => void;
  setObsDesc: (desc: string) => void;
  setFotoUri: (uri: string) => void;  // Mobile D: store captured photo URI
  setFileId: (fileId: string) => void; // Mobile D: store uploaded file ID
  markFotoSkipped: () => void;
  setAiLoading: (loading: boolean) => void;
  setAiSuggestion: (text: string, fallback: boolean) => void;
  acceptMedida: (medida: string, origen: 'ia' | 'manual') => void;
  setProb: (prob: number) => void;
  setCons: (cons: number) => void;
  setSla: (sla: number) => void;
  addMoreObs: () => void;
  finishObs: () => void;
  setCompany: (id: string, name: string) => void;
  setPersonnel: (ids: string[], names: string[]) => void;
  goToResumen: () => void;
  reset: () => void;
}

function emptyObs(): ObservacionDraft {
  return {
    desc: null,
    foto: false,
    fotoUri: null,
    fileId: null,
    medida: null,
    medidaOrigen: null,
    prob: null,
    cons: null,
    nivel: null,
    sla: 7,
  };
}

export const useInspectionFlow = create<InspectionFlowState>((set) => ({
  step: 'area',
  progressStep: 0,

  areaId: null,
  areaName: null,
  sectorId: null,
  sectorName: null,
  inspectionTypeId: null,
  inspectionTypeName: null,

  companyId: null,
  companyName: null,
  personnelIds: [],
  personnelNames: [],

  observaciones: [],
  currentObs: emptyObs(),

  aiSuggestion: null,
  aiLoading: false,
  aiFallback: false,

  setArea: (id, name) => set({ areaId: id, areaName: name, step: 'sector' }),
  setSector: (id, name) => set({ sectorId: id, sectorName: name, step: 'tipo' }),
  setInspectionType: (id, name) =>
    set({ inspectionTypeId: id, inspectionTypeName: name, step: 'obs_desc', progressStep: 1 }),

  setObsDesc: (desc) =>
    set((s) => ({ currentObs: { ...s.currentObs, desc }, step: 'obs_foto' })),

  setFotoUri: (uri) =>
    set((s) => ({ currentObs: { ...s.currentObs, fotoUri: uri, foto: true } })),

  setFileId: (fileId) =>
    set((s) => ({ currentObs: { ...s.currentObs, fileId } })),

  // step transitions to obs_ai_suggest, marks aiLoading — fotoUri/fileId already stored above
  markFotoSkipped: () =>
    set((s) => ({ currentObs: { ...s.currentObs, foto: false }, step: 'obs_ai_suggest', aiLoading: true })),

  setAiLoading: (loading) => set({ aiLoading: loading }),

  setAiSuggestion: (text, fallback) =>
    set({ aiSuggestion: text, aiLoading: false, aiFallback: fallback, step: 'obs_medida' }),

  acceptMedida: (medida, origen) =>
    set((s) => ({
      currentObs: { ...s.currentObs, medida, medidaOrigen: origen },
      step: 'criticidad',
      progressStep: 2,
    })),

  setProb: (prob) => set((s) => ({ currentObs: { ...s.currentObs, prob } })),

  setCons: (cons) =>
    set((s) => {
      const p = s.currentObs.prob ?? 1;
      const nivel = calcNivel(p, cons);
      const sla = defaultSla(nivel);
      return { currentObs: { ...s.currentObs, cons, nivel, sla }, step: 'sla' };
    }),

  setSla: (sla) => set((s) => ({ currentObs: { ...s.currentObs, sla } })),

  addMoreObs: () =>
    set((s) => ({
      observaciones: [...s.observaciones, s.currentObs],
      currentObs: emptyObs(),
      step: 'obs_desc',
      progressStep: 3,
      aiSuggestion: null,
      aiLoading: false,
      aiFallback: false,
    })),

  finishObs: () =>
    set((s) => ({
      observaciones: [...s.observaciones, s.currentObs],
      currentObs: emptyObs(),
      step: 'empresa',
      progressStep: 4,
    })),

  setCompany: (id, name) => set({ companyId: id, companyName: name, step: 'personal' }),

  setPersonnel: (ids, names) =>
    set({ personnelIds: ids, personnelNames: names }),

  goToResumen: () => set({ step: 'resumen', progressStep: 5 }),

  reset: () =>
    set({
      step: 'area',
      progressStep: 0,
      areaId: null,
      areaName: null,
      sectorId: null,
      sectorName: null,
      inspectionTypeId: null,
      inspectionTypeName: null,
      companyId: null,
      companyName: null,
      personnelIds: [],
      personnelNames: [],
      observaciones: [],
      currentObs: emptyObs(),
      aiSuggestion: null,
      aiLoading: false,
      aiFallback: false,
    }),
}));

function calcNivel(p: number, c: number): string {
  const s = (p - 1) + (c - 1);
  if (s <= 1) return 'Bajo';
  if (s <= 3) return 'Medio';
  if (s <= 5) return 'Alto';
  return 'Crítico';
}

function defaultSla(nivel: string): number {
  return ({ Bajo: 14, Medio: 7, Alto: 3, Crítico: 1 } as Record<string, number>)[nivel] ?? 7;
}
