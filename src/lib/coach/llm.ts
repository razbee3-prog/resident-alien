import "server-only";
import type Anthropic from "@anthropic-ai/sdk";
import { anthropic, MODELS } from "./claude";
import { systemBlocks } from "./prompt";
import { allowedTools, type SkillName } from "./skills";
import { stripMarkdown } from "./text";
import { executeTool, toolDefinitions, type Effects, type ToolCallLog } from "./tools";
import type { CoachUser } from "./types";

const MAX_TOOL_ROUNDS = 6;
const FALLBACK_BETA = "server-side-fallback-2026-07-01" as const;

export type LoopResult = {
  text: string;
  effects: Effects;
  log: ToolCallLog[];
  usage: { input: number; output: number; cache_read: number; cache_write: number; rounds: number };
  model: string;
  refused: boolean;
};

/**
 * One agent turn: Opus 5 with the full (cache-stable) tool list, skill-gated execution, sequential tool calls so
 * effects (profile → plan → task) chain correctly. Server-side refusal fallback is on by default.
 */
export async function agentLoop(input: { user: CoachUser; skills: SkillName[]; userTurn: string }): Promise<LoopResult> {
  const client = anthropic();
  const ctx = { user: input.user, allowed: allowedTools(input.skills), effects: {} as Effects, log: [] as ToolCallLog[] };
  const messages: Anthropic.Beta.BetaMessageParam[] = [{ role: "user", content: input.userTurn }];
  const usage = { input: 0, output: 0, cache_read: 0, cache_write: 0, rounds: 0 };
  let text = "";
  let model: string = MODELS.chat;
  let refused = false;

  for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
    const res = await client.beta.messages.create({
      model: MODELS.chat,
      max_tokens: 2048,
      betas: [FALLBACK_BETA],
      fallbacks: "default",
      system: systemBlocks(input.skills),
      tools: toolDefinitions as Anthropic.Beta.BetaTool[],
      messages,
      output_config: { effort: "medium" },
    });
    usage.rounds += 1;
    usage.input += res.usage.input_tokens;
    usage.output += res.usage.output_tokens;
    usage.cache_read += res.usage.cache_read_input_tokens ?? 0;
    usage.cache_write += res.usage.cache_creation_input_tokens ?? 0;
    model = res.model;

    if (res.stop_reason === "refusal") {
      refused = true;
      text = "I can’t help with that one. Happy to keep going on your credit plan whenever you’re ready.";
      break;
    }
    messages.push({ role: "assistant", content: res.content });
    const toolUses = res.content.filter((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === "tool_use");
    const textNow = res.content.filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text").map((b) => b.text).join("\n").trim();

    if (res.stop_reason !== "tool_use" || toolUses.length === 0 || round === MAX_TOOL_ROUNDS) {
      text = textNow;
      break;
    }
    const results: Anthropic.Beta.BetaToolResultBlockParam[] = [];
    for (const tu of toolUses) {
      const r = await executeTool(tu.name, tu.input, ctx);
      results.push({ type: "tool_result", tool_use_id: tu.id, content: r.content, ...(r.is_error ? { is_error: true } : {}) });
    }
    messages.push({ role: "user", content: results });
  }

  return { text: stripMarkdown(text), effects: ctx.effects, log: ctx.log, usage, model, refused };
}
