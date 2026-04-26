export const queryKeys = {
  missions: {
    all: ['missions'] as const,
    syncMeta: ['missions', 'sync-meta'] as const,
  },
} as const;
