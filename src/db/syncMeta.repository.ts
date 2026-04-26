import { executeSql } from './sqlite';

const DEFAULT_SYNC_KEY = 'launches.last_sync';

type SyncMetaRow = {
  value: string;
};

export const syncMetaRepository = {
  async deleteValue(key: string): Promise<void> {
    await executeSql('DELETE FROM sync_meta WHERE key = ?;', [key]);
  },

  async getLastSyncTime(key = DEFAULT_SYNC_KEY): Promise<string | null> {
    const [result] = await executeSql(
      'SELECT value FROM sync_meta WHERE key = ? LIMIT 1;',
      [key],
    );

    if (!result || result.rows.length === 0) {
      return null;
    }

    const row = result.rows.item(0) as SyncMetaRow;
    return row.value;
  },

  async setLastSyncTime(
    value: Date | number | string,
    key = DEFAULT_SYNC_KEY,
  ): Promise<void> {
    const serializedValue =
      value instanceof Date ? value.toISOString() : String(value);

    await executeSql(
      `INSERT INTO sync_meta (key, value, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET
         value = excluded.value,
         updated_at = excluded.updated_at;`,
      [key, serializedValue, Date.now()],
    );
  },
};
