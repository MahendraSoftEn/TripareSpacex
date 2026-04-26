import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { appColors } from '../app/theme/colors';
import { AppScreen } from '../components/AppScreen';

export function BookmarksScreen(): React.JSX.Element {
  return (
    <AppScreen contentContainerStyle={styles.content}>
      <Text style={styles.title}>Bookmarks</Text>
      <View style={styles.card}>
        <Text style={styles.message}>
          Saved launches will appear here once bookmark state is connected.
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
    padding: 20,
  },
  content: {
    gap: 16,
  },
  message: {
    color: appColors.textSecondary,
    fontSize: 16,
    lineHeight: 24,
  },
  title: {
    color: appColors.textPrimary,
    fontSize: 28,
    fontWeight: '800',
  },
});
