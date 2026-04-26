import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '../../../utils/queryKeys';
import {
  fetchCachedMissions,
  fetchLastMissionsSyncTime,
  fetchMissions,
} from '../api/missions.service';

export function useMissions() {
  const queryClient = useQueryClient();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function hydrateFromCache() {
      try {
        const [cachedMissions, lastSyncedAt] = await Promise.all([
          fetchCachedMissions(),
          fetchLastMissionsSyncTime(),
        ]);

        if (!isMounted) {
          return;
        }

        queryClient.setQueryData(queryKeys.missions.all, cachedMissions);
        queryClient.setQueryData(queryKeys.missions.syncMeta, lastSyncedAt);
      } finally {
        if (isMounted) {
          setIsHydrated(true);
        }
      }
    }

    void hydrateFromCache();

    return () => {
      isMounted = false;
    };
  }, [queryClient]);

  useEffect(() => {
    let wasOffline = false;

    const unsubscribe = NetInfo.addEventListener(state => {
      const isConnected = Boolean(state.isConnected);

      if (isConnected && wasOffline) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.missions.all,
        });
      }

      wasOffline = !isConnected;
    });

    return unsubscribe;
  }, [queryClient]);

  const missionsQuery = useQuery({
    queryFn: async () => {
      const missions = await fetchMissions();
      const lastSyncedAt = await fetchLastMissionsSyncTime();

      queryClient.setQueryData(queryKeys.missions.syncMeta, lastSyncedAt);

      return missions;
    },
    queryKey: queryKeys.missions.all,
    enabled: isHydrated,
    placeholderData: previousData => previousData,
  });

  const lastSyncQuery = useQuery({
    queryFn: fetchLastMissionsSyncTime,
    queryKey: queryKeys.missions.syncMeta,
    enabled: isHydrated,
    placeholderData: previousData => previousData,
  });

  return {
    ...missionsQuery,
    data: missionsQuery.data ?? [],
    isLoading: !isHydrated || missionsQuery.isLoading,
    lastSyncedAt: lastSyncQuery.data ?? null,
  };
}
