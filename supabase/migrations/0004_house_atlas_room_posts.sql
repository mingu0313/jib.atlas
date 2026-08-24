-- 집 아틀라스 콜드스타트 해결 — 실사진 없이도 에디터에서 꾸민 방을
-- 한 번의 클릭으로 지도에 올릴 수 있게 한다. room_items가 채워져 있으면
-- "방 미리보기" 게시물(아이소메트릭 SVG 렌더링), 비어있으면 기존처럼
-- house_photos의 실사진 게시물이다. 0002/0003 다음에 실행하세요.
-- Supabase 대시보드 SQL Editor에서 직접 실행해야 적용됩니다.

alter table public.house_posts
  add column if not exists room_items jsonb;
