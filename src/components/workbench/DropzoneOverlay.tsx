'use client';

import React from 'react';
import { UploadCloud, FileText, Database, FileSpreadsheet, Binary } from 'lucide-react';

interface DropzoneOverlayProps {
  isVisible: boolean;
}

export function DropzoneOverlay({ isVisible }: DropzoneOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-carbon-950/80 backdrop-blur-xs pointer-events-none transition-all duration-150 animate-in fade-in">
      <div className="relative mx-6 max-w-xl w-full rounded-2xl border-2 border-dashed border-workbench-accent/80 bg-carbon-900/95 p-8 shadow-2xl text-center">
        <div className="absolute -inset-1 rounded-2xl bg-workbench-accent/10 blur-xl pointer-events-none" />

        <div className="relative flex flex-col items-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-workbench-accent/40 bg-carbon-800/80 text-workbench-accent shadow-inner">
            <UploadCloud className="h-8 w-8 animate-bounce" />
          </div>

          <h3 className="font-sans text-lg font-bold text-workbench-textPrimary tracking-tight">
            Drop Dataset to Query Instantly
          </h3>

          <p className="mt-1.5 font-sans text-xs text-workbench-textMuted max-w-sm">
            Files are processed 100% locally in your browser privately without data ever being sent to a server.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 font-mono text-2xs">
            <div className="flex items-center gap-1.5 rounded-md border border-workbench-border bg-carbon-800/80 px-2.5 py-1 text-workbench-textPrimary">
              <FileText className="h-3.5 w-3.5 text-workbench-accent" />
              <span>CSV (Auto-delim)</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-md border border-workbench-border bg-carbon-800/80 px-2.5 py-1 text-workbench-textPrimary">
              <Database className="h-3.5 w-3.5 text-cyan-400" />
              <span>JSON / NDJSON</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-md border border-workbench-border bg-carbon-800/80 px-2.5 py-1 text-workbench-textPrimary">
              <Binary className="h-3.5 w-3.5 text-amber-400" />
              <span>Apache Parquet</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-md border border-workbench-border bg-carbon-800/80 px-2.5 py-1 text-workbench-textPrimary">
              <FileSpreadsheet className="h-3.5 w-3.5 text-purple-400" />
              <span>Excel (.xlsx)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
