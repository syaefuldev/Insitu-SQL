import type { ColumnMetadata } from '@/types';

export function exportToCsv(
  columns: ColumnMetadata[],
  rows: Record<string, unknown>[],
  filename = 'insitu_sql_export.csv'
): void {
  if (rows.length === 0 || columns.length === 0) return;

  const headers = columns.map((c) => `"${c.name.replace(/"/g, '""')}"`).join(',');
  const rowLines = rows.map((row) =>
    columns
      .map((col) => {
        const val = row[col.name];
        if (val === null || val === undefined) return '';
        const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
        return `"${str.replace(/"/g, '""')}"`;
      })
      .join(',')
  );

  const csvContent = [headers, ...rowLines].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, filename);
}

export function exportToJson(
  rows: Record<string, unknown>[],
  filename = 'insitu_sql_export.json'
): void {
  if (rows.length === 0) return;

  const jsonString = JSON.stringify(rows, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
  downloadBlob(blob, filename);
}

export function exportToMarkdown(
  columns: ColumnMetadata[],
  rows: Record<string, unknown>[],
  maxRows = 100
): string {
  if (columns.length === 0 || rows.length === 0) return '';

  const displayRows = rows.slice(0, maxRows);
  const headerLine = `| ${columns.map((c) => c.name).join(' | ')} |`;
  const separatorLine = `| ${columns.map(() => '---').join(' | ')} |`;
  const dataLines = displayRows.map((row) => {
    return `| ${columns
      .map((col) => {
        const val = row[col.name];
        if (val === null || val === undefined) return '*null*';
        const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
        return str.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
      })
      .join(' | ')} |`;
  });

  let md = [headerLine, separatorLine, ...dataLines].join('\n');
  if (rows.length > maxRows) {
    md += `\n\n*...and ${rows.length - maxRows} more rows truncated for markdown preview.*`;
  }
  return md;
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
