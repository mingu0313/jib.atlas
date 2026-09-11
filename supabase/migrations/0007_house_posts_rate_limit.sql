-- 게시물 스팸 방지 — 한 유저가 24시간 안에 올릴 수 있는 house_posts 개수를
-- 제한한다. 인스타그램 공유 전 검토에서 나온 이슈: 로그인만 하면 게시물
-- 개수 자체엔 제한이 없어서(게시물당 사진 6장 제한만 있음) 계정 하나로
-- 무한정 도배가 가능했다.
--
-- 클라이언트(app/atlas/new/page.tsx·app/en/atlas/new/page.tsx·
-- components/studio/ShareToAtlasButton.tsx) 세 곳 모두 브라우저 Supabase
-- client로 직접 insert하기 때문에, 그쪽 코드에서만 개수를 세서 막으면
-- API를 직접 호출해 우회할 수 있다 — 그래서 실제 방어선은 DB 트리거로
-- 둔다(0002_house_atlas.sql의 like/comment count 트리거와 같은 패턴).
-- 세 진입점 다 같은 house_posts 테이블에 insert하므로 트리거 하나로 전부 막힌다.
--
-- Supabase 대시보드 SQL Editor에서 실행하세요.

-- 24시간 안에 이만큼 넘게 올리면 막는다. 진짜 유저가 방을 여러 번
-- 고쳐 다시 올리는 정도는 넉넉히 감안한 값 — 스팸 도배만 막는 게 목적이라
-- 너무 빡빡하게 잡지 않았다.
create or replace function public.house_posts_enforce_rate_limit()
returns trigger as $$
declare
  recent_count int;
begin
  select count(*) into recent_count
  from public.house_posts
  where user_id = new.user_id
    and created_at > now() - interval '24 hours';

  -- 메시지는 고정 접두사(RATE_LIMIT_EXCEEDED)로 시작한다 — 클라이언트가
  -- 이 문자열로 "그냥 실패"와 "레이트리밋 걸림"을 구분해서, 후자일 때만
  -- 전용 안내 문구를 보여준다(위 세 파일의 postErr.message 체크 참고).
  if recent_count >= 5 then
    raise exception 'RATE_LIMIT_EXCEEDED: 24시간 내 게시물 5개 제한';
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists house_posts_rate_limit on public.house_posts;
create trigger house_posts_rate_limit
  before insert on public.house_posts
  for each row execute function public.house_posts_enforce_rate_limit();
