'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { duckdbClient } from '@/lib/duckdb/duckdb-client';
import type { EngineStats, TableCatalog, QueryExecutionResult } from '@/types';

export function useDuckDB() {
  const [stats, setStats] = useState<EngineStats>(() => duckdbClient.getStats());
  const [catalog, setCatalog] = useState<TableCatalog[]>([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState<boolean>(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;

    const unsubscribe = duckdbClient.subscribeStatus((newStats) => {
      if (mountedRef.current) {
        setStats(newStats);
      }
    });

    duckdbClient.init().then(() => {
      if (mountedRef.current) {
        refreshCatalog();
      }
    }).catch((err) => {
      console.error('DuckDB initialization failed:', err);
    });

    return () => {
      mountedRef.current = false;
      unsubscribe();
    };
  }, []);

  const refreshCatalog = useCallback(async (): Promise<TableCatalog[]> => {
    setIsLoadingCatalog(true);
    try {
      const cat = await duckdbClient.getCatalog();
      if (mountedRef.current) {
        setCatalog(cat);
      }
      return cat;
    } catch (err) {
      console.error('Failed to retrieve table catalog:', err);
      return [];
    } finally {
      if (mountedRef.current) {
        setIsLoadingCatalog(false);
      }
    }
  }, []);

  const executeQuery = useCallback(async (sql: string): Promise<QueryExecutionResult> => {
    const result = await duckdbClient.executeQuery(sql);
    
    if (!result.error) {
      const isSchemaOrDataMutation =
        result.statementType &&
        result.statementType !== 'SELECT';

      if (isSchemaOrDataMutation) {
        await refreshCatalog();
      }
    }
    
    return result;
  }, [refreshCatalog]);

  const dropTable = useCallback(async (tableName: string) => {
    await duckdbClient.dropTable(tableName);
    await refreshCatalog();
  }, [refreshCatalog]);

  return {
    stats,
    isReady: stats.isReady,
    isInitializing: stats.isInitializing,
    error: stats.error,
    catalog,
    isLoadingCatalog,
    executeQuery,
    refreshCatalog,
    dropTable,
  };
}
