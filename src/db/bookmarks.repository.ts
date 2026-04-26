import { executeSql } from './sqlite';
import {
  launchesRepository,
  type CachedLaunchRecord,
} from './launches.repository';

export const bookmarksRepository = {
  async addBookmark(launchId: string): Promise<void> {
    await executeSql(
      `INSERT INTO bookmarks (launch_id, created_at)
       VALUES (?, ?)
       ON CONFLICT(launch_id) DO UPDATE SET
         created_at = excluded.created_at;`,
      [launchId, Date.now()],
    );
  },

  async removeBookmark(launchId: string): Promise<void> {
    await executeSql('DELETE FROM bookmarks WHERE launch_id = ?;', [launchId]);
  },

  async fetchBookmarks(): Promise<CachedLaunchRecord[]> {
    const launches = await launchesRepository.fetchCachedLaunches();
    return launches.filter(launch => launch.isBookmarked);
  },
};
