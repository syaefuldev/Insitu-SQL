'use client';

import React, { useMemo, useRef, useState, useCallback } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  type SortingState,
  type ColumnDef,
  flexRender,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ArrowUpDown, ArrowUp, ArrowDown, Copy, Check } from 'lucide-react';
import type { ColumnMetadata } from '@/types';

interface DataGridProps {
  columns: ColumnMetadata[];
  rows: Record<string, unknown>[];
  filterText?: string;
}

export function DataGrid({ columns, rows, filterText = '' }: DataGridProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [copiedCell, setCopiedCell] = useState<{ rowIdx: number; colKey: string } | null>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const handleCopyCell = useCallback((value: unknown, rowIdx: number, colKey: string) => {
    const textToCopy = value === null || value === undefined ? 'NULL' : String(value);
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(textToCopy);
      setCopiedCell({ rowIdx, colKey });
      setTimeout(() => setCopiedCell(null), 1500);
    }
  }, []);

  const filteredData = useMemo(() => {
    if (!filterText.trim()) return rows;
    const lower = filterText.toLowerCase();
    return rows.filter((row) =>
      Object.values(row).some((val) => {
        if (val === null || val === undefined) return false;
        return String(val).toLowerCase().includes(lower);
      })
    );
  }, [rows, filterText]);

  const tableColumns = useMemo<ColumnDef<Record<string, unknown>>[]>(() => {
    const dynamicCols: ColumnDef<Record<string, unknown>>[] = columns.map((col) => {
      return {
        accessorKey: col.name,
        header: () => (
          <div className="flex flex-col gap-0.5 text-left">
            <span className="font-semibold text-workbench-textPrimary truncate">{col.name}</span>
            <span className="text-[9px] uppercase tracking-wider text-workbench-textMuted font-mono">
              {col.normalizedType}
            </span>
          </div>
        ),
        cell: (info) => {
          const rawValue = info.getValue();
          const rowIdx = info.row.index;
          const colKey = col.name;
          const isCopied = copiedCell?.rowIdx === rowIdx && copiedCell?.colKey === colKey;

          if (rawValue === null || rawValue === undefined) {
            return (
              <span
                onClick={() => handleCopyCell(rawValue, rowIdx, colKey)}
                className="cursor-pointer font-mono italic text-[11px] text-workbench-textMuted bg-carbon-850 px-1 py-0.5 rounded select-all hover:bg-carbon-800"
                title="Click to copy (NULL)"
              >
                {isCopied ? 'Copied!' : 'null'}
              </span>
            );
          }

          if (typeof rawValue === 'boolean') {
            return (
              <span
                onClick={() => handleCopyCell(rawValue, rowIdx, colKey)}
                className={`cursor-pointer rounded px-1.5 py-0.5 font-mono text-[11px] font-medium transition-colors ${
                  rawValue
                    ? 'bg-indigo-950/70 text-indigo-300 border border-indigo-700/50 hover:bg-indigo-900/80'
                    : 'bg-carbon-800 text-workbench-textMuted border border-workbench-border hover:bg-carbon-750'
                }`}
                title="Click to copy"
              >
                {isCopied ? 'Copied!' : rawValue ? 'true' : 'false'}
              </span>
            );
          }

          const isNumeric =
            col.normalizedType === 'INTEGER' ||
            col.normalizedType === 'BIGINT' ||
            col.normalizedType === 'DOUBLE' ||
            col.normalizedType === 'FLOAT' ||
            col.normalizedType === 'DECIMAL';

          return (
            <div
              onClick={() => handleCopyCell(rawValue, rowIdx, colKey)}
              className={`group flex items-center justify-between cursor-pointer truncate font-mono text-xs text-workbench-textSecondary hover:text-workbench-textPrimary transition-colors ${
                isNumeric ? 'text-right justify-end' : 'text-left'
              }`}
              title="Click to copy cell value"
            >
              <span className="truncate">{String(rawValue)}</span>
              {isCopied ? (
                <Check className="ml-1.5 h-3 w-3 shrink-0 text-indigo-400" />
              ) : (
                <Copy className="ml-1.5 h-2.5 w-2.5 shrink-0 opacity-0 group-hover:opacity-60 text-workbench-textMuted" />
              )}
            </div>
          );
        },
      };
    });

    return dynamicCols;
  }, [columns, copiedCell, handleCopyCell]);

  const table = useReactTable({
    data: filteredData,
    columns: tableColumns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const { rows: tableRows } = table.getRowModel();

  const rowVirtualizer = useVirtualizer({
    count: tableRows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 28,
    overscan: 25,
  });

  if (columns.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center font-mono text-xs text-zinc-500">
        No data or empty query result.
      </div>
    );
  }

  return (
    <div
      ref={tableContainerRef}
      className="h-full w-full overflow-auto bg-carbon-900 font-mono text-xs select-text no-scrollbar"
    >
      <table className="w-full border-collapse text-left">
        <thead className="sticky top-0 z-10 bg-carbon-850 shadow-sm border-b border-workbench-border">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="flex">
              <th className="w-12 shrink-0 border-r border-workbench-border/60 bg-carbon-850 px-2 py-1.5 text-center text-[10px] font-mono text-workbench-textMuted select-none">
                #
              </th>
              {headerGroup.headers.map((header) => {
                const canSort = header.column.getCanSort();
                const isSorted = header.column.getIsSorted();

                return (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className={`flex-1 min-w-[120px] max-w-[320px] border-r border-workbench-border/60 px-3 py-1.5 text-xs select-none transition-colors ${
                      canSort ? 'cursor-pointer hover:bg-carbon-800' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {canSort && (
                        <span className="shrink-0 text-workbench-textMuted">
                          {isSorted === 'asc' ? (
                            <ArrowUp className="h-3 w-3 text-indigo-400" />
                          ) : isSorted === 'desc' ? (
                            <ArrowDown className="h-3 w-3 text-indigo-400" />
                          ) : (
                            <ArrowUpDown className="h-2.5 w-2.5 opacity-30 hover:opacity-100" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const row = tableRows[virtualRow.index];
            if (!row) return null;

            return (
              <tr
                key={row.id}
                data-index={virtualRow.index}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                className={`flex border-b border-workbench-border/40 hover:bg-carbon-800/60 transition-colors ${
                  virtualRow.index % 2 === 0 ? 'bg-carbon-900' : 'bg-carbon-850/40'
                }`}
              >
                <td className="w-12 shrink-0 border-r border-workbench-border/60 px-2 py-1 text-center text-[10px] text-workbench-textMuted select-none bg-carbon-850/60">
                  {virtualRow.index + 1}
                </td>
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="flex-1 min-w-[120px] max-w-[320px] border-r border-workbench-border/40 px-3 py-1 truncate"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
