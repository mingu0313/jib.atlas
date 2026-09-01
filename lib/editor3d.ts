/**
 * 룸 에디터 3D 뷰(components/studio/RoomStudioScene3D.tsx)가 쓰는 배율 상수.
 *
 * STEP 12에서는 lib/iso.ts의 고정 격자(RW×RD, 벽높이 WH)를 그대로 미터로
 * 옮겼지만, STEP 13부터는 방 구조 자체가 하우스 타입마다 달라져서 방
 * 크기·벽 위치를 여기서 상수로 고정해두지 않는다. 남는 건 두 층위의
 * 배율뿐이다: 타일 하나가 실제로 몇 미터인지(TILE_M), 가구 h 필드가
 * 몇 미터인지(HEIGHT_SCALE). lib/iso.ts(SVG 아이소메트릭)는 완전히
 * 별개 좌표계라 이 상수들과 무관하다 — 랜딩 히어로 미니 창·공유 카드·
 * 아틀라스 카드는 계속 그쪽을 쓴다.
 *
 * 배율은 눈으로 맞춘 근사치다(w=3,d=1 소파가 실제 3인 소파 폭 200cm대와
 * 비슷하게, 옷장(h=88)이 실제 옷장 높이 2m 안팎으로 보이도록). cm 단위
 * 실측값은 아니다. 실제 제품 데이터(IsoFurnitureDef.modelUrl 등,
 * lib/types.ts 참고)가 들어오면 그 제품의 실측 치수로 개별 정밀화한다.
 */
export const TILE_M = 0.7;
export const HEIGHT_SCALE = 0.023;
