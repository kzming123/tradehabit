-- ============================================================
-- TradeHabit — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- ── Extensions ───────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── Portfolios ───────────────────────────────────────────────
create table if not exists public.portfolios (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  name             text not null,
  broker           text not null default '',
  currency         text not null default 'USDT',
  starting_balance numeric(18, 8) not null default 0,
  trading_style    text not null default 'other',
  goal             text,
  notes            text,
  created_at       timestamptz not null default now()
);

alter table public.portfolios enable row level security;

create policy "Users can manage their own portfolios"
  on public.portfolios
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── Trades ───────────────────────────────────────────────────
create table if not exists public.trades (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  portfolio_id     uuid not null references public.portfolios(id) on delete cascade,
  pair             text not null,
  market           text not null default 'crypto',
  direction        text not null check (direction in ('long', 'short')),
  outcome          text not null check (outcome in ('win', 'loss', 'breakeven')),
  entry_price      numeric(18, 8) not null,
  exit_price       numeric(18, 8) not null,
  position_size    numeric(18, 8) not null,
  pnl              numeric(18, 8) not null,
  pnl_percent      numeric(10, 4) not null,
  date_time        timestamptz not null,
  setup_tag        text,
  emotion_before   text,
  emotion_after    text,
  mistakes         text[] not null default '{}',
  notes            text,
  lesson_learned   text,
  screenshot_url   text,
  created_at       timestamptz not null default now()
);

alter table public.trades enable row level security;

create policy "Users can manage their own trades"
  on public.trades
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── Weekly Reviews ───────────────────────────────────────────
create table if not exists public.weekly_reviews (
  id                      uuid primary key default uuid_generate_v4(),
  user_id                 uuid not null references auth.users(id) on delete cascade,
  portfolio_id            uuid references public.portfolios(id) on delete set null,
  week_start              date not null,
  week_end                date,
  followed_plan           boolean not null default false,
  followed_plan_notes     text,
  repeated_mistake        text,
  repeated_mistake_notes  text,
  improvement_next_week   text,
  notes                   text,
  rating                  integer check (rating between 1 and 5),
  created_at              timestamptz not null default now()
);

-- Partial unique indexes (PostgreSQL NULLs are never equal in a regular UNIQUE constraint,
-- so we need two separate partial indexes to enforce uniqueness for both scopes).
create unique index if not exists weekly_reviews_all_scope_idx
  on public.weekly_reviews(user_id, week_start)
  where portfolio_id is null;

create unique index if not exists weekly_reviews_portfolio_scope_idx
  on public.weekly_reviews(user_id, portfolio_id, week_start)
  where portfolio_id is not null;

alter table public.weekly_reviews enable row level security;

create policy "Users can manage their own weekly reviews"
  on public.weekly_reviews
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── Storage Bucket ───────────────────────────────────────────
-- Run in SQL Editor (Supabase Storage API does not support SQL CREATE BUCKET)
-- Instead, go to: Storage → New Bucket → Name: trade-screenshots → Public: ON
--
-- Then add these storage RLS policies via: Storage → Policies
--
-- Policy 1 — Upload (INSERT):
--   name: "Users can upload their own screenshots"
--   bucket: trade-screenshots
--   operation: INSERT
--   expression: (auth.uid()::text) = (storage.foldername(name))[1]
--
-- Policy 2 — Read (SELECT):
--   name: "Public read access to screenshots"
--   bucket: trade-screenshots
--   operation: SELECT
--   expression: true
--
-- Policy 3 — Delete (DELETE):
--   name: "Users can delete their own screenshots"
--   bucket: trade-screenshots
--   operation: DELETE
--   expression: (auth.uid()::text) = (storage.foldername(name))[1]

-- ── Indexes (optional performance boost) ─────────────────────
create index if not exists trades_portfolio_id_idx    on public.trades(portfolio_id);
create index if not exists trades_user_id_idx         on public.trades(user_id);
create index if not exists trades_date_time_idx       on public.trades(date_time desc);
create index if not exists portfolios_user_id_idx     on public.portfolios(user_id);
create index if not exists weekly_reviews_user_id_idx on public.weekly_reviews(user_id);
create index if not exists weekly_reviews_week_idx    on public.weekly_reviews(week_start desc);
