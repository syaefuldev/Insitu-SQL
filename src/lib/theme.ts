import type { AppTheme, ThemeDefinition } from '@/types';

export const THEME_STORAGE_KEY = 'insitu_sql_active_theme';

export const THEMES: ThemeDefinition[] = [
  {
    id: 'obsidian',
    name: 'Obsidian Dark',
    tagline: 'Electric Indigo & Hairline Obsidian',
    isLight: false,
    swatches: ['#090a0f', '#0e1017', '#6366f1'],
  },
  {
    id: 'midnight',
    name: 'Midnight Cyber',
    tagline: 'OLED Pure Black & Neon Cyan',
    isLight: false,
    swatches: ['#000000', '#0a0a0f', '#06b6d4'],
  },
  {
    id: 'tokyo',
    name: 'Tokyo Night',
    tagline: 'Sapphire Navy & Electric Sky',
    isLight: false,
    swatches: ['#0a0f1d', '#0f172a', '#38bdf8'],
  },
  {
    id: 'nordic',
    name: 'Nordic Slate',
    tagline: 'Cool Charcoal & Arctic Mint',
    isLight: false,
    swatches: ['#101418', '#161c22', '#2dd4bf'],
  },
  {
    id: 'paper-light',
    name: 'Paper Minimal Light',
    tagline: 'Clean Studio Light & Deep Indigo',
    isLight: true,
    swatches: ['#f8fafc', '#ffffff', '#4f46e5'],
  },
];

export interface MonacoThemeConfig {
  base: 'vs' | 'vs-dark';
  inherit: boolean;
  rules: Array<{ token: string; foreground: string; fontStyle?: string }>;
  colors: Record<string, string>;
}

export const MONACO_THEMES: Record<AppTheme, MonacoThemeConfig> = {
  obsidian: {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'keyword', foreground: '818CF8', fontStyle: 'bold' },
      { token: 'string', foreground: 'FCD34D' },
      { token: 'number', foreground: '38BDF8' },
      { token: 'comment', foreground: '64748B', fontStyle: 'italic' },
      { token: 'operator', foreground: 'E2E8F0' },
      { token: 'delimiter', foreground: '94A3B8' },
    ],
    colors: {
      'editor.background': '#090A0F',
      'editor.foreground': '#F8FAFC',
      'editor.lineHighlightBackground': '#0E1017',
      'editor.selectionBackground': '#1E2335',
      'editorCursor.foreground': '#6366F1',
      'editorWhitespace.foreground': '#1E2335',
      'editorLineNumber.foreground': '#475569',
      'editorLineNumber.activeForeground': '#818CF8',
      'editorGutter.background': '#090A0F',
    },
  },
  midnight: {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'keyword', foreground: '06B6D4', fontStyle: 'bold' },
      { token: 'string', foreground: '34D399' },
      { token: 'number', foreground: 'A78BFA' },
      { token: 'comment', foreground: '475569', fontStyle: 'italic' },
      { token: 'operator', foreground: 'E0E7FF' },
      { token: 'delimiter', foreground: '64748B' },
    ],
    colors: {
      'editor.background': '#000000',
      'editor.foreground': '#F0FDFA',
      'editor.lineHighlightBackground': '#080C14',
      'editor.selectionBackground': '#0E2238',
      'editorCursor.foreground': '#06B6D4',
      'editorWhitespace.foreground': '#111827',
      'editorLineNumber.foreground': '#334155',
      'editorLineNumber.activeForeground': '#06B6D4',
      'editorGutter.background': '#000000',
    },
  },
  tokyo: {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'keyword', foreground: '7AA2F7', fontStyle: 'bold' },
      { token: 'string', foreground: '9ECE6A' },
      { token: 'number', foreground: 'FF9E64' },
      { token: 'comment', foreground: '565F89', fontStyle: 'italic' },
      { token: 'operator', foreground: 'BB9AF7' },
      { token: 'delimiter', foreground: '7DCFFF' },
    ],
    colors: {
      'editor.background': '#0A0F1D',
      'editor.foreground': '#C0CAF5',
      'editor.lineHighlightBackground': '#11182B',
      'editor.selectionBackground': '#1E293B',
      'editorCursor.foreground': '#7AA2F7',
      'editorWhitespace.foreground': '#1A2138',
      'editorLineNumber.foreground': '#414868',
      'editorLineNumber.activeForeground': '#7AA2F7',
      'editorGutter.background': '#0A0F1D',
    },
  },
  nordic: {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'keyword', foreground: '81A1C1', fontStyle: 'bold' },
      { token: 'string', foreground: 'A3BE8C' },
      { token: 'number', foreground: 'B48EAD' },
      { token: 'comment', foreground: '4C566A', fontStyle: 'italic' },
      { token: 'operator', foreground: '88C0D0' },
      { token: 'delimiter', foreground: 'D8DEE9' },
    ],
    colors: {
      'editor.background': '#101418',
      'editor.foreground': '#ECEFF4',
      'editor.lineHighlightBackground': '#181F26',
      'editor.selectionBackground': '#242F3A',
      'editorCursor.foreground': '#2DD4BF',
      'editorWhitespace.foreground': '#1E2833',
      'editorLineNumber.foreground': '#4C566A',
      'editorLineNumber.activeForeground': '#2DD4BF',
      'editorGutter.background': '#101418',
    },
  },
  'paper-light': {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'keyword', foreground: '4338CA', fontStyle: 'bold' },
      { token: 'string', foreground: '047857' },
      { token: 'number', foreground: 'B45309' },
      { token: 'comment', foreground: '94A3B8', fontStyle: 'italic' },
      { token: 'operator', foreground: '1E293B' },
      { token: 'delimiter', foreground: '64748B' },
    ],
    colors: {
      'editor.background': '#FFFFFF',
      'editor.foreground': '#0F172A',
      'editor.lineHighlightBackground': '#F1F5F9',
      'editor.selectionBackground': '#E0E7FF',
      'editorCursor.foreground': '#4F46E5',
      'editorWhitespace.foreground': '#CBD5E1',
      'editorLineNumber.foreground': '#94A3B8',
      'editorLineNumber.activeForeground': '#4F46E5',
      'editorGutter.background': '#F8FAFC',
    },
  },
};
