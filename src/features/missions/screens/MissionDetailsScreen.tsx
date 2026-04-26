import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { appColors } from '../../../app/theme/colors';
import { AppScreen } from '../../../components/AppScreen';
import { SectionHeader } from '../../../components/SectionHeader';
import { formatMissionDate } from '../../../utils/formatters';
import { MissionDetailsScreenProps } from '../../../navigation/navigation.types';

export function MissionDetailsScreen({
  route,
}: MissionDetailsScreenProps): React.JSX.Element {
  const { mission } = route.params;

  return (
    <AppScreen>
      <SectionHeader eyebrow="Mission Detail" title={mission.missionName} />
      <View style={styles.panel}>
        <DetailRow label="Rocket" value={mission.rocketName} />
        <DetailRow label="Launch date" value={formatMissionDate(mission.launchDateUtc)} />
        <DetailRow label="Launchpad" value={mission.launchpad} />
        <DetailRow label="Status" value={mission.status} />
      </View>
    </AppScreen>
  );
}

type DetailRowProps = {
  label: string;
  value: string;
};

function DetailRow({ label, value }: DetailRowProps): React.JSX.Element {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  detailLabel: {
    color: appColors.muted,
    fontSize: 14,
  },
  detailRow: {
    borderBottomColor: appColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 6,
    paddingVertical: 14,
  },
  detailValue: {
    color: appColors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  panel: {
    backgroundColor: appColors.surface,
    borderColor: appColors.border,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 24,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
});
