export type ColumnType =
  | 'INTEGER'
  | 'BIGINT'
  | 'DOUBLE'
  | 'FLOAT'
  | 'DECIMAL'
  | 'VARCHAR'
  | 'BOOLEAN'
  | 'DATE'
  | 'TIMESTAMP'
  | 'TIME'
  | 'JSON'
  | 'BLOB'
  | 'UNKNOWN';

export interface ColumnMetadata {
  name: string;
  type: string;
  normalizedType: ColumnType;
  nullable?: boolean;
}

export interface TableColumnSchema {
  name: string;
  type: string;
  nullable: boolean;
  isPrimaryKey?: boolean;
}

export interface TableCatalog {
  name: string;
  columns: TableColumnSchema[];
  estimatedRowCount: number;
  sourceType?: 'csv' | 'json' | 'parquet' | 'xlsx' | 'sample' | 'view';
}

export type StatementType =
  | 'SELECT'
  | 'CREATE_TABLE'
  | 'CREATE_VIEW'
  | 'INSERT'
  | 'UPDATE'
  | 'DELETE'
  | 'DROP'
  | 'ALTER'
  | 'TRUNCATE'
  | 'COPY'
  | 'OTHER';

export interface QueryExecutionResult {
  queryId: string;
  sql: string;
  columns: ColumnMetadata[];
  rows: Record<string, unknown>[];
  totalRows: number;
  durationMs: number;
  timestamp: number;
  error?: string;
  errorPosition?: {
    line: number;
    column?: number;
  };
  statementType?: StatementType;
  targetTable?: string;
  affectedRows?: number;
  message?: string;
  schemaSummary?: TableCatalog;
}

export interface EditorTab {
  id: string;
  title: string;
  sql: string;
  isDirty?: boolean;
  lastExecutedAt?: number;
}

export interface QueryHistoryRecord {
  id: string;
  sql: string;
  timestamp: number;
  durationMs: number;
  rowCount: number;
  status: 'success' | 'error';
  errorMessage?: string;
}

export type SupportedChartType = 'bar' | 'line' | 'area';

export interface EngineStats {
  isReady: boolean;
  isInitializing: boolean;
  version: string;
  bufferMemoryMb: number;
  tablesCount: number;
  error: string | null;
}

export interface SampleDatasetDefinition {
  id: string;
  name: string;
  tableName: string;
  description: string;
  category: 'Fintech' | 'DevOps' | 'SaaS Analytics';
  rowCountEstimated: number;
  suggestedSql: string;
  dataGenerator: () => Record<string, unknown>[];
}

export type AppTheme = 'obsidian' | 'midnight' | 'tokyo' | 'nordic' | 'paper-light';

export interface ThemeDefinition {
  id: AppTheme;
  name: string;
  tagline: string;
  isLight: boolean;
  swatches: [string, string, string];
}
