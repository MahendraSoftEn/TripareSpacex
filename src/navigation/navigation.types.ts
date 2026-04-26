import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { Mission } from '../features/missions/types/mission.types';

export type RootStackParamList = {
  LaunchList: undefined;
  LaunchDetail: {
    launchId: string;
    launchName?: string;
  };
  Bookmarks: undefined;
  Map:
    | {
        launchId?: string;
        latitude?: number;
        longitude?: number;
        title?: string;
      }
    | undefined;
};

export type LaunchListScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'LaunchList'
>;

export type LaunchDetailScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'LaunchDetail'
>;

export type BookmarksScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'Bookmarks'
>;

export type MapScreenProps = NativeStackScreenProps<RootStackParamList, 'Map'>;

export type LegacyMissionStackParamList = {
  Home: undefined;
  MissionDetails: {
    mission: Mission;
  };
};

export type HomeScreenProps = NativeStackScreenProps<
  LegacyMissionStackParamList,
  'Home'
>;

export type MissionDetailsScreenProps = NativeStackScreenProps<
  LegacyMissionStackParamList,
  'MissionDetails'
>;
