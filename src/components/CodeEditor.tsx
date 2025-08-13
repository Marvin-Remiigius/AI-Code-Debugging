"use client";

import React, { useRef, useEffect } from 'react';
import { Editor, type OnMount } from '@monaco-editor/react';
import type * as monaco from 'monaco-editor';
import { Skeleton } from './ui/skeleton';

type AnalysisResult = {
  line: number;
  severity: 'error' | 'suggestion';
  message: string;
};

interface CodeEditorProps {
  code: string;
  onCodeChange: (value: string | undefined) => void;
  analysis: AnalysisResult[];
}

const CodeEditor: React.FC<CodeEditorProps> = ({ code, onCodeChange, analysis }) => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof monaco | null>(null);
  const decorationsRef = useRef<string[]>([]);
  const hoverProviderRef = useRef<monaco.IDisposable | null>(null);

  const handleEditorDidMount: OnMount = (editor, monacoInstance) => {
    editorRef.current = editor;
    monacoRef.current = monacoInstance;
  };

  useEffect(() => {
    const editor = editorRef.current;
    const monacoInstance = monacoRef.current;
    if (!editor || !monacoInstance) return;

    // Update decorations
    const newDecorations = analysis.map(item => ({
      range: new monacoInstance.Range(item.line, 1, item.line, 1),
      options: {
        isWholeLine: true,
        className: item.severity === 'error' ? 'line-error-highlight' : 'line-suggestion-highlight',
        overviewRuler: {
          color: item.severity === 'error' ? 'hsl(var(--destructive) / 0.5)' : 'hsl(var(--chart-4) / 0.5)',
          position: monacoInstance.editor.OverviewRulerLane.Right,
        }
      },
    }));

    decorationsRef.current = editor.deltaDecorations(
      decorationsRef.current,
      newDecorations
    );

    // Update hover provider
    if (hoverProviderRef.current) {
      hoverProviderRef.current.dispose();
    }
    hoverProviderRef.current = monacoInstance.languages.registerHoverProvider('javascript', {
      provideHover: (model, position) => {
        const issue = analysis.find(a => a.line === position.lineNumber);
        if (issue) {
          return {
            range: new monacoInstance.Range(position.lineNumber, 1, position.lineNumber, model.getLineMaxColumn(position.lineNumber)),
            contents: [
              { value: `**${issue.severity.toUpperCase()}**` },
              { value: issue.message },
            ],
          };
        }
        return null;
      },
    });

  }, [analysis]);

  return (
    <Editor
      height="100%"
      language="javascript"
      theme="vs-dark"
      value={code}
      onChange={onCodeChange}
      onMount={handleEditorDidMount}
      options={{
        fontFamily: 'var(--font-code)',
        fontSize: 14,
        minimap: { enabled: true, autohide: true },
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        lineNumbers: 'on',
        automaticLayout: true,
        padding: { top: 16 },
      }}
      loading={<Skeleton className="w-full h-full" />}
    />
  );
};

export default CodeEditor;
