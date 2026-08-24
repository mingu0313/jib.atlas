-- "집 아틀라스" — 실제 내 집 사진을 올려 다른 유저와 공유하는 공개 갤러리.
-- Supabase 대시보드 SQL Editor에서 실행하세요.

create table if not exists public.house_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  caption text not null default '',
  -- 작성 시점 진단 결과 스냅샷(선택) — 진단을 안 받았으면 전부 null.
  -- 나중에 재진단해도 이 게시물 배지는 그대로 남는다(등록 당시 기록이므로).
  template_id text,
  template_name text,
  persona_name text,
  rarity_tier text,
  like_count int not null default 0,
  comment_count int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.house_photos (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.house_posts(id) on delete cascade,
  storage_path text not null,
  sort_order int not null default 0
);

create table if not exists public.house_likes (
  post_id uuid not null references public.house_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists public.house_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.house_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists house_photos_post_id_idx on public.house_photos(post_id);
create index if not exists house_likes_post_id_idx on public.house_likes(post_id);
create index if not exists house_comments_post_id_idx on public.house_comments(post_id);
create index if not exists house_posts_created_at_idx on public.house_posts(created_at desc);

alter table public.house_posts enable row level security;
alter table public.house_photos enable row level security;
alter table public.house_likes enable row level security;
alter table public.house_comments enable row level security;

-- 갤러리라 읽기는 로그인 여부와 무관하게 전부 공개.
-- 아래 모든 create policy는 (재실행해도 안전하도록) 먼저 drop policy if exists로
-- 지우고 다시 만든다 — SQL Editor가 "Backend error"로 중간에 끊긴 뒤 재실행해도
-- "policy already exists" 에러 없이 그대로 다시 돌릴 수 있다.
drop policy if exists "house_posts public read" on public.house_posts;
create policy "house_posts public read" on public.house_posts for select using (true);
drop policy if exists "house_photos public read" on public.house_photos;
create policy "house_photos public read" on public.house_photos for select using (true);
drop policy if exists "house_likes public read" on public.house_likes;
create policy "house_likes public read" on public.house_likes for select using (true);
drop policy if exists "house_comments public read" on public.house_comments;
create policy "house_comments public read" on public.house_comments for select using (true);

drop policy if exists "house_posts own insert" on public.house_posts;
create policy "house_posts own insert" on public.house_posts
  for insert with check (auth.uid() = user_id);
drop policy if exists "house_posts own update" on public.house_posts;
create policy "house_posts own update" on public.house_posts
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "house_posts own delete" on public.house_posts;
create policy "house_posts own delete" on public.house_posts
  for delete using (auth.uid() = user_id);

-- house_photos는 자체 user_id가 없어서, 속한 post의 주인인지로 판단한다.
drop policy if exists "house_photos own insert" on public.house_photos;
create policy "house_photos own insert" on public.house_photos
  for insert with check (
    exists (select 1 from public.house_posts p where p.id = post_id and p.user_id = auth.uid())
  );
drop policy if exists "house_photos own delete" on public.house_photos;
create policy "house_photos own delete" on public.house_photos
  for delete using (
    exists (select 1 from public.house_posts p where p.id = post_id and p.user_id = auth.uid())
  );

drop policy if exists "house_likes own insert" on public.house_likes;
create policy "house_likes own insert" on public.house_likes
  for insert with check (auth.uid() = user_id);
drop policy if exists "house_likes own delete" on public.house_likes;
create policy "house_likes own delete" on public.house_likes
  for delete using (auth.uid() = user_id);

drop policy if exists "house_comments own insert" on public.house_comments;
create policy "house_comments own insert" on public.house_comments
  for insert with check (auth.uid() = user_id);
drop policy if exists "house_comments own delete" on public.house_comments;
create policy "house_comments own delete" on public.house_comments
  for delete using (auth.uid() = user_id);

-- 좋아요/댓글 수는 매번 count() 쿼리 대신 house_posts에 캐시해두고 트리거로 맞춘다.
create or replace function public.house_posts_bump_like_count()
returns trigger as $$
begin
  if (tg_op = 'INSERT') then
    update public.house_posts set like_count = like_count + 1 where id = new.post_id;
    return new;
  elsif (tg_op = 'DELETE') then
    update public.house_posts set like_count = greatest(like_count - 1, 0) where id = old.post_id;
    return old;
  end if;
  return null;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists house_likes_count on public.house_likes;
create trigger house_likes_count
  after insert or delete on public.house_likes
  for each row execute function public.house_posts_bump_like_count();

create or replace function public.house_posts_bump_comment_count()
returns trigger as $$
begin
  if (tg_op = 'INSERT') then
    update public.house_posts set comment_count = comment_count + 1 where id = new.post_id;
    return new;
  elsif (tg_op = 'DELETE') then
    update public.house_posts set comment_count = greatest(comment_count - 1, 0) where id = old.post_id;
    return old;
  end if;
  return null;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists house_comments_count on public.house_comments;
create trigger house_comments_count
  after insert or delete on public.house_comments
  for each row execute function public.house_posts_bump_comment_count();

-- Storage: 집 사진 전용 공개 버킷. 경로는 항상 "{user_id}/{uuid}.jpg"로 올린다
-- (아래 정책이 첫 폴더 세그먼트 = 본인 uid인지로 쓰기 권한을 검사하기 때문).
insert into storage.buckets (id, name, public)
values ('house-photos', 'house-photos', true)
on conflict (id) do nothing;

drop policy if exists "house-photos public read" on storage.objects;
create policy "house-photos public read" on storage.objects
  for select using (bucket_id = 'house-photos');

drop policy if exists "house-photos own insert" on storage.objects;
create policy "house-photos own insert" on storage.objects
  for insert with check (
    bucket_id = 'house-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "house-photos own delete" on storage.objects;
create policy "house-photos own delete" on storage.objects
  for delete using (
    bucket_id = 'house-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
