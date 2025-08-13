"use client";

import { useState, useRef } from 'react';
import { Wand2, Loader2, Play, AlertCircle, Lightbulb, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import CodeEditor from '@/components/CodeEditor';
import type { AnalyzeCodeOutput } from '@/ai/flows/analyze-code';
import { runCodeAnalysis, runCodeExecution } from '@/app/actions';
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
  if (n === 0) {
    return 1;
  } else {
    return n * factorial(n - 1);
  }
}

console.log('Factorial of 5 is:', factorial(5));

for (var i = 1; i < 5; i++) {
  console.log("Hello, world!");
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
  const [isExecuting, setIsExecuting] = useState(false);
  const [language, setLanguage] = useState('javascript');
  const [output, setOutput] = useState<OutputLine[]>([]);
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('results');

  const handleAnalyzeCode = async () => {
    setIsLoading(true);
    setAnalysis([]);
    setActiveTab('results');
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

  const handleRunCode = async () => {
    setOutput([]);
    setIsExecuting(true);
    setActiveTab('output');

    if (language === 'javascript') {
        const newOutput: OutputLine[] = [];
        
        const originalConsoleLog = console.log;
        const originalConsoleError = console.error;

        const customConsole = {
            log: (...args: any[]) => {
                newOutput.push({ type: 'log', message: args.map(arg => typeof arg === 'string' ? arg : JSON.stringify(arg, null, 2)).join(' ') });
                setOutput([...newOutput]);
                originalConsoleLog(...args);
            },
            error: (...args: any[]) => {
                newOutput.push({ type: 'error', message: args.map(arg => typeof arg === 'string' ? arg : JSON.stringify(arg, null, 2)).join(' ') });
                setOutput([...newOutput]);
                originalConsoleError(...args);
            }
        };
        
        try {
            const functionBody = `
                const console = { log: customConsole.log, error: customConsole.error };
                try {
                    ${code}
                } catch(e) {
                    console.error(e.message);
                }
            `;
            const runner = new Function('customConsole', functionBody);
            runner(customConsole);
        } catch (e: any) {
          newOutput.push({ type: 'error', message: e.message });
          setOutput([...newOutput]);
        }
    } else if (language === 'python') {
        try {
            const result = await runCodeExecution({ code, language });
            if (result.success && result.data) {
                setOutput([{ type: 'log', message: result.data.output }]);
            } else {
                setOutput([{ type: 'error', message: result.error || 'An unknown error occurred.' }]);
            }
        } catch (error) {
            setOutput([{ type: 'error', message: 'Could not connect to the execution service.' }]);
        }
    }

    setIsExecuting(false);
  };


  const errors = analysis.filter(a => a.severity === 'error');
  const suggestions = analysis.filter(a => a.severity === 'suggestion');

  const isRunDisabled = isLoading || isExecuting || !code || (language !== 'javascript' && language !== 'python');

  return (
    <div className="flex flex-col h-screen bg-indigo-900 text-gray-200 font-mono">
      <Header />
      <main className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 md:p-6 overflow-hidden">
        <div className="md:col-span-2 flex flex-col gap-4">
            <div className="flex-1 relative rounded-lg border-2 border-dashed border-indigo-400 overflow-hidden shadow-lg">
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
                        <SelectTrigger className="bg-indigo-700 border-indigo-500">
                            <SelectValue placeholder="Language" />
                        </SelectTrigger>
                        <SelectContent className="bg-indigo-800 text-gray-200 border-indigo-500">
                            <SelectItem value="javascript">JavaScript</SelectItem>
                            <SelectItem value="python">Python</SelectItem>
                            <SelectItem value="c">C</SelectItem>
                            <SelectItem value="java">Java</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex gap-2">
                    <Button onClick={handleRunCode} disabled={isRunDisabled} variant="outline" className="bg-green-500 hover:bg-green-600 text-white border-green-700">
                        {isExecuting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2" />}
                        Run
                    </Button>
                    <Button onClick={handleAnalyzeCode} disabled={isLoading || !code} size="lg" className="bg-blue-500 hover:bg-blue-600 text-white">
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
            <Card className="h-full flex flex-col bg-indigo-800/50 border-indigo-700 text-gray-300">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                    <CardHeader>
                        <TabsList className="grid w-full grid-cols-2 bg-indigo-900/80">
                            <TabsTrigger value="results" className="data-[state=active]:bg-indigo-700 data-[state=active]:text-white">Analysis Results</TabsTrigger>
                            <TabsTrigger value="output" className="data-[state=active]:bg-indigo-700 data-[state=active]:text-white">Output</TabsTrigger>
                        </TabsList>
                    </CardHeader>
                    <TabsContent value="results" className="flex-1 overflow-auto">
                      <ScrollArea className="h-full px-6">
                        {isLoading ? (
                            <div className="text-center text-gray-400 pt-10">Analyzing...</div>
                        ) : analysis.length > 0 ? (
                           <div className="space-y-4">
                            {errors.length > 0 && (
                                <div>
                                    <h3 className="font-semibold mb-2 flex items-center text-red-400"><AlertCircle className="mr-2" /> Errors</h3>
                                    <ul className="space-y-2">
                                        {errors.map((item, index) => (
                                            <li key={`error-${index}`} className="text-sm p-2 bg-red-900/50 rounded-md">
                                                <span className="font-bold">L{item.line}:</span> {item.message}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {suggestions.length > 0 && (
                                <div>
                                    <h3 className="font-semibold mb-2 flex items-center text-yellow-400"><Lightbulb className="mr-2" /> Suggestions</h3>
                                    <ul className="space-y-2">
                                        {suggestions.map((item, index) => (
                                            <li key={`suggestion-${index}`} className="text-sm p-2 bg-yellow-900/50 rounded-md">
                                                <span className="font-bold">L{item.line}:</span> {item.message}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            </div>
                        ) : (
                            <div className="text-center text-gray-400 pt-10">
                                Run analysis to see results.
                            </div>
                        )}
                      </ScrollArea>
                    </TabsContent>
                    <TabsContent value="output" className="flex-1 overflow-auto">
                        <ScrollArea className="h-full">
                        <div className="p-4 font-mono text-sm space-y-2">
                            {isExecuting ? (
                               <div className="text-center text-gray-400 pt-10">Executing...</div>
                            ) : output.length > 0 ? output.map((line, index) => (
                                <div key={index} className={`flex items-start ${line.type === 'error' ? 'text-red-400' : 'text-green-300'}`}>
                                    <span className="mr-2 shrink-0">&gt;</span>
                                    <pre className="whitespace-pre-wrap break-words">{line.message}</pre>
                                </div>
                            )) : (
                                <div className="text-center text-gray-400 pt-10">
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
