import type { Point, RoomShapeId } from "./roomBuilderStore";

export type RoomUnit = "cm" | "ft";

export const CM_PER_FT = 30.48;
export const MIN_DIMENSION_CM = 20;
export const MAX_DIMENSION_CM = 1000;
export const MIN_WALL_HEIGHT_CM = 200;
export const MAX_WALL_HEIGHT_CM = 400;
export const DEFAULT_WALL_HEIGHT_CM = 240;

export function cmToFt(cm: number): number {
  return cm / CM_PER_FT;
}

export function ftToCm(ft: number): number {
  return ft * CM_PER_FT;
}

/**
 * 표시용 반올림 — cm은 정수, ft는 소수 첫째자리(예: "13.1"). 저장(store)은
 * 항상 cm 그대로라 이 반올림이 원본 값을 훼손하지 않는다: 단위 토글은
 * 화면에 보여주는 숫자만 바꾸고 roomPolygon(cm)은 그대로 둔다.
 */
export function formatLength(cm: number, unit: RoomUnit): string {
  return unit === "cm" ? String(Math.round(cm)) : cmToFt(cm).toFixed(1);
}

/** 입력창에 사용자가 타이핑한 문자열(현재 unit 기준)을 cm 숫자로 되돌린다.
 * 파싱 실패면 null(빈 문자열, "-"처럼 아직 입력 중인 값 포함). */
export function parseLengthInput(raw: string, unit: RoomUnit): number | null {
  const n = Number(raw);
  if (raw.trim() === "" || !Number.isFinite(n)) return null;
  return unit === "cm" ? n : ftToCm(n);
}

export interface DimensionField {
  id: string;
  label: string;
  min: number; // cm
  max: number; // cm
}

function field(id: string, label: string): DimensionField {
  return { id, label, min: MIN_DIMENSION_CM, max: MAX_DIMENSION_CM };
}

const SQUARE_FIELDS: DimensionField[] = [field("side", "한 변")];
const RECTANGLE_FIELDS: DimensionField[] = [field("width", "가로"), field("depth", "깊이")];
const CLIPPED_CORNER_FIELDS: DimensionField[] = [field("width", "가로"), field("depth", "깊이"), field("cut", "잘린 모서리")];
const LSHAPE_FIELDS: DimensionField[] = [
  field("mainWidth", "전체 가로"),
  field("mainDepth", "전체 깊이"),
  field("notchWidth", "잘린 폭"),
  field("notchDepth", "잘린 깊이"),
];
const TSHAPE_FIELDS: DimensionField[] = [
  field("mainWidth", "전체 가로"),
  field("barDepth", "위쪽 바 깊이"),
  field("stemWidth", "돌출부 폭"),
  field("stemDepth", "돌출부 깊이"),
];
const USHAPE_FIELDS: DimensionField[] = [
  field("mainWidth", "전체 가로"),
  field("mainDepth", "전체 깊이"),
  field("notchWidth", "안뜰 폭"),
  field("notchDepth", "안뜰 깊이"),
];
const ANGLED_FIELDS: DimensionField[] = [field("width", "가로"), field("depth", "깊이"), field("slope", "경사 깊이")];

/**
 * 프리셋별로 노출할 치수 입력 필드. "정사각형"은 가로/세로를 따로 두면
 * 더 이상 정사각형이 아니게 돼서(직사각형 프리셋과 의미가 겹침) 한 변만
 * 조정하게 잠갔다.
 */
export function getDimensionFields(shape: RoomShapeId): DimensionField[] {
  switch (shape) {
    case "square":
      return SQUARE_FIELDS;
    case "rectangle":
      return RECTANGLE_FIELDS;
    case "clippedCorner":
      return CLIPPED_CORNER_FIELDS;
    case "lshape":
      return LSHAPE_FIELDS;
    case "tshape":
      return TSHAPE_FIELDS;
    case "ushape":
      return USHAPE_FIELDS;
    case "angled":
      return ANGLED_FIELDS;
  }
}

/**
 * 현재 polygon에서 프리셋별 치수 값(cm)을 역산한다. buildPolygon()의
 * 역함수 — 두 함수는 항상 같은 점 순서 규약(lib/roomBuilderStore.ts
 * ROOM_SHAPE_PRESETS 주석)을 공유해야 한다.
 */
export function readDimensions(shape: RoomShapeId, polygon: Point[]): Record<string, number> {
  switch (shape) {
    case "square":
      return { side: polygon[1].x - polygon[0].x };
    case "rectangle":
      return { width: polygon[1].x - polygon[0].x, depth: polygon[2].z - polygon[1].z };
    case "clippedCorner":
      // (0,0) (W-C,0) (W,C) (W,D) (0,D)
      return { width: polygon[2].x, depth: polygon[3].z, cut: polygon[2].z };
    case "lshape":
      // (0,0) (mainW-notchW,0) (mainW-notchW,notchD) (mainW,notchD) (mainW,mainD) (0,mainD)
      return {
        mainWidth: polygon[4].x - polygon[0].x,
        mainDepth: polygon[4].z - polygon[0].z,
        notchWidth: polygon[4].x - polygon[1].x,
        notchDepth: polygon[2].z - polygon[1].z,
      };
    case "tshape":
      // (0,0) (W,0) (W,B) ((W+SW)/2,B) ((W+SW)/2,B+SD) ((W-SW)/2,B+SD) ((W-SW)/2,B) (0,B)
      return {
        mainWidth: polygon[1].x,
        barDepth: polygon[2].z,
        stemWidth: polygon[3].x - polygon[6].x,
        stemDepth: polygon[4].z - polygon[3].z,
      };
    case "ushape":
      // (0,0) ((W-NW)/2,0) ((W-NW)/2,ND) ((W+NW)/2,ND) ((W+NW)/2,0) (W,0) (W,D) (0,D)
      return {
        mainWidth: polygon[5].x,
        mainDepth: polygon[6].z,
        notchWidth: polygon[3].x - polygon[2].x,
        notchDepth: polygon[2].z,
      };
    case "angled":
      // (0,0) (W,S) (W,D) (0,D)
      return { width: polygon[1].x, depth: polygon[2].z, slope: polygon[1].z };
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * dims(치수 값, cm)로부터 프리셋 topology에 맞는 polygon을 다시 만든다.
 * 범위 밖 값은 여기서 clamp하기 때문에, 호출부(입력창)는 타이핑 도중의
 * 값을 clamp 없이 그대로 넘겨도 안전하다. "잘린/돌출/노치" 종류의 부분
 * 필드는 전체 필드의 90%(또는 절반)를 못 넘게 추가로 clamp해서, 그
 * 부분이 방 전체를 삼켜 폴리곤이 무너지는 걸 막는다.
 */
export function buildPolygon(shape: RoomShapeId, dims: Record<string, number>): Point[] {
  const dim = (id: string, fallback = MIN_DIMENSION_CM) => clamp(dims[id] ?? fallback, MIN_DIMENSION_CM, MAX_DIMENSION_CM);

  switch (shape) {
    case "square": {
      const side = dim("side");
      return [
        { x: 0, z: 0 },
        { x: side, z: 0 },
        { x: side, z: side },
        { x: 0, z: side },
      ];
    }
    case "rectangle": {
      const width = dim("width");
      const depth = dim("depth");
      return [
        { x: 0, z: 0 },
        { x: width, z: 0 },
        { x: width, z: depth },
        { x: 0, z: depth },
      ];
    }
    case "clippedCorner": {
      const width = dim("width");
      const depth = dim("depth");
      const cut = clamp(dims.cut ?? MIN_DIMENSION_CM, MIN_DIMENSION_CM, Math.min(width, depth) * 0.9);
      return [
        { x: 0, z: 0 },
        { x: width - cut, z: 0 },
        { x: width, z: cut },
        { x: width, z: depth },
        { x: 0, z: depth },
      ];
    }
    case "lshape": {
      const mainWidth = dim("mainWidth");
      const mainDepth = dim("mainDepth");
      // 잘린 폭/깊이는 각 변의 절반을 못 넘게 — 노치가 방 전체를 삼켜
      // 폴리곤이 무너지는 걸 막는다.
      const notchWidth = clamp(dims.notchWidth ?? MIN_DIMENSION_CM, MIN_DIMENSION_CM, mainWidth / 2);
      const notchDepth = clamp(dims.notchDepth ?? MIN_DIMENSION_CM, MIN_DIMENSION_CM, mainDepth / 2);
      return [
        { x: 0, z: 0 },
        { x: mainWidth - notchWidth, z: 0 },
        { x: mainWidth - notchWidth, z: notchDepth },
        { x: mainWidth, z: notchDepth },
        { x: mainWidth, z: mainDepth },
        { x: 0, z: mainDepth },
      ];
    }
    case "tshape": {
      const mainWidth = dim("mainWidth");
      const barDepth = dim("barDepth");
      const stemWidth = clamp(dims.stemWidth ?? MIN_DIMENSION_CM, MIN_DIMENSION_CM, mainWidth * 0.9);
      const stemDepth = dim("stemDepth");
      const left = (mainWidth - stemWidth) / 2;
      const right = (mainWidth + stemWidth) / 2;
      return [
        { x: 0, z: 0 },
        { x: mainWidth, z: 0 },
        { x: mainWidth, z: barDepth },
        { x: right, z: barDepth },
        { x: right, z: barDepth + stemDepth },
        { x: left, z: barDepth + stemDepth },
        { x: left, z: barDepth },
        { x: 0, z: barDepth },
      ];
    }
    case "ushape": {
      const mainWidth = dim("mainWidth");
      const mainDepth = dim("mainDepth");
      const notchWidth = clamp(dims.notchWidth ?? MIN_DIMENSION_CM, MIN_DIMENSION_CM, mainWidth * 0.9);
      const notchDepth = clamp(dims.notchDepth ?? MIN_DIMENSION_CM, MIN_DIMENSION_CM, mainDepth * 0.9);
      const left = (mainWidth - notchWidth) / 2;
      const right = (mainWidth + notchWidth) / 2;
      return [
        { x: 0, z: 0 },
        { x: left, z: 0 },
        { x: left, z: notchDepth },
        { x: right, z: notchDepth },
        { x: right, z: 0 },
        { x: mainWidth, z: 0 },
        { x: mainWidth, z: mainDepth },
        { x: 0, z: mainDepth },
      ];
    }
    case "angled": {
      const width = dim("width");
      const depth = dim("depth");
      const slope = clamp(dims.slope ?? MIN_DIMENSION_CM, MIN_DIMENSION_CM, depth * 0.9);
      return [
        { x: 0, z: 0 },
        { x: width, z: slope },
        { x: width, z: depth },
        { x: 0, z: depth },
      ];
    }
  }
}

export interface DraggableEdge {
  /** getWallSegments(polygon)의 인덱스 — i번째 점 → i+1번째 점. */
  edgeIndex: number;
  /** 이 변을 드래그할 때 반응하는 좌표축(포인터의 x 또는 z를 읽는다). */
  axis: "x" | "z";
  fieldId: string;
  /** 포인터의 axis 좌표(cm) → 실제로 setDimension에 넘길 새 값. 대부분
   * 그대로 통과하지만(direct), L자형 notchWidth처럼 원점 안 닿는 변이
   * 없는 필드는 다른 필드(mainWidth 등)에서 역산해야 한다. */
  toFieldValue: (pointerCoord: number) => number;
}

/**
 * 평면도에서 "변을 직접 드래그해서 치수 바꾸기"에 쓰는 변→필드 매핑.
 * buildPolygon이 항상 원점(0,0)에 폴리곤을 고정해서 그리는 관례 덕분에,
 * 원점에 안 닿는 변은 "그 변이 놓인 좌표 = 그 필드의 cm 값" 그대로다
 * (direct). 예: 직사각형 오른쪽 변은 항상 x=width에 있으니, 그 변을
 * x=420으로 드래그하면 곧 width=420이 된다.
 *
 * 원점에 닿는 두 변은 이 트릭이 안 통해서(그 변을 옮기면 원점 자체가
 * 움직여야 함) 드래그 대상에서 뺐다. 대각선 변(잘라내기의 잘린 모서리,
 * 경사진의 경사)도 좌표축 하나만으로 못 나타내서 뺐다 — 그 두 값은
 * 숫자 입력으로만 바꾼다. "돌출부/노치 폭"처럼 자기 위치가 두 필드의
 * 차인 필드는 다른 필드(현재 dims)에서 역산한다(derived) — L자형
 * notchWidth와 같은 방식.
 */
export function getDraggableEdges(shape: RoomShapeId, dims: Record<string, number>): DraggableEdge[] {
  switch (shape) {
    case "square":
      return [
        { edgeIndex: 1, axis: "x", fieldId: "side", toFieldValue: (v) => v },
        { edgeIndex: 2, axis: "z", fieldId: "side", toFieldValue: (v) => v },
      ];
    case "rectangle":
      return [
        { edgeIndex: 1, axis: "x", fieldId: "width", toFieldValue: (v) => v },
        { edgeIndex: 2, axis: "z", fieldId: "depth", toFieldValue: (v) => v },
      ];
    case "clippedCorner":
      // e1(대각선)은 드래그 대상 밖 — "잘린 모서리"는 숫자 입력으로만.
      return [
        { edgeIndex: 2, axis: "x", fieldId: "width", toFieldValue: (v) => v },
        { edgeIndex: 3, axis: "z", fieldId: "depth", toFieldValue: (v) => v },
      ];
    case "lshape": {
      const mainWidth = dims.mainWidth ?? MIN_DIMENSION_CM;
      return [
        { edgeIndex: 1, axis: "x", fieldId: "notchWidth", toFieldValue: (v) => mainWidth - v },
        { edgeIndex: 2, axis: "z", fieldId: "notchDepth", toFieldValue: (v) => v },
        { edgeIndex: 3, axis: "x", fieldId: "mainWidth", toFieldValue: (v) => v },
        { edgeIndex: 4, axis: "z", fieldId: "mainDepth", toFieldValue: (v) => v },
      ];
    }
    case "tshape": {
      const mainWidth = dims.mainWidth ?? MIN_DIMENSION_CM;
      const barDepth = dims.barDepth ?? MIN_DIMENSION_CM;
      return [
        { edgeIndex: 1, axis: "x", fieldId: "mainWidth", toFieldValue: (v) => v },
        { edgeIndex: 2, axis: "z", fieldId: "barDepth", toFieldValue: (v) => v },
        { edgeIndex: 3, axis: "x", fieldId: "stemWidth", toFieldValue: (v) => 2 * v - mainWidth },
        { edgeIndex: 4, axis: "z", fieldId: "stemDepth", toFieldValue: (v) => v - barDepth },
        { edgeIndex: 6, axis: "z", fieldId: "barDepth", toFieldValue: (v) => v },
      ];
    }
    case "ushape": {
      const mainWidth = dims.mainWidth ?? MIN_DIMENSION_CM;
      return [
        { edgeIndex: 1, axis: "x", fieldId: "notchWidth", toFieldValue: (v) => mainWidth - 2 * v },
        { edgeIndex: 2, axis: "z", fieldId: "notchDepth", toFieldValue: (v) => v },
        { edgeIndex: 3, axis: "x", fieldId: "notchWidth", toFieldValue: (v) => 2 * v - mainWidth },
        { edgeIndex: 5, axis: "x", fieldId: "mainWidth", toFieldValue: (v) => v },
        { edgeIndex: 6, axis: "z", fieldId: "mainDepth", toFieldValue: (v) => v },
      ];
    }
    case "angled":
      // e0(대각선 전체 윗변)은 드래그 대상 밖 — "경사 깊이"는 숫자 입력으로만.
      return [
        { edgeIndex: 1, axis: "x", fieldId: "width", toFieldValue: (v) => v },
        { edgeIndex: 2, axis: "z", fieldId: "depth", toFieldValue: (v) => v },
      ];
  }
}
