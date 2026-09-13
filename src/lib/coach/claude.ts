import "server-only";
import Anthropic from "@anthropic-ai/sdk";

/** Accepts ANTHROPIC_API_KEY (SDK default) or ANTHROPIC_KEY. */
const apiKey = process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_KEY;

let client: Anthropic | null = null;
export function anthropic(): Anthropic {
  if (!client) client = new Anthropic({ apiKey, maxRetries: 2, timeout: 60_000 });
  return client;
}

export const MODELS = {
  /** Conversation turns, planning, weekly check-ins. */
  chat: "claude-opus-5",
  /** Intent routing and memory extraction. */
  helper: "claude-haiku-4-5",
} as const;

export const anthropicConfigured = Boolean(apiKey);
