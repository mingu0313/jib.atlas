-- 집 아틀라스 댓글 삭제 권한 확장 — 댓글 작성자 본인뿐 아니라, 그 댓글이 달린
-- 게시물의 주인도 자기 게시물의 댓글을 지울 수 있게 한다(기본 모더레이션).
-- 0002_house_atlas.sql 다음에 실행하세요. Supabase 대시보드 SQL Editor에서
-- 직접 실행해야 적용됩니다 — 재실행해도 안전합니다(drop policy if exists).

drop policy if exists "house_comments own delete" on public.house_comments;
drop policy if exists "house_comments own or post owner delete" on public.house_comments;

create policy "house_comments own or post owner delete" on public.house_comments
  for delete using (
    auth.uid() = user_id
    or exists (
      select 1 from public.house_posts p
      where p.id = post_id and p.user_id = auth.uid()
    )
  );
