'use client';

import React, { useState, useEffect } from 'react';
import {
  Table as TableIcon,
  ChevronRight,
  ChevronDown,
  Play,
  Trash2,
  Search,
  RefreshCw,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
  Hash,
  Type,
  Calendar,
  ToggleLeft,
  X,
} from 'lucide-react';
import type { TableCatalog } from '@/types';
import { SAMPLE_DATASETS } from '@/lib/duckdb/sample-datasets';

interface SchemaExplorerProps {
  catalog: TableCatalog[];
  isLoading: boolean;
  onRefresh: () => void;
  onQueryTable: (tableName: string) => void;
  onDropTable: (tableName: string) => void;
  onLoadSample: (datasetId: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  highlightedTable?: string | null;
  onCloseMobile?: () => void;
}

export function SchemaExplorer({
  catalog,
  isLoading,
  onRefresh,
  onQueryTable,
  onDropTable,
  onLoadSample,
  isCollapsed,
  onToggleCollapse,
  highlightedTable,
  onCloseMobile,
}: SchemaExplorerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTables, setExpandedTables] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (highlightedTable) {
      setExpandedTables((prev) => ({
        ...prev,
        [highlightedTable]: true,
      }));
    }
  }, [highlightedTable]);

  const toggleTableExpand = (tableName: string) => {
    setExpandedTables((prev: Record<string, boolean>) => ({
      ...prev,
      [tableName]: !prev[tableName],
    }));
  };

  const filteredCatalog = catalog.filter((table) => {
    if (!searchQuery.trim()) return true;
    const lower = searchQuery.toLowerCase();
    const matchesTableName = table.name.toLowerCase().includes(lower);
    const matchesColumnName = table.columns.some((c) => c.name.toLowerCase().includes(lower));
    return matchesTableName || matchesColumnName;
  });

  const getColumnTypeIcon = (type: string) => {
    const upper = type.toUpperCase();
    if (
      upper.includes('INT') ||
      upper.includes('DOUBLE') ||
      upper.includes('FLOAT') ||
      upper.includes('DECIMAL') ||
      upper.includes('NUMERIC')
    ) {
      return <Hash className="h-3 w-3 text-cyan-400 shrink-0" />;
    }
    if (upper.includes('DATE') || upper.includes('TIME')) {
      return <Calendar className="h-3 w-3 text-amber-400 shrink-0" />;
    }
    if (upper.includes('BOOL')) {
      return <ToggleLeft className="h-3 w-3 text-indigo-400 shrink-0" />;
    }
    return <Type className="h-3 w-3 text-workbench-textMuted shrink-0" />;
  };

  if (isCollapsed) {
    return (
      <div className="flex flex-col items-center border-r border-workbench-border bg-carbon-850 py-3 px-1 w-10 select-none">
        <button
          onClick={onToggleCollapse}
          className="flex h-7 w-7 items-center justify-center rounded text-workbench-textMuted hover:bg-carbon-800 hover:text-workbench-textPrimary transition-colors cursor-pointer"
          title="Open Schema Explorer"
        >
          <PanelLeftOpen className="h-4 w-4" />
        </button>
        <div className="mt-4 flex flex-col items-center space-y-3">
          <div
            className="flex h-7 w-7 items-center justify-center rounded text-workbench-textMuted hover:text-workbench-textPrimary cursor-pointer"
            title={`${catalog.length} registered tables`}
          >
            <TableIcon className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full lg:w-64 flex-col border-r border-workbench-border bg-carbon-850 select-none font-mono text-xs">
      <div className="flex h-11 items-center justify-between border-b border-workbench-border px-3 bg-carbon-900/50">
        <div className="flex items-center space-x-2">
          <span className="text-[11px] font-semibold tracking-wider text-workbench-textMuted uppercase font-sans">
            Schema Explorer
          </span>
          <span className="rounded bg-carbon-800 px-1.5 py-0.5 text-[10px] text-workbench-textSecondary border border-workbench-border">
            {catalog.length}
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex h-6 w-6 items-center justify-center rounded text-workbench-textMuted hover:bg-carbon-800 hover:text-workbench-textPrimary transition-colors disabled:opacity-50 cursor-pointer"
            title="Refresh table catalog"
          >
            <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin text-workbench-accent' : ''}`} />
          </button>
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex h-6 w-6 items-center justify-center rounded text-workbench-textMuted hover:bg-carbon-800 hover:text-workbench-textPrimary transition-colors cursor-pointer"
            title="Close schema panel"
          >
            <PanelLeftClose className="h-3.5 w-3.5" />
          </button>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="flex lg:hidden h-6 w-6 items-center justify-center rounded text-workbench-textMuted hover:bg-carbon-800 hover:text-workbench-textPrimary transition-colors cursor-pointer"
              title="Close schema menu"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="p-2 border-b border-workbench-border bg-carbon-900/30">
        <div className="relative flex items-center">
          <Search className="absolute left-2.5 h-3 w-3 text-workbench-textMuted" />
          <input
            type="text"
            placeholder="Filter table / column..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            className="w-full rounded border border-workbench-border bg-carbon-900/80 py-1.5 pl-7 pr-2 text-xs text-workbench-textPrimary placeholder:text-workbench-textMuted outline-none focus:border-workbench-accent focus:ring-1 focus:ring-workbench-accent/30 transition-all font-sans"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-1.5 space-y-0.5">
        {filteredCatalog.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <TableIcon className="h-7 w-7 text-workbench-textMuted mb-2" />
            <p className="text-2xs text-workbench-textMuted font-sans">No tables in catalog yet.</p>
            <p className="text-[10px] text-workbench-textMuted mt-1 font-sans">
              Execute a DDL query (CREATE TABLE) or load a sample dataset.
            </p>
          </div>
        ) : (
          filteredCatalog.map((table) => {
            const isExpanded = !!expandedTables[table.name];
            const isRecentlyActive = highlightedTable === table.name;

            return (
              <div
                key={table.name}
                className={`rounded border transition-all ${
                  isRecentlyActive
                    ? 'border-indigo-500/50 bg-indigo-950/20'
                    : 'border-transparent hover:border-workbench-border/70 hover:bg-carbon-800/40'
                }`}
              >
                <div
                  onClick={() => toggleTableExpand(table.name)}
                  className="group flex items-center justify-between rounded px-2 py-1.5 hover:bg-carbon-800/60 cursor-pointer transition-colors"
                >
                  <div className="flex items-center space-x-1.5 truncate">
                    <span className="text-workbench-textMuted group-hover:text-workbench-textSecondary transition-colors">
                      {isExpanded ? (
                        <ChevronDown className="h-3 w-3" />
                      ) : (
                        <ChevronRight className="h-3 w-3" />
                      )}
                    </span>
                    <TableIcon className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                    <span
                      className={`truncate font-medium text-[11.5px] ${
                        isRecentlyActive ? 'text-indigo-300 font-semibold' : 'text-workbench-textPrimary'
                      }`}
                      title={table.name}
                    >
                      {table.name}
                    </span>
                    {isRecentlyActive && (
                      <span className="px-1 py-0.2 rounded text-[8.5px] bg-indigo-500/25 text-indigo-300 border border-indigo-500/40 font-mono">
                        ACTIVE
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <span className="text-[10px] text-workbench-textMuted font-mono">
                      {table.estimatedRowCount}r
                    </span>

                    <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-0.5 transition-opacity">
                      <button
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          onQueryTable(table.name);
                        }}
                        className="flex h-5 w-5 items-center justify-center rounded text-workbench-textMuted hover:bg-carbon-700 hover:text-indigo-300 cursor-pointer transition-colors"
                        title={`Query table ${table.name}`}
                      >
                        <Play className="h-2.5 w-2.5 fill-current" />
                      </button>
                      <button
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          onDropTable(table.name);
                        }}
                        className="flex h-5 w-5 items-center justify-center rounded text-workbench-textMuted hover:bg-carbon-700 hover:text-rose-400 cursor-pointer transition-colors"
                        title={`Drop table ${table.name}`}
                      >
                        <Trash2 className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="ml-4 pl-2.5 border-l border-workbench-border/70 py-1 space-y-0.5">
                    {table.columns.map((col) => (
                      <div
                        key={col.name}
                        className="flex items-center justify-between rounded px-1.5 py-0.5 hover:bg-carbon-800 text-[11px] transition-colors"
                      >
                        <div className="flex items-center space-x-1.5 truncate">
                          {getColumnTypeIcon(col.type)}
                          <span className="truncate text-workbench-textSecondary" title={col.name}>
                            {col.name}
                          </span>
                        </div>
                        <span className="text-[9px] uppercase tracking-wider text-workbench-textMuted font-mono">
                          {col.type}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="border-t border-workbench-border p-2.5 bg-carbon-900/60">
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-2xs uppercase tracking-wider text-workbench-textMuted font-semibold flex items-center gap-1 font-sans">
            <Sparkles className="h-3 w-3 text-amber-400" />
            Quick Samples
          </span>
        </div>
        <div className="space-y-1">
          {SAMPLE_DATASETS.slice(0, 2).map((s) => (
            <button
              key={s.id}
              onClick={() => onLoadSample(s.id)}
              className="w-full flex items-center justify-between rounded bg-carbon-800/80 hover:bg-carbon-750 hover:border-indigo-500/40 px-2 py-1.5 text-left text-2xs text-workbench-textSecondary transition-all border border-workbench-border/60 cursor-pointer active:scale-[0.99]"
            >
              <span className="truncate font-sans">{s.name}</span>
              <span className="text-[9px] text-workbench-textMuted font-mono">+{s.rowCountEstimated}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
