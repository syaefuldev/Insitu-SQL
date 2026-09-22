'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { BarChart3, LineChart as LineIcon, AreaChart as AreaIcon } from 'lucide-react';
import type { ColumnMetadata, SupportedChartType } from '@/types';

interface ChartViewProps {
  columns: ColumnMetadata[];
  rows: Record<string, unknown>[];
}

const PALETTE = [
  '#6366F1',
  '#38BDF8',
  '#F59E0B',
  '#10B981',
  '#EC4899',
  '#8B5CF6',
];

export function ChartView({ columns, rows }: ChartViewProps) {
  const [chartType, setChartType] = useState<SupportedChartType>('bar');
  const [rowLimit, setRowLimit] = useState<number>(50);

  const numericColumns = useMemo(() => {
    return columns.filter((c) =>
      ['INTEGER', 'BIGINT', 'DOUBLE', 'FLOAT', 'DECIMAL'].includes(c.normalizedType)
    );
  }, [columns]);

  const categoricalColumns = useMemo(() => {
    return columns.filter((c) =>
      ['VARCHAR', 'DATE', 'TIMESTAMP', 'TIME', 'UNKNOWN'].includes(c.normalizedType)
    );
  }, [columns]);

  const defaultXKey = useMemo(() => {
    return categoricalColumns[0]?.name || columns[0]?.name || '';
  }, [categoricalColumns, columns]);

  const [xAxisKey, setXAxisKey] = useState<string>(defaultXKey);

  const defaultYKeys = useMemo(() => {
    if (numericColumns.length > 0) {
      return [numericColumns[0].name];
    }
    const nonXCols = columns.filter((c) => c.name !== defaultXKey);
    return nonXCols.length > 0 ? [nonXCols[0].name] : [];
  }, [numericColumns, columns, defaultXKey]);

  const [selectedYKeys, setSelectedYKeys] = useState<string[]>(defaultYKeys);

  useEffect(() => {
    setXAxisKey(defaultXKey);
  }, [defaultXKey]);

  useEffect(() => {
    setSelectedYKeys(defaultYKeys);
  }, [defaultYKeys]);

  const toggleYKey = (key: string) => {
    setSelectedYKeys((prev: string[]) => {
      if (prev.includes(key)) {
        if (prev.length === 1) return prev;
        return prev.filter((k: string) => k !== key);
      }
      return [...prev, key];
    });
  };

  const chartData = useMemo(() => {
    const sliced = rows.slice(0, rowLimit);
    return sliced.map((row) => {
      const item: Record<string, unknown> = {
        [xAxisKey]: row[xAxisKey] ?? 'null',
      };
      selectedYKeys.forEach((yKey: string) => {
        const val = row[yKey];
        item[yKey] = typeof val === 'number' ? val : Number(val) || 0;
      });
      return item;
    });
  }, [rows, xAxisKey, selectedYKeys, rowLimit]);

  if (rows.length === 0 || columns.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center font-mono text-xs text-workbench-textMuted">
        No data to visualize.
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col bg-carbon-900 font-mono text-xs overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-workbench-border bg-carbon-850 px-4 py-2">
        <div className="flex items-center space-x-1 rounded-md bg-carbon-800 p-0.5 border border-workbench-border">
          <button
            type="button"
            onClick={() => setChartType('bar')}
            className={`flex cursor-pointer items-center gap-1.5 rounded px-2.5 py-1 text-xs transition-all active:scale-95 ${
              chartType === 'bar'
                ? 'bg-indigo-500/15 text-indigo-400 font-medium shadow-xs'
                : 'text-workbench-textMuted hover:text-workbench-textPrimary hover:bg-carbon-700/50'
            }`}
            title="Bar Chart"
          >
            <BarChart3 className="h-3.5 w-3.5" />
            <span>Bar</span>
          </button>
          <button
            type="button"
            onClick={() => setChartType('line')}
            className={`flex cursor-pointer items-center gap-1.5 rounded px-2.5 py-1 text-xs transition-all active:scale-95 ${
              chartType === 'line'
                ? 'bg-indigo-500/15 text-indigo-400 font-medium shadow-xs'
                : 'text-workbench-textMuted hover:text-workbench-textPrimary hover:bg-carbon-700/50'
            }`}
            title="Line Chart"
          >
            <LineIcon className="h-3.5 w-3.5" />
            <span>Line</span>
          </button>
          <button
            type="button"
            onClick={() => setChartType('area')}
            className={`flex cursor-pointer items-center gap-1.5 rounded px-2.5 py-1 text-xs transition-all active:scale-95 ${
              chartType === 'area'
                ? 'bg-indigo-500/15 text-indigo-400 font-medium shadow-xs'
                : 'text-workbench-textMuted hover:text-workbench-textPrimary hover:bg-carbon-700/50'
            }`}
            title="Area Chart"
          >
            <AreaIcon className="h-3.5 w-3.5" />
            <span>Area</span>
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-workbench-textMuted text-2xs uppercase tracking-wider">X-Axis:</span>
          <select
            value={xAxisKey}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setXAxisKey(e.target.value)}
            className="cursor-pointer rounded-md border border-workbench-border bg-carbon-800 px-2 py-1 text-xs text-workbench-textPrimary outline-none hover:border-workbench-textMuted focus:border-indigo-500 transition-colors"
          >
            {columns.map((col) => (
              <option key={col.name} value={col.name}>
                {col.name} ({col.normalizedType})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-workbench-textMuted text-2xs uppercase tracking-wider">Y-Axes:</span>
          <div className="flex flex-wrap gap-1">
            {columns.map((col, idx) => {
              const isSelected = selectedYKeys.includes(col.name);
              const color = PALETTE[idx % PALETTE.length];

              return (
                <button
                  key={col.name}
                  type="button"
                  onClick={() => toggleYKey(col.name)}
                  style={{
                    borderColor: isSelected ? color : 'transparent',
                    backgroundColor: isSelected ? `${color}20` : undefined,
                  }}
                  className={`cursor-pointer rounded border px-2 py-0.5 text-2xs font-mono transition-all active:scale-95 ${
                    isSelected
                      ? 'font-semibold text-white'
                      : 'bg-carbon-800 text-workbench-textMuted hover:text-workbench-textPrimary hover:bg-carbon-700/60'
                  }`}
                >
                  <span
                    className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  {col.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-workbench-textMuted text-2xs uppercase tracking-wider">Limit:</span>
          <select
            value={rowLimit}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setRowLimit(Number(e.target.value))}
            className="cursor-pointer rounded-md border border-workbench-border bg-carbon-800 px-2 py-1 text-xs text-workbench-textPrimary outline-none hover:border-workbench-textMuted focus:border-indigo-500 transition-colors"
          >
            <option value={25}>25 rows</option>
            <option value={50}>50 rows</option>
            <option value={100}>100 rows</option>
            <option value={250}>250 rows</option>
          </select>
        </div>
      </div>

      <div className="flex-1 p-4">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'bar' ? (
            <BarChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2335" vertical={false} />
              <XAxis
                dataKey={xAxisKey}
                stroke="#1e2335"
                fontSize={11}
                tickLine={false}
                tick={{ fill: '#64748b' }}
              />
              <YAxis
                stroke="#1e2335"
                fontSize={11}
                tickLine={false}
                tick={{ fill: '#64748b' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0e1017',
                  borderColor: '#1e2335',
                  borderRadius: '8px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  color: '#f8fafc',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', color: '#94a3b8' }} />
              {selectedYKeys.map((key, i) => (
                <Bar
                  key={key}
                  dataKey={key}
                  fill={PALETTE[i % PALETTE.length]}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          ) : chartType === 'line' ? (
            <LineChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2335" vertical={false} />
              <XAxis
                dataKey={xAxisKey}
                stroke="#1e2335"
                fontSize={11}
                tickLine={false}
                tick={{ fill: '#64748b' }}
              />
              <YAxis
                stroke="#1e2335"
                fontSize={11}
                tickLine={false}
                tick={{ fill: '#64748b' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0e1017',
                  borderColor: '#1e2335',
                  borderRadius: '8px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  color: '#f8fafc',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', color: '#94a3b8' }} />
              {selectedYKeys.map((key, i) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={PALETTE[i % PALETTE.length]}
                  strokeWidth={2}
                  dot={{ r: 3, fill: PALETTE[i % PALETTE.length] }}
                />
              ))}
            </LineChart>
          ) : (
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2335" vertical={false} />
              <XAxis
                dataKey={xAxisKey}
                stroke="#1e2335"
                fontSize={11}
                tickLine={false}
                tick={{ fill: '#64748b' }}
              />
              <YAxis
                stroke="#1e2335"
                fontSize={11}
                tickLine={false}
                tick={{ fill: '#64748b' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0e1017',
                  borderColor: '#1e2335',
                  borderRadius: '8px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  color: '#f8fafc',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', color: '#94a3b8' }} />
              {selectedYKeys.map((key, i) => (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={PALETTE[i % PALETTE.length]}
                  fill={PALETTE[i % PALETTE.length]}
                  fillOpacity={0.2}
                />
              ))}
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
