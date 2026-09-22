'use client';

import React from 'react';
import { Cpu, Database, Zap, Lock } from 'lucide-react';
import type { EngineStats, QueryExecutionResult } from '@/types';
import { formatDurationMs, formatNumberWithCommas } from '@/lib/utils';

interface StatusBarProps {
  stats: EngineStats;
  lastResult: QueryExecutionResult | null;
  onOpenAbout?: () => void;
}

export function StatusBar({ stats, lastResult, onOpenAbout }: StatusBarProps) {
  return (
    <footer className="flex h-7 w-full items-center justify-between border-t border-workbench-border bg-carbon-950 px-3 font-mono text-[11px] select-none text-workbench-textMuted z-20">
      <div className="flex items-center space-x-2 sm:space-x-3">
        <button
          onClick={onOpenAbout}
          className="flex items-center space-x-1.5 hover:text-workbench-textPrimary transition-colors cursor-pointer"
          title="Click to view engine details"
        >
          <span className="relative flex h-1.5 w-1.5">
            {stats.isReady ? (
              <>
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-indigo-500" />
              </>
            ) : stats.isInitializing ? (
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-workbench-amber animate-pulse" />
            ) : (
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-workbench-crimson" />
            )}
          </span>
          <span className="text-workbench-textSecondary font-medium">
            {stats.isReady ? 'Local Engine (Ready)' : stats.isInitializing ? 'Initializing Engine...' : 'Engine Offline'}
          </span>
        </button>

        <span className="text-workbench-border">|</span>

        <div className="flex items-center space-x-1" title="Estimated WebAssembly VFS heap allocation">
          <Cpu className="h-3 w-3 text-workbench-cyan" />
          <span>Mem: <strong className="font-normal text-workbench-textSecondary">{stats.bufferMemoryMb} MB</strong></span>
        </div>

        <span className="hidden sm:inline text-workbench-border">|</span>

        <div className="hidden sm:flex items-center space-x-1" title="Number of active tables in in-memory catalog">
          <Database className="h-3 w-3 text-indigo-400" />
          <span>Tables: <strong className="font-normal text-workbench-textSecondary">{stats.tablesCount}</strong></span>
        </div>
      </div>

      <div className="flex items-center space-x-2 sm:space-x-3">
        {lastResult && !lastResult.error && (
          <>
            <div className="flex items-center space-x-1 text-indigo-400">
              <Zap className="h-3 w-3 fill-current" />
              <span>{formatDurationMs(lastResult.durationMs)}</span>
            </div>

            <span className="hidden sm:inline text-workbench-border">|</span>

            <div className="hidden sm:flex items-center space-x-1">
              <span>{formatNumberWithCommas(lastResult.totalRows)} rows</span>
            </div>

            <span className="text-workbench-border">|</span>
          </>
        )}

        <div className="flex items-center space-x-1 text-indigo-400/90" title="Data is never sent to a remote server">
          <Lock className="h-2.5 w-2.5" />
          <span className="text-[10px]">Private & Local</span>
        </div>
      </div>
    </footer>
  );
}
