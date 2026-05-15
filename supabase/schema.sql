create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  city text not null,
  avatar_url text,
  preferred_theme text default 'calm',
  preferred_language text default 'en',
  is_pro boolean not null default false,
  created_at timestamp with time zone default now()
);

create table if not exists public.game_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  mode text not null,
  layout_id text not null,
  score integer not null,
  duration_seconds integer not null,
  moves_count integer not null,
  hints_used integer not null default 0,
  shuffles_used integer not null default 0,
  undos_used integer not null default 0,
  completed boolean not null default false,
  created_at timestamp with time zone default now()
);

create table if not exists public.daily_challenges (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  seed text not null,
  layout_id text not null,
  difficulty text not null,
  created_at timestamp with time zone default now()
);

create table if not exists public.daily_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  challenge_date date not null,
  score integer not null,
  duration_seconds integer not null,
  moves_count integer not null,
  hints_used integer not null default 0,
  shuffles_used integer not null default 0,
  undos_used integer not null default 0,
  completed boolean not null default false,
  created_at timestamp with time zone default now()
);

create table if not exists public.user_stats (
  user_id uuid primary key references auth.users(id) on delete cascade,
  total_games integer not null default 0,
  total_wins integer not null default 0,
  best_time_seconds integer,
  average_time_seconds integer,
  total_score integer not null default 0,
  current_streak integer not null default 0,
  best_streak integer not null default 0,
  last_daily_completed date
);

create table if not exists public.user_unlocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  item_id text not null,
  item_type text not null,
  purchased_at timestamp with time zone default now()
);

alter table public.profiles enable row level security;
alter table public.game_sessions enable row level security;
alter table public.daily_results enable row level security;
alter table public.user_stats enable row level security;
alter table public.user_unlocks enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles for select
using (auth.uid() = id);

drop policy if exists "profiles_upsert_own" on public.profiles;
create policy "profiles_upsert_own"
on public.profiles for all
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "game_sessions_own" on public.game_sessions;
create policy "game_sessions_own"
on public.game_sessions for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "daily_results_read_all" on public.daily_results;
create policy "daily_results_read_all"
on public.daily_results for select
using (true);

drop policy if exists "daily_results_write_own" on public.daily_results;
create policy "daily_results_write_own"
on public.daily_results for insert
with check (auth.uid() = user_id);

drop policy if exists "user_stats_own" on public.user_stats;
create policy "user_stats_own"
on public.user_stats for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "user_unlocks_own" on public.user_unlocks;
create policy "user_unlocks_own"
on public.user_unlocks for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
