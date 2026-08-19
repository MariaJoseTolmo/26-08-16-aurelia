import { create } from 'zustand';

export type NewInspectionPicker = 'area' | 'sector' | 'date' | null;
export type NewInspectionAssistantGoal = 'hallazgo' | 'checklist' | 'rapido' | null;
export type NewInspectionStep =
  | 'start'
  | 'assistant-chat'
  | 'identification'
  | 'type'
  | 'observations-finding'
  | 'observations-checklist'
  | 'summary'
  | 'saved';

interface NewInspectionFlowState {
  currentStep: number;
  routeStep: NewInspectionStep;
  activePicker: NewInspectionPicker;
  assistantGoal: NewInspectionAssistantGoal;
  assistantSuggestionApplied: boolean;
  assistantChecklistSuggestionApplied: boolean;
  assistantChatTrace: string[];
  goToStart: () => void;
  goToAssistantChat: () => void;
  goToIdentification: () => void;
  goToType: () => void;
  goToFindingObservations: () => void;
  goToChecklistObservations: () => void;
  goToSummary: () => void;
  goToSaved: () => void;
  openPicker: (picker: Exclude<NewInspectionPicker, null>) => void;
  closePicker: () => void;
  setAssistantGoal: (goal: NewInspectionAssistantGoal) => void;
  setAssistantSuggestionApplied: (value: boolean) => void;
  setAssistantChecklistSuggestionApplied: (value: boolean) => void;
  appendAssistantChatTrace: (message: string) => void;
  clearAssistantChatTrace: () => void;
  reset: () => void;
}

export const useNewInspectionFlowStore = create<NewInspectionFlowState>((set) => ({
  currentStep: 1,
  routeStep: 'start',
  activePicker: null,
  assistantGoal: null,
  assistantSuggestionApplied: false,
  assistantChecklistSuggestionApplied: false,
  assistantChatTrace: [],
  goToStart: () => set({ currentStep: 1, routeStep: 'start', activePicker: null }),
  goToAssistantChat: () => set({ currentStep: 1, routeStep: 'assistant-chat', activePicker: null }),
  goToIdentification: () => set({ currentStep: 1, routeStep: 'identification', activePicker: null }),
  goToType: () => set({ currentStep: 2, routeStep: 'type', activePicker: null }),
  goToFindingObservations: () => set({ currentStep: 3, routeStep: 'observations-finding', activePicker: null }),
  goToChecklistObservations: () => set({ currentStep: 3, routeStep: 'observations-checklist', activePicker: null }),
  goToSummary: () => set({ currentStep: 4, routeStep: 'summary', activePicker: null }),
  goToSaved: () => set({ currentStep: 5, routeStep: 'saved', activePicker: null }),
  openPicker: (activePicker) => set({ activePicker }),
  closePicker: () => set({ activePicker: null }),
  setAssistantGoal: (assistantGoal) => set({ assistantGoal }),
  setAssistantSuggestionApplied: (assistantSuggestionApplied) => set({ assistantSuggestionApplied }),
  setAssistantChecklistSuggestionApplied: (assistantChecklistSuggestionApplied) => set({ assistantChecklistSuggestionApplied }),
  appendAssistantChatTrace: (message) =>
    set((state) => {
      const text = message.trim();
      if (!text) return state;
      if (state.assistantChatTrace[state.assistantChatTrace.length - 1] === text) return state;
      const next = [...state.assistantChatTrace, text];
      return { assistantChatTrace: next.slice(-10) };
    }),
  clearAssistantChatTrace: () => set({ assistantChatTrace: [] }),
  reset: () =>
    set({
      currentStep: 1,
      routeStep: 'start',
      activePicker: null,
      assistantGoal: null,
      assistantSuggestionApplied: false,
      assistantChecklistSuggestionApplied: false,
      assistantChatTrace: [],
    }),
}));
