"use server";

import { analyzeCode, type AnalyzeCodeOutput } from "@/ai/flows/analyze-code";
import { z } from "zod";

const ActionInputSchema = z.object({
  code: z.string().min(1, "Code cannot be empty."),
});

type ActionResponse = {
  success: boolean;
  data?: AnalyzeCodeOutput;
  error?: string;
};

export async function runCodeAnalysis(input: { code: string }): Promise<ActionResponse> {
  const parsed = ActionInputSchema.safeParse(input);
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
