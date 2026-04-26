declare module 'react-native-sqlite-storage' {
  export type SQLStatement = [string, unknown[]?];

  export type ResultSetRowList = {
    item(index: number): unknown;
    length: number;
    raw(): unknown[];
  };

  export type ResultSet = {
    rows: ResultSetRowList;
  };

  export type SQLiteDatabase = {
    executeSql(
      statement: string,
      params?: unknown[],
    ): Promise<ResultSet[]>;
    sqlBatch(statements: SQLStatement[]): Promise<Array<ResultSet[]>>;
  };

  export type OpenDatabaseParams = {
    createFromLocation?: string;
    location?: 'default' | 'Library' | 'Documents' | 'Shared';
    name: string;
  };

  const SQLite: {
    DEBUG(enabled: boolean): void;
    enablePromise(enabled: boolean): void;
    openDatabase(options: OpenDatabaseParams): Promise<SQLiteDatabase>;
  };

  export default SQLite;
}
