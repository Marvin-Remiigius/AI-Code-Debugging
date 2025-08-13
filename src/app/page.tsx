"use client";

import { useState, useRef } from 'react';
import { Wand2, Loader2, Play, AlertCircle, Lightbulb, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import CodeEditor from '@/components/CodeEditor';
import type { AnalyzeCodeOutput } from '@/ai/flows/analyze-code';
import { runCodeAnalysis } from '@/app/actions';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

const defaultCode = `function factorial(n) {
  if (n = 0) { // This should be a comparison
    return 1;
  } else {
    return n * factorial(n - 1);
  }
}

// Inefficient loop
for (var i = 1; i < 10; i++) {
  console.log("Hello) // Missing closing quote
}

const unusedVar = 10;`;

type OutputLine = {
  type: 'log' | 'error';
  message: string;
};

export default function Home() {
  const [code, setCode] = useState<string>(defaultCode);
  const [analysis, setAnalysis] = useState<AnalyzeCodeOutput>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState('javascript');
  const [output, setOutput] = useState<OutputLine[]>([]);
  const { toast } = useToast();

  const handleAnalyzeCode = async () => {
    setIsLoading(true);
    setAnalysis([]);
    try {
      const result = await runCodeAnalysis({ code });
      if (result.success && result.data) {
        setAnalysis(result.data);
        if (result.data.length === 0) {
            toast({
                title: "All Clear!",
                description: "No issues found in your code.",
            });
        }
      } else {
        toast({
          variant: 'destructive',
          title: 'Analysis Failed',
          description: result.error || 'An unknown error occurred.',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not connect to the analysis service.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunCode = () => {
    setOutput([]);
    const newOutput: OutputLine[] = [];
    
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;

    console.log = (...args) => {
      newOutput.push({ type: 'log', message: args.map(arg => JSON.stringify(arg)).join(' ') });
    };
    console.error = (...args) => {
       newOutput.push({ type: 'error', message: args.map(arg => JSON.stringify(arg)).join(' ') });
    };

    try {
      new Function(code)();
    } catch (e: any) {
      newOutput.push({ type: 'error', message: e.message });
    } finally {
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
      setOutput(newOutput);
    }
  };

  const errors = analysis.filter(a => a.severity === 'error');
  const suggestions = analysis.filter(a => a.severity === 'suggestion');

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <Header />
      <main className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 md:p-6 overflow-hidden">
        <div className="md:col-span-2 flex flex-col gap-4">
            <div className="flex-1 relative rounded-lg border border-border shadow-lg overflow-hidden">
                <CodeEditor 
                    code={code} 
                    onCodeChange={(value) => setCode(value || '')} 
                    analysis={analysis}
                    language={language}
                />
            </div>
            <div className="flex-shrink-0 flex items-center justify-between">
                <div className="w-40">
                    <Select value={language} onValueChange={setLanguage}>
                        <SelectTrigger>
                            <SelectValue placeholder="Language" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="javascript">JavaScript</SelectItem>
                            <SelectItem value="typescript">TypeScript</SelectItem>
                            <SelectItem value="python">Python</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex gap-2">
                    <Button onClick={handleRunCode} disabled={isLoading || !code || language !== 'javascript'} variant="outline">
                        <Play className="mr-2" />
                        Run
                    </Button>
                    <Button onClick={handleAnalyzeCode} disabled={isLoading || !code} size="lg">
                        {isLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                        <Wand2 className="mr-2 h-4 w-4" />
                        )}
                        Analyze Code
                    </Button>
                </div>
            </div>
        </div>
        <div className="md:col-span-1 flex flex-col h-full overflow-hidden">
            <Card className="h-full flex flex-col">
                <Tabs defaultValue="results" className="h-full flex flex-col">
                    <CardHeader>
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="results">Analysis Results</TabsTrigger>
                            <TabsTrigger value="output">Output</TabsTrigger>
                        </TabsList>
                    </CardHeader>
                    <TabsContent value="results" className="flex-1 overflow-auto">
                      <ScrollArea className="h-full px-6">
                        {analysis.length > 0 ? (
                           <div className="space-y-4">
                            {errors.length > 0 && (
                                <div>
                                    <h3 className="font-semibold mb-2 flex items-center"><AlertCircle className="mr-2 text-destructive" /> Errors</h3>
                                    <ul className="space-y-2">
                                        {errors.map((item, index) => (
                                            <li key={`error-${index}`} className="text-sm p-2 bg-destructive/10 rounded-md">
                                                <span className="font-bold">L{item.line}:</span> {item.message}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {suggestions.length > 0 && (
                                <div>
                                    <h3 className="font-semibold mb-2 flex items-center"><Lightbulb className="mr-2 text-yellow-500" /> Suggestions</h3>
                                    <ul className="space-y-2">
                                        {suggestions.map((item, index) => (
                                            <li key={`suggestion-${index}`} className="text-sm p-2 bg-yellow-500/10 rounded-md">
                                                <span className="font-bold">L{item.line}:</span> {item.message}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            </div>
                        ) : (
                            <div className="text-center text-muted-foreground pt-10">
                                {isLoading ? 'Analyzing...' : 'Run analysis to see results.'}
                            </div>
                        )}
                      </ScrollArea>
                    </TabsContent>
                    <TabsContent value="output" className="flex-1 overflow-auto">
                        <ScrollArea className="h-full">
                        <div className="p-4 font-mono text-sm space-y-2">
                            {output.length > 0 ? output.map((line, index) => (
                                <div key={index} className={`flex items-start ${line.type === 'error' ? 'text-destructive' : ''}`}>
                                    <span className="mr-2 shrink-0">&gt;</span>
                                    <pre className="whitespace-pre-wrap break-words">{line.message}</pre>
                                </div>
                            )) : (
                                <div className="text-center text-muted-foreground pt-10">
                                    Click "Run" to execute the code and see the output.
                                </div>
                            )}
                        </div>
                        </ScrollArea>
                    </TabsContent>
                </Tabs>
            </Card>
        </div>
      </main>
    </div>
  );
}