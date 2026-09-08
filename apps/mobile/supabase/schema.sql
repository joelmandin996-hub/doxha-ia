-- Doxha Church — mobile app schema for Supabase
-- Scope: only the 9 collections the Expo mobile app actually uses
-- (members, groups, group_members, evenements, suivis, donations,
-- conversations, chat_messages, plus a profiles table backing auth.users).
-- apps/web and apps/api stay on PocketBase for now — this project is
-- mobile-only until the rest is migrated too.
--
-- HOW TO RUN: paste this whole file into the Supabase dashboard's
-- SQL Editor (left sidebar) and click "Run". It's safe to re-run —
-- every statement is guarded (CREATE ... IF NOT EXISTS / DROP ... IF EXISTS).

-- ============================================================
-- 1. profiles — mirrors auth.users so RLS-able tables (and the
--    mobile app's "list my teammates" chat screen) can read a
--    name/email without needing service-role access to auth.users.
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text,
  email text,
  created timestamptz not null default now(),
  updated timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated" on public.profiles
  for select using (auth.uid() is not null);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid());

-- Keep profiles in sync whenever a new auth user signs up / is created
-- (e.g. from the Supabase dashboard's "Add user").
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email)
  values (new.id, new.raw_user_meta_data ->> 'name', new.email)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill profiles for any auth users that already exist.
insert into public.profiles (id, name, email)
select id, raw_user_meta_data ->> 'name', email from auth.users
on conflict (id) do nothing;

-- Reusable "touch updated column" trigger, attached per-table below.
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated = now();
  return new;
end;
$$ language plpgsql;

-- ============================================================
-- 2. members
-- ============================================================
create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  address text,
  join_date date,
  status text check (status in ('Actif', 'Inactif', 'Visiteur', 'Nouveau', 'Baptisé')),
  notes text,
  baptism_date date,
  created timestamptz not null default now(),
  updated timestamptz not null default now()
);

drop trigger if exists members_set_updated_at on public.members;
create trigger members_set_updated_at before update on public.members
  for each row execute function public.set_updated_at();

alter table public.members enable row level security;

drop policy if exists "members_all_authenticated" on public.members;
create policy "members_all_authenticated" on public.members
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

-- ============================================================
-- 3. groups
-- ============================================================
create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  responsible uuid references public.members (id) on delete set null,
  type text check (type in ('Cellule', 'Jeunesse', 'Femmes', 'Hommes', 'Louange', 'Technique', 'Groupe de service')),
  created timestamptz not null default now(),
  updated timestamptz not null default now()
);

drop trigger if exists groups_set_updated_at on public.groups;
create trigger groups_set_updated_at before update on public.groups
  for each row execute function public.set_updated_at();

alter table public.groups enable row level security;

drop policy if exists "groups_all_authenticated" on public.groups;
create policy "groups_all_authenticated" on public.groups
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

-- ============================================================
-- 4. group_members
-- ============================================================
create table if not exists public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  member_id uuid not null references public.members (id) on delete cascade,
  created timestamptz not null default now(),
  updated timestamptz not null default now(),
  unique (group_id, member_id)
);

drop trigger if exists group_members_set_updated_at on public.group_members;
create trigger group_members_set_updated_at before update on public.group_members
  for each row execute function public.set_updated_at();

alter table public.group_members enable row level security;

drop policy if exists "group_members_all_authenticated" on public.group_members;
create policy "group_members_all_authenticated" on public.group_members
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

-- ============================================================
-- 5. evenements
-- ============================================================
create table if not exists public.evenements (
  id uuid primary key default gen_random_uuid(),
  titre text not null,
  description text,
  date_debut timestamptz not null,
  date_fin timestamptz not null,
  categorie text,
  lieu text,
  responsable uuid references public.members (id) on delete set null,
  statut text check (statut in ('a_venir', 'fait', 'annule')) default 'a_venir',
  capacite_max integer,
  created_by uuid not null references auth.users (id) on delete cascade,
  created timestamptz not null default now(),
  updated timestamptz not null default now()
);

drop trigger if exists evenements_set_updated_at on public.evenements;
create trigger evenements_set_updated_at before update on public.evenements
  for each row execute function public.set_updated_at();

alter table public.evenements enable row level security;

drop policy if exists "evenements_select_own" on public.evenements;
create policy "evenements_select_own" on public.evenements
  for select using (created_by = auth.uid());

drop policy if exists "evenements_insert_own" on public.evenements;
create policy "evenements_insert_own" on public.evenements
  for insert with check (auth.uid() is not null and created_by = auth.uid());

drop policy if exists "evenements_update_own" on public.evenements;
create policy "evenements_update_own" on public.evenements
  for update using (created_by = auth.uid());

drop policy if exists "evenements_delete_own" on public.evenements;
create policy "evenements_delete_own" on public.evenements
  for delete using (created_by = auth.uid());

-- ============================================================
-- 6. suivis
-- ============================================================
create table if not exists public.suivis (
  id uuid primary key default gen_random_uuid(),
  description text not null,
  type text check (type in ('Nouveau membre', 'Suivi pastoral', 'Demande de prière', 'Membre absent', 'Bénévole', 'Formation', 'Donateur', 'Famille', 'Jeunesse', 'Enfant', 'Visite', 'Appel', 'Rencontre', 'Autre')),
  statut text check (statut in ('Nouveau', 'À contacter', 'Planifié', 'En cours', 'Terminé')) default 'Nouveau',
  notes text,
  membre_id uuid references public.members (id) on delete set null,
  priorite text check (priorite in ('urgent', 'normal', 'basse')) default 'normal',
  created_by uuid not null references auth.users (id) on delete cascade,
  created timestamptz not null default now(),
  updated timestamptz not null default now()
);

drop trigger if exists suivis_set_updated_at on public.suivis;
create trigger suivis_set_updated_at before update on public.suivis
  for each row execute function public.set_updated_at();

alter table public.suivis enable row level security;

drop policy if exists "suivis_select_own" on public.suivis;
create policy "suivis_select_own" on public.suivis
  for select using (created_by = auth.uid());

drop policy if exists "suivis_insert_own" on public.suivis;
create policy "suivis_insert_own" on public.suivis
  for insert with check (created_by = auth.uid());

drop policy if exists "suivis_update_own" on public.suivis;
create policy "suivis_update_own" on public.suivis
  for update using (created_by = auth.uid());

drop policy if exists "suivis_delete_own" on public.suivis;
create policy "suivis_delete_own" on public.suivis
  for delete using (created_by = auth.uid());

-- ============================================================
-- 7. donations
-- (PocketBase carried a legacy English field set alongside the French
-- one purely to satisfy old required-field validation; dropped here —
-- the mobile app only ever read/wrote the French set.)
-- ============================================================
create table if not exists public.donations (
  id uuid primary key default gen_random_uuid(),
  membre_id uuid not null references public.members (id) on delete cascade,
  amount numeric not null,
  date_don timestamptz not null,
  type_don text check (type_don in ('unique', 'recurrent')) default 'unique',
  statut text check (statut in ('completed', 'pending')) default 'completed',
  description text,
  created_by uuid not null references auth.users (id) on delete cascade,
  created timestamptz not null default now(),
  updated timestamptz not null default now()
);

drop trigger if exists donations_set_updated_at on public.donations;
create trigger donations_set_updated_at before update on public.donations
  for each row execute function public.set_updated_at();

alter table public.donations enable row level security;

drop policy if exists "donations_select_own" on public.donations;
create policy "donations_select_own" on public.donations
  for select using (created_by = auth.uid());

drop policy if exists "donations_insert_own" on public.donations;
create policy "donations_insert_own" on public.donations
  for insert with check (auth.uid() is not null and created_by = auth.uid());

drop policy if exists "donations_update_own" on public.donations;
create policy "donations_update_own" on public.donations
  for update using (created_by = auth.uid());

drop policy if exists "donations_delete_own" on public.donations;
create policy "donations_delete_own" on public.donations
  for delete using (created_by = auth.uid());

-- ============================================================
-- 8. conversations (1:1 team chat)
-- ============================================================
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references auth.users (id) on delete cascade,
  user_b uuid not null references auth.users (id) on delete cascade,
  created timestamptz not null default now(),
  updated timestamptz not null default now()
);

create index if not exists idx_conversations_user_a on public.conversations (user_a);
create index if not exists idx_conversations_user_b on public.conversations (user_b);

alter table public.conversations enable row level security;

drop policy if exists "conversations_select_participant" on public.conversations;
create policy "conversations_select_participant" on public.conversations
  for select using (user_a = auth.uid() or user_b = auth.uid());

drop policy if exists "conversations_insert_participant" on public.conversations;
create policy "conversations_insert_participant" on public.conversations
  for insert with check (auth.uid() is not null and (user_a = auth.uid() or user_b = auth.uid()));

-- No update/delete policy on purpose — conversations are immutable
-- after creation, same as they were in PocketBase (updateRule/deleteRule
-- were both null there too).

-- ============================================================
-- 9. chat_messages
-- ============================================================
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation uuid not null references public.conversations (id) on delete cascade,
  sender uuid not null references auth.users (id) on delete cascade,
  text text not null check (char_length(text) between 1 and 4000),
  created timestamptz not null default now(),
  updated timestamptz not null default now()
);

create index if not exists idx_chat_messages_conversation on public.chat_messages (conversation);

alter table public.chat_messages enable row level security;

drop policy if exists "chat_messages_select_participant" on public.chat_messages;
create policy "chat_messages_select_participant" on public.chat_messages
  for select using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation and (c.user_a = auth.uid() or c.user_b = auth.uid())
    )
  );

drop policy if exists "chat_messages_insert_participant" on public.chat_messages;
create policy "chat_messages_insert_participant" on public.chat_messages
  for insert with check (
    sender = auth.uid()
    and exists (
      select 1 from public.conversations c
      where c.id = conversation and (c.user_a = auth.uid() or c.user_b = auth.uid())
    )
  );

-- No update/delete policy on purpose — same as PocketBase (null rules).

-- Enable realtime broadcasts for the chat thread screen (guarded so
-- re-running this script doesn't error if it's already added).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'chat_messages'
  ) then
    alter publication supabase_realtime add table public.chat_messages;
  end if;
end $$;
