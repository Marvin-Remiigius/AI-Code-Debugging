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
  prompt: `You are an advanced code analysis AI. Your primary function is to analyze a given code snippet and return a structured JSON array of all issues found. The accuracy of the line and column numbers in your response is critical for the application's functionality.

## MANDATORY RULES:
1.  **JSON ONLY:** Your entire response MUST be a single, valid JSON array. Do not include any introductory text, explanations, or markdown formatting like \`\`\`json before or after the array.
2.  **PRECISE LOCATION:** For each issue, you must provide the exact start and end line and column numbers. The line numbers must be relative to the beginning of the code provided below. This is not optional.
3.  **COMPLETE OBJECTS:** Every object in the array must contain all required keys: 'startLine', 'startColumn', 'endLine', 'endColumn', 'severity' (either "error" or "suggestion"), and 'message'.
4.  **NO DOCSTRING SUGGESTIONS:** Do not suggest adding docstrings or comments to the code.

## EXAMPLE OF PERFECT OUTPUT:
If the input code is:
\`\`\`python
1: def my_func()
2:     name = "AI"
3:     print(nam)
\`\`\`
Your JSON output MUST be exactly this:
\`\`\`json
[
  {
    "startLine": 1,
    "startColumn": 13,
    "endLine": 1,
    "endColumn": 13,
    "severity": "error",
    "message": "SyntaxError: Missing colon ':' at the end of the function definition."
  },
  {
    "startLine": 3,
    "startColumn": 11,
    "endLine": 3,
    "endColumn": 14,
    "severity": "error",
    "message": "NameError: The variable 'nam' is not defined. Did you mean 'name'?"
  }
]
\`\`\`
TASK:
Now, analyze the following code snippet and provide your response according to all the rules specified above.

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
