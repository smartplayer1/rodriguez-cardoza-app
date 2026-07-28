import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthUser } from '@/app/type/user';


interface UserState {
  user: AuthUser | null;
  hasHydrated: boolean;

  // acciones
  setUser: (user: AuthUser) => void;
  logout: () => void;
  setHasHydrated: (value: boolean) => void;

  // helpers
  can: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      hasHydrated: false,

      setUser: (user: AuthUser) => set({ user }),

      logout: () => set({ user: null }),

      setHasHydrated: (value: boolean) => set({ hasHydrated: value }),

      can: (permission: string) => {
        const user = get().user;
        if (!user) return false;
        return user.permissions.includes(permission);
      },

      hasRole: (role: string) => {
        const user = get().user;
        if (!user) return false;
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