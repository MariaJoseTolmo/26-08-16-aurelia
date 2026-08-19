import { create } from 'zustand';
import type { AuthUser } from '../services/api/auth.api';
import { fetchInspectionAssignmentScopeLocalFirst } from '../services/api/inspection-assignment-scope.api';

interface MobileInspectionAssignmentScopeState {
  userId: string | null;
  loaded: boolean;
  loading: boolean;
  canSelectCompany: boolean;
  companyId: string | null;
  companyName: string | null;
  inspectorCompanyName: string | null;
  hydrate: (user: AuthUser | null) => Promise<void>;
  reset: () => void;
}

const initialState = {
  userId: null,
  loaded: false,
  loading: false,
  canSelectCompany: true,
  companyId: null,
  companyName: null,
  inspectorCompanyName: null,
};

export const useMobileInspectionAssignmentScope = create<MobileInspectionAssignmentScopeState>((set, get) => ({
  ...initialState,
  hydrate: async (user) => {
    if (!user) {
      set({ ...initialState, loaded: true });
      return;
    }
    const current = get();
    if (current.userId === user.id && (current.loaded || current.loading)) return;
    set({ ...initialState, userId: user.id, loading: true });
    const scope = await fetchInspectionAssignmentScopeLocalFirst(user);
    set({
      userId: user.id,
      loaded: true,
      loading: false,
      canSelectCompany: scope.canSelectCompany,
      companyId: scope.companyId,
      companyName: scope.companyName,
      inspectorCompanyName: scope.inspectorCompanyName,
    });
  },
  reset: () => set(initialState),
}));
