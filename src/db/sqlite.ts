import SQLite, {
  type ResultSet,
  type SQLiteDatabase,
  type SQLStatement,
} from 'react-native-sqlite-storage';

export type DatabaseStatus = 'idle' | 'initializing' | 'ready';

const DATABASE_NAME = 'tripare-spacex.db';
const DATABASE_VERSION = 1;

let databasePromise: Promise<SQLiteDatabase> | null = null;
let status: DatabaseStatus = 'idle';

SQLite.enablePromise(true);

const migrations: Array<{
  statements: SQLStatement[];
  version: number;
}> = [
  {
    statements: [
      [
        'CREATE TABLE IF NOT EXISTS launchpads (' +
          'id TEXT PRIMARY KEY NOT NULL,' +
          'name TEXT NOT NULL,' +
          'full_name TEXT NOT NULL,' +
          'latitude REAL,' +
          'longitude REAL,' +
          'updated_at INTEGER NOT NULL' +
          ');',
      ],
      [
        'CREATE TABLE IF NOT EXISTS launches (' +
          'id TEXT PRIMARY KEY NOT NULL,' +
          'name TEXT NOT NULL,' +
          'date_utc TEXT NOT NULL,' +
          'rocket TEXT,' +
          'success INTEGER,' +
          'upcoming INTEGER NOT NULL,' +
          'launchpad_id TEXT,' +
          'patch_image TEXT,' +
          'updated_at INTEGER NOT NULL,' +
          'FOREIGN KEY (launchpad_id) REFERENCES launchpads(id) ON DELETE SET NULL' +
          ');',
      ],
      [
        'CREATE TABLE IF NOT EXISTS bookmarks (' +
          'launch_id TEXT PRIMARY KEY NOT NULL,' +
          'created_at INTEGER NOT NULL,' +
          'FOREIGN KEY (launch_id) REFERENCES launches(id) ON DELETE CASCADE' +
          ');',
      ],
      [
        'CREATE TABLE IF NOT EXISTS sync_meta (' +
          'key TEXT PRIMARY KEY NOT NULL,' +
          'value TEXT NOT NULL,' +
          'updated_at INTEGER NOT NULL' +
          ');',
      ],
      ['CREATE INDEX IF NOT EXISTS idx_launches_date_utc ON launches(date_utc);'],
      [
        'CREATE INDEX IF NOT EXISTS idx_launches_launchpad_id ON launches(launchpad_id);',
      ],
      ['CREATE INDEX IF NOT EXISTS idx_bookmarks_created_at ON bookmarks(created_at);'],
    ],
    version: 1,
  },
];

export async function initializeDatabase(): Promise<DatabaseStatus> {
  await getDatabase();
  return status;
}

export function getDatabaseStatus(): DatabaseStatus {
  return status;
}

export async function getDatabase(): Promise<SQLiteDatabase> {
  if (!databasePromise) {
    status = 'initializing';
    databasePromise = openDatabase().then(async database => {
      await database.executeSql('PRAGMA foreign_keys = ON;');
      await database.executeSql('PRAGMA journal_mode = WAL;');
      await runMigrations(database);
      status = 'ready';
      return database;
    });
  }

  return databasePromise;
}

export async function executeSql(
  statement: string,
  params: ReadonlyArray<unknown> = [],
): Promise<ResultSet[]> {
  const database = await getDatabase();
  return database.executeSql(statement, params as unknown[]);
}

export async function executeBatch(
  statements: SQLStatement[],
): Promise<Array<ResultSet[]>> {
  const database = await getDatabase();
  return database.sqlBatch(statements);
}

async function openDatabase(): Promise<SQLiteDatabase> {
  return SQLite.openDatabase({
    location: 'default',
    name: DATABASE_NAME,
  });
}

async function runMigrations(database: SQLiteDatabase): Promise<void> {
  const currentVersion = await getUserVersion(database);

  for (const migration of migrations) {
    if (migration.version <= currentVersion) {
      continue;
    }

    await database.sqlBatch([
      ...migration.statements,
      [`PRAGMA user_version = ${migration.version};`],
    ]);
  }

  if (currentVersion > DATABASE_VERSION) {
    throw new Error(
      `Database version ${currentVersion} is newer than supported version ${DATABASE_VERSION}.`,
    );
  }
}

async function getUserVersion(database: SQLiteDatabase): Promise<number> {
  const [result] = await database.executeSql('PRAGMA user_version;');

  if (!result) {
    return 0;
  }

  const row = result.rows.item(0) as { user_version?: number };
  return row.user_version ?? 0;
}
