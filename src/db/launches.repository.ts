import { executeBatch, executeSql } from './sqlite';

export type LaunchpadRecord = {
  fullName: string;
  id: string;
  latitude: number | null;
  longitude: number | null;
  name: string;
};

export type LaunchRecordInput = {
  dateUtc: string;
  id: string;
  launchpad: LaunchpadRecord | null;
  name: string;
  patchImage: string | null;
  rocket: string | null;
  success: boolean | null;
  upcoming: boolean;
};

export type CachedLaunchRecord = {
  dateUtc: string;
  id: string;
  isBookmarked: boolean;
  launchpad: LaunchpadRecord | null;
  name: string;
  patchImage: string | null;
  rocket: string | null;
  success: boolean | null;
  upcoming: boolean;
};

type LaunchRow = {
  date_utc: string;
  id: string;
  is_bookmarked: number;
  launchpad_full_name: string | null;
  launchpad_id: string | null;
  launchpad_latitude: number | null;
  launchpad_longitude: number | null;
  launchpad_name: string | null;
  name: string;
  patch_image: string | null;
  rocket: string | null;
  success: number | null;
  upcoming: number;
};

export const launchesRepository = {
  async fetchCachedLaunches(): Promise<CachedLaunchRecord[]> {
    const [result] = await executeSql(
      `SELECT
        launches.id,
        launches.name,
        launches.date_utc,
        launches.rocket,
        launches.success,
        launches.upcoming,
        launches.patch_image,
        launchpads.id AS launchpad_id,
        launchpads.name AS launchpad_name,
        launchpads.full_name AS launchpad_full_name,
        launchpads.latitude AS launchpad_latitude,
        launchpads.longitude AS launchpad_longitude,
        CASE WHEN bookmarks.launch_id IS NULL THEN 0 ELSE 1 END AS is_bookmarked
      FROM launches
      LEFT JOIN launchpads ON launchpads.id = launches.launchpad_id
      LEFT JOIN bookmarks ON bookmarks.launch_id = launches.id
      ORDER BY launches.date_utc ASC;`,
    );

    if (!result) {
      return [];
    }

    return mapRows(result.rows.raw() as LaunchRow[]);
  },

  async upsertLaunch(launch: LaunchRecordInput): Promise<void> {
    await this.bulkUpsertLaunches([launch]);
  },

  async bulkUpsertLaunches(launches: LaunchRecordInput[]): Promise<void> {
    if (launches.length === 0) {
      return;
    }

    const updatedAt = Date.now();
    const statements: Array<[string, unknown[]?]> = [];
    const uniqueLaunchpads = new Map<string, LaunchpadRecord>();

    launches.forEach(launch => {
      if (launch.launchpad) {
        uniqueLaunchpads.set(launch.launchpad.id, launch.launchpad);
      }
    });

    uniqueLaunchpads.forEach(launchpad => {
      statements.push([
        `INSERT INTO launchpads (id, name, full_name, latitude, longitude, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           name = excluded.name,
           full_name = excluded.full_name,
           latitude = excluded.latitude,
           longitude = excluded.longitude,
           updated_at = excluded.updated_at;`,
        [
          launchpad.id,
          launchpad.name,
          launchpad.fullName,
          launchpad.latitude,
          launchpad.longitude,
          updatedAt,
        ],
      ]);
    });

    launches.forEach(launch => {
      statements.push([
        `INSERT INTO launches (
          id,
          name,
          date_utc,
          rocket,
          success,
          upcoming,
          launchpad_id,
          patch_image,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          date_utc = excluded.date_utc,
          rocket = excluded.rocket,
          success = excluded.success,
          upcoming = excluded.upcoming,
          launchpad_id = excluded.launchpad_id,
          patch_image = excluded.patch_image,
          updated_at = excluded.updated_at;`,
        [
          launch.id,
          launch.name,
          launch.dateUtc,
          launch.rocket,
          launch.success == null ? null : launch.success ? 1 : 0,
          launch.upcoming ? 1 : 0,
          launch.launchpad?.id ?? null,
          launch.patchImage,
          updatedAt,
        ],
      ]);
    });

    await executeBatch(statements);
  },
};

function mapRows(rows: LaunchRow[]): CachedLaunchRecord[] {
  return rows.map(row => ({
    dateUtc: row.date_utc,
    id: row.id,
    isBookmarked: row.is_bookmarked === 1,
    launchpad: row.launchpad_id
      ? {
          fullName: row.launchpad_full_name ?? row.launchpad_name ?? row.launchpad_id,
          id: row.launchpad_id,
          latitude: row.launchpad_latitude,
          longitude: row.launchpad_longitude,
          name: row.launchpad_name ?? row.launchpad_id,
        }
      : null,
    name: row.name,
    patchImage: row.patch_image,
    rocket: row.rocket,
    success: row.success == null ? null : row.success === 1,
    upcoming: row.upcoming === 1,
  }));
}
