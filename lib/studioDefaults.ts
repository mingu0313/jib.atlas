import type { RoomShapeId } from "./roomBuilderStore";
import { WALL_COLOR_PRESETS } from "./roomStyle";
import type { HouseTemplate } from "./types";

export interface StudioDefaults {
  roomShape: RoomShapeId;
  wallColorHex: string;
  floorStyleId: string;
}

function hexOf(colorId: string): string {
  return WALL_COLOR_PRESETS.find((p) => p.id === colorId)?.hex ?? WALL_COLOR_PRESETS[0].hex;
}

/**
 * 진단으로 매칭된 하우스 타입의 5축 점수(scoreProfile)로 `/studio` 진입 시
 * 기본 모양·벽색·바닥을 고른다. house-templates.json 30종 각각에 손으로
 * 디자인해 정해준 값이 아니라 축 점수 기반 휴리스틱이다 — "이 타입엔 왜
 * 이 색인가"에 근거가 있고, 나중에 실제 디자인 검수가 들어오면 이 함수
 * 안 로직만 타입별 하드코딩 매핑으로 바꾸면 된다(시그니처는 그대로라
 * 호출부 — app/studio/page.tsx — 는 안 건드려도 됨).
 */
export function getStudioDefaults(template: HouseTemplate): StudioDefaults {
  const { minimalism, sociability, openness, nature, activity } = template.scoreProfile;

  // 모양: 미니멀 성향이 강하면 군더더기 없는 정사각형, 사교적이거나
  // 개방적이면 거실+주방을 나눠 손님 응대에 유리한 L자형, 나머지는 무난한
  // 직사각형.
  const roomShape: RoomShapeId =
    minimalism >= 65 ? "square" : sociability >= 60 || openness >= 60 ? "lshape" : "rectangle";

  // 벽 색상: 자연친화 > 미니멀 > 활동성 > 사교성 순으로 가장 두드러진
  // 성향 하나를 골라 그에 맞는 톤을 준다.
  const wallColorHex = hexOf(
    nature >= 60
      ? "sage"
      : minimalism >= 65
        ? "charcoal"
        : activity >= 60
          ? "terracotta"
          : sociability >= 60
            ? "deep-olive"
            : "warm-white",
  );

  // 바닥: 자연친화는 원목, 미니멀은 깔끔한 타일, 활동적이면 관리 편한
  // 다크 원목, 나머지는 카펫.
  const floorStyleId = nature >= 60 ? "oak" : minimalism >= 65 ? "tile-light" : activity >= 60 ? "walnut" : "carpet";

  return { roomShape, wallColorHex, floorStyleId };
}
