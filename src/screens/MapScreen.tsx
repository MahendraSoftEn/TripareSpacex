import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { appColors } from '../app/theme/colors';
import { AppScreen } from '../components/AppScreen';
import type { MapScreenProps } from '../navigation/navigation.types';

export function MapScreen({ route }: MapScreenProps): React.JSX.Element {
  const params = route.params;

  return (
    <AppScreen contentContainerStyle={styles.content}>
      <Text style={styles.title}>{params?.title ?? 'Map'}</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Launch ID</Text>
        <Text style={styles.value}>{params?.launchId ?? 'Not provided'}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>Coordinates</Text>
        <Text style={styles.value}>
          {params?.latitude != null && params?.longitude != null
            ? `${params.latitude}, ${params.longitude}`
            : 'No coordinates provided'}
        </Text>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: appColors.surface,
    borderColor: appColors.border,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
    padding: 20,
  },
  content: {
    gap: 16,
  },
  label: {
    color: appColors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  title: {
    color: appColors.textPrimary,
    fontSize: 28,
    fontWeight: '800',
  },
  value: {
    color: appColors.textPrimary,
    fontSize: 16,
    lineHeight: 24,
  },
});
