import type { RoomShapeId } from "./roomBuilderStore";
import { WALL_COLOR_PRESETS } from "./roomStyle";
import type { HouseTemplate } from "./types";

export interface StudioDefaults {
  roomShape: RoomShapeId;
  wallColorHex: string;
  floorStyleId: string;
}

function hexOf(colorId: string): string {
  const preset = WALL_COLOR_PRESETS.find((p) => p.id === colorId);
  // WALL_COLOR_PRESETS 밖의 id를 넘기면(오타 등) 조용히 기본값(웜 화이트)으로
  // 빠지는 대신 개발 중엔 경고를 띄운다 — 실제로 "sage"/"charcoal"/
  // "deep-olive"라는, 이 배열에 없는 id를 넘겨서 30개 하우스 타입 중 25개가
  // 의도한 색과 상관없이 전부 웜 화이트로 조용히 깔리던 버그가 있었다.
  if (!preset && process.env.NODE_ENV !== "production") {
    console.warn(`[getStudioDefaults] "${colorId}"는 WALL_COLOR_PRESETS에 없는 id예요 — 기본값으로 대체됩니다.`);
  }
  return preset?.hex ?? WALL_COLOR_PRESETS[0].hex;
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
  // 성향 하나를 골라 그에 맞는 톤을 준다. id는 반드시 roomStyle.ts의
  // WALL_COLOR_PRESETS에 실제로 있는 것만 써야 한다 — "sage"/"charcoal"/
  // "deep-olive"처럼 그럴듯하지만 존재하지 않는 id를 썼다가 hexOf가 조용히
  // 기본값(웜 화이트)으로 대체해버려서, 30개 타입 중 25개가 벽 색이 전혀
  // 안 바뀌는 버그가 있었다(브랜드 올리브/세이지 톤과 안 겹치게 일부러
  // 뺀 중립 팔레트라 "sage" 자체가 원래 없다 — roomStyle.ts 주석 참고).
  // greige(그레이지)=자연친화의 흙빛 뉘앙스, dark-roast(다크 로스트)=
  // 미니멀의 짙고 차분한 느낌, mocha(모카)=사교적인 공간의 따뜻한 느낌으로
  // 기존 팔레트 안에서 가장 가까운 색을 골랐다.
  const wallColorHex = hexOf(
    nature >= 60
      ? "greige"
      : minimalism >= 65
        ? "dark-roast"
        : activity >= 60
          ? "terracotta"
          : sociability >= 60
            ? "mocha"
            : "warm-white",
  );

  // 바닥: 자연친화는 원목, 미니멀은 깔끔한 타일, 활동적이면 관리 편한
  // 다크 원목, 나머지는 카펫.
  const floorStyleId = nature >= 60 ? "oak" : minimalism >= 65 ? "tile-light" : activity >= 60 ? "walnut" : "carpet";

  return { roomShape, wallColorHex, floorStyleId };
}
