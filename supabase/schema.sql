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
