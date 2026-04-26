import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { appColors } from '../app/theme/colors';

type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
};

export function SectionHeader({
  eyebrow,
  title,
}: SectionHeaderProps): React.JSX.Element {
  return (
    <View style={styles.container}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  eyebrow: {
    color: appColors.accent,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    color: appColors.textPrimary,
    fontSize: 28,
    fontWeight: '700',
  },
});
