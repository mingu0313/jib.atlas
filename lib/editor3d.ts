import { RD, RW, WH } from "./iso";

/**
 * 룸 에디터 3D 뷰(components/EditorScene3D.tsx)의 좌표계 — STEP 12.
 * lib/iso.ts와 같은 격자(RW×RD 타일, 벽 높이 WH)를 그대로 공유하되, SVG
 * 아이소메트릭 투영식(ixy/up) 대신 실제 미터 단위 three.js 씬으로 옮긴다.
 * lib/iso.ts·components/EditorCanvas.tsx(SVG)는 랜딩 히어로 미니 창·공유
 * 카드·아틀라스 카드가 계속 쓰고 있어 그대로 두고 건드리지 않는다.
 *
 * 배율(TILE_M/HEIGHT_SCALE)은 눈으로 맞춘 근사치다 — 예를 들어 소파
 * (w=3,d=1)가 실제 3인 소파 폭 200cm대와 비슷하게, 옷장(h=88)이 실제
 * 옷장 높이 2m 안팎으로 보이도록 손으로 조정했다. cm 단위 실측값은 아니다.
 * 실제 제품 데이터(IsoFurnitureDef.modelUrl 등, lib/types.ts 참고)가 들어오면
 * 그 제품의 GLTF를 이 좌표계 위에 실측 치수로 올리는 식으로 정밀화한다.
 */
export const TILE_M = 0.7;
export const HEIGHT_SCALE = 0.023;

export const ROOM_W = RW * TILE_M;
export const ROOM_D = RD * TILE_M;
export const ROOM_H = WH * HEIGHT_SCALE;

export { RD, RW };
