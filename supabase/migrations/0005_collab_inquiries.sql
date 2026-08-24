-- 부유형 내비 "협업 문의" 모달에서 들어오는 문의를 저장한다. 로그인 없이
-- 누구나 제출할 수 있어야 해서 insert만 공개하고, 읽기는 정책을 아예 안
-- 준다(기본 거부) — 대시보드(Table Editor)는 서비스 role로 RLS를 우회해서
-- 보이니 문의 확인은 거기서 한다. Supabase 대시보드 SQL Editor에서
-- 실행하세요. 재실행해도 안전합니다.

create table if not exists public.collab_inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  created_at timestamptz not null default now()
);

create index if not exists collab_inquiries_created_at_idx on public.collab_inquiries(created_at desc);

alter table public.collab_inquiries enable row level security;

drop policy if exists "collab_inquiries public insert" on public.collab_inquiries;
create policy "collab_inquiries public insert" on public.collab_inquiries
  for insert with check (true);
