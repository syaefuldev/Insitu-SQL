'use client';

import React, { useState } from 'react';
import {
  X,
  History,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  PlusSquare,
  FileInput,
  Trash2,
  Search,
} from 'lucide-react';
import type { QueryHistoryRecord } from '@/types';
import { formatDurationMs, formatNumberWithCommas } from '@/lib/utils';

interface QueryHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: QueryHistoryRecord[];
  onSelectQuery: (sql: string) => void;
  onCreateTabWithQuery: (sql: string) => void;
  onClearHistory: () => void;
}

export function QueryHistoryModal({
  isOpen,
  onClose,
  history,
  onSelectQuery,
  onCreateTabWithQuery,
  onClearHistory,
}: QueryHistoryModalProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const handleCopySql = (id: string, sql: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(sql);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    }
  };

  const filteredHistory = history.filter((item) =>
    item.sql.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-carbon-950/80 backdrop-blur-xs p-4 font-mono text-xs">
      <div className="relative flex max-h-[85vh] w-full max-w-2xl flex-col rounded-xl border border-workbench-border bg-carbon-850 shadow-2xl overflow-hidden">
        <div className="flex h-12 items-center justify-between border-b border-workbench-border bg-carbon-900/60 px-4">
          <div className="flex items-center space-x-2">
            <History className="h-4 w-4 text-workbench-accent" />
            <span className="font-sans text-sm font-semibold text-workbench-textPrimary">Query History</span>
            <span className="rounded bg-carbon-800 px-1.5 py-0.5 text-[10px] text-workbench-textMuted border border-workbench-border">
              {history.length}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {history.length > 0 && (
              <button
                onClick={onClearHistory}
                className="flex items-center gap-1 rounded px-2 py-1 text-2xs text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-900/40 transition-colors cursor-pointer"
                title="Clear all history"
              >
                <Trash2 className="h-3 w-3" />
                <span>Clear History</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded text-workbench-textMuted hover:bg-carbon-800 hover:text-workbench-textPrimary transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="border-b border-workbench-border p-3 bg-carbon-900/30">
          <div className="relative flex items-center">
            <Search className="absolute left-3 h-3.5 w-3.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search SQL query history..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              className="w-full rounded-md border border-workbench-border bg-carbon-900/80 py-1.5 pl-9 pr-3 text-xs text-workbench-textPrimary placeholder:text-workbench-textMuted outline-none focus:border-workbench-accent focus:ring-1 focus:ring-workbench-accent/30 font-sans transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[60vh] no-scrollbar">
          {filteredHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-zinc-500">
              <History className="h-8 w-8 opacity-30 mb-2" />
              <p className="font-sans text-xs">No query history saved yet.</p>
            </div>
          ) : (
            filteredHistory.map((item) => (
              <div
                key={item.id}
                className="group rounded-lg border border-workbench-border/70 bg-carbon-900/60 p-3 hover:border-workbench-accent/40 hover:bg-carbon-900 transition-all"
              >
                <div className="flex items-center justify-between mb-1.5 text-2xs text-workbench-textMuted">
                  <div className="flex items-center space-x-2">
                    {item.status === 'success' ? (
                      <span className="flex items-center gap-1 text-workbench-accent font-medium">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Success</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-rose-400 font-medium">
                        <AlertCircle className="h-3 w-3" />
                        <span>Error</span>
                      </span>
                    )}
                    <span className="text-workbench-textMuted">•</span>
                    <span className="flex items-center gap-1 text-workbench-textSecondary">
                      <Clock className="h-3 w-3 text-amber-400" />
                      {formatDurationMs(item.durationMs)}
                    </span>
                    <span className="text-zinc-600">•</span>
                    <span>{formatNumberWithCommas(item.rowCount)} rows</span>
                  </div>

                  <span className="text-zinc-500">{new Date(item.timestamp).toLocaleTimeString()}</span>
                </div>

                <pre className="overflow-x-auto rounded bg-carbon-950 p-2.5 text-2xs font-mono text-workbench-textSecondary whitespace-pre-wrap break-words max-h-24 border border-workbench-border/50">
                  {item.sql}
                </pre>

                {item.errorMessage && (
                  <p className="mt-1.5 text-[11px] text-rose-400 font-mono">
                    {item.errorMessage}
                  </p>
                )}

                <div className="mt-2.5 flex items-center justify-end space-x-1.5 pt-2 border-t border-workbench-border/50">
                  <button
                    onClick={() => handleCopySql(item.id, item.sql)}
                    className="flex items-center gap-1 rounded bg-carbon-800 px-2.5 py-1 text-2xs text-workbench-textSecondary hover:bg-carbon-750 hover:text-workbench-textPrimary transition-colors cursor-pointer"
                  >
                    {copiedId === item.id ? (
                      <Check className="h-3 w-3 text-workbench-accent" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                    <span>{copiedId === item.id ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button
                    onClick={() => {
                      onSelectQuery(item.sql);
                      onClose();
                    }}
                    className="flex items-center gap-1 rounded bg-carbon-800 px-2.5 py-1 text-2xs text-workbench-textSecondary hover:bg-carbon-750 hover:text-cyan-300 transition-colors cursor-pointer"
                  >
                    <FileInput className="h-3 w-3 text-cyan-400" />
                    <span>Use in Active Tab</span>
                  </button>
                  <button
                    onClick={() => {
                      onCreateTabWithQuery(item.sql);
                      onClose();
                    }}
                    className="flex items-center gap-1 rounded bg-workbench-accent px-2.5 py-1 text-2xs font-semibold text-white hover:opacity-90 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
                  >
                    <PlusSquare className="h-3 w-3" />
                    <span>New Tab</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
