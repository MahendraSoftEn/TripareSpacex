import { launchesRepository, type LaunchRecordInput } from './launches.repository';
import { syncMetaRepository } from './syncMeta.repository';
import { Mission } from '../features/missions/types/mission.types';

export const missionCacheRepository = {
  async getAll(): Promise<Mission[]> {
    const launches = await launchesRepository.fetchCachedLaunches();

    return launches.map(launch => ({
      id: launch.id,
      launchDateUtc: launch.dateUtc,
      launchpad: launch.launchpad?.name ?? 'TBD',
      missionName: launch.name,
      patchImage: launch.patchImage,
      rocketName: launch.rocket ?? 'Unknown rocket',
      status:
        launch.success === true
          ? 'success'
          : launch.success === false
            ? 'failed'
            : 'upcoming',
    }));
  },

  async replaceAll(missions: Mission[]): Promise<void> {
    const launches: LaunchRecordInput[] = missions.map(mission => ({
      dateUtc: mission.launchDateUtc,
      id: mission.id,
      launchpad: mission.launchpad
        ? {
            fullName: mission.launchpad,
            id: mission.launchpad,
            latitude: null,
            longitude: null,
            name: mission.launchpad,
          }
        : null,
      name: mission.missionName,
      patchImage: mission.patchImage,
      rocket: mission.rocketName,
      success:
        mission.status === 'success'
          ? true
          : mission.status === 'failed'
            ? false
            : null,
      upcoming: mission.status === 'upcoming',
    }));

    await launchesRepository.bulkUpsertLaunches(launches);
    await syncMetaRepository.setLastSyncTime(new Date());
  },
};
