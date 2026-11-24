-- جدول عناوين الزبائن. شغّل هذا الملف مرة وحدة في Supabase: SQL Editor ثم New query ثم Run.
-- كل زبون يشوف ويعدّل عناوينه بس، بفضل سياسات RLS.

create table if not exists public.addresses (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null,
  country text not null,
  path jsonb not null default '[]'::jsonb,
  fields jsonb not null default '{}'::jsonb,
  phone text,
  recipient text,
  created_at timestamptz not null default now()
);

alter table public.addresses enable row level security;

drop policy if exists "own addresses select" on public.addresses;
drop policy if exists "own addresses insert" on public.addresses;
drop policy if exists "own addresses update" on public.addresses;
drop policy if exists "own addresses delete" on public.addresses;

create policy "own addresses select" on public.addresses
  for select using (auth.uid() = user_id);
create policy "own addresses insert" on public.addresses
  for insert with check (auth.uid() = user_id);
create policy "own addresses update" on public.addresses
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own addresses delete" on public.addresses
  for delete using (auth.uid() = user_id);

-- طريقة الدفع تنحفظ داخل حقل contact في جدول orders (لا يحتاج عمود جديد)
