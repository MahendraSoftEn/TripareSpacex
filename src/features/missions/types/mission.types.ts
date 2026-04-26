export type MissionStatus = 'success' | 'failed' | 'upcoming';

export type Mission = {
  id: string;
  launchDateUtc: string;
  launchpad: string;
  missionName: string;
  patchImage: string | null;
  rocketName: string;
  status: MissionStatus;
};
