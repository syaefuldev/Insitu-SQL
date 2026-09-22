'use client';

import React from 'react';
import {
  X,
  Database,
  Cpu,
  ShieldCheck,
} from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AboutModal({ isOpen, onClose }: AboutModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-lg flex-col rounded-xl border border-workbench-border bg-carbon-900 shadow-craftsman overflow-hidden"
      >
        <div className="flex items-center justify-between border-b border-workbench-border bg-carbon-850 px-5 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-workbench-accent/20 border border-workbench-accent/40 text-workbench-accent">
              <Database className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-workbench-textPrimary tracking-tight">
                  InSitu SQL Studio
                </span>
                <span className="rounded bg-carbon-800 px-1.5 py-0.5 font-mono text-[10px] text-workbench-accent border border-workbench-border">
                  v0.1.0
                </span>
              </div>
              <p className="text-[11px] text-workbench-textMuted">
                Autonomous In-Browser Tabular Data & SQL Exploration
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-workbench-textMuted hover:bg-carbon-750 hover:text-workbench-textPrimary transition-all cursor-pointer"
            title="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs font-sans text-workbench-textSecondary leading-relaxed">
          <div className="rounded-lg border border-workbench-border/80 bg-carbon-850/60 p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-workbench-accent font-semibold text-xs font-mono">
              <ShieldCheck className="h-4 w-4" />
              <span>Zero Backend • 100% Client-Side Privacy</span>
            </div>
            <p className="text-2xs text-workbench-textMuted">
              All datasets and SQL execution run purely inside your browser memory using WebAssembly VFS. Your data is never sent to any external server.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-mono text-2xs uppercase tracking-wider text-workbench-textMuted font-semibold flex items-center gap-1.5">
              <Cpu className="h-3.5 w-3.5 text-workbench-cyan" />
              <span>Core Technologies & Open-Source Attributions</span>
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-2xs">
              <div className="rounded border border-workbench-border/60 bg-carbon-850/40 p-2.5 space-y-1">
                <div className="font-semibold text-workbench-textPrimary">DuckDB-WASM</div>
                <div className="text-workbench-textMuted text-[11px]">Columnar SQL Engine (MIT / Apache-2.0)</div>
              </div>
              <div className="rounded border border-workbench-border/60 bg-carbon-850/40 p-2.5 space-y-1">
                <div className="font-semibold text-workbench-textPrimary">Apache Arrow</div>
                <div className="text-workbench-textMuted text-[11px]">In-Memory Tabular IPC Format</div>
              </div>
              <div className="rounded border border-workbench-border/60 bg-carbon-850/40 p-2.5 space-y-1">
                <div className="font-semibold text-workbench-textPrimary">Monaco Editor</div>
                <div className="text-workbench-textMuted text-[11px]">SQL Code Intelligence (MIT)</div>
              </div>
              <div className="rounded border border-workbench-border/60 bg-carbon-850/40 p-2.5 space-y-1">
                <div className="font-semibold text-workbench-textPrimary">TanStack Virtual</div>
                <div className="text-workbench-textMuted text-[11px]">High-FPS Row Virtualization (MIT)</div>
              </div>
            </div>
          </div>

          <div className="rounded border border-workbench-border/40 bg-carbon-950/60 p-3 text-[11px] text-workbench-textMuted">
            InSitu SQL is independent open-source software. Third-party libraries are distributed under their respective software license terms.
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-workbench-border bg-carbon-850 px-5 py-3 font-mono text-xs">
          <span className="text-2xs text-workbench-textMuted">Crafted for precision analytics</span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-md bg-workbench-accent text-white font-medium text-2xs transition-all cursor-pointer shadow-sm active:scale-[0.98] hover:opacity-90"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
