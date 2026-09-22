'use client';

import React, { useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import type { AppTheme } from '@/types';
import { MONACO_THEMES } from '@/lib/theme';

interface SqlEditorProps {
  value: string;
  onChange: (value: string) => void;
  onExecute: () => void;
  readOnly?: boolean;
  theme?: AppTheme;
}

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-carbon-900 font-mono text-xs text-workbench-textMuted">
      <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border border-workbench-accent border-t-transparent mr-2.5" />
      Loading SQL Editor...
    </div>
  ),
});

export function SqlEditor({
  value,
  onChange,
  onExecute,
  readOnly = false,
  theme = 'obsidian',
}: SqlEditorProps) {
  const monacoRef = useRef<unknown>(null);
  const onExecuteRef = useRef(onExecute);
  onExecuteRef.current = onExecute;

  const handleEditorDidMount = (editor: unknown, monaco: unknown) => {
    monacoRef.current = monaco;

    const monacoTyped = monaco as {
      editor: {
        defineTheme: (name: string, theme: unknown) => void;
        setTheme: (name: string) => void;
      };
      KeyMod: { CtrlCmd: number };
      KeyCode: { Enter: number };
    };

    Object.entries(MONACO_THEMES).forEach(([themeKey, config]) => {
      monacoTyped.editor.defineTheme(`insitu-${themeKey}`, config);
    });

    monacoTyped.editor.setTheme(`insitu-${theme}`);

    const editorInstance = editor as {
      addCommand: (keybinding: number, handler: () => void) => void;
      focus: () => void;
    };

    editorInstance.addCommand(monacoTyped.KeyMod.CtrlCmd | monacoTyped.KeyCode.Enter, () => {
      onExecuteRef.current();
    });

    editorInstance.focus();
  };

  useEffect(() => {
    if (monacoRef.current) {
      const monacoTyped = monacoRef.current as {
        editor: {
          setTheme: (name: string) => void;
        };
      };
      monacoTyped.editor.setTheme(`insitu-${theme}`);
    }
  }, [theme]);

  return (
    <div className="relative h-full w-full bg-carbon-900 overflow-hidden font-mono">
      <MonacoEditor
        height="100%"
        defaultLanguage="sql"
        language="sql"
        theme={`insitu-${theme}`}
        value={value}
        onChange={(val?: string) => onChange(val || '')}
        onMount={handleEditorDidMount}
        options={{
          readOnly,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          fontFamily: "'JetBrains Mono', 'Geist Mono', 'Fira Code', Menlo, monospace",
          fontSize: 13,
          lineHeight: 20,
          tabSize: 2,
          renderWhitespace: 'selection',
          padding: { top: 12, bottom: 12 },
          lineNumbers: 'on',
          glyphMargin: false,
          folding: true,
          wordWrap: 'on',
          contextmenu: true,
          overviewRulerBorder: false,
          hideCursorInOverviewRuler: true,
          scrollbar: {
            vertical: 'visible',
            horizontal: 'visible',
            verticalScrollbarSize: 8,
            horizontalScrollbarSize: 8,
          },
        }}
      />
    </div>
  );
}
