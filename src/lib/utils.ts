export function formatDurationMs(ms: number): string {
  if (ms < 1) return '< 1 ms';
  if (ms < 1000) return `${ms.toFixed(1)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

export function formatNumberWithCommas(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

export function sanitizeTableName(rawName: string): string {
  const withoutExt = rawName.replace(/\.[^/.]+$/, '');
  let sanitized = withoutExt.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
  if (/^[0-9]/.test(sanitized)) {
    sanitized = `tbl_${sanitized}`;
  }
  sanitized = sanitized.replace(/_+/g, '_').replace(/^_|_$/g, '');
  return sanitized || 'dataset_table';
}
