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
    line: z.number().describe('The line number where the issue exists.'),
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
  prompt: `You are an expert code review assistant. Analyze the following code for bugs and areas for improvement. Your task is to identify issues and return them in a structured JSON array format. Each object in the array should contain: a 'line' number, a 'severity' ('error' for breaking issues, 'suggestion' for improvements), and a 'message' explaining the issue. Do not include any text, explanations, or markdown formatting outside of the JSON array itself. Here is the code:\n\n\`\`\`\n{{{code}}}\n\`\`\`\n`,
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
