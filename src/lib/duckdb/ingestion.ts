import * as XLSX from 'xlsx';
import { duckdbClient } from '@/lib/duckdb/duckdb-client';
import { SAMPLE_DATASETS } from '@/lib/duckdb/sample-datasets';
import { sanitizeTableName } from '@/lib/utils';

export interface IngestionResult {
  tableName: string;
  rowCount: number;
  columnsCount: number;
  sourceType: 'csv' | 'json' | 'parquet' | 'xlsx' | 'sample';
  suggestedSql: string;
}

export class IngestionEngine {
  private static instance: IngestionEngine | null = null;

  public static getInstance(): IngestionEngine {
    if (!IngestionEngine.instance) {
      IngestionEngine.instance = new IngestionEngine();
    }
    return IngestionEngine.instance;
  }

  public async ingestFile(file: File): Promise<IngestionResult> {
    await duckdbClient.init();
    const fileName = file.name;
    const lowerName = fileName.toLowerCase();
    const sanitizedName = sanitizeTableName(fileName);
    const timestamp = Date.now();
    const virtualPath = `vfs_${timestamp}_${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

    if (lowerName.endsWith('.csv') || lowerName.endsWith('.tsv') || lowerName.endsWith('.txt')) {
      const buffer = new Uint8Array(await file.arrayBuffer());
      await duckdbClient.registerFileBuffer(virtualPath, buffer);
      
      const sql = `CREATE OR REPLACE TABLE "${sanitizedName}" AS SELECT * FROM read_csv_auto('${virtualPath}', header=true, auto_detect=true);`;
      const execResult = await duckdbClient.executeQuery(sql);
      if (execResult.error) {
        throw new Error(`Failed to parse CSV: ${execResult.error}`);
      }

      return this.getTableSummary(sanitizedName, 'csv');
    }

    if (lowerName.endsWith('.json') || lowerName.endsWith('.ndjson')) {
      const buffer = new Uint8Array(await file.arrayBuffer());
      await duckdbClient.registerFileBuffer(virtualPath, buffer);

      const sql = `CREATE OR REPLACE TABLE "${sanitizedName}" AS SELECT * FROM read_json_auto('${virtualPath}');`;
      const execResult = await duckdbClient.executeQuery(sql);
      if (execResult.error) {
        throw new Error(`Failed to parse JSON: ${execResult.error}`);
      }

      return this.getTableSummary(sanitizedName, 'json');
    }

    if (lowerName.endsWith('.parquet')) {
      const buffer = new Uint8Array(await file.arrayBuffer());
      await duckdbClient.registerFileBuffer(virtualPath, buffer);

      const sql = `CREATE OR REPLACE TABLE "${sanitizedName}" AS SELECT * FROM read_parquet('${virtualPath}');`;
      const execResult = await duckdbClient.executeQuery(sql);
      if (execResult.error) {
        throw new Error(`Failed to parse Parquet: ${execResult.error}`);
      }

      return this.getTableSummary(sanitizedName, 'parquet');
    }

    if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls')) {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        throw new Error('Excel file has no valid sheets.');
      }

      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (!jsonData || jsonData.length === 0) {
        throw new Error('The first Excel sheet is empty.');
      }

      const jsonString = JSON.stringify(jsonData);
      const encoder = new TextEncoder();
      const buffer = encoder.encode(jsonString);
      const excelVirtualPath = `vfs_${timestamp}_${sanitizedName}.json`;

      await duckdbClient.registerFileBuffer(excelVirtualPath, buffer);

      const sql = `CREATE OR REPLACE TABLE "${sanitizedName}" AS SELECT * FROM read_json_auto('${excelVirtualPath}');`;
      const execResult = await duckdbClient.executeQuery(sql);
      if (execResult.error) {
        throw new Error(`Failed to parse Excel data: ${execResult.error}`);
      }

      return this.getTableSummary(sanitizedName, 'xlsx');
    }

    throw new Error(`File format "${fileName}" is not supported. Please use CSV, JSON, Parquet, or Excel (.xlsx).`);
  }

  public async loadSample(datasetId: string): Promise<IngestionResult> {
    await duckdbClient.init();
    const dataset = SAMPLE_DATASETS.find((d) => d.id === datasetId);
    if (!dataset) {
      throw new Error(`Sample dataset "${datasetId}" was not found.`);
    }

    const rows = dataset.dataGenerator();
    const jsonString = JSON.stringify(rows);
    const encoder = new TextEncoder();
    const buffer = encoder.encode(jsonString);
    const virtualPath = `sample_${dataset.tableName}_${Date.now()}.json`;

    await duckdbClient.registerFileBuffer(virtualPath, buffer);

    const sql = `CREATE OR REPLACE TABLE "${dataset.tableName}" AS SELECT * FROM read_json_auto('${virtualPath}');`;
    const execResult = await duckdbClient.executeQuery(sql);
    if (execResult.error) {
      throw new Error(`Failed to load sample dataset: ${execResult.error}`);
    }

    const summary = await this.getTableSummary(dataset.tableName, 'sample');
    summary.suggestedSql = dataset.suggestedSql;
    return summary;
  }

  private async getTableSummary(
    tableName: string,
    sourceType: 'csv' | 'json' | 'parquet' | 'xlsx' | 'sample'
  ): Promise<IngestionResult> {
    const countRes = await duckdbClient.executeQuery(`SELECT COUNT(*) as cnt FROM "${tableName}";`);
    const rowCount = countRes.rows.length > 0 ? Number(countRes.rows[0].cnt || 0) : 0;

    const colRes = await duckdbClient.executeQuery(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'main' AND table_name = '${tableName}';
    `);
    const columnsCount = colRes.rows.length;

    return {
      tableName,
      rowCount,
      columnsCount,
      sourceType,
      suggestedSql: `SELECT * FROM "${tableName}" LIMIT 50;`,
    };
  }
}

export const ingestionEngine = IngestionEngine.getInstance();
