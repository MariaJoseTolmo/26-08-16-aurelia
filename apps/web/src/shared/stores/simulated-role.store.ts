import { create } from 'zustand';
import {
  resolveSimulatedRole,
  WASTE_WITHDRAWER_ROLE,
  type SimulatedRole,
} from '../auth/simulated-role';

interface SimulatedRoleState {
  role: SimulatedRole | null;
  syncFromSearch: (search: string) => void;
}

export const useSimulatedRoleStore = create<SimulatedRoleState>((set) => ({
  /*
   * Se resuelve al crear el store —leyendo `window.location.search`— y no en un
   * efecto, para que el primer render ya conozca el rol. Si esperáramos al
   * efecto, la landing pintaría el dashboard general antes de redirigir.
   */
  role: resolveSimulatedRole(typeof window === 'undefined' ? '' : window.location.search),
  syncFromSearch: (search) => set({ role: resolveSimulatedRole(search) }),
}));

export function useIsWasteWithdrawer(): boolean {
  return useSimulatedRoleStore((state) => state.role === WASTE_WITHDRAWER_ROLE);
}
