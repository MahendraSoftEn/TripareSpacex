import React, { PropsWithChildren } from 'react';
import {
  ScrollView,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { appColors } from '../app/theme/colors';

type AppScreenProps = PropsWithChildren<{
  contentContainerStyle?: StyleProp<ViewStyle>;
  scrollEnabled?: boolean;
}>;

export function AppScreen({
  children,
  contentContainerStyle,
  scrollEnabled = true,
}: AppScreenProps): React.JSX.Element {
  const insets = useSafeAreaInsets();

  if (scrollEnabled) {
    return (
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 24, paddingTop: insets.top + 16 },
          contentContainerStyle,
        ]}
        style={styles.container}>
        {children}
      </ScrollView>
    );
  }

  return (
    <View
      style={[
        styles.container,
        styles.screen,
        { paddingBottom: insets.bottom + 24, paddingTop: insets.top + 16 },
        contentContainerStyle,
      ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: appColors.background,
    flex: 1,
  },
  screen: {
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
});
