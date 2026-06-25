-- ============================================================
-- schema.sql — estructura de la base de datos en Supabase.
-- Tabla única app_state: un blob JSON por usuario, con RLS.
-- ============================================================
create table if not exists public.app_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.app_state enable row level security;

create policy "own rows - select" on public.app_state
  for select using (auth.uid() = user_id);
create policy "own rows - insert" on public.app_state
  for insert with check (auth.uid() = user_id);
create policy "own rows - update" on public.app_state
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
