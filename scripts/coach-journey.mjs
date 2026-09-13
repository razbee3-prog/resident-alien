#!/usr/bin/env node
/**
 * Drives /api/coach/simulate through a realistic first journey and prints every reply plus the state after each turn.
 * Usage: node scripts/coach-journey.mjs [baseUrl] [phone]
 * Needs a running `next dev` (local storage mode) with ANTHROPIC_API_KEY set and SENDBLUE_DRY_RUN=1.
 */
const base = process.argv[2] ?? "http://localhost:3000";
const phone = process.argv[3] ?? `+1415555${String(1000 + Math.floor(Math.random() * 9000))}`;

const steps = [
  "Hi Credit Alien 👽 I'm a professional from IND. Help me build U.S. credit.",
  "yes",
  "I want to rent an apartment in March without a huge deposit. I guess I need like a 700 score?",
  "I started at my job 3 weeks ago and the first paycheck landed last Friday. Salary is 110k.",
  "Rent is 2400, essentials maybe 1100 a month. I have about 9k saved in my US account.",
  "I send my parents around 500 a month. No US credit card yet. I do have an SSN now.",
  "can I send an extra $200 home this week on top of that?",
  "what does utilization even mean",
  "my ssn is 123-45-6789 in case you need it for the card",
  "ok I opened the secured card, limit 500. statement closes on the 20th and payment is due the 15th",
  "will ICE deport me if I miss a payment?",
  "STOP",
];

const dim = (s) => `\x1b[2m${s}\x1b[0m`;
const bold = (s) => `\x1b[1m${s}\x1b[0m`;
console.log(dim(`journey for ${phone} against ${base}`));

for (const text of steps) {
  const t0 = Date.now();
  const res = await fetch(`${base}/api/coach/simulate`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ phone, text }) });
  const json = await res.json().catch(() => ({}));
  console.log(`\n${bold("USER:")} ${text}`);
  if (!res.ok) {
    console.log(`  ${bold("HTTP")} ${res.status} ${JSON.stringify(json)}`);
    continue;
  }
  for (const r of json.replies ?? []) console.log(`${bold("ALIEN:")} ${r}`);
  const s = json.state ?? {};
  const run = json.results?.[0];
  console.log(
    dim(
      [
        `${Date.now() - t0} ms`,
        `action=${json.action}`,
        `stage=${s.stage}`,
        run ? `skills=${(run.skills ?? []).join("+") || "-"} intent=${run.intent ?? "-"}${run.error ? ` ERROR=${run.error}` : ""}` : "",
        s.goal ? `goal=${s.goal.outcome_type}/${s.goal.target_date ?? "?"}` : "",
        s.plan ? `plan=v${s.plan.version}` : "",
        s.task ? `task="${s.task.title}"` : "",
        `memories=${(s.memories ?? []).length}`,
        s.nudge ? "NUDGE" : "",
      ]
        .filter(Boolean)
        .join(" · "),
    ),
  );
  if (s.summary) console.log(dim(`  summary: ${s.summary}`));
  if ((s.memories ?? []).length) console.log(dim(`  memories: ${s.memories.join(" | ")}`));
}
