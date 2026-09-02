-- 집지도 — 룸빌더(/studio)로 만든 방을 공유할 수 있게, 원본 룸 데이터를
-- 저장할 컬럼을 추가한다.
--
-- room_items(0004_house_atlas_room_posts.sql, 옛 /editor의 col/row 격자
-- 기반 배치)와는 좌표계 자체가 다르다 — /studio는 임의 폴리곤 방 +
-- 자유 x/z(cm) 가구 좌표라 room_items 스키마로 못 담는다. 그래서 같은
-- 컬럼을 확장하지 않고 별도 컬럼을 새로 둔다.
--
-- room_items 게시물과 달리 이 컬럼이 채워진 게시물은 항상 house_photos에
-- 캡처 이미지(components/studio/RoomStudioScene3D.tsx의 CaptureBridge)도
-- 같이 올라간다 — 그래서 RoomIsoCard 같은 별도 SVG 렌더러가 필요 없고,
-- 일반 사진 게시물과 똑같이 보여주면 된다(구분은 뱃지만).
--
-- Supabase 대시보드 SQL Editor에서 직접 실행해야 적용됩니다.

alter table public.house_posts
  add column if not exists studio_room jsonb;
