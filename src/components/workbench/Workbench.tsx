'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  X,
  Loader2,
} from 'lucide-react';
import { useDuckDB } from '@/hooks/useDuckDB';
import { ingestionEngine } from '@/lib/duckdb/ingestion';
import { useWorkbenchStore } from '@/lib/store/workbench-store';
import { Header } from '@/components/workbench/Header';
import { SchemaExplorer } from '@/components/workbench/SchemaExplorer';
import { SqlEditorPanel } from '@/components/editor/SqlEditorPanel';
import { ResultsPanel } from '@/components/workbench/ResultsPanel';
import { StatusBar } from '@/components/workbench/StatusBar';
import { DropzoneOverlay } from '@/components/workbench/DropzoneOverlay';
import { QueryHistoryModal } from '@/components/workbench/QueryHistoryModal';
import { AboutModal } from '@/components/workbench/AboutModal';
import type { QueryHistoryRecord } from '@/types';

export function Workbench() {
  const {
    stats,
    isReady,
    error: duckdbInitError,
    catalog,
    isLoadingCatalog,
    executeQuery,
    refreshCatalog,
    dropTable,
  } = useDuckDB();

  const {
    theme,
    setTheme,
    isSidebarOpen,
    toggleSidebar,
    splitRatio,
    updateSplitRatio,
    tabs,
    activeTabId,
    activeTab,
    setActiveTabId,
    createTab,
    closeTab,
    updateTabSql,
    updateTabTitle,
    history,
    addHistoryRecord,
    clearHistory,
    activeView,
    setActiveView,
    filterText,
    setFilterText,
    isExecuting,
    setIsExecuting,
    lastResult,
    setLastResult,
  } = useWorkbenchStore();

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState<boolean>(false);
  const [isDraggingSplitter, setIsDraggingSplitter] = useState<boolean>(false);

  const [isIngesting, setIsIngesting] = useState<boolean>(false);
  const [ingestionMessage, setIngestionMessage] = useState<string>('');
  const [isDragOverWindow, setIsDragOverWindow] = useState<boolean>(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(0);
  const [highlightedTable, setHighlightedTable] = useState<string | null>(null);

  const [toast, setToast] = useState<{
    id: string;
    type: 'success' | 'error' | 'info';
    title: string;
    description?: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const showToast = useCallback(
    (type: 'success' | 'error' | 'info', title: string, description?: string) => {
      setToast({ id: Math.random().toString(), type, title, description });
      setTimeout(() => {
        setToast((current: { id: string; type: 'success' | 'error' | 'info'; title: string; description?: string } | null) =>
          current?.title === title ? null : current
        );
      }, 5000);
    },
    []
  );

  const handleExecuteQuery = useCallback(
    async (queryText: string) => {
      if (!queryText.trim()) return;

      setIsExecuting(true);
      const result = await executeQuery(queryText);
      setLastResult(result);
      setIsExecuting(false);

      const historyRecord: QueryHistoryRecord = {
        id: Math.random().toString(36).substring(2, 9),
        sql: queryText,
        timestamp: Date.now(),
        durationMs: result.durationMs,
        rowCount: result.totalRows,
        status: result.error ? 'error' : 'success',
        errorMessage: result.error,
      };
      addHistoryRecord(historyRecord);

      if (result.statementType && result.statementType !== 'SELECT' && result.statementType !== 'OTHER') {
        if (!result.error) {
          if (result.targetTable) {
            setHighlightedTable(result.targetTable);
            setTimeout(() => setHighlightedTable(null), 3000);
          }
          showToast(
            'success',
            `${result.statementType.replace('_', ' ')} Executed`,
            result.message || `Catalog operation completed successfully.`
          );
        }
      }
    },
    [executeQuery, setLastResult, setIsExecuting, addHistoryRecord, showToast]
  );

  useEffect(() => {
    if (autoRefreshInterval <= 0 || !activeTab?.sql) return;

    const timer = setInterval(() => {
      if (!isExecuting) {
        handleExecuteQuery(activeTab.sql);
      }
    }, autoRefreshInterval);

    return () => clearInterval(timer);
  }, [autoRefreshInterval, activeTab?.sql, isExecuting, handleExecuteQuery]);

  const handleIngestFiles = useCallback(
    async (files: FileList | File[]) => {
      if (!files || files.length === 0) return;

      setIsIngesting(true);
      const fileArray = Array.from(files);

      for (const file of fileArray) {
        setIngestionMessage(`Processing ${file.name} (${(file.size / 1024).toFixed(1)} KB)...`);
        try {
          const result = await ingestionEngine.ingestFile(file);
          await refreshCatalog();
          showToast(
            'success',
            'Dataset Registered!',
            `Table "${result.tableName}" (${result.rowCount.toLocaleString()} rows) ready for analysis.`
          );

          const sampleSql = `SELECT * FROM "${result.tableName}" LIMIT 50;`;
          createTab(result.tableName, sampleSql);
          handleExecuteQuery(sampleSql);
        } catch (err: unknown) {
          showToast('error', 'Failed to Load File', err instanceof Error ? err.message : String(err));
        }
      }

      setIsIngesting(false);
      setIngestionMessage('');
    },
    [refreshCatalog, showToast, createTab, handleExecuteQuery]
  );

  const handleLoadSample = useCallback(
    async (datasetId: string) => {
      setIsIngesting(true);
      setIngestionMessage('Loading sample dataset in-memory...');
      try {
        const result = await ingestionEngine.loadSample(datasetId);
        await refreshCatalog();
        showToast(
          'success',
          'Sample Loaded!',
          `Table "${result.tableName}" (${result.rowCount.toLocaleString()} rows) ready for analysis.`
        );

        const sampleSql = `SELECT * FROM "${result.tableName}" LIMIT 50;`;
        createTab(result.tableName, sampleSql);
        handleExecuteQuery(sampleSql);
      } catch (err: unknown) {
        showToast('error', 'Failed to Load Sample', err instanceof Error ? err.message : String(err));
      } finally {
        setIsIngesting(false);
        setIngestionMessage('');
      }
    },
    [refreshCatalog, showToast, createTab, handleExecuteQuery]
  );

  const initialLoadRef = useRef(false);
  useEffect(() => {
    if (isReady && !initialLoadRef.current && catalog.length === 0) {
      initialLoadRef.current = true;
      handleLoadSample('ecommerce_transactions');
    }
  }, [isReady, catalog.length, handleLoadSample]);

  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      dragCounterRef.current += 1;
      if (e.dataTransfer?.types.includes('Files')) {
        setIsDragOverWindow(true);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounterRef.current -= 1;
      if (dragCounterRef.current <= 0) {
        setIsDragOverWindow(false);
        dragCounterRef.current = 0;
      }
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      dragCounterRef.current = 0;
      setIsDragOverWindow(false);

      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        handleIngestFiles(e.dataTransfer.files);
      }
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('drop', handleDrop);
    };
  }, [handleIngestFiles]);

  const handleSplitterMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingSplitter(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingSplitter || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const relativeY = e.clientY - rect.top;
      const percentage = (relativeY / rect.height) * 100;
      updateSplitRatio(percentage);
    };

    const handleMouseUp = () => {
      if (isDraggingSplitter) {
        setIsDraggingSplitter(false);
      }
    };

    if (isDraggingSplitter) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'row-resize';
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isDraggingSplitter, updateSplitRatio]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebar();
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        setIsHistoryModalOpen((prev: boolean) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebar]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-carbon-900 text-workbench-textPrimary font-sans select-none">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".csv,.tsv,.txt,.json,.ndjson,.parquet,.parquet.snappy,.xlsx,.xls"
        className="hidden"
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          if (e.target.files && e.target.files.length > 0) {
            handleIngestFiles(e.target.files);
            e.target.value = '';
          }
        }}
      />

      <DropzoneOverlay isVisible={isDragOverWindow} />

      <QueryHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        history={history}
        onSelectQuery={(sql: string) => {
          if (activeTab) {
            updateTabSql(activeTab.id, sql);
          }
        }}
        onCreateTabWithQuery={(sql: string) => {
          createTab('History Query', sql);
        }}
        onClearHistory={clearHistory}
      />

      <AboutModal
        isOpen={isAboutModalOpen}
        onClose={() => setIsAboutModalOpen(false)}
      />

      {isIngesting && (
        <div className="bg-carbon-850 border-b border-workbench-accent/40 px-4 py-1.5 flex items-center justify-between text-xs text-workbench-textPrimary z-30 animate-fadeIn">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-3.5 w-3.5 text-workbench-accent animate-spin" />
            <span className="font-mono text-2xs font-semibold text-workbench-accent uppercase tracking-wider">
              INGESTION ENGINE:
            </span>
            <span className="font-sans text-workbench-textPrimary">{ingestionMessage}</span>
          </div>
          <span className="font-mono text-2xs text-workbench-textMuted hidden sm:inline">Processing in-memory VFS...</span>
        </div>
      )}

      <Header
        theme={theme}
        onThemeChange={setTheme}
        onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
        onSelectSample={handleLoadSample}
        onOpenHistory={() => setIsHistoryModalOpen(true)}
        onTriggerUpload={() => fileInputRef.current?.click()}
        onOpenAbout={() => setIsAboutModalOpen(true)}
      />

      {duckdbInitError && (
        <div className="bg-rose-950/70 border-b border-rose-800/80 px-4 py-2 flex items-center justify-between text-xs text-rose-200">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
            <span className="font-mono font-medium text-rose-300">WASM Initialization Alert:</span>
            <span>{duckdbInitError}</span>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-2.5 py-1 bg-rose-900/60 hover:bg-rose-800 rounded text-rose-100 border border-rose-700 font-mono text-2xs transition-colors cursor-pointer"
          >
            Reload InSitu SQL
          </button>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden relative">
        {isMobileSidebarOpen && (
          <div className="fixed inset-0 z-40 lg:hidden flex">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
              onClick={() => setIsMobileSidebarOpen(false)}
            />
            <div className="relative z-50 w-72 max-w-[85vw] h-full shadow-2xl animate-in slide-in-from-left duration-200">
              <SchemaExplorer
                catalog={catalog}
                isLoading={isLoadingCatalog}
                onRefresh={refreshCatalog}
                highlightedTable={highlightedTable}
                onQueryTable={(tableName: string) => {
                  const query = `SELECT * FROM "${tableName}" LIMIT 50;`;
                  createTab(tableName, query);
                  setIsMobileSidebarOpen(false);
                  setTimeout(() => {
                    handleExecuteQuery(query);
                  }, 100);
                }}
                onDropTable={async (tableName: string) => {
                  if (window.confirm(`Drop table "${tableName}" from in-memory catalog?`)) {
                    await dropTable(tableName);
                    showToast('info', 'Table Dropped', `Table ${tableName} has been removed.`);
                  }
                }}
                onLoadSample={(datasetId: string) => {
                  handleLoadSample(datasetId);
                  setIsMobileSidebarOpen(false);
                }}
                isCollapsed={false}
                onToggleCollapse={() => {}}
                onCloseMobile={() => setIsMobileSidebarOpen(false)}
              />
            </div>
          </div>
        )}

        <div
          className={`hidden lg:flex h-full shrink-0 transition-[width] duration-150 ease-in-out ${
            isSidebarOpen ? 'w-64' : 'w-10'
          }`}
        >
          <SchemaExplorer
            catalog={catalog}
            isLoading={isLoadingCatalog}
            onRefresh={refreshCatalog}
            highlightedTable={highlightedTable}
            onQueryTable={(tableName: string) => {
              const query = `SELECT * FROM "${tableName}" LIMIT 50;`;
              createTab(tableName, query);
              setTimeout(() => {
                handleExecuteQuery(query);
              }, 100);
            }}
            onDropTable={async (tableName: string) => {
              if (window.confirm(`Drop table "${tableName}" from in-memory catalog?`)) {
                await dropTable(tableName);
                showToast('info', 'Table Dropped', `Table ${tableName} has been removed.`);
              }
            }}
            onLoadSample={handleLoadSample}
            isCollapsed={!isSidebarOpen}
            onToggleCollapse={toggleSidebar}
          />
        </div>

        <div
          ref={containerRef}
          className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden bg-carbon-950"
        >
          <div
            style={{ height: `${splitRatio}%` }}
            className="w-full flex flex-col overflow-hidden min-h-[100px] shrink-0"
          >
            <SqlEditorPanel
              tabs={tabs}
              activeTabId={activeTabId}
              onSelectTab={setActiveTabId}
              onCloseTab={closeTab}
              onCreateTab={createTab}
              onUpdateSql={updateTabSql}
              onUpdateTitle={updateTabTitle}
              onExecute={() => {
                if (activeTab) {
                  handleExecuteQuery(activeTab.sql);
                }
              }}
              isExecuting={isExecuting}
              autoRefreshInterval={autoRefreshInterval}
              onSetAutoRefreshInterval={setAutoRefreshInterval}
              theme={theme}
            />
          </div>

          <div
            onMouseDown={handleSplitterMouseDown}
            className={`group relative h-[6px] w-full shrink-0 cursor-row-resize transition-colors z-20 flex items-center justify-center select-none ${
              isDraggingSplitter ? 'bg-workbench-accent' : 'bg-workbench-border hover:bg-workbench-accent/70'
            }`}
            title="Drag up or down to resize Editor & Query Results"
          >
            <div className="w-10 h-[2px] rounded-full bg-zinc-500/60 group-hover:bg-zinc-200 transition-colors pointer-events-none" />
          </div>

          <div className="flex-1 w-full overflow-hidden flex flex-col min-h-[120px]">
            <ResultsPanel
              activeView={activeView}
              onViewChange={setActiveView}
              filterText={filterText}
              onFilterChange={setFilterText}
              result={lastResult}
              isExecuting={isExecuting}
              onReRun={() => {
                if (activeTab) {
                  handleExecuteQuery(activeTab.sql);
                }
              }}
            />
          </div>
        </div>
      </div>

      <StatusBar
        stats={stats}
        lastResult={lastResult}
        onOpenAbout={() => setIsAboutModalOpen(true)}
      />

      {toast && (
        <div
          className={`fixed bottom-10 right-4 z-50 flex items-start gap-2.5 max-w-md p-3 rounded-lg border text-xs shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 ${
            toast.type === 'error'
              ? 'bg-rose-950/90 border-rose-700/80 text-rose-100'
              : toast.type === 'success'
              ? 'bg-carbon-900/95 border-workbench-accent/50 text-workbench-textPrimary'
              : 'bg-carbon-900/95 border-carbon-700 text-workbench-textPrimary'
          }`}
        >
          {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />}
          {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-workbench-accent shrink-0 mt-0.5" />}
          {toast.type === 'info' && <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />}
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-xs tracking-wide">{toast.title}</div>
            {toast.description && (
              <div className="text-2xs text-workbench-textMuted mt-0.5 font-mono truncate">{toast.description}</div>
            )}
          </div>
          <button
            onClick={() => setToast(null)}
            className="text-workbench-textMuted hover:text-workbench-textSecondary transition-colors shrink-0 ml-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
