import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { MissionStatus } from '../features/missions/types/mission.types';
import { sqliteStateStorage } from './storePersistence';

export type DateRangeFilter = 'all-time' | 'last-30-days' | 'last-year';

type MissionFiltersState = {
  dateRange: DateRangeFilter;
  hasHydrated: boolean;
  launchpads: string[];
  rocketTypes: string[];
  statuses: MissionStatus[];
};

type MissionFiltersActions = {
  clearAllFilters: () => void;
  setDateRange: (dateRange: DateRangeFilter) => void;
  setHasHydrated: (hasHydrated: boolean) => void;
  toggleLaunchpad: (launchpad: string) => void;
  toggleRocketType: (rocketType: string) => void;
  toggleStatus: (status: MissionStatus) => void;
};

const initialState: MissionFiltersState = {
  dateRange: 'all-time',
  hasHydrated: false,
  launchpads: [],
  rocketTypes: [],
  statuses: [],
};

export const useMissionFiltersStore = create<
  MissionFiltersState & MissionFiltersActions
>()(
  persist(
    set => ({
      ...initialState,
      clearAllFilters: () => {
        set({
          dateRange: initialState.dateRange,
          launchpads: [],
          rocketTypes: [],
          statuses: [],
        });
      },
      setDateRange: dateRange => {
        set({ dateRange });
      },
      setHasHydrated: hasHydrated => {
        set({ hasHydrated });
      },
      toggleLaunchpad: launchpad => {
        set(state => ({
          launchpads: toggleStringValue(state.launchpads, launchpad),
        }));
      },
      toggleRocketType: rocketType => {
        set(state => ({
          rocketTypes: toggleStringValue(state.rocketTypes, rocketType),
        }));
      },
      toggleStatus: status => {
        set(state => ({
          statuses: toggleStringValue(state.statuses, status),
        }));
      },
    }),
    {
      name: 'mission-filters',
      onRehydrateStorage: () => state => {
        state?.setHasHydrated(true);
      },
      partialize: state => ({
        dateRange: state.dateRange,
        launchpads: state.launchpads,
        rocketTypes: state.rocketTypes,
        statuses: state.statuses,
      }),
      storage: createJSONStorage(() => sqliteStateStorage),
    },
  ),
);

function toggleStringValue<TValue extends string>(
  values: TValue[],
  value: TValue,
): TValue[] {
  if (values.includes(value)) {
    return values.filter(entry => entry !== value);
  }

  return [...values, value];
}
