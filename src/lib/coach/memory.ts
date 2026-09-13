import "server-only";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { anthropic, MODELS } from "./claude";
import * as store from "./store";
import { daysBetween } from "./text";
import type { CoachUser, Conversation, Memory, Task } from "./types";

/**
 * The memory writer. Runs after every turn: refreshes the rolling summary, proposes durable memories (with what they
 * supersede), and grades whether the exchange moved this week's task. Nothing here talks to the user.
 */

const Extraction = z.object({
  summary: z.string().describe("2-4 sentences: who the user is, their goal, where the plan stands, open threads. Third person, present tense, with numbers and dates."),
  memories: z
    .array(
      z.object({
        kind: z.enum(["preference", "constraint", "fact", "event"]),
        summary: z.string().describe("One sentence, third person, specific."),
        confidence: z.enum(["high", "medium", "low"]),
        stated_by_user: z.boolean().describe("true only if the user said it; false if inferred"),
        expires_in_days: z.number().nullable(),
        supersedes_id: z.string().nullable().describe("id of an existing memory this replaces, else null"),
      }),
    )
    .max(4)
    .describe("Only new durable facts from THIS exchange. Empty array if none."),
  progress: z.enum(["advance", "neutral", "off_track", "complete", "not_applicable"]).describe("Did this exchange move the weekly task?"),
  progress_note: z.string(),
});

const SYSTEM = `You maintain long-term memory for a credit coach texting with a newcomer to the U.S. Be conservative: write only durable, specific facts the user stated (or that a tool confirmed), never guesses.
Rules:
- Never restate an existing memory in different words; if the new fact only adds detail to one, write the fuller version and set supersedes_id to the old one.
- Do not record what the coach explained, what the user now "understands", or that they asked a question. Record facts about their life and money, stable preferences, and events.
- Never include SSNs, card numbers, passport or account numbers.
- Keep the summary short and current.`;

export async function extractAndUpdate(input: { user: CoachUser; conv: Conversation; task: Task | null; existing: Memory[]; userText: string; reply: string; toolNames: string[] }): Promise<void> {
  const { user, conv, task } = input;
  try {
    const res = await anthropic().messages.parse({
      model: MODELS.helper,
      max_tokens: 900,
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: [
            `Existing summary: ${conv.summary || "(none)"}`,
            `Existing memories:\n${input.existing.length ? input.existing.map((m) => `- [${m.id}] ${m.summary}`).join("\n") : "(none)"}`,
            `This week's task: ${task ? `${task.title} (${task.status})` : "none"}`,
            `Tools the coach called this turn: ${input.toolNames.join(", ") || "none"}`,
            `User said:\n${input.userText}`,
            `Coach replied:\n${input.reply}`,
          ].join("\n\n"),
        },
      ],
      output_config: { format: zodOutputFormat(Extraction) },
    });
    const out = res.parsed_output;
    if (!out) return;

    const existingText = new Set(input.existing.map((m) => norm(m.summary)));
    const existingIds = new Set(input.existing.map((m) => m.id));
    for (const m of out.memories) {
      if (existingText.has(norm(m.summary))) continue;
      if (!m.stated_by_user && m.confidence !== "high") continue;
      await store.insertMemory(user.id, {
        kind: m.kind,
        summary: m.summary,
        source: m.stated_by_user ? "user_stated" : "inferred",
        confidence: m.confidence,
        expires_at: m.expires_in_days ? new Date(Date.now() + m.expires_in_days * 86400000).toISOString() : null,
        supersedes: m.supersedes_id && existingIds.has(m.supersedes_id) ? m.supersedes_id : null,
      });
    }

    let streak = conv.off_track_streak;
    if (out.progress === "off_track") streak += 1;
    else if (out.progress === "advance" || out.progress === "complete") streak = 0;
    if (out.progress !== "not_applicable" && task) {
      await store.insertProgress(user.id, { task_id: task.id, kind: out.progress, note: out.progress_note });
    }
    const dueSoon = task?.due_at ? daysBetween(new Date().toISOString(), task.due_at) <= 3 : false;
    const nudge = Boolean(task && task.status === "active" && streak >= 3 && dueSoon);
    await store.updateConversation(user.id, { summary: out.summary.slice(0, 1200), turn_count: conv.turn_count + 1, off_track_streak: streak, nudge });
  } catch (e) {
    console.warn("memory extraction failed", e);
    await store.updateConversation(user.id, { turn_count: conv.turn_count + 1 });
  }
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
