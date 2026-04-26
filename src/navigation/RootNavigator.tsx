import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { appColors } from '../app/theme/colors';
import { BookmarksScreen } from '../screens/BookmarksScreen';
import { LaunchDetailScreen } from '../screens/LaunchDetailScreen';
import { LaunchListScreen } from '../screens/LaunchScreen/LaunchListScreen';
import { MapScreen } from '../screens/MapScreen';
import type { RootStackParamList } from './navigation.types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator(): React.JSX.Element {
  return (
    <Stack.Navigator
      initialRouteName="LaunchList"
      screenOptions={{
        contentStyle: {
          backgroundColor: appColors.background,
        },
        headerShadowVisible: false,
        headerStyle: {
          backgroundColor: appColors.background,
        },
        headerTintColor: appColors.textPrimary,
        headerTitleStyle: {
          fontWeight: '700',
        },
      }}>
      <Stack.Screen
        component={LaunchListScreen}
        name="LaunchList"
        options={{ title: 'Launches' }}
      />
      <Stack.Screen
        component={LaunchDetailScreen}
        name="LaunchDetail"
        options={({ route }) => ({
          title: route.params.launchName ?? 'Launch Detail',
        })}
      />
      <Stack.Screen
        component={BookmarksScreen}
        name="Bookmarks"
        options={{ title: 'Bookmarks' }}
      />
      <Stack.Screen
        component={MapScreen}
        name="Map"
        options={({ route }) => ({
          title: route.params?.title ?? 'Map',
        })}
      />
    </Stack.Navigator>
  );
}
