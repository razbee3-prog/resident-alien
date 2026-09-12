import "server-only";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { anthropic, MODELS } from "./claude";
import type { SkillName } from "./skills";

const Route = z.object({
  intent: z.string().describe("snake_case, 1-3 words, e.g. utilization_question, remittance_affordability, task_report, greeting"),
  skills: z.array(z.enum(["credit_coach", "plan_and_goals", "cash_flow", "smalltalk"])).min(1).max(2),
  sensitive: z.enum(["none", "immigration_status", "formal_dispute", "fraud", "hardship", "sensitive_data"]),
  task_signal: z.enum(["none", "reports_done", "reports_blocked", "asks_about_task", "wants_new_goal"]),
});
export type Route = z.infer<typeof Route>;

const SYSTEM = `You route inbound iMessages for a credit coach. Pick the minimal skills:
- credit_coach: credit education, scores, utilization, reports, cards, SSN/ITIN, disputes.
- plan_and_goals: goal changes, plan/milestone/weekly-task talk, reporting progress, "what should I do next".
- cash_flow: affordability, how much to pay, sending money home, rent vs card, budgets.
- smalltalk: greetings, thanks, jokes, off-topic.
Return the intent, up to two skills, whether the message is sensitive, and whether it reports on the current weekly task.`;

export async function route(text: string, taskTitle: string | null): Promise<Route> {
  try {
    const res = await anthropic().messages.parse({
      model: MODELS.helper,
      max_tokens: 300,
      system: SYSTEM,
      messages: [{ role: "user", content: `Current weekly task: ${taskTitle ?? "none"}\n\nMessage:\n${text}` }],
      output_config: { format: zodOutputFormat(Route) },
    });
    if (res.parsed_output) return res.parsed_output;
  } catch (e) {
    console.warn("router failed, defaulting", e);
  }
  return { intent: "unknown", skills: ["credit_coach", "plan_and_goals"] as SkillName[] as Route["skills"], sensitive: "none", task_signal: "none" };
}
