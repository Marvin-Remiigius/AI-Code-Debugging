"use client";

import { useState } from 'react';
import { Wand2, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import CodeEditor from '@/components/CodeEditor';
import type { AnalyzeCodeOutput } from '@/ai/flows/analyze-code';
import { runCodeAnalysis } from '@/app/actions';

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

export default function Home() {
  const [code, setCode] = useState<string>(defaultCode);
  const [analysis, setAnalysis] = useState<AnalyzeCodeOutput>([]);
  const [isLoading, setIsLoading] = useState(false);
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

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <Header />
      <main className="flex-1 flex flex-col p-4 md:p-6 gap-4 overflow-hidden">
        <div className="flex-1 relative rounded-lg border border-border shadow-lg overflow-hidden">
          <CodeEditor 
            code={code} 
            onCodeChange={(value) => setCode(value || '')} 
            analysis={analysis} 
          />
        </div>
        <div className="flex-shrink-0 flex justify-end">
          <Button onClick={handleAnalyzeCode} disabled={isLoading || !code} size="lg">
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Wand2 className="mr-2 h-4 w-4" />
            )}
            Analyze Code
          </Button>
        </div>
      </main>
    </div>
  );
}
