import { create } from 'zustand';

interface UiState {
  sidebarCollapsed: boolean;
  activeModule: string;
  toggleSidebar: () => void;
  setActiveModule: (module: string) => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarCollapsed: false,
  activeModule: 'dashboard',
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setActiveModule: (module) => set({ activeModule: module }),
}));