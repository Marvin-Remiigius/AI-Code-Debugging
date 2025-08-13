"use server";

import { analyzeCode, type AnalyzeCodeOutput } from "@/ai/flows/analyze-code";
import { executeCode, type ExecuteCodeOutput } from "@/ai/flows/execute-code";
import { z } from "zod";

const AnalyzeActionInputSchema = z.object({
  code: z.string().min(1, "Code cannot be empty."),
});

const ExecuteActionInputSchema = z.object({
  code: z.string().min(1, "Code cannot be empty."),
  language: z.string().min(1, "Language cannot be empty."),
  stdin: z.string().optional(),
});

type AnalyzeActionResponse = {
  success: boolean;
  data?: AnalyzeCodeOutput;
  error?: string;
};

export async function runCodeAnalysis(input: { code: string }): Promise<AnalyzeActionResponse> {
  const parsed = AnalyzeActionInputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors.map((e) => e.message).join(", ") };
  }

  try {
    const results = await analyzeCode(parsed.data);
    return { success: true, data: results };
  } catch (e) {
    console.error("Code analysis failed:", e);
    return { success: false, error: "An unexpected error occurred during analysis." };
  }
}

type ExecuteActionResponse = {
    success: boolean;
    data?: ExecuteCodeOutput;
    error?: string;
};

export async function runCodeExecution(input: { code: string, language: string, stdin?: string }): Promise<ExecuteActionResponse> {
    const parsed = ExecuteActionInputSchema.safeParse(input);
    if (!parsed.success) {
        return { success: false, error: parsed.error.errors.map((e) => e.message).join(", ") };
    }

    try {
        const result = await executeCode(parsed.data);
        return { success: true, data: result };
    } catch (e) {
        console.error("Code execution failed:", e);
        return { success: false, error: "An unexpected error occurred during execution." };
    }
}

    