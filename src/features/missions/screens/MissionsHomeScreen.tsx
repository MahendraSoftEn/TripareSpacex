import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { appColors } from '../../../app/theme/colors';
import { AppScreen } from '../../../components/AppScreen';
import { SectionHeader } from '../../../components/SectionHeader';
import { HomeScreenProps } from '../../../navigation/navigation.types';
import { useOnlineStatus } from '../../../hooks/useOnlineStatus';
import { formatLastSyncedTime } from '../../../utils/formatters';
import { MissionCard } from '../components/MissionCard';
import { useMissions } from '../hooks/useMissions';

export function MissionsHomeScreen({
  navigation,
}: HomeScreenProps): React.JSX.Element {
  const { data, isFetching, isLoading, lastSyncedAt } = useMissions();
  const isOnline = useOnlineStatus();

  return (
    <AppScreen contentContainerStyle={styles.content}>
      <SectionHeader eyebrow="Mission Control" title="SpaceX Launch Overview" />
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Realtime launch tracking architecture starter</Text>
        <Text style={styles.heroSubtitle}>
          Shared layers stay stable while feature slices scale with new mission,
          rocket, and telemetry workflows.
        </Text>
        <Text style={styles.connection}>
          Network: {isOnline ? 'online' : 'offline fallback'}
        </Text>
        <Text style={styles.syncStatus}>
          Sync: {isFetching ? 'refreshing in background' : 'cache ready'}
        </Text>
        <Text style={styles.syncMeta}>
          Last synced: {formatLastSyncedTime(lastSyncedAt)}
        </Text>
      </View>
      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={appColors.accent} />
        </View>
      ) : (
        <View style={styles.list}>
          {data.map(mission => (
            <MissionCard
              key={mission.id}
              mission={mission}
              onPress={selectedMission =>
                navigation.navigate('MissionDetails', {
                  mission: selectedMission,
                })
              }
            />
          ))}
        </View>
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  connection: {
    color: appColors.success,
    fontSize: 13,
    fontWeight: '600',
  },
  content: {
    gap: 20,
  },
  hero: {
    backgroundColor: appColors.surface,
    borderColor: appColors.border,
    borderRadius: 22,
    borderWidth: 1,
    gap: 10,
    padding: 20,
  },
  heroSubtitle: {
    color: appColors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
  },
  heroTitle: {
    color: appColors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
  },
  syncMeta: {
    color: appColors.textSecondary,
    fontSize: 13,
  },
  syncStatus: {
    color: appColors.accent,
    fontSize: 13,
    fontWeight: '600',
  },
  list: {
    gap: 14,
  },
  loader: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 180,
  },
});
