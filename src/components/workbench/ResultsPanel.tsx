'use client';

import React, { useState, useMemo } from 'react';
import {
  Table as TableIcon,
  BarChart2,
  Download,
  Clipboard,
  ClipboardCheck,
  Search,
  ChevronDown,
  FileSpreadsheet,
  FileJson,
  CheckCircle2,
  RefreshCw,
  Eye,
  Columns,
  Layers,
  Sparkles,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';
import { DataGrid } from '@/components/table/DataGrid';
import { ChartView } from '@/components/charts/ChartView';
import { exportToCsv, exportToJson, exportToMarkdown } from '@/lib/export';
import { formatDurationMs, formatNumberWithCommas } from '@/lib/utils';
import type { QueryExecutionResult, StatementType } from '@/types';

interface ResultsPanelProps {
  activeView: 'table' | 'chart';
  onViewChange: (view: 'table' | 'chart') => void;
  filterText: string;
  onFilterChange: (text: string) => void;
  result: QueryExecutionResult | null;
  isExecuting: boolean;
  onReRun?: () => void;
}

export function ResultsPanel({
  activeView,
  onViewChange,
  filterText,
  onFilterChange,
  result,
  isExecuting,
  onReRun,
}: ResultsPanelProps) {
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [copiedMd, setCopiedMd] = useState(false);
  const [copiedError, setCopiedError] = useState(false);
  const [nonSelectMode, setNonSelectMode] = useState<'preview' | 'schema'>('schema');

  const parsedError = useMemo(() => {
    if (!result?.error) return null;
    const raw = result.error.trim();
    let category = 'Query Execution Error';
    let message = raw;
    let snippet: string | null = null;
    let hint: string | null = null;

    const lineMatch = raw.match(/\r?\n(LINE \d+:[\s\S]*)$/);
    if (lineMatch) {
      snippet = lineMatch[1].trim();
      message = raw.substring(0, lineMatch.index).trim();
    }

    if (snippet) {
      const rawLines = snippet.split(/\r?\n/);
      if (rawLines.length >= 4 && rawLines.length % 2 === 0) {
        const half = rawLines.length / 2;
        if (rawLines.slice(0, half).join('\n') === rawLines.slice(half).join('\n')) {
          snippet = rawLines.slice(0, half).join('\n');
        }
      }
    }

    const categoryMatch = message.match(/^([A-Z][A-Za-z0-9\s_-]*?Error):\s*([\s\S]*)$/i);
    if (categoryMatch) {
      category = categoryMatch[1].trim();
      message = categoryMatch[2].trim();
    }

    const hintMatch = message.match(/\r?\n(Did you mean [^\r\n]+|\bCandidate bindings:[\s\S]*)$/i);
    if (hintMatch) {
      hint = hintMatch[1].trim();
      message = message.substring(0, hintMatch.index).trim();
    }

    return {
      category,
      message,
      hint,
      snippet,
    };
  }, [result?.error]);

  const handleCopyError = () => {
    if (!result?.error) return;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(result.error);
      setCopiedError(true);
      setTimeout(() => setCopiedError(false), 2000);
    }
  };

  const columns = result?.columns || [];
  const rows = result?.rows || [];
  const durationMs = result?.durationMs || 0;
  const statementType: StatementType = result?.statementType || 'SELECT';
  const isNonSelect = statementType !== 'SELECT' && statementType !== 'OTHER';
  const schemaSummary = result?.schemaSummary;

  const handleCopyMarkdown = () => {
    if (columns.length === 0 || rows.length === 0) return;
    const md = exportToMarkdown(columns, rows);
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(md);
      setCopiedMd(true);
      setTimeout(() => setCopiedMd(false), 2000);
      setExportMenuOpen(false);
    }
  };

  const handleExportCsv = () => {
    exportToCsv(columns, rows, `insitu_sql_export_${Date.now()}.csv`);
    setExportMenuOpen(false);
  };

  const handleExportJson = () => {
    exportToJson(rows, `insitu_sql_export_${Date.now()}.json`);
    setExportMenuOpen(false);
  };

  const getBadgeStyleForStatement = (type: StatementType) => {
    switch (type) {
      case 'CREATE_TABLE':
      case 'CREATE_VIEW':
        return 'bg-indigo-500/15 text-indigo-300 border-indigo-500/40';
      case 'INSERT':
        return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40';
      case 'UPDATE':
      case 'ALTER':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/40';
      case 'DELETE':
      case 'DROP':
      case 'TRUNCATE':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/40';
      case 'COPY':
        return 'bg-purple-500/15 text-purple-300 border-purple-500/40';
      default:
        return 'bg-carbon-800 text-workbench-textMuted border-workbench-border';
    }
  };

  const getColumnTypeColor = (type: string) => {
    const t = type.toUpperCase();
    if (t.includes('INT') || t.includes('FLOAT') || t.includes('DOUBLE') || t.includes('NUMERIC') || t.includes('DECIMAL')) {
      return 'text-sky-400 bg-sky-950/40 border-sky-800/40';
    }
    if (t.includes('CHAR') || t.includes('TEXT') || t.includes('VARCHAR')) {
      return 'text-amber-400 bg-amber-950/40 border-amber-800/40';
    }
    if (t.includes('BOOL')) {
      return 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40';
    }
    if (t.includes('DATE') || t.includes('TIME')) {
      return 'text-purple-400 bg-purple-950/40 border-purple-800/40';
    }
    if (t.includes('JSON') || t.includes('STRUCT') || t.includes('LIST')) {
      return 'text-cyan-400 bg-cyan-950/40 border-cyan-800/40';
    }
    return 'text-workbench-textMuted bg-carbon-800 border-workbench-border';
  };

  return (
    <div className="flex h-full w-full flex-col bg-carbon-900 select-none overflow-hidden">
      <div className="flex h-10 items-center justify-between border-b border-workbench-border bg-carbon-850 px-2 sm:px-3 gap-2 shrink-0 overflow-hidden">
        <div className="flex items-center gap-2 min-w-0 overflow-hidden">
          {result && !result.error && isNonSelect ? (
            <div className="flex items-center rounded-md bg-carbon-800 p-0.5 border border-workbench-border shrink-0">
              <button
                type="button"
                onClick={() => setNonSelectMode('schema')}
                className={`flex items-center gap-1 rounded px-2 py-1 text-xs transition-all cursor-pointer ${
                  nonSelectMode === 'schema'
                    ? 'bg-carbon-700 text-workbench-textPrimary font-semibold shadow-xs'
                    : 'text-workbench-textMuted hover:text-workbench-textPrimary'
                }`}
                title="View column schema structure"
              >
                <Columns className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                <span className="text-xs">Schema</span>
              </button>
              {rows.length > 0 && (
                <button
                  type="button"
                  onClick={() => setNonSelectMode('preview')}
                  className={`flex items-center gap-1 rounded px-2 py-1 text-xs transition-all cursor-pointer ${
                    nonSelectMode === 'preview'
                      ? 'bg-carbon-700 text-workbench-textPrimary font-semibold shadow-xs'
                      : 'text-workbench-textMuted hover:text-workbench-textPrimary'
                  }`}
                  title="View table data preview"
                >
                  <Eye className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                  <span className="hidden md:inline text-xs">Preview</span>
                  <span className="text-[11px] text-workbench-textMuted">({formatNumberWithCommas(rows.length)})</span>
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center rounded-md bg-carbon-800 p-0.5 border border-workbench-border shrink-0">
              <button
                type="button"
                onClick={() => onViewChange('table')}
                className={`flex items-center gap-1 rounded px-2 py-1 text-xs transition-all cursor-pointer ${
                  activeView === 'table'
                    ? 'bg-carbon-700 text-workbench-textPrimary font-semibold shadow-xs'
                    : 'text-workbench-textMuted hover:text-workbench-textPrimary'
                }`}
                title="Table View"
              >
                <TableIcon className="h-3.5 w-3.5 shrink-0" />
                <span className="text-xs">Table</span>
              </button>
              <button
                type="button"
                onClick={() => onViewChange('chart')}
                disabled={columns.length === 0 || rows.length === 0}
                className={`flex items-center gap-1 rounded px-2 py-1 text-xs transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none ${
                  activeView === 'chart'
                    ? 'bg-carbon-700 text-workbench-textPrimary font-semibold shadow-xs'
                    : 'text-workbench-textMuted hover:text-workbench-textPrimary'
                }`}
                title="Chart Visualization"
              >
                <BarChart2 className="h-3.5 w-3.5 shrink-0" />
                <span className="text-xs">Chart</span>
              </button>
            </div>
          )}

          {((!isNonSelect && activeView === 'table') || (isNonSelect && nonSelectMode === 'preview')) && (
            <div className="relative min-w-0 w-24 sm:w-36 md:w-44">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-workbench-textMuted pointer-events-none" />
              <input
                type="text"
                placeholder="Filter data..."
                value={filterText}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onFilterChange(e.target.value)}
                className="w-full h-7 rounded-md border border-workbench-border bg-carbon-900/80 pl-6 pr-2 text-xs text-workbench-textPrimary placeholder:text-workbench-textMuted outline-none focus:border-workbench-accent focus:ring-1 focus:ring-workbench-accent/30 font-sans transition-all"
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {onReRun && (
            <button
              type="button"
              onClick={onReRun}
              disabled={isExecuting}
              className="h-7 w-7 flex items-center justify-center rounded-md border border-workbench-border bg-carbon-800 text-workbench-textMuted hover:text-workbench-textPrimary hover:bg-carbon-750 hover:border-workbench-accent transition-all disabled:opacity-40 cursor-pointer"
              title="Re-run query (Refresh Data)"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isExecuting ? 'animate-spin text-workbench-accent' : ''}`} />
            </button>
          )}

          <div className="relative">
            <button
              type="button"
              onClick={() => setExportMenuOpen(!exportMenuOpen)}
              disabled={rows.length === 0}
              className="h-7 px-2 sm:px-2.5 rounded-md border border-workbench-border bg-carbon-800 text-xs text-workbench-textPrimary hover:bg-carbon-750 hover:border-workbench-accent transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer flex items-center gap-1"
              title="Export query results"
            >
              <Download className="h-3.5 w-3.5 text-workbench-textMuted" />
              <span className="hidden sm:inline">Export</span>
              <ChevronDown className="h-3 w-3 text-workbench-textMuted" />
            </button>

            {exportMenuOpen && (
              <div
                onClick={() => setExportMenuOpen(false)}
                className="fixed inset-0 z-40"
              />
            )}

            {exportMenuOpen && (
              <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-md border border-workbench-border bg-carbon-850 p-1 shadow-2xl font-mono text-xs">
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="w-full flex items-center gap-2 rounded px-2.5 py-1.5 text-left text-workbench-textPrimary hover:bg-carbon-750 hover:text-workbench-accent transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Download CSV</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportJson}
                  className="w-full flex items-center gap-2 rounded px-2.5 py-1.5 text-left text-workbench-textPrimary hover:bg-carbon-750 hover:text-amber-400 transition-colors cursor-pointer"
                >
                  <FileJson className="h-3.5 w-3.5 text-amber-400" />
                  <span>Download JSON</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyMarkdown}
                  className="w-full flex items-center gap-2 rounded px-2.5 py-1.5 text-left text-workbench-textPrimary hover:bg-carbon-750 hover:text-cyan-400 transition-colors cursor-pointer"
                >
                  {copiedMd ? (
                    <ClipboardCheck className="h-3.5 w-3.5 text-indigo-400" />
                  ) : (
                    <Clipboard className="h-3.5 w-3.5 text-cyan-400" />
                  )}
                  <span>{copiedMd ? 'Copied Markdown!' : 'Copy Markdown'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden flex flex-col">
        {isExecuting ? (
          <div className="flex h-full w-full flex-col items-center justify-center space-y-3 bg-carbon-900 font-mono text-xs text-workbench-textMuted">
            <RefreshCw className="h-6 w-6 animate-spin text-workbench-accent" />
            <div className="flex items-center space-x-2">
              <span className="inline-block h-2 w-2 animate-ping rounded-full bg-workbench-accent" />
              <span className="text-workbench-textPrimary font-medium">Executing query in DuckDB-WASM...</span>
            </div>
            <p className="text-2xs text-workbench-textMuted">
              Operation executed 100% locally in browser without server
            </p>
          </div>
        ) : !result ? (
          <div className="flex h-full w-full flex-col items-center justify-center space-y-2 bg-carbon-900 font-mono text-xs text-workbench-textMuted p-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-workbench-border bg-carbon-850 text-workbench-accent shadow-inner">
              <Sparkles className="h-6 w-6" />
            </div>
            <p className="font-semibold text-workbench-textPrimary mt-2">No queries executed yet</p>
            <p className="text-2xs text-workbench-textMuted max-w-sm">
              Write SQL commands in the editor, then press{' '}
              <kbd className="rounded border border-workbench-border bg-carbon-800 px-1.5 py-0.5 text-workbench-textPrimary font-mono">
                ⌘+Enter
              </kbd>{' '}
              or click <strong className="text-workbench-textPrimary">Run</strong>.
            </p>
          </div>
        ) : result.error ? (
          <div className="flex h-full w-full items-center justify-center bg-carbon-900 p-4 sm:p-6 overflow-y-auto">
            <div className="w-full max-w-2xl rounded-xl border border-rose-200 dark:border-rose-500/30 bg-carbon-850 shadow-xl dark:shadow-2xl overflow-hidden animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-rose-200 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-950/40 px-4 py-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-rose-300 dark:border-rose-500/40 bg-rose-100 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400">
                    <AlertCircle className="h-4 w-4" />
                  </div>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-xs font-semibold text-rose-950 dark:text-rose-200 truncate">
                      {parsedError?.category || 'Query Execution Error'}
                    </span>
                    {result.errorPosition && (
                      <span className="shrink-0 rounded bg-rose-100 dark:bg-rose-900/50 px-2 py-0.5 text-2xs font-mono font-medium text-rose-900 dark:text-rose-200 border border-rose-300 dark:border-rose-700/50">
                        Line {result.errorPosition.line}
                        {result.errorPosition.column ? `, Col ${result.errorPosition.column}` : ''}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCopyError}
                  className="flex items-center gap-1.5 rounded-md border border-rose-300 dark:border-rose-900/50 bg-white dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 px-2.5 py-1 text-2xs font-mono text-rose-900 dark:text-rose-200 transition-colors cursor-pointer shrink-0 shadow-2xs"
                  title="Copy error message"
                >
                  {copiedError ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-emerald-700 dark:text-emerald-400 font-semibold">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-4 space-y-3 font-mono text-xs">
                <div className="rounded-lg border border-rose-200 dark:border-rose-900/50 bg-rose-50/80 dark:bg-rose-950/30 p-3.5 text-rose-950 dark:text-rose-100 leading-relaxed break-words font-medium">
                  {parsedError?.message || result.error}
                </div>

                {parsedError?.hint && (
                  <div className="rounded-lg border border-amber-300 dark:border-amber-500/25 bg-amber-50 dark:bg-amber-500/10 p-3 text-2xs text-amber-950 dark:text-amber-200 leading-relaxed flex items-start gap-2">
                    <span className="font-sans font-bold text-amber-800 dark:text-amber-400 shrink-0 uppercase tracking-wider text-3xs pt-0.5">
                      Tip:
                    </span>
                    <span className="break-words font-mono">{parsedError.hint}</span>
                  </div>
                )}

                {parsedError?.snippet && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-3xs font-sans font-semibold uppercase tracking-wider text-workbench-textSecondary">
                      SQL Context
                    </span>
                    <div className="rounded-lg border border-workbench-border bg-carbon-950 p-3.5 overflow-x-auto text-xs leading-5">
                      {parsedError.snippet.split('\n').map((line, idx) => (
                        <div
                          key={idx}
                          className={`whitespace-pre font-mono ${
                            line.trim().startsWith('^')
                              ? 'text-rose-600 dark:text-rose-400 font-bold select-none'
                              : 'text-workbench-textPrimary'
                          }`}
                        >
                          {line}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : isNonSelect ? (
          <div className="flex h-full w-full flex-col bg-carbon-900 overflow-auto p-4 font-mono text-xs">
            <div className="mb-4 rounded-xl border border-workbench-border bg-carbon-850/80 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-bold text-workbench-textPrimary text-sm">
                        {statementType.replace('_', ' ')} Successful
                      </h3>
                      <span
                        className={`px-2 py-0.5 rounded text-2xs font-semibold border ${getBadgeStyleForStatement(
                          statementType
                        )}`}
                      >
                        {statementType}
                      </span>
                    </div>
                    <p className="text-2xs text-workbench-textMuted mt-0.5">
                      {result.message || 'Database command executed successfully and schema catalog synchronized.'}
                    </p>
                  </div>
                </div>

                <div className="text-right text-2xs text-workbench-textMuted font-mono">
                  <div>Duration: <span className="text-amber-400 font-semibold">{formatDurationMs(durationMs)}</span></div>
                  {result.affectedRows !== undefined && result.affectedRows >= 0 && (
                    <div>Rows Affected: <span className="text-cyan-400 font-semibold">{formatNumberWithCommas(result.affectedRows)}</span></div>
                  )}
                  {result.targetTable && (
                    <div>Target Table: <span className="text-indigo-400 font-semibold">{result.targetTable}</span></div>
                  )}
                </div>
              </div>
            </div>

            {statementType === 'DROP' ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 rounded-xl border border-workbench-border bg-carbon-850/40 text-center text-workbench-textMuted">
                <Layers className="h-10 w-10 text-workbench-textMuted mb-2" />
                <p className="font-semibold text-workbench-textPrimary">Table Dropped Successfully</p>
                <p className="text-2xs max-w-sm mt-1">
                  Table object has been removed from the local DuckDB memory catalog.
                </p>
              </div>
            ) : nonSelectMode === 'schema' && schemaSummary ? (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xs font-semibold uppercase tracking-wider text-workbench-textMuted">
                    Table Column Definitions: <strong className="text-workbench-textPrimary font-mono">{schemaSummary.name}</strong> ({schemaSummary.columns.length} columns)
                  </span>
                  <span className="text-2xs text-workbench-textMuted font-mono">
                    Estimated rows: {formatNumberWithCommas(schemaSummary.estimatedRowCount)}
                  </span>
                </div>

                <div className="rounded-lg border border-workbench-border bg-carbon-850/60 overflow-hidden shadow-sm">
                  <table className="w-full border-collapse font-mono text-xs text-left">
                    <thead>
                      <tr className="border-b border-workbench-border bg-carbon-800/40 text-2xs text-workbench-textMuted uppercase tracking-wider">
                        <th className="px-3 py-2 font-semibold">#</th>
                        <th className="px-3 py-2 font-semibold">Column Name</th>
                        <th className="px-3 py-2 font-semibold">Data Type</th>
                        <th className="px-3 py-2 font-semibold">Nullable</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-workbench-border/50">
                      {schemaSummary.columns.map((col, idx) => (
                        <tr
                          key={col.name}
                          className="hover:bg-carbon-800/50 transition-colors text-workbench-textPrimary"
                        >
                          <td className="px-3 py-2 text-workbench-textMuted text-2xs">{idx + 1}</td>
                          <td className="px-3 py-2 font-semibold flex items-center gap-1.5">
                            {col.name}
                            {col.isPrimaryKey && (
                              <span className="rounded bg-amber-500/20 px-1 py-0.2 text-[9px] text-amber-300 border border-amber-500/40">
                                PK
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <span
                              className={`rounded border px-2 py-0.5 text-2xs font-semibold ${getColumnTypeColor(
                                col.type
                              )}`}
                            >
                              {col.type}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-2xs">
                            {col.nullable ? (
                              <span className="text-workbench-textMuted">YES</span>
                            ) : (
                              <span className="text-amber-400 font-semibold">NO (NOT NULL)</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : rows.length > 0 ? (
              <div className="flex-1 min-h-0 border border-workbench-border rounded-lg overflow-hidden">
                <DataGrid columns={columns} rows={rows} filterText={filterText} />
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 rounded-xl border border-workbench-border bg-carbon-850/40 text-center text-workbench-textMuted">
                <TableIcon className="h-8 w-8 text-workbench-textMuted mb-2" />
                <p className="font-semibold text-workbench-textPrimary">No Row Data</p>
                <p className="text-2xs max-w-sm mt-1">
                  This table currently has no row records.
                </p>
              </div>
            )}
          </div>
        ) : activeView === 'table' ? (
          <DataGrid columns={columns} rows={rows} filterText={filterText} />
        ) : (
          <ChartView columns={columns} rows={rows} />
        )}
      </div>
    </div>
  );
}
