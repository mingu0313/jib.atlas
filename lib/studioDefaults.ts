import { pickTopAxesByExtremity, simpleBand } from "./axisUtils";
import type { RoomShapeId } from "./roomBuilderStore";
import { WALL_COLOR_PRESETS } from "./roomStyle";
import type { Axis, HouseTemplate } from "./types";

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
 * 5축 중 그 템플릿에서 가장 두드러진(중립 50에서 가장 먼) 축 하나 — 그
 * 축의 high/low 밴드에 따라 ROOM_SHAPE_PRESETS(roomBuilderStore.ts) 7종 중
 * 하나를 고른다. lib/persona.ts가 캐릭터 이름을 지을 때 쓰는 것과 같은
 * pickTopAxesByExtremity/simpleBand를 그대로 재사용한다 — "이 타입을
 * 가장 잘 설명하는 축이 뭔가"라는 같은 질문이라 로직도 같아야 한다.
 *
 * high 쪽만 형태가 뚜렷하고(정사각형/안뜰형/L자형/잘라내기/T자형), low
 * 쪽은 그 축이 딱히 안 두드러진다는 뜻이라 대부분 무난한 직사각형으로
 * 수렴한다 — 미니멀 low(=맥시멀리스트다움)만 예외로 "경사진" 다락방형을
 * 준다(물건 잔뜩 쌓인 빈티지/로프트 타입엔 반듯한 상자보다 그쪽이 더
 * 어울린다고 판단).
 */
function shapeForAxis(axis: Axis, band: "high" | "low"): RoomShapeId {
  switch (axis) {
    case "minimalism":
      return band === "high" ? "square" : "angled"; // 미니멀=군더더기 없는 원룸형 / 맥시멀=다락방형
    case "nature":
      return band === "high" ? "ushape" : "rectangle"; // 자연친화=가운데 마당이 있는 안뜰형
    case "sociability":
      return band === "high" ? "lshape" : "rectangle"; // 사교적=거실+주방 분리형(손님 응대)
    case "openness":
      return band === "high" ? "clippedCorner" : "rectangle"; // 개방적=모서리를 비스듬히 자른 독특한 형태
    case "activity":
      return band === "high" ? "tshape" : "rectangle"; // 활동적=넓은 거실+돌출 복도형
    default:
      return "rectangle";
  }
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
  const { minimalism, sociability, nature, activity } = template.scoreProfile;

  const [primaryAxis] = pickTopAxesByExtremity(template.scoreProfile, 1);
  const roomShape: RoomShapeId = shapeForAxis(primaryAxis, simpleBand(template.scoreProfile[primaryAxis]));

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
