'use client';

import React, { useState } from 'react';
import {
  Database,
  History,
  UploadCloud,
  ChevronDown,
  Sparkles,
  Info,
  Menu,
  Check,
} from 'lucide-react';
import { SAMPLE_DATASETS } from '@/lib/duckdb/sample-datasets';
import { THEMES } from '@/lib/theme';
import type { AppTheme } from '@/types';

interface HeaderProps {
  onSelectSample: (datasetId: string) => void;
  onOpenHistory: () => void;
  onTriggerUpload: () => void;
  onOpenAbout: () => void;
  onOpenMobileSidebar?: () => void;
  theme: AppTheme;
  onThemeChange: (theme: AppTheme) => void;
}

export function Header({
  onSelectSample,
  onOpenHistory,
  onTriggerUpload,
  onOpenAbout,
  onOpenMobileSidebar,
  theme,
  onThemeChange,
}: HeaderProps) {
  const [samplesOpen, setSamplesOpen] = useState(false);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);

  const currentThemeDef = THEMES.find((t) => t.id === theme) || THEMES[0];

  return (
    <header className="flex h-12 w-full items-center justify-between border-b border-workbench-border bg-carbon-850 px-3 select-none shrink-0 z-30 gap-2">
      <div className="flex items-center gap-2.5 shrink-0">
        {onOpenMobileSidebar && (
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            className="flex lg:hidden h-8 w-8 items-center justify-center rounded-md border border-workbench-border bg-carbon-800 text-workbench-textMuted hover:text-workbench-textPrimary hover:bg-carbon-750 transition-all cursor-pointer"
            title="Open tables menu (Mobile)"
            aria-label="Open Schema Explorer"
          >
            <Menu className="h-4 w-4" />
          </button>
        )}

        <div className="flex items-center space-x-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md border border-workbench-accent/40 bg-workbench-accent/15 text-workbench-accent shadow-sm">
            <Database className="h-4 w-4" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-sans text-sm font-bold tracking-tight text-workbench-textPrimary">
              InSitu SQL
            </span>
            <span className="rounded bg-workbench-accent/15 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-workbench-accent border border-workbench-accent/30 font-semibold leading-none">
              STUDIO
            </span>
          </div>
        </div>

        <div className="hidden lg:block h-4 w-px bg-workbench-border ml-1" />

        <span className="hidden xl:inline-block font-sans text-xs text-workbench-textMuted truncate max-w-[260px]">
          Local-First In-Browser SQL Studio
        </span>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <div className="relative">
          <button
            type="button"
            onClick={() => setThemeMenuOpen(!themeMenuOpen)}
            className="flex items-center gap-1.5 rounded-md border border-workbench-border bg-carbon-800 px-2 py-1 text-xs font-medium text-workbench-textPrimary hover:bg-carbon-750 hover:border-workbench-accent transition-all cursor-pointer"
            title="Switch studio theme"
          >
            <div className="flex items-center -space-x-1">
              <span
                className="inline-block h-3 w-3 rounded-full border border-black/20"
                style={{ backgroundColor: currentThemeDef.swatches[0] }}
              />
              <span
                className="inline-block h-3 w-3 rounded-full border border-black/20"
                style={{ backgroundColor: currentThemeDef.swatches[2] }}
              />
            </div>
            <span className="hidden md:inline text-[11.5px]">{currentThemeDef.name}</span>
            <ChevronDown className="h-3 w-3 text-workbench-textMuted" />
          </button>

          {themeMenuOpen && (
            <div
              onClick={() => setThemeMenuOpen(false)}
              className="fixed inset-0 z-40"
            />
          )}

          {themeMenuOpen && (
            <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-lg border border-workbench-border bg-carbon-850 p-1.5 shadow-2xl font-sans">
              <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-workbench-textMuted font-mono flex items-center justify-between">
                <span>Theme Presets</span>
                <span>Live Hot-Swap</span>
              </div>
              <div className="space-y-0.5">
                {THEMES.map((th) => {
                  const isSelected = th.id === theme;
                  return (
                    <button
                      key={th.id}
                      type="button"
                      onClick={() => {
                        onThemeChange(th.id);
                        setThemeMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between rounded-md px-2 py-1.5 text-xs transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-carbon-750 text-workbench-accent font-semibold'
                          : 'text-workbench-textPrimary hover:bg-carbon-750/70'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-0.5">
                          <span
                            className="h-3 w-3 rounded-full border border-black/20"
                            style={{ backgroundColor: th.swatches[0] }}
                            title="Canvas"
                          />
                          <span
                            className="h-3 w-3 rounded-full border border-black/20"
                            style={{ backgroundColor: th.swatches[1] }}
                            title="Panel"
                          />
                          <span
                            className="h-3 w-3 rounded-full border border-black/20"
                            style={{ backgroundColor: th.swatches[2] }}
                            title="Accent"
                          />
                        </div>
                        <div>
                          <div className="text-[12px] leading-tight">{th.name}</div>
                          <div className="text-[9.5px] text-workbench-textMuted leading-tight">
                            {th.tagline}
                          </div>
                        </div>
                      </div>
                      {isSelected && <Check className="h-3.5 w-3.5 text-workbench-accent shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <div className="relative">
          <button
            type="button"
            onClick={() => setSamplesOpen(!samplesOpen)}
            className="flex items-center gap-1.5 rounded-md border border-workbench-border bg-carbon-800 px-2.5 py-1 text-xs font-medium text-workbench-textPrimary hover:bg-carbon-750 hover:border-workbench-accent transition-all cursor-pointer active:scale-[0.98]"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span className="hidden sm:inline">Samples</span>
            <ChevronDown className="h-3 w-3 text-workbench-textMuted" />
          </button>

          {samplesOpen && (
            <div
              onClick={() => setSamplesOpen(false)}
              className="fixed inset-0 z-40"
            />
          )}

          {samplesOpen && (
            <div className="absolute right-0 top-full z-50 mt-1 w-64 rounded-lg border border-workbench-border bg-carbon-850 p-1.5 shadow-2xl font-sans">
              <div className="px-2 py-1 text-2xs uppercase tracking-wider text-workbench-textMuted font-mono">
                Sample Datasets
              </div>
              {SAMPLE_DATASETS.map((sample) => (
                <button
                  key={sample.id}
                  type="button"
                  onClick={() => {
                    onSelectSample(sample.id);
                    setSamplesOpen(false);
                  }}
                  className="w-full rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-carbon-750 group cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-workbench-textPrimary group-hover:text-workbench-accent transition-colors">
                      {sample.name}
                    </span>
                    <span className="rounded bg-carbon-800 px-1 py-0.2 text-[9px] text-workbench-textMuted font-mono">
                      {sample.rowCountEstimated} rows
                    </span>
                  </div>
                  <p className="mt-0.5 line-clamp-1 text-2xs text-workbench-textMuted">
                    {sample.description}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onTriggerUpload}
          className="flex items-center gap-1.5 rounded-md border border-workbench-border bg-carbon-800 px-2.5 py-1 text-xs font-medium text-workbench-textPrimary hover:bg-carbon-750 hover:border-workbench-accent transition-all cursor-pointer active:scale-[0.98]"
          title="Upload CSV, JSON, Parquet, or Excel files"
        >
          <UploadCloud className="h-3.5 w-3.5 text-cyan-400" />
          <span className="hidden sm:inline">Import</span>
        </button>

        <button
          type="button"
          onClick={onOpenHistory}
          className="flex items-center gap-1.5 rounded-md border border-workbench-border bg-carbon-800 px-2.5 py-1 text-xs font-medium text-workbench-textPrimary hover:bg-carbon-750 hover:border-workbench-accent transition-all cursor-pointer active:scale-[0.98]"
          title="View query history (Ctrl+H)"
        >
          <History className="h-3.5 w-3.5 text-workbench-textMuted" />
          <span className="hidden md:inline">History</span>
        </button>

        <button
          type="button"
          onClick={onOpenAbout}
          className="flex h-7 w-7 items-center justify-center rounded-md border border-workbench-border bg-carbon-800 text-workbench-textMuted hover:text-workbench-accent hover:bg-carbon-750 hover:border-workbench-accent transition-all cursor-pointer active:scale-[0.98]"
          title="About InSitu SQL & System Architecture"
        >
          <Info className="h-3.5 w-3.5" />
        </button>
      </div>
    </header>
  );
}
