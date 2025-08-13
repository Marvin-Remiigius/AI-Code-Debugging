// This file uses server-side code.
'use server';

/**
 * @fileOverview Analyzes code for errors and suggests improvements using the Gemini API.
 *
 * - analyzeCode - A function that takes code as input and returns a list of code analysis results.
 * - AnalyzeCodeInput - The input type for the analyzeCode function.
 * - AnalyzeCodeOutput - The return type for the analyzeCode function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeCodeInputSchema = z.object({
  code: z.string().describe('The code to analyze.'),
});
export type AnalyzeCodeInput = z.infer<typeof AnalyzeCodeInputSchema>;

const AnalyzeCodeOutputSchema = z.array(
  z.object({
    startLine: z.number().describe('The starting line number of the issue.'),
    startColumn: z.number().describe('The starting column number of the issue.'),
    endLine: z.number().describe('The ending line number of the issue.'),
    endColumn: z.number().describe('The ending column number of the issue.'),
    severity: z
      .enum(['error', 'suggestion'])
      .describe('The severity of the issue (error or suggestion).'),
    message: z.string().describe('A description of the issue.'),
  })
);
export type AnalyzeCodeOutput = z.infer<typeof AnalyzeCodeOutputSchema>;

export async function analyzeCode(input: AnalyzeCodeInput): Promise<AnalyzeCodeOutput> {
  return analyzeCodeFlow(input);
}

const analyzeCodePrompt = ai.definePrompt({
  name: 'analyzeCodePrompt',
  input: {schema: AnalyzeCodeInputSchema},
  output: {schema: AnalyzeCodeOutputSchema},
  prompt: `You are an expert code review assistant. Analyze the following code for bugs and areas for improvement. Your task is to identify issues and return them in a structured JSON array format. For each issue, provide the precise location with start and end line and column numbers.

Each object in the array must contain:
- 'startLine': The line number where the issue begins.
- 'startColumn': The column number on the start line where the issue begins.
- 'endLine': The line number where the issue ends.
- 'endColumn': The column number on the end line where the issue ends.
- 'severity': 'error' for breaking issues, 'suggestion' for improvements.
- 'message': A clear explanation of the issue.

Do not suggest adding docstrings or comments. Do not include any text, explanations, or markdown formatting outside of the JSON array itself.

Here is the code:
\`\`\`
{{{code}}}
\`\`\`
`,
});

const analyzeCodeFlow = ai.defineFlow(
  {
    name: 'analyzeCodeFlow',
    inputSchema: AnalyzeCodeInputSchema,
    outputSchema: AnalyzeCodeOutputSchema,
  },
  async input => {
    const {output} = await analyzeCodePrompt(input);
    return output!;
  }
);
