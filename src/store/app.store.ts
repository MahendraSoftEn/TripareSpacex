import { create } from 'zustand';

type AppStore = {
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
};

export const useAppStore = create<AppStore>(set => ({
  hasHydrated: false,
  setHasHydrated: value => {
    set({ hasHydrated: value });
  },
}));
