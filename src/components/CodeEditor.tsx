"use client";

import React, { useRef, useEffect } from 'react';
import { Editor, type OnMount } from '@monaco-editor/react';
import type * as monaco from 'monaco-editor';
import { Skeleton } from './ui/skeleton';

type AnalysisResult = {
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
  severity: 'error' | 'suggestion';
  message: string;
};

interface CodeEditorProps {
  code: string;
  onCodeChange: (value: string | undefined) => void;
  analysis: AnalysisResult[];
  language: string;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ code, onCodeChange, analysis, language }) => {
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
    const newDecorations = analysis.map(item => {
      return {
        range: new monacoInstance.Range(item.startLine, item.startColumn, item.endLine, item.endColumn),
        options: {
          className: item.severity === 'error' ? 'inline-error-highlight' : 'inline-suggestion-highlight',
          overviewRuler: {
            color: item.severity === 'error' ? 'hsl(var(--destructive) / 0.5)' : 'hsl(var(--chart-4) / 0.5)',
            position: monacoInstance.editor.OverviewRulerLane.Right,
          },
          stickiness: monacoInstance.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
        },
      };
    });

    decorationsRef.current = editor.deltaDecorations(
      decorationsRef.current,
      newDecorations
    );

    // Update hover provider
    if (hoverProviderRef.current) {
      hoverProviderRef.current.dispose();
    }
    hoverProviderRef.current = monacoInstance.languages.registerHoverProvider(language, {
      provideHover: (model, position) => {
        const issue = analysis.find(a => 
            position.lineNumber >= a.startLine &&
            position.lineNumber <= a.endLine
        );
        if (issue) {
          return {
            range: new monacoInstance.Range(issue.startLine, issue.startColumn, issue.endLine, issue.endColumn),
            contents: [
              { value: `**${issue.severity.toUpperCase()}**` },
              { value: issue.message },
            ],
          };
        }
        return null;
      },
    });
    
    // Cleanup on unmount
    return () => {
        hoverProviderRef.current?.dispose();
    }

  }, [analysis, language]);

  return (
    <Editor
      height="100%"
      language={language}
      theme="light" // Force light theme
      value={code}
      onChange={onCodeChange}
      onMount={handleEditorDidMount}
      options={{
        fontFamily: "'Courier New', Courier, monospace",
        fontSize: 14,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        lineNumbers: 'on',
        automaticLayout: true,
        padding: { top: 16 },
        renderLineHighlight: "none",
        overviewRulerLanes: 0
      }}
      loading={<Skeleton className="w-full h-full" />}
    />
  );
};

export default CodeEditor;
