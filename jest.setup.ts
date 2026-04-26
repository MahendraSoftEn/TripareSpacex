jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => jest.fn()),
}));

jest.mock(
  'react-native-sqlite-storage',
  () => {
    const executeSql = jest.fn(async (statement: string) => {
      if (statement.includes('PRAGMA user_version')) {
        return [
          {
            rows: {
              item: () => ({ user_version: 0 }),
              length: 1,
              raw: () => [{ user_version: 0 }],
            },
          },
        ];
      }

      return [
        {
          rows: {
            item: () => ({}),
            length: 0,
            raw: () => [],
          },
        },
      ];
    });

    return {
      DEBUG: jest.fn(),
      enablePromise: jest.fn(),
      openDatabase: jest.fn(async () => ({
        executeSql,
        sqlBatch: jest.fn(async () => []),
      })),
    };
  },
  { virtual: true },
);

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');

  return {
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
    useSafeAreaInsets: () => ({
      bottom: 0,
      left: 0,
      right: 0,
      top: 0,
    }),
  };
});
