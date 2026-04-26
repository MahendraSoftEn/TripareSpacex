import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { appColors } from '../../../app/theme/colors';
import { formatMissionDate } from '../../../utils/formatters';
import { Mission } from '../types/mission.types';

type MissionCardProps = {
  mission: Mission;
  onPress: (mission: Mission) => void;
};

export function MissionCard({
  mission,
  onPress,
}: MissionCardProps): React.JSX.Element {
  return (
    <Pressable onPress={() => onPress(mission)} style={styles.card}>
      <View style={styles.header}>
        {mission.patchImage ? (
          <Image source={{ uri: mission.patchImage }} style={styles.patch} />
        ) : (
          <View style={[styles.patch, styles.placeholder]}>
            <Text style={styles.placeholderText}>SX</Text>
          </View>
        )}
        <View style={styles.headerCopy}>
          <Text style={styles.title}>{mission.missionName}</Text>
          <Text style={styles.subtitle}>{mission.rocketName}</Text>
        </View>
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.metaLabel}>Launch window</Text>
        <Text style={styles.metaValue}>
          {formatMissionDate(mission.launchDateUtc)}
        </Text>
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.metaLabel}>Pad</Text>
        <Text style={styles.metaValue}>{mission.launchpad}</Text>
      </View>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{mission.status}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#143852',
    borderRadius: 999,
    marginTop: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeText: {
    color: appColors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  card: {
    backgroundColor: appColors.surface,
    borderColor: appColors.border,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  headerCopy: {
    flex: 1,
    gap: 2,
  },
  metaLabel: {
    color: appColors.muted,
    fontSize: 13,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  metaValue: {
    color: appColors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  patch: {
    borderRadius: 12,
    height: 56,
    width: 56,
  },
  placeholder: {
    alignItems: 'center',
    backgroundColor: '#12314A',
    justifyContent: 'center',
  },
  placeholderText: {
    color: appColors.textPrimary,
    fontWeight: '700',
  },
  subtitle: {
    color: appColors.textSecondary,
    fontSize: 14,
  },
  title: {
    color: appColors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
});
