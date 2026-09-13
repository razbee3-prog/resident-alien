-- Resident Alien: waitlist + safety reports
-- Run in the Supabase SQL editor. Service-role key is used server-side only; RLS stays on with no public policies.

create table if not exists waitlist (
  id uuid primary key,
  email text not null unique,
  segment text not null check (segment in ('student','professional')),
  country text not null,
  arrival text,
  first_bill text,
  created_at timestamptz not null default now()
);

create table if not exists reports (
  id uuid primary key,
  lat double precision not null,
  lng double precision not null,
  category text not null check (category in ('checkpoint','presence','detention','courthouse','workplace','other')),
  note text not null check (char_length(note) <= 240),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  confirmations integer not null default 0,
  ip_hash text
);
create index if not exists reports_expires_idx on reports (expires_at);

create table if not exists report_confirmations (
  report_id uuid not null references reports(id) on delete cascade,
  ip_hash text not null,
  created_at timestamptz not null default now(),
  primary key (report_id, ip_hash)
);

create or replace function increment_confirmations(rid uuid)
returns integer language sql as $$
  update reports set confirmations = confirmations + 1 where id = rid returning confirmations;
$$;

-- Purge expired reports (schedule with pg_cron, e.g. every 15 minutes)
-- select cron.schedule('purge-reports', '*/15 * * * *', $$delete from reports where expires_at < now()$$);

alter table waitlist enable row level security;
alter table reports enable row level security;
alter table report_confirmations enable row level security;

-- ---------------------------------------------------------------------------
-- Credit Alien: iMessage coaching agent. Service-role only; RLS on, no public policies.
-- ---------------------------------------------------------------------------

create table if not exists coach_users (
  id uuid primary key,
  phone text not null unique,
  segment text check (segment in ('student','professional')),
  country text,
  persona text,
  timezone text,
  onboarding_stage text not null default 'new' check (onboarding_stage in ('new','consent','goal','context','active')),
  opted_out boolean not null default false,
  consent_messaging_at timestamptz,
  checkin_weekday smallint,
  next_checkin_at timestamptz,
  profile jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists coach_conversations (
  user_id uuid primary key references coach_users(id) on delete cascade,
  summary text not null default '',
  summary_through uuid,
  lock_until timestamptz,
  turn_count integer not null default 0,
  off_track_streak integer not null default 0,
  nudge boolean not null default false,
  last_in_at timestamptz,
  last_out_at timestamptz
);

create table if not exists coach_messages (
  id uuid primary key,
  user_id uuid not null references coach_users(id) on delete cascade,
  direction text not null check (direction in ('in','out')),
  message_handle text unique,
  content text not null,
  service text,
  status text,
  payload jsonb,
  created_at timestamptz not null default now(),
  processed_at timestamptz,
  run_id uuid
);
create index if not exists coach_messages_user_idx on coach_messages (user_id, created_at desc);

create table if not exists coach_goals (
  id uuid primary key,
  user_id uuid not null references coach_users(id) on delete cascade,
  outcome_type text not null,
  description text not null,
  score_target integer,
  target_date date,
  status text not null default 'active' check (status in ('active','achieved','abandoned')),
  created_at timestamptz not null default now()
);

create table if not exists coach_plans (
  id uuid primary key,
  user_id uuid not null references coach_users(id) on delete cascade,
  goal_id uuid references coach_goals(id) on delete set null,
  version integer not null,
  status text not null default 'active' check (status in ('active','superseded')),
  rationale text not null,
  milestones jsonb not null default '[]'::jsonb,
  replan_if jsonb not null default '[]'::jsonb,
  assumptions jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  superseded_at timestamptz,
  unique (user_id, version)
);

create table if not exists coach_tasks (
  id uuid primary key,
  plan_id uuid references coach_plans(id) on delete set null,
  user_id uuid not null references coach_users(id) on delete cascade,
  title text not null,
  rationale text not null,
  action_type text not null,
  success_condition text not null,
  status text not null default 'active' check (status in ('active','done','skipped','expired')),
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists coach_memories (
  id uuid primary key,
  user_id uuid not null references coach_users(id) on delete cascade,
  kind text not null check (kind in ('preference','constraint','fact','event')),
  summary text not null,
  source text not null check (source in ('user_stated','inferred','system')),
  confidence text not null check (confidence in ('high','medium','low')),
  superseded_by uuid,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists coach_progress (
  id uuid primary key,
  user_id uuid not null references coach_users(id) on delete cascade,
  task_id uuid,
  kind text not null check (kind in ('advance','neutral','off_track','complete','nudge')),
  note text not null,
  created_at timestamptz not null default now()
);

create table if not exists coach_runs (
  id uuid primary key,
  user_id uuid not null references coach_users(id) on delete cascade,
  trigger text not null,
  intent text,
  skills text[] not null default '{}',
  packet jsonb,
  tool_calls jsonb,
  model text,
  usage jsonb,
  policy jsonb,
  response text,
  error text,
  duration_ms integer,
  created_at timestamptz not null default now()
);

create table if not exists coach_jobs (
  id uuid primary key,
  user_id uuid not null references coach_users(id) on delete cascade,
  kind text not null,
  run_date date not null,
  run_at timestamptz not null default now(),
  status text not null default 'running' check (status in ('running','done','failed')),
  locked_until timestamptz,
  result jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, kind, run_date)
);

create table if not exists coach_events (
  id uuid primary key,
  user_id uuid references coach_users(id) on delete cascade,
  kind text not null,
  detail jsonb,
  created_at timestamptz not null default now()
);

alter table coach_users enable row level security;
alter table coach_conversations enable row level security;
alter table coach_messages enable row level security;
alter table coach_goals enable row level security;
alter table coach_plans enable row level security;
alter table coach_tasks enable row level security;
alter table coach_memories enable row level security;
alter table coach_progress enable row level security;
alter table coach_runs enable row level security;
alter table coach_jobs enable row level security;
alter table coach_events enable row level security;

-- ---------------------------------------------------------------------------
-- Credit Alien: score source via a hosted browser the user logs into (demo), and score history.
-- ---------------------------------------------------------------------------

create table if not exists coach_connections (
  id uuid primary key,
  user_id uuid not null references coach_users(id) on delete cascade,
  provider text not null default 'credit_karma',
  context_id text,
  status text not null default 'pending' check (status in ('pending','active','needs_relogin','revoked')),
  last_ok_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider)
);

create table if not exists coach_link_tokens (
  token text primary key,
  user_id uuid not null references coach_users(id) on delete cascade,
  connection_id uuid references coach_connections(id) on delete cascade,
  session_id text,
  connect_url text,
  live_view_url text,
  device text,
  status text not null default 'issued' check (status in ('issued','opened','completed','expired')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists coach_credit_snapshots (
  id uuid primary key,
  user_id uuid not null references coach_users(id) on delete cascade,
  source text not null,
  score integer,
  score_model text,
  bureau text,
  as_of text,
  confidence text,
  extract jsonb,
  created_at timestamptz not null default now()
);
create index if not exists coach_credit_snapshots_user_idx on coach_credit_snapshots (user_id, created_at desc);

alter table coach_connections enable row level security;
alter table coach_link_tokens enable row level security;
alter table coach_credit_snapshots enable row level security;

-- Onboarding stages gained 'situation' and 'connect' (consent kept for old rows). Safe to re-run.
alter table coach_users drop constraint if exists coach_users_onboarding_stage_check;
alter table coach_users add constraint coach_users_onboarding_stage_check
  check (onboarding_stage in ('new','situation','goal','connect','context','active','consent'));
