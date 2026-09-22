import * as duckdb from '@duckdb/duckdb-wasm';
import type { AsyncDuckDB, AsyncDuckDBConnection } from '@duckdb/duckdb-wasm';
import type {
  ColumnMetadata,
  ColumnType,
  QueryExecutionResult,
  TableCatalog,
  TableColumnSchema,
  EngineStats,
  StatementType,
} from '@/types';

const DUCKDB_VERSION = '1.29.0';
const DEFAULT_BUNDLES: duckdb.DuckDBBundles = {
  mvp: {
    mainModule: `https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@${DUCKDB_VERSION}/dist/duckdb-mvp.wasm`,
    mainWorker: `https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@${DUCKDB_VERSION}/dist/duckdb-browser-mvp.worker.js`,
  },
  eh: {
    mainModule: `https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@${DUCKDB_VERSION}/dist/duckdb-eh.wasm`,
    mainWorker: `https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@${DUCKDB_VERSION}/dist/duckdb-browser-eh.worker.js`,
  },
};

class DuckDBClient {
  private static instance: DuckDBClient | null = null;
  private db: AsyncDuckDB | null = null;
  private conn: AsyncDuckDBConnection | null = null;
  private worker: Worker | null = null;
  private isInitializing = false;
  private initPromise: Promise<void> | null = null;
  private statusListeners: Array<(stats: EngineStats) => void> = [];

  private escapeSql(value: string): string {
    return value.replace(/'/g, "''");
  }

  private stats: EngineStats = {
    isReady: false,
    isInitializing: false,
    version: `DuckDB v${DUCKDB_VERSION} (WASM)`,
    bufferMemoryMb: 0,
    tablesCount: 0,
    error: null,
  };

  private constructor() {}

  public static getInstance(): DuckDBClient {
    if (!DuckDBClient.instance) {
      DuckDBClient.instance = new DuckDBClient();
    }
    return DuckDBClient.instance;
  }

  public subscribeStatus(listener: (stats: EngineStats) => void): () => void {
    this.statusListeners.push(listener);
    listener(this.stats);
    return () => {
      this.statusListeners = this.statusListeners.filter((l) => l !== listener);
    };
  }

  private notifyStatus(): void {
    this.statusListeners.forEach((listener) => listener(this.stats));
  }

  public getStats(): EngineStats {
    return { ...this.stats };
  }

  public async init(): Promise<void> {
    if (typeof window === 'undefined') return;

    if (this.db && this.conn) {
      return;
    }

    if (this.isInitializing && this.initPromise) {
      return this.initPromise;
    }

    this.isInitializing = true;
    this.stats.isInitializing = true;
    this.notifyStatus();

    this.initPromise = (async () => {
      try {
        let bundles: duckdb.DuckDBBundles;
        try {
          bundles = await duckdb.getJsDelivrBundles();
        } catch {
          bundles = DEFAULT_BUNDLES;
        }

        const bundle = await duckdb.selectBundle(bundles);
        if (!bundle.mainWorker) {
          throw new Error('DuckDB worker bundle was not resolved properly.');
        }

        const workerResponse = await fetch(bundle.mainWorker);
        const workerCode = await workerResponse.text();
        const workerBlob = new Blob([workerCode], { type: 'application/javascript' });
        const workerUrl = URL.createObjectURL(workerBlob);
        this.worker = new Worker(workerUrl);

        const logger = new duckdb.ConsoleLogger(duckdb.LogLevel.WARNING);
        this.db = new duckdb.AsyncDuckDB(logger, this.worker);
        await this.db.instantiate(bundle.mainModule, bundle.pthreadWorker);
        URL.revokeObjectURL(workerUrl);

        this.conn = await this.db.connect();

        try {
          await this.conn.query('SET preserve_insertion_order = false;');
        } catch {
        }

        this.stats.isReady = true;
        this.stats.isInitializing = false;
        this.stats.error = null;
        await this.updateCatalogStats();
        this.notifyStatus();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        this.stats.isReady = false;
        this.stats.isInitializing = false;
        this.stats.error = message;
        this.notifyStatus();
        throw new Error(`Failed to initialize DuckDB-WASM: ${message}`);
      } finally {
        this.isInitializing = false;
      }
    })();

    return this.initPromise;
  }

  private normalizeColumnType(rawType: string): ColumnType {
    const upper = rawType.toUpperCase();
    if (upper.includes('INT64') || upper.includes('BIGINT') || upper.includes('INT8') || upper.includes('HUGEINT')) return 'BIGINT';
    if (upper.includes('INT') || upper.includes('TINYINT') || upper.includes('SMALLINT') || upper.includes('INT32') || upper.includes('INT16')) return 'INTEGER';
    if (upper.includes('DOUBLE') || upper.includes('FLOAT8') || upper.includes('FLOAT64')) return 'DOUBLE';
    if (upper.includes('FLOAT') || upper.includes('REAL') || upper.includes('FLOAT32')) return 'FLOAT';
    if (upper.includes('DECIMAL') || upper.includes('NUMERIC')) return 'DECIMAL';
    if (upper.includes('VARCHAR') || upper.includes('TEXT') || upper.includes('STRING') || upper.includes('UTF8') || upper.includes('CHAR')) return 'VARCHAR';
    if (upper.includes('BOOL')) return 'BOOLEAN';
    if (upper.includes('TIMESTAMP')) return 'TIMESTAMP';
    if (upper.includes('DATE')) return 'DATE';
    if (upper.includes('TIME')) return 'TIME';
    if (upper.includes('JSON') || upper.includes('STRUCT') || upper.includes('MAP') || upper.includes('LIST')) return 'JSON';
    if (upper.includes('BLOB') || upper.includes('BINARY')) return 'BLOB';
    return 'VARCHAR';
  }

  private serializeValue(val: unknown): unknown {
    if (val === null || val === undefined) return null;
    if (typeof val === 'bigint') {
      return val <= BigInt(Number.MAX_SAFE_INTEGER) && val >= BigInt(Number.MIN_SAFE_INTEGER)
        ? Number(val)
        : val.toString();
    }
    if (val instanceof Date) {
      return val.toISOString();
    }
    if (typeof val === 'object') {
      try {
        return JSON.parse(
          JSON.stringify(val, (_, v) => (typeof v === 'bigint' ? v.toString() : v))
        );
      } catch {
        return String(val);
      }
    }
    return val;
  }

  public parseStatementMetadata(sql: string): {
    type: StatementType;
    targetTable?: string;
  } {
    const clean = sql.trim().replace(/^--.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '').trim();

    if (/^CREATE\s+(?:OR\s+REPLACE\s+)?TABLE/i.test(clean)) {
      const match = clean.match(/CREATE\s+(?:OR\s+REPLACE\s+)?TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?["'`]?([a-zA-Z0-9_]+)["'`]?/i);
      return { type: 'CREATE_TABLE', targetTable: match ? match[1] : undefined };
    }
    if (/^CREATE\s+(?:OR\s+REPLACE\s+)?VIEW/i.test(clean)) {
      const match = clean.match(/CREATE\s+(?:OR\s+REPLACE\s+)?VIEW\s+(?:IF\s+NOT\s+EXISTS\s+)?["'`]?([a-zA-Z0-9_]+)["'`]?/i);
      return { type: 'CREATE_VIEW', targetTable: match ? match[1] : undefined };
    }
    if (/^INSERT\s+INTO/i.test(clean)) {
      const match = clean.match(/INSERT\s+INTO\s+["'`]?([a-zA-Z0-9_]+)["'`]?/i);
      return { type: 'INSERT', targetTable: match ? match[1] : undefined };
    }
    if (/^UPDATE/i.test(clean)) {
      const match = clean.match(/UPDATE\s+["'`]?([a-zA-Z0-9_]+)["'`]?/i);
      return { type: 'UPDATE', targetTable: match ? match[1] : undefined };
    }
    if (/^DELETE\s+FROM/i.test(clean)) {
      const match = clean.match(/DELETE\s+FROM\s+["'`]?([a-zA-Z0-9_]+)["'`]?/i);
      return { type: 'DELETE', targetTable: match ? match[1] : undefined };
    }
    if (/^DROP\s+TABLE/i.test(clean)) {
      const match = clean.match(/DROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?["'`]?([a-zA-Z0-9_]+)["'`]?/i);
      return { type: 'DROP', targetTable: match ? match[1] : undefined };
    }
    if (/^DROP\s+VIEW/i.test(clean)) {
      const match = clean.match(/DROP\s+VIEW\s+(?:IF\s+EXISTS\s+)?["'`]?([a-zA-Z0-9_]+)["'`]?/i);
      return { type: 'DROP', targetTable: match ? match[1] : undefined };
    }
    if (/^ALTER\s+TABLE/i.test(clean)) {
      const match = clean.match(/ALTER\s+TABLE\s+["'`]?([a-zA-Z0-9_]+)["'`]?/i);
      return { type: 'ALTER', targetTable: match ? match[1] : undefined };
    }
    if (/^TRUNCATE/i.test(clean)) {
      const match = clean.match(/TRUNCATE\s+(?:TABLE\s+)?["'`]?([a-zA-Z0-9_]+)["'`]?/i);
      return { type: 'TRUNCATE', targetTable: match ? match[1] : undefined };
    }
    if (/^COPY/i.test(clean)) {
      const match = clean.match(/COPY\s+["'`]?([a-zA-Z0-9_]+)["'`]?/i);
      return { type: 'COPY', targetTable: match ? match[1] : undefined };
    }
    if (/^(?:SELECT|WITH|EXPLAIN|DESCRIBE|PRAGMA|SHOW)/i.test(clean)) {
      return { type: 'SELECT' };
    }
    return { type: 'OTHER' };
  }

  public async getTableSchema(tableName: string): Promise<TableCatalog | null> {
    await this.init();
    if (!this.conn) return null;

    try {
      const colResult = await this.conn.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'main' AND table_name = '${this.escapeSql(tableName)}'
        ORDER BY ordinal_position ASC;
      `);

      const cols: TableColumnSchema[] = (colResult.toArray() as Array<{ toJSON: () => Record<string, unknown> }>).map((c) => {
        const json = c.toJSON();
        return {
          name: String(json.column_name),
          type: String(json.data_type),
          nullable: String(json.is_nullable).toUpperCase() === 'YES',
        };
      });

      if (cols.length === 0) return null;

      let count = 0;
      try {
        const countResult = await this.conn.query(`SELECT COUNT(*) as cnt FROM "${tableName}";`);
        const countArr = countResult.toArray();
        if (countArr.length > 0) {
          count = Number(countArr[0].toJSON().cnt || 0);
        }
      } catch {
        count = 0;
      }

      return {
        name: tableName,
        columns: cols,
        estimatedRowCount: count,
        sourceType: 'view',
      };
    } catch {
      return null;
    }
  }

  public async executeQuery(sql: string): Promise<QueryExecutionResult> {
    await this.init();
    if (!this.conn) {
      throw new Error('DuckDB connection is not active yet.');
    }

    const trimmedSql = sql.trim();
    if (!trimmedSql) {
      return {
        queryId: crypto.randomUUID(),
        sql,
        columns: [],
        rows: [],
        totalRows: 0,
        durationMs: 0,
        timestamp: Date.now(),
        statementType: 'OTHER',
      };
    }

    const meta = this.parseStatementMetadata(trimmedSql);
    const startTime = performance.now();
    try {
      const arrowTable = await this.conn.query(trimmedSql);
      const durationMs = performance.now() - startTime;

      let columns: ColumnMetadata[] = (arrowTable.schema.fields as Array<{ name: string; type: { toString: () => string }; nullable?: boolean }>).map((field) => {
        const rawType = field.type.toString();
        return {
          name: field.name,
          type: rawType,
          normalizedType: this.normalizeColumnType(rawType),
          nullable: field.nullable,
        };
      });

      const rawRows = arrowTable.toArray() as Array<{ toJSON: () => Record<string, unknown> }>;
      let rows: Record<string, unknown>[] = rawRows.map((row) => {
        const rowJson = row.toJSON();
        const cleanRow: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(rowJson)) {
          cleanRow[k] = this.serializeValue(v);
        }
        return cleanRow;
      });

      let affectedRows: number | undefined;
      if (
        (meta.type === 'INSERT' || meta.type === 'UPDATE' || meta.type === 'DELETE') &&
        rows.length === 1 &&
        rows[0]['Count'] !== undefined
      ) {
        affectedRows = Number(rows[0]['Count']);
      } else if (meta.type === 'INSERT' || meta.type === 'UPDATE' || meta.type === 'DELETE') {
        affectedRows = rows.length;
      }

      let message: string | undefined;
      if (meta.type === 'CREATE_TABLE') {
        message = `Table "${meta.targetTable || 'new'}" created successfully.`;
      } else if (meta.type === 'CREATE_VIEW') {
        message = `View "${meta.targetTable || 'new'}" created successfully.`;
      } else if (meta.type === 'INSERT') {
        message = `${affectedRows !== undefined ? `${affectedRows} rows` : 'Data'} successfully inserted into "${meta.targetTable || 'table'}".`;
      } else if (meta.type === 'UPDATE') {
        message = `${affectedRows !== undefined ? `${affectedRows} rows` : 'Data'} successfully updated in "${meta.targetTable || 'table'}".`;
      } else if (meta.type === 'DELETE') {
        message = `${affectedRows !== undefined ? `${affectedRows} rows` : 'Data'} successfully deleted from "${meta.targetTable || 'table'}".`;
      } else if (meta.type === 'DROP') {
        message = `Table/View "${meta.targetTable || ''}" dropped successfully.`;
      } else if (meta.type === 'ALTER') {
        message = `Table schema "${meta.targetTable || ''}" modified successfully (ALTER).`;
      } else if (meta.type === 'TRUNCATE') {
        message = `Table "${meta.targetTable || ''}" truncated successfully.`;
      }

      let schemaSummary: TableCatalog | undefined;
      if (meta.targetTable && meta.type !== 'DROP') {
        const schema = await this.getTableSchema(meta.targetTable);
        if (schema) {
          schemaSummary = schema;
          if (meta.type !== 'SELECT') {
            try {
              const preview = await this.conn.query(`SELECT * FROM "${meta.targetTable}" LIMIT 1000;`);
              columns = (preview.schema.fields as Array<{ name: string; type: { toString: () => string }; nullable?: boolean }>).map((field) => {
                const rawType = field.type.toString();
                return {
                  name: field.name,
                  type: rawType,
                  normalizedType: this.normalizeColumnType(rawType),
                  nullable: field.nullable,
                };
              });
              rows = (preview.toArray() as Array<{ toJSON: () => Record<string, unknown> }>).map((r) => {
                const json = r.toJSON();
                const clean: Record<string, unknown> = {};
                for (const [k, v] of Object.entries(json)) {
                  clean[k] = this.serializeValue(v);
                }
                return clean;
              });
            } catch {
            }
          }
        }
      }

      await this.updateCatalogStats();
      this.updateMemoryEstimate();
      this.notifyStatus();

      return {
        queryId: crypto.randomUUID(),
        sql: trimmedSql,
        columns,
        rows,
        totalRows: rows.length,
        durationMs,
        timestamp: Date.now(),
        statementType: meta.type,
        targetTable: meta.targetTable,
        affectedRows,
        message,
        schemaSummary,
      };
    } catch (err: unknown) {
      const durationMs = performance.now() - startTime;
      const rawMessage = err instanceof Error ? err.message : String(err);

      let errorLine: number | undefined;
      let errorCol: number | undefined;
      const lineCaretMatch = rawMessage.match(/LINE\s+(\d+):\s*([^\n]*)\n(\s*)\^/);
      if (lineCaretMatch) {
        errorLine = parseInt(lineCaretMatch[1], 10);
        const linePrefixMatch = rawMessage.match(/LINE\s+\d+:\s*/);
        const prefixLen = linePrefixMatch ? linePrefixMatch[0].length : 8;
        errorCol = Math.max(1, lineCaretMatch[3].length - prefixLen + 1);
      } else {
        const lineMatch = rawMessage.match(/LINE\s+(\d+)/i);
        if (lineMatch) errorLine = parseInt(lineMatch[1], 10);
        const colMatch = rawMessage.match(/(?:character|at position)\s+(\d+)/i);
        if (colMatch) errorCol = parseInt(colMatch[1], 10);
      }

      return {
        queryId: crypto.randomUUID(),
        sql: trimmedSql,
        columns: [],
        rows: [],
        totalRows: 0,
        durationMs,
        timestamp: Date.now(),
        error: rawMessage,
        errorPosition: errorLine
          ? {
              line: errorLine,
              column: errorCol,
            }
          : undefined,
        statementType: meta.type,
        targetTable: meta.targetTable,
      };
    }
  }

  public async getCatalog(): Promise<TableCatalog[]> {
    await this.init();
    if (!this.conn) return [];

    try {
      const tablesResult = await this.conn.query(`
        SELECT table_name, table_type 
        FROM information_schema.tables 
        WHERE table_schema = 'main'
        ORDER BY table_name ASC;
      `);

      const tableRows = (tablesResult.toArray() as Array<{ toJSON: () => Record<string, unknown> }>).map((r) => r.toJSON());
      const catalog: TableCatalog[] = [];

      for (const t of tableRows) {
        const tableName = String(t.table_name);
        
        const colResult = await this.conn.query(`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_schema = 'main' AND table_name = '${this.escapeSql(tableName)}'
          ORDER BY ordinal_position ASC;
        `);
        
        const cols: TableColumnSchema[] = (colResult.toArray() as Array<{ toJSON: () => Record<string, unknown> }>).map((c) => {
          const json = c.toJSON();
          return {
            name: String(json.column_name),
            type: String(json.data_type),
            nullable: String(json.is_nullable).toUpperCase() === 'YES',
          };
        });

        let count = 0;
        try {
          const countResult = await this.conn.query(`SELECT COUNT(*) as cnt FROM "${tableName}";`);
          const countArr = countResult.toArray();
          if (countArr.length > 0) {
            const countJson = countArr[0].toJSON();
            count = Number(countJson.cnt || 0);
          }
        } catch {
          count = 0;
        }

        catalog.push({
          name: tableName,
          columns: cols,
          estimatedRowCount: count,
          sourceType: 'view',
        });
      }

      this.stats.tablesCount = catalog.length;
      return catalog;
    } catch {
      return [];
    }
  }

  public async registerFileBuffer(fileName: string, buffer: Uint8Array): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('DuckDB is not ready.');
    await this.db.registerFileBuffer(fileName, buffer);
  }

  public async dropTable(tableName: string): Promise<void> {
    await this.init();
    if (!this.conn) return;
    await this.conn.query(`DROP TABLE IF EXISTS "${tableName}";`);
    await this.updateCatalogStats();
    this.notifyStatus();
  }

  private async updateCatalogStats(): Promise<void> {
    if (!this.conn) return;
    try {
      const res = await this.conn.query(`
        SELECT COUNT(*) as total_tables 
        FROM information_schema.tables 
        WHERE table_schema = 'main';
      `);
      const row = res.toArray()[0]?.toJSON();
      this.stats.tablesCount = Number(row?.total_tables || 0);
    } catch {
    }
  }

  private updateMemoryEstimate(): void {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const perf = window.performance as unknown as {
        memory?: { usedJSHeapSize: number; totalJSHeapSize: number };
      };
      if (perf.memory?.usedJSHeapSize) {
        this.stats.bufferMemoryMb = Math.round(perf.memory.usedJSHeapSize / (1024 * 1024));
        return;
      }
    }
    this.stats.bufferMemoryMb = Math.max(16, this.stats.tablesCount * 4 + 8);
  }
}

export const duckdbClient = DuckDBClient.getInstance();
