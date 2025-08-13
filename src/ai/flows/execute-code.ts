'use server';

/**
 * @fileOverview Simulates code execution using the Gemini API.
 *
 * - executeCode - A function that takes code, language, and optional stdin, and returns the simulated output.
 * - ExecuteCodeInput - The input type for the executeCode function.
 * - ExecuteCodeOutput - The return type for the executeCode function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExecuteCodeInputSchema = z.object({
  code: z.string().describe('The code to execute.'),
  language: z.string().describe('The programming language of the code.'),
  stdin: z.string().optional().describe('The standard input to provide to the program.'),
});
export type ExecuteCodeInput = z.infer<typeof ExecuteCodeInputSchema>;

const ExecuteCodeOutputSchema = z.object({
    output: z.string().describe('The standard output (stdout) of the executed code.')
});
export type ExecuteCodeOutput = z.infer<typeof ExecuteCodeOutputSchema>;

export async function executeCode(input: ExecuteCodeInput): Promise<ExecuteCodeOutput> {
  return executeCodeFlow(input);
}

const executeCodePrompt = ai.definePrompt({
  name: 'executeCodePrompt',
  input: {schema: ExecuteCodeInputSchema},
  output: {schema: ExecuteCodeOutputSchema},
  prompt: `You are a code interpreter. Execute the following {{{language}}} code and return only the standard output (stdout). Do not provide any explanation, comments, or markdown formatting. Just return the raw text output that the code would print to the console. If the code produces an error, return the error message as the output.

Code:
\`\`\`{{{language}}}
{{{code}}}
\`\`\`

{{#if stdin}}
Use the following as the standard input (stdin) for the program:
\`\`\`
{{{stdin}}}
\`\`\`
{{/if}}
`,
});

const executeCodeFlow = ai.defineFlow(
  {
    name: 'executeCodeFlow',
    inputSchema: ExecuteCodeInputSchema,
    outputSchema: ExecuteCodeOutputSchema,
  },
  async input => {
    const {output} = await executeCodePrompt(input);
    return output!;
  }
);

    