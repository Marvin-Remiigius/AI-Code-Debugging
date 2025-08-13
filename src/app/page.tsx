"use client";

import { useState, useEffect, useRef } from 'react';
import { Wand2, Loader2, Play, AlertCircle, Lightbulb, X, Pause } from 'lucide-react';
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
import { Card, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import LoadingScreen from '@/components/LoadingScreen';

const defaultCode = `// Your C or Python code here!`;
const ANALYSIS_INTERVAL = 45; // in seconds

type OutputLine = {
  type: 'log' | 'error';
  message: string;
};

export default function Home() {
  const [appLoading, setAppLoading] = useState(true);
  const [code, setCode] = useState<string>(defaultCode);
  const [userInput, setUserInput] = useState<string>('');
  const [analysis, setAnalysis] = useState<AnalyzeCodeOutput>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [language, setLanguage] = useState('python');
  const [output, setOutput] = useState<OutputLine[]>([]);
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('results');
  const [analysisRun, setAnalysisRun] = useState(false);
  const [isAutoAnalysisPaused, setIsAutoAnalysisPaused] = useState(false);
  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [countdown, setCountdown] = useState(ANALYSIS_INTERVAL);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAppLoading(false);
    }, 2000); // Show loading screen for 2 seconds
    return () => clearTimeout(timer);
  }, []);


  const resetCountdown = () => {
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    setCountdown(ANALYSIS_INTERVAL);
    
    if (!isAutoAnalysisPaused) {
      countdownIntervalRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            return ANALYSIS_INTERVAL;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const handleAnalyzeCode = async (isAuto: boolean = false) => {
    if (isLoading) return;
    setIsLoading(true);
    if (!isAuto) {
      setAnalysis([]);
      setActiveTab('results');
    }
    setAnalysisRun(true);
    try {
      const result = await runCodeAnalysis({ code });
      if (result.success && result.data) {
        if (result.data.filter(i => i.severity === 'error').length === 0 && result.data.filter(i => i.severity === 'suggestion').length > 0) {
          const suggestionsOnly = result.data.filter(i => i.severity === 'suggestion');
          setAnalysis(suggestionsOnly);
        } else {
          setAnalysis(result.data);
        }
      } else if (!isAuto) {
        toast({
          variant: 'destructive',
          title: 'Analysis Failed',
          description: result.error || 'An unknown error occurred.',
        });
      }
    } catch (error) {
      if (!isAuto) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not connect to the analysis service.',
        });
      }
    } finally {
      setIsLoading(false);
      if (!isAuto) {
         resetCountdown();
      }
    }
  };

  useEffect(() => {
    if (analysisIntervalRef.current) clearInterval(analysisIntervalRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    if (!isAutoAnalysisPaused) {
        resetCountdown();
        analysisIntervalRef.current = setInterval(() => {
            handleAnalyzeCode(true);
        }, ANALYSIS_INTERVAL * 1000);
    }

    return () => {
        if (analysisIntervalRef.current) clearInterval(analysisIntervalRef.current);
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [code, isAutoAnalysisPaused]);


  const handleRunCode = async () => {
    setOutput([]);
    setIsExecuting(true);
    setActiveTab('output');

    try {
        const result = await runCodeExecution({ code, language, stdin: userInput });
        if (result.success && result.data) {
            const isError = /error|exception|failed|traceback/i.test(result.data.output.substring(0, 100));
            setOutput([{ type: isError ? 'error' : 'log', message: result.data.output }]);
        } else {
            setOutput([{ type: 'error', message: result.error || 'An unknown error occurred.' }]);
        }
    } catch (error) {
        setOutput([{ type: 'error', message: 'Could not connect to the execution service.' }]);
    }

    setIsExecuting(false);
  };

  const handleDismissAnalysisItem = (itemToDismiss: {startLine: number; message: string}) => {
    setAnalysis(prev => prev.filter(item => !(item.startLine === itemToDismiss.startLine && item.message === itemToDismiss.message)));
  };

  const errors = analysis.filter(a => a.severity === 'error');
  const suggestions = analysis.filter(a => a.severity === 'suggestion');

  const isRunDisabled = isLoading || isExecuting || !code;
  
  if (appLoading) {
    return <LoadingScreen />;
  }


  return (
    <div className="flex flex-col h-screen bg-white text-black font-mono">
      <Header />
      <main className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 md:p-6 overflow-hidden">
        <div className="md:col-span-2 flex flex-col gap-4">
            <div className="flex-1 flex flex-col gap-2">
                <div className="flex-1 relative rounded-none border-2 border-dashed border-gray-400 overflow-hidden shadow-none">
                    <CodeEditor 
                        code={code} 
                        onCodeChange={(value) => setCode(value || '')} 
                        analysis={analysis}
                        language={language}
                    />
                </div>
                <div className="flex-shrink-0">
                  <Label htmlFor="userInput" className="text-xs font-bold uppercase text-gray-500">Input (stdin)</Label>
                  <Textarea
                    id="userInput"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Enter input for your program here..."
                    className="mt-1 bg-white border-gray-300 rounded-none h-24"
                  />
                </div>
            </div>
            <div className="flex-shrink-0 flex items-center justify-between">
                <div className="w-40">
                    <Select value={language} onValueChange={setLanguage}>
                        <SelectTrigger className="bg-gray-200 border-gray-500 rounded-none">
                            <SelectValue placeholder="Language" />
                        </SelectTrigger>
                        <SelectContent className="bg-white text-black border-gray-500 rounded-none">
                            <SelectItem value="python">Python</SelectItem>
                            <SelectItem value="c">C</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => handleRunCode()} disabled={isRunDisabled} variant="outline" className="bg-green-400 hover:bg-green-500 text-black border-green-700 rounded-none">
                        {isExecuting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2" />}
                        Run
                    </Button>
                    <div className="flex flex-col items-center">
                      <Button onClick={() => setIsAutoAnalysisPaused(!isAutoAnalysisPaused)} variant="outline" className="rounded-none">
                        {isAutoAnalysisPaused ? <Play className="mr-2" /> : <Pause className="mr-2" />}
                        {isAutoAnalysisPaused ? 'Resume' : 'Pause'} Auto
                      </Button>
                       {!isAutoAnalysisPaused && (
                        <div className="text-xs text-gray-500 mt-1">
                          Next in: {countdown}s
                        </div>
                      )}
                    </div>
                    <Button onClick={() => handleAnalyzeCode(false)} disabled={isLoading || !code} size="lg" className="bg-blue-400 hover:bg-blue-500 text-black rounded-none">
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
            <Card className="h-full flex flex-col bg-gray-50 border border-gray-300 text-black rounded-none shadow-none">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                    <CardHeader>
                        <TabsList className="grid w-full grid-cols-2 bg-gray-200 rounded-none">
                            <TabsTrigger value="results" className="data-[state=active]:bg-gray-300 data-[state=active]:text-black rounded-none">Analysis Results</TabsTrigger>
                            <TabsTrigger value="output" className="data-[state=active]:bg-gray-300 data-[state=active]:text-black rounded-none">Output</TabsTrigger>
                        </TabsList>
                    </CardHeader>
                    <TabsContent value="results" className="flex-1 overflow-auto">
                      <ScrollArea className="h-full px-6">
                        {isLoading && !analysisRun ? (
                            <div className="text-center text-gray-500 pt-10">Analyzing...</div>
                        ) : !analysisRun ? (
                             <div className="text-center text-gray-500 pt-10">
                                Run analysis to see results.
                            </div>
                        ) : errors.length === 0 && suggestions.length === 0 ? (
                            <div className="space-y-4">
                                <div className="text-center text-green-600 font-bold pt-10 pb-4">
                                    Your code is good to go!!
                                </div>
                            </div>
                        ) : (
                           <div className="space-y-4">
                            {errors.length > 0 && (
                                <div>
                                    <h3 className="font-semibold mb-2 flex items-center text-red-600"><AlertCircle className="mr-2" /> Errors</h3>
                                    <ul className="space-y-2">
                                        {errors.map((item, index) => (
                                            <li key={`error-${index}`} className="flex justify-between items-start text-sm p-2 bg-red-100 rounded-none">
                                                <div>
                                                    <span className="font-bold">L{item.startLine}:</span> {item.message}
                                                </div>
                                                <Button variant="ghost" size="icon" className="h-5 w-5 ml-2 shrink-0" onClick={() => handleDismissAnalysisItem(item)}>
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {suggestions.length > 0 && (
                                <div>
                                    <h3 className="font-semibold mb-2 flex items-center text-yellow-600"><Lightbulb className="mr-2" /> Suggestions</h3>
                                    <ul className="space-y-2">
                                        {suggestions.map((item, index) => (
                                            <li key={`suggestion-${index}`} className="flex justify-between items-start text-sm p-2 bg-yellow-100 rounded-none">
                                                <div>
                                                    <span className="font-bold">L{item.startLine}:</span> {item.message}
                                                </div>
                                                <Button variant="ghost" size="icon" className="h-5 w-5 ml-2 shrink-0" onClick={() => handleDismissAnalysisItem(item)}>
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            </div>
                        )}
                      </ScrollArea>
                    </TabsContent>
                    <TabsContent value="output" className="flex-1 overflow-auto">
                        <ScrollArea className="h-full">
                        <div className="p-4 font-mono text-sm space-y-2">
                            {isExecuting ? (
                               <div className="text-center text-gray-500 pt-10">Executing...</div>
                            ) : output.length > 0 ? output.map((line, index) => (
                                <div key={index} className={`flex items-start ${line.type === 'error' ? 'text-red-600' : 'text-green-700'}`}>
                                    <span className="mr-2 shrink-0">&gt;</span>
                                    <pre className="whitespace-pre-wrap break-words">{line.message}</pre>
                                </div>
                            )) : (
                                <div className="text-center text-gray-500 pt-10">
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
