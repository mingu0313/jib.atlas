-- 인테리어 에디터의 가구 배치를 유저별로 저장하는 테이블.
-- Supabase 대시보드 SQL Editor에서 실행하세요.

create table if not exists public.editor_layouts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  template_id text not null,
  items jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.editor_layouts enable row level security;

create policy "own layout select" on public.editor_layouts
  for select using (auth.uid() = user_id);

create policy "own layout insert" on public.editor_layouts
  for insert with check (auth.uid() = user_id);

create policy "own layout update" on public.editor_layouts
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
