# Credit Alien: the iMessage coaching agent

Credit Alien is the long-horizon coach behind the "Chat with Credit Alien" button. A visitor taps the button, Messages opens with a prefilled hello to our Sendblue line, and from then on the coach runs a versioned credit plan for them over weeks and months: one action a week, a daily internal check, a weekly check-in, memory that outlives any single conversation.

This document describes what was built, where it departs from the original architecture note, and how to run it.

## What changed from the architecture note, and why

| Original | Built | Why |
|---|---|---|
| Four conversational agents (Journey Manager, Credit Coach, Plan & Goals, Cash Flow) | One agent, five skills. A Haiku router picks the skills; each skill adds prompt rules and unlocks tools | Handoffs between LLM agents over text add latency and voice drift. The note's skill YAMLs were already tool bundles; that is what a skill is here (`src/lib/coach/skills.ts`) |
| "Keep the goal in mind" | A goal header leads every context packet (goal, deadline, days left, active milestone, this week's task and status). A post-turn pass grades every exchange advance / neutral / off_track; three off-track turns near a due date set a `nudge` flag the prompt acts on | Stated intent is not a mechanism. This is |
| Last 5 to 10 messages as live context | Last 12 raw messages plus a rolling summary refreshed after every turn | "yes" and "the second one" are meaningless without the thread |
| Memory-write policy, no writer | `memory.ts`: after each turn, Haiku proposes memories with what they supersede; inferred facts are dropped unless high-confidence; duplicates are skipped | Someone has to write the memories |
| Idempotency mentioned | Dedupe on `message_handle`, a per-user lock, a short debounce so rapid texts get one reply, and a daily sweep for any message that never got a turn | iMessage users double-text |
| No first-contact flow | Onboarding state machine: new → consent → goal → context → active. Each stage pins the one question to ask. The website button prefills segment and country | Consent has to be explicit; the plan needs five facts before it exists |
| pgvector RAG, Temporal, BullMQ | Curated knowledge in the cached system prompt; one daily Vercel Cron plus a `coach_jobs` table | Nothing here needs a queue yet. Move knowledge to retrieval when it outgrows ~50k tokens |

Kept as written: structured state over chat history, deterministic finance tools, plan versioning (never mutate), the Monitor never texts on its own except for payment risk, Sendblue behind a provider interface, the priority order, the hard rules.

## Flow of one message

```
iMessage → Sendblue → POST /api/sendblue/webhook
  verify sb-signing-secret (shared secret, timing-safe compare)
  ignore outbound status callbacks and group chats
  ingest: find/create user by phone, STOP/START handling, PII redaction (stored redacted), insert (unique handle)
  run the turn inline (Next's after() hook did not run on Vercel; a >45 s turn makes Sendblue retry, which dedupes):
    runTurn(user)
      sleep 1.5 s (debounce), take per-user lock
      load all unprocessed inbound messages as one turn
      hard route: immigration/status questions → referral, no model call
      stage machine decides onboarding step, or Haiku router picks skills
      build packet (goal header, profile, memories, summary, recent turns)
      Opus 5 tool loop (≤ 6 rounds, skill-gated tools, sequential execution)
      outbound guard (no guarantees, no carry-a-balance, no card-funded remittance) → one rewrite → canned fallback
      send via Sendblue (≤ 2 bubbles), record coach_runs
      memory pass (summary, memories, progress grade, nudge flag)
      loop if more inbound arrived, release lock
```

## Modules (`src/lib/coach/`)

| File | Job |
|---|---|
| `sendblue.ts` | Provider: verify webhook, parse inbound, send (splits bubbles), typing indicator, mark read. `SENDBLUE_DRY_RUN=1` logs instead of sending |
| `db.ts`, `store.ts` | Table adapter (Supabase live / JSON files local) and the domain store: users, conversation, messages, goals, plans, tasks, memories, progress, runs, jobs, events |
| `ingest.ts` | Shared by webhook and simulator: opt-out, PII redaction, idempotent insert |
| `policy.ts` | PII regexes (SSN/ITIN, Luhn-valid cards, passport, account, secrets), opt-out words, immigration-question detector, outbound claim guard |
| `finance.ts` | utilization, safe payment, safe remittance, payment recommendation. Pure, tested |
| `onboarding.ts` | Stage machine, button-prefill parser, context-completeness check |
| `skills.ts`, `prompt.ts`, `knowledge.ts` | Skill definitions, the persona and hard rules, the approved knowledge block (cache breakpoint sits on it) |
| `tools.ts` | Tool schemas (strict where the shape allows) and the executor; refuses tools outside the active skills so the tool list stays cache-stable |
| `context.ts` | Packet builder and renderer (goal header first) |
| `router.ts` | Haiku 4.5 structured-output classifier: intent, skills, sensitivity, task signal |
| `llm.ts` | The Opus 5 loop with server-side refusal fallback on |
| `turn.ts` | Debounce, lock, batch, stage transitions, guard, send, record, memory pass |
| `memory.ts` | Rolling summary, memory proposals with supersede, progress grade, nudge |
| `monitor.ts` | Daily deterministic findings; texts only for a payment due within 3 days without autopay |
| `weekly.ts` | Weekly check-in: close/set task, version plan on material change, one message or none |

Routes: `POST /api/sendblue/webhook`, `GET /api/cron/tick` (Bearer `CRON_SECRET`), `POST /api/coach/simulate` (dev only).

## Data model

All tables are prefixed `coach_` in `supabase/schema.sql`. RLS is on with no public policies; the service-role key is used server-side only. `coach_messages.content` is stored after redaction; raw Sendblue payloads are never stored. `coach_runs` holds the packet, tool calls, usage, and policy outcome for every model turn, which is the audit trail.

Local development without Supabase writes the same tables to `.data/coach/*.json` (git-ignored).

## Models

- Turns, planning, weekly check-ins: `claude-opus-5`, adaptive thinking (default), effort `medium`, `max_tokens` 2048, server-side refusal fallback enabled (`server-side-fallback-2026-07-01`, `fallbacks: "default"`).
- Router and memory writer: `claude-haiku-4-5` with structured outputs (zod).
- Prompt caching: persona and knowledge blocks are the stable prefix; the tool list never changes per turn; skill sections and everything volatile come after the breakpoint.

## Setup

1. Run `supabase/schema.sql` in the Supabase SQL editor (idempotent).
2. Set env vars (see `.env.example`): `ANTHROPIC_API_KEY` (or `ANTHROPIC_KEY`), `SENDBLUE_API_KEY` (or `SENDBLUE_API_KEY_ID`), `SENDBLUE_SECRET` (or `SENDBLUE_API_SECRET_KEY`), `SENDBLUE_NUMBER`, `SENDBLUE_WEBHOOK_SECRET`, `CRON_SECRET`. `SENDBLUE_BASE_URL` is optional.
3. In Sendblue → Developer → Webhooks, add `https://<your-domain>/api/sendblue/webhook`. Its secret must match `SENDBLUE_WEBHOOK_SECRET`, or the API secret when that is unset (the dashboard default).
4. Deploy. `vercel.json` schedules `/api/cron/tick` daily at 16:00 UTC (Hobby allows one run a day; the job decides per user whether a weekly check-in is due). Vercel sends `Authorization: Bearer $CRON_SECRET`.
5. The hero button appears once `SENDBLUE_NUMBER` is set (it is read at build time, so redeploy after adding it).

Function durations: the webhook route declares `maxDuration = 120` and the cron route `300`. Both are within Vercel's Fluid Compute limits on every plan.

## Testing without a phone

```bash
SENDBLUE_DRY_RUN=1 npm run dev
curl -s localhost:3000/api/coach/simulate -H 'content-type: application/json' \
  -d '{"phone":"+14155550101","text":"Hi Credit Alien 👽 I'"'"'m a professional from IND. Help me build U.S. credit."}' | jq
```

Each call returns the replies, the run summary, and the user's state (stage, goal, plan version, task, memories, summary, nudge). `node scripts/coach-journey.mjs` walks a full scripted journey: prefill → `yes` → a goal → the context questions → the plan appears → a remittance question → a utilization question → an SSN-shaped message (redacted, warned) → an immigration question (referral) → `STOP`.

Unit tests (`npm test`) cover the finance tools, PII redaction, the outbound guard, opt-out words, the immigration detector, the prefill parser, context completeness, bubble splitting, and phone normalization.

Webhook check: post Sendblue's documented sample payload to `/api/sendblue/webhook` with and without the `sb-signing-secret` header; post the same `message_handle` twice and confirm `{"action":"duplicate"}` the second time.

## Boundaries

No payments, transfers, applications, account changes, or disputes happen by text. The coach describes the step and says a secure link will follow; that flow is not built yet. The Kikoff Enterprise adapter and reporting reconciliation from the architecture note are also not built; `coach_events` is where a monitor finding from a data provider would land.
