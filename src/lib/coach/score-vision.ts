import "server-only";
import type Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { anthropic, MODELS } from "./claude";

/**
 * Reads a credit score off a page screenshot (hosted-browser flow) or a user-texted screenshot. Structured output only;
 * the model never guesses a number: `score` is null unless it is legible on the image.
 */
export const ScoreExtraction = z.object({
  logged_in: z.boolean().describe("true if the page shows the user's own account content (a score, accounts, greeting by name); false for a login, MFA, captcha, or error page"),
  score: z.number().nullable().describe("The credit score number legible on the page, else null. Never estimate."),
  score_model: z.string().nullable().describe("e.g. VantageScore 3.0, FICO 8, or null if not shown"),
  bureau: z.string().nullable().describe("TransUnion, Equifax, Experian, or null if not shown"),
  as_of: z.string().nullable().describe("The 'updated' or 'as of' date shown, ISO YYYY-MM-DD if possible, else the text, else null"),
  confidence: z.enum(["high", "medium", "low"]),
  notes: z.string().describe("One sentence: what the page shows, and anything blocking (MFA prompt, captcha, error)."),
});
export type ScoreExtraction = z.infer<typeof ScoreExtraction>;

const SYSTEM = `You read credit-monitoring pages for a coaching app. Report only what is visibly on the page. If the page is a login, verification, captcha, or error page, set logged_in false and score null. If two scores are shown (e.g. TransUnion and Equifax), report the first and mention the second in notes.`;

export async function extractScore(input: { pngBase64?: string; imageUrl?: string; pageText?: string; provider: string }): Promise<ScoreExtraction> {
  const content: Anthropic.ContentBlockParam[] = [];
  if (input.pngBase64) content.push({ type: "image", source: { type: "base64", media_type: "image/png", data: input.pngBase64 } });
  else if (input.imageUrl) content.push({ type: "image", source: { type: "url", url: input.imageUrl } });
  content.push({
    type: "text",
    text: `Provider: ${input.provider}.${input.pageText ? `\n\nVisible page text (may be truncated):\n${input.pageText.slice(0, 6000)}` : ""}\n\nExtract the score information.`,
  });
  const res = await anthropic().messages.parse({
    model: MODELS.chat,
    max_tokens: 600,
    system: SYSTEM,
    messages: [{ role: "user", content }],
    output_config: { effort: "low", format: zodOutputFormat(ScoreExtraction) },
  });
  if (!res.parsed_output) throw new Error("score extraction returned no structured output");
  return res.parsed_output;
}

export { looksLikeLoginPage } from "./score-page";
