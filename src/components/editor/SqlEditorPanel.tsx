'use client';

import React, { useState } from 'react';
import {
  Play,
  Plus,
  X,
  Edit2,
  Check,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { SqlEditor } from './SqlEditor';
import type { EditorTab, AppTheme } from '@/types';

interface SqlEditorPanelProps {
  tabs: EditorTab[];
  activeTabId: string;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  onCreateTab: (title?: string, sql?: string) => void;
  onUpdateSql: (id: string, sql: string) => void;
  onUpdateTitle: (id: string, title: string) => void;
  onExecute: () => void;
  isExecuting: boolean;
  autoRefreshInterval?: number;
  onSetAutoRefreshInterval?: (interval: number) => void;
  theme?: AppTheme;
}

export function SqlEditorPanel({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onCreateTab,
  onUpdateSql,
  onUpdateTitle,
  onExecute,
  isExecuting,
  autoRefreshInterval = 0,
  onSetAutoRefreshInterval,
  theme = 'obsidian',
}: SqlEditorPanelProps) {
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>('');

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  const handleStartRename = (tab: EditorTab, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTabId(tab.id);
    setEditingTitle(tab.title);
  };

  const handleSaveRename = (tabId: string) => {
    if (editingTitle.trim()) {
      onUpdateTitle(tabId, editingTitle.trim());
    }
    setEditingTabId(null);
  };

  return (
    <div className="flex h-full w-full flex-col bg-carbon-900 select-none overflow-hidden">
      <div className="flex h-10 items-center justify-between border-b border-workbench-border bg-carbon-850 px-2 gap-1.5 shrink-0 overflow-hidden">
        <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar flex-1 min-w-0">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            const isEditing = editingTabId === tab.id;

            return (
              <div
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`group relative flex h-8 items-center rounded-t-md px-2.5 sm:px-3 text-xs font-mono transition-all cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-carbon-900 text-workbench-textPrimary border-t-2 border-workbench-accent font-medium shadow-xs'
                    : 'bg-transparent text-workbench-textMuted hover:bg-carbon-800/60 hover:text-workbench-textSecondary'
                }`}
              >
                {isEditing ? (
                  <div className="flex items-center gap-1" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingTitle(e.target.value)}
                      onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                        if (e.key === 'Enter') handleSaveRename(tab.id);
                        if (e.key === 'Escape') setEditingTabId(null);
                      }}
                      autoFocus
                      className="w-20 sm:w-24 bg-carbon-800 border border-workbench-accent px-1.5 py-0.5 text-xs text-workbench-textPrimary outline-none rounded font-sans"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveRename(tab.id)}
                      className="text-workbench-accent hover:text-workbench-textPrimary p-0.5 cursor-pointer"
                      title="Save tab name"
                    >
                      <Check className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <span
                    onDoubleClick={(e: React.MouseEvent) => handleStartRename(tab, e)}
                    className="truncate max-w-[90px] sm:max-w-[130px] font-sans text-[11.5px]"
                    title={tab.title}
                  >
                    {tab.title}
                    {tab.isDirty && <span className="ml-1 text-amber-400">•</span>}
                  </span>
                )}

                {!isEditing && (
                  <div className="ml-1.5 flex items-center space-x-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={(e: React.MouseEvent) => handleStartRename(tab, e)}
                      className="text-workbench-textMuted hover:text-workbench-textPrimary p-0.5 rounded transition-colors cursor-pointer"
                      title="Rename tab"
                    >
                      <Edit2 className="h-2.5 w-2.5" />
                    </button>
                    {tabs.length > 1 && (
                      <button
                        type="button"
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          onCloseTab(tab.id);
                        }}
                        className="text-workbench-textMuted hover:text-rose-400 p-0.5 rounded transition-colors cursor-pointer"
                        title="Close tab"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          <button
            type="button"
            onClick={() => onCreateTab()}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-workbench-textMuted hover:bg-carbon-800 hover:text-workbench-textPrimary transition-colors cursor-pointer"
            title="New SQL tab"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {onSetAutoRefreshInterval && (
            <div className="flex h-7 items-center gap-1 rounded-md bg-carbon-800/80 border border-workbench-border/80 px-1.5 py-0.5 text-[11px] font-mono">
              <RefreshCw
                className={`h-3 w-3 ${
                  autoRefreshInterval > 0
                    ? 'text-workbench-accent animate-spin [animation-duration:3s]'
                    : 'text-workbench-textMuted'
                }`}
              />
              <span className="text-workbench-textMuted text-[10.5px] hidden 2xl:inline">Auto:</span>
              <select
                value={autoRefreshInterval}
                onChange={(e) => onSetAutoRefreshInterval(Number(e.target.value))}
                className="bg-transparent text-workbench-textPrimary text-[11px] focus:outline-none cursor-pointer"
                title="Live Auto Refresh Interval"
              >
                <option value={0} className="bg-carbon-850 text-workbench-textPrimary">
                  Off
                </option>
                <option value={1000} className="bg-carbon-850 text-workbench-textPrimary">
                  1s
                </option>
                <option value={3000} className="bg-carbon-850 text-workbench-textPrimary">
                  3s
                </option>
                <option value={5000} className="bg-carbon-850 text-workbench-textPrimary">
                  5s
                </option>
                <option value={10000} className="bg-carbon-850 text-workbench-textPrimary">
                  10s
                </option>
              </select>
              {autoRefreshInterval > 0 && (
                <span className="flex h-1.5 w-1.5 rounded-full bg-workbench-accent animate-ping" />
              )}
            </div>
          )}

          <button
            type="button"
            onClick={onExecute}
            disabled={isExecuting}
            className="flex h-7 items-center gap-1.5 rounded-md bg-workbench-accent hover:bg-workbench-accentHover active:scale-[0.98] px-2.5 sm:px-3 text-xs font-semibold text-white transition-all shadow-sm shadow-indigo-950/40 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            title="Run Query (Ctrl+Enter / Cmd+Enter)"
          >
            {isExecuting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
            ) : (
              <Play className="h-3.5 w-3.5 fill-current text-white" />
            )}
            <span>Run</span>
            <kbd className="ml-1 hidden 2xl:inline-block rounded bg-black/25 border border-white/20 px-1 py-0.2 font-mono text-[9px] text-white/90">
              ⌘↵
            </kbd>
          </button>
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden">
        {activeTab ? (
          <SqlEditor
            value={activeTab.sql}
            onChange={(val) => onUpdateSql(activeTab.id, val)}
            onExecute={onExecute}
            theme={theme}
          />
        ) : (
          <div className="flex h-full items-center justify-center font-mono text-xs text-workbench-textMuted">
            No active tab
          </div>
        )}
      </div>
    </div>
  );
}
