'use client';

import { useState, useEffect, useCallback } from 'react';
import type {
  EditorTab,
  QueryExecutionResult,
  QueryHistoryRecord,
  AppTheme,
} from '@/types';
import { THEME_STORAGE_KEY } from '@/lib/theme';

const STORAGE_KEYS = {
  TABS: 'insitu_sql_tabs_v1',
  ACTIVE_TAB: 'insitu_sql_active_tab_v1',
  HISTORY: 'insitu_sql_history_v1',
  THEME: THEME_STORAGE_KEY,
  SIDEBAR: 'insitu_sql_sidebar_open',
  SPLIT_RATIO: 'insitu_sql_split_ratio_v1',
};

const DEFAULT_INITIAL_SQL = `SELECT 
  'DuckDB-WASM' AS engine,
  '100% Client-Side' AS architecture,
  'Zero Remote Telemetry' AS privacy,
  CURRENT_TIMESTAMP AS initialized_at;`;

const DEFAULT_TAB: EditorTab = {
  id: 'tab-default',
  title: 'Query 1',
  sql: DEFAULT_INITIAL_SQL,
  isDirty: false,
};

export function useWorkbenchStore() {
  const [theme, setThemeState] = useState<AppTheme>(() => {
    if (typeof window === 'undefined') return 'obsidian';
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.THEME) as AppTheme;
      if (saved && ['obsidian', 'midnight', 'tokyo', 'nordic', 'paper-light'].includes(saved)) {
        return saved;
      }
    } catch {
    }
    return 'obsidian';
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SIDEBAR);
      if (saved !== null) return saved === 'true';
    } catch {
    }
    return true;
  });

  const [splitRatio, setSplitRatio] = useState<number>(() => {
    if (typeof window === 'undefined') return 40;
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SPLIT_RATIO);
      if (saved) {
        const val = Number(saved);
        if (val >= 15 && val <= 85) return val;
      }
    } catch {
    }
    return 40;
  });

  const [tabs, setTabs] = useState<EditorTab[]>(() => {
    if (typeof window === 'undefined') return [DEFAULT_TAB];
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TABS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
    }
    return [DEFAULT_TAB];
  });

  const [activeTabId, setActiveTabId] = useState<string>(() => {
    if (typeof window === 'undefined') return DEFAULT_TAB.id;
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_TAB);
      if (saved) return saved;
    } catch {
    }
    return DEFAULT_TAB.id;
  });

  const [history, setHistory] = useState<QueryHistoryRecord[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.HISTORY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.slice(0, 100);
      }
    } catch {
    }
    return [];
  });

  const [activeView, setActiveView] = useState<'table' | 'chart'>('table');
  const [filterText, setFilterText] = useState<string>('');
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<QueryExecutionResult | null>(null);

  const setTheme = useCallback((newTheme: AppTheme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, newTheme);
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', newTheme);
        if (newTheme === 'paper-light') {
          document.documentElement.classList.remove('dark');
        } else {
          document.documentElement.classList.add('dark');
        }
      }
    } catch {
    }
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
      if (theme === 'paper-light') {
        document.documentElement.classList.remove('dark');
      } else {
        document.documentElement.classList.add('dark');
      }
    }
  }, [theme]);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev: boolean) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEYS.SIDEBAR, String(next));
      } catch {
      }
      return next;
    });
  }, []);

  const updateSplitRatio = useCallback((ratio: number) => {
    const clamped = Math.max(15, Math.min(85, Math.round(ratio)));
    setSplitRatio(clamped);
    try {
      localStorage.setItem(STORAGE_KEYS.SPLIT_RATIO, String(clamped));
    } catch {
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TABS, JSON.stringify(tabs));
    } catch {
    }
  }, [tabs]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_TAB, activeTabId);
    } catch {
    }
  }, [activeTabId]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
    } catch {
    }
  }, [history]);

  const activeTab = tabs.find((t: EditorTab) => t.id === activeTabId) || tabs[0];

  const updateTabSql = useCallback((id: string, newSql: string) => {
    setTabs((prev: EditorTab[]) =>
      prev.map((tab: EditorTab) => (tab.id === id ? { ...tab, sql: newSql, isDirty: true } : tab))
    );
  }, []);

  const updateTabTitle = useCallback((id: string, newTitle: string) => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    setTabs((prev: EditorTab[]) =>
      prev.map((tab: EditorTab) => (tab.id === id ? { ...tab, title: trimmed } : tab))
    );
  }, []);

  const createTab = useCallback((title?: string, initialSql?: string) => {
    const newId = `tab-${Date.now()}`;
    setTabs((prev: EditorTab[]) => {
      const newTab: EditorTab = {
        id: newId,
        title: title || `Query ${prev.length + 1}`,
        sql: initialSql ?? 'SELECT * FROM main;',
        isDirty: false,
      };
      return [...prev, newTab];
    });
    setActiveTabId(newId);
    return newId;
  }, []);

  const closeTab = useCallback((id: string) => {
    setTabs((prev: EditorTab[]) => {
      if (prev.length <= 1) return prev;
      const nextTabs = prev.filter((t: EditorTab) => t.id !== id);
      if (id === activeTabId) {
        const nextActive = nextTabs[nextTabs.length - 1];
        setActiveTabId(nextActive.id);
      }
      return nextTabs;
    });
  }, [activeTabId]);

  const addHistoryRecord = useCallback((record: QueryHistoryRecord) => {
    setHistory((prev: QueryHistoryRecord[]) => [record, ...prev.slice(0, 99)]);
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEYS.HISTORY);
    } catch {
    }
  }, []);

  return {
    theme,
    setTheme,
    isSidebarOpen,
    setIsSidebarOpen,
    toggleSidebar,
    splitRatio,
    updateSplitRatio,
    tabs,
    activeTab,
    activeTabId,
    setActiveTabId,
    updateTabSql,
    updateTabTitle,
    createTab,
    closeTab,
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
  };
}
