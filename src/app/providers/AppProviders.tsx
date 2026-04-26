import React, { PropsWithChildren, useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import {
  QueryClient,
  QueryClientProvider,
  onlineManager,
} from '@tanstack/react-query';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { initializeDatabase } from '../../db/sqlite';
import { appColors } from '../theme/colors';

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: appColors.background,
    card: appColors.surface,
    border: appColors.border,
    primary: appColors.accent,
    text: appColors.textPrimary,
  },
};

export function AppProviders({
  children,
}: PropsWithChildren): React.JSX.Element {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnReconnect: true,
            staleTime: 60_000,
          },
        },
      }),
  );

  useEffect(() => {
    void initializeDatabase();
  }, []);

  useEffect(() => {
    onlineManager.setEventListener(setOnline => {
      const unsubscribe = NetInfo.addEventListener(state => {
        setOnline(Boolean(state.isConnected));
      });

      return unsubscribe;
    });
  }, []);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <NavigationContainer theme={navigationTheme}>
          {children}
        </NavigationContainer>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
