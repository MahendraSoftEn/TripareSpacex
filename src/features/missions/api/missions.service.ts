import {
  getLaunches,
  getLaunchpadById,
  type SpaceXLaunch,
  type SpaceXLaunchpad,
} from '../../../api/spacexApi';
import { launchesRepository } from '../../../db/launches.repository';
import { missionCacheRepository } from '../../../db/missionCache.repository';
import { syncMetaRepository } from '../../../db/syncMeta.repository';
import { Mission } from '../types/mission.types';

function mapLaunchToMission(
  launch: SpaceXLaunch,
  launchpad?: SpaceXLaunchpad,
): Mission {
  return {
    id: launch.id,
    launchDateUtc: launch.date_utc,
    launchpad: launchpad?.name ?? 'TBD',
    missionName: launch.name,
    patchImage: launch.links?.patch?.small ?? null,
    rocketName: launch.rocket ?? 'Unknown rocket',
    status:
      launch.success === true
        ? 'success'
        : launch.success === false
          ? 'failed'
          : 'upcoming',
  };
}

function mapLaunchToCacheRecord(
  launch: SpaceXLaunch,
  launchpad?: SpaceXLaunchpad,
) {
  return {
    dateUtc: launch.date_utc,
    id: launch.id,
    launchpad: launchpad
      ? {
          fullName: launchpad.full_name,
          id: launchpad.id,
          latitude: launchpad.latitude ?? null,
          longitude: launchpad.longitude ?? null,
          name: launchpad.name,
        }
      : null,
    name: launch.name,
    patchImage: launch.links?.patch?.small ?? null,
    rocket: launch.rocket ?? null,
    success: launch.success ?? null,
    upcoming: launch.upcoming,
  };
}

export async function fetchMissions(): Promise<Mission[]> {
  const launches = await getLaunches();
  const upcomingLaunches = launches
    .filter(launch => launch.upcoming)
    .sort(
      (left, right) =>
        new Date(left.date_utc).getTime() - new Date(right.date_utc).getTime(),
    );

  const uniqueLaunchpadIds = [
    ...new Set(
      upcomingLaunches
        .map(launch => launch.launchpad)
        .filter((launchpadId): launchpadId is string => Boolean(launchpadId)),
    ),
  ];

  const launchpadEntries = await Promise.all(
    uniqueLaunchpadIds.map(async launchpadId => {
      const launchpad = await getLaunchpadById(launchpadId);
      return [launchpadId, launchpad] as const;
    }),
  );

  const launchpadsById = new Map<string, SpaceXLaunchpad>(launchpadEntries);
  const cachedLaunches = upcomingLaunches.map(launch =>
    mapLaunchToCacheRecord(launch, launchpadsById.get(launch.launchpad ?? '')),
  );
  const missions = upcomingLaunches.map(launch =>
    mapLaunchToMission(launch, launchpadsById.get(launch.launchpad ?? '')),
  );

  await launchesRepository.bulkUpsertLaunches(cachedLaunches);
  await syncMetaRepository.setLastSyncTime(new Date());
  return missions;
}

export function fetchCachedMissions(): Promise<Mission[]> {
  return missionCacheRepository.getAll();
}

export function fetchLastMissionsSyncTime(): Promise<string | null> {
  return syncMetaRepository.getLastSyncTime();
}
