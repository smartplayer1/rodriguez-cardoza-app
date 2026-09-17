import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthUser } from '@/app/type/user';

// 'loading' = todavía no se confirmó contra el backend si la cookie de
// sesión sigue siendo válida (fase de arranque). Un componente que decide
// si redirigir a /login debe esperar a que salga de 'loading' en vez de
// tratar "sin user todavía" como "no autenticado".
export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface UserState {
  user: AuthUser | null;
  hasHydrated: boolean;
  status: AuthStatus;

  // acciones
  setUser: (user: AuthUser) => void;
  logout: () => void;
  setHasHydrated: (value: boolean) => void;
  setStatus: (status: AuthStatus) => void;

  // helpers
  can: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      hasHydrated: false,
      status: 'loading',

      setUser: (user: AuthUser) => set({ user, status: 'authenticated' }),

      logout: () => set({ user: null, status: 'unauthenticated' }),

      setHasHydrated: (value: boolean) => set({ hasHydrated: value }),

      setStatus: (status: AuthStatus) => set({ status }),

      can: (permission: string) => {
        const { user, hasHydrated } = get();
        if (!hasHydrated || !user) return false;
        return user.permissions.includes(permission);
      },

      hasRole: (role: string) => {
        const { user, hasHydrated } = get();
        if (!hasHydrated || !user) return false;
        return user.roles.includes(role);
      }
    }),
    {
      name: 'auth-storage', // localStorage key
      skipHydration: true,
      partialize: (state) => ({ user: state.user }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);