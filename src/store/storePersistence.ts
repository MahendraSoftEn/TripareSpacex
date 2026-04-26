import type { StateStorage } from 'zustand/middleware';

import { syncMetaRepository } from '../db/syncMeta.repository';

const STORE_PREFIX = 'zustand.';

export const sqliteStateStorage: StateStorage = {
  async getItem(name) {
    return syncMetaRepository.getLastSyncTime(`${STORE_PREFIX}${name}`);
  },

  async removeItem(name) {
    await syncMetaRepository.deleteValue(`${STORE_PREFIX}${name}`);
  },

  async setItem(name, value) {
    await syncMetaRepository.setLastSyncTime(value, `${STORE_PREFIX}${name}`);
  },
};
