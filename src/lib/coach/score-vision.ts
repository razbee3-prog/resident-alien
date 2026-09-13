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
  utilization_percent: z.number().nullable().describe("Credit card utilization percent if shown, else null"),
  on_time_percent: z.number().nullable().describe("On-time payment percent if shown, else null"),
  total_accounts: z.number().nullable().describe("Number of accounts if shown, else null"),
  derogatory_marks: z.number().nullable().describe("Derogatory marks / collections count if shown, else null"),
  observations: z.string().describe("Two or three plain sentences on what the page shows beyond the score: accounts, factors, alerts, offers. Only what is visible."),
  notes: z.string().describe("One sentence: what the page is, and anything blocking (MFA prompt, captcha, error)."),
});
export type ScoreExtraction = z.infer<typeof ScoreExtraction>;

const SYSTEM = `You read credit-monitoring pages for a coaching app. Report only what is visibly on the page. If the page is a login, verification, captcha, or error page, or shows only a navigation bar with a loading spinner, set logged_in false and score null. If two scores are shown (e.g. TransUnion and Equifax), report the first and mention the second in notes.
Credit Karma layout: on the Credit Health page "NNN out of 850" is the score; the selected tab (TransUnion or Equifax) is the bureau; "Scores checked daily with VantageScore 3.0" gives the score model; "Checked Daily" with no explicit date means as_of is today's date given in the message. On the Today page each gauge shows a score with its bureau underneath.`;

export type ImageMediaType = "image/png" | "image/jpeg" | "image/gif" | "image/webp";

export async function extractScore(input: { pngBase64?: string; image?: { base64: string; mediaType: ImageMediaType }; pageText?: string; provider: string }): Promise<ScoreExtraction> {
  const content: Anthropic.ContentBlockParam[] = [];
  if (input.pngBase64) content.push({ type: "image", source: { type: "base64", media_type: "image/png", data: input.pngBase64 } });
  else if (input.image) content.push({ type: "image", source: { type: "base64", media_type: input.image.mediaType, data: input.image.base64 } });
  content.push({
    type: "text",
    text: `Provider: ${input.provider}. Today is ${new Date().toISOString().slice(0, 10)}.${input.pageText ? `\n\nVisible page text (may be truncated):\n${input.pageText.slice(0, 6000)}` : ""}\n\nExtract the score information.`,
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

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

/** Fetch a texted image (Sendblue media URL) into base64 for the extractor. Supports data: URLs for tests. */
export async function fetchImage(url: string): Promise<{ base64: string; mediaType: ImageMediaType } | null> {
  const m = url.match(/^data:(image\/(?:png|jpeg|gif|webp));base64,(.+)$/);
  if (m) return { base64: m[2], mediaType: m[1] as ImageMediaType };
  const res = await fetch(url, { signal: AbortSignal.timeout(20_000) });
  if (!res.ok) return null;
  const type = (res.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
  const mediaType = type === "image/jpg" ? "image/jpeg" : type;
  if (!["image/png", "image/jpeg", "image/gif", "image/webp"].includes(mediaType)) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.byteLength > MAX_IMAGE_BYTES) return null;
  return { base64: buf.toString("base64"), mediaType: mediaType as ImageMediaType };
}
