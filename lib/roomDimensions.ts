import type { Point, RoomShapeId } from "./roomBuilderStore";

export type RoomUnit = "cm" | "ft";

export const CM_PER_FT = 30.48;
export const MIN_DIMENSION_CM = 150;
export const MAX_DIMENSION_CM = 1500;
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

const SQUARE_FIELDS: DimensionField[] = [
  { id: "side", label: "한 변", min: MIN_DIMENSION_CM, max: MAX_DIMENSION_CM },
];
const RECTANGLE_FIELDS: DimensionField[] = [
  { id: "width", label: "가로", min: MIN_DIMENSION_CM, max: MAX_DIMENSION_CM },
  { id: "depth", label: "깊이", min: MIN_DIMENSION_CM, max: MAX_DIMENSION_CM },
];
const LSHAPE_FIELDS: DimensionField[] = [
  { id: "mainWidth", label: "전체 가로", min: MIN_DIMENSION_CM, max: MAX_DIMENSION_CM },
  { id: "mainDepth", label: "전체 깊이", min: MIN_DIMENSION_CM, max: MAX_DIMENSION_CM },
  { id: "notchWidth", label: "잘린 폭", min: 50, max: MAX_DIMENSION_CM },
  { id: "notchDepth", label: "잘린 깊이", min: 50, max: MAX_DIMENSION_CM },
];

/**
 * 프리셋별로 노출할 치수 입력 필드. "정사각형"은 가로/세로를 따로 두면
 * 더 이상 정사각형이 아니게 돼서(직사각형 프리셋과 의미가 겹침) 한 변만
 * 조정하게 잠갔다.
 */
export function getDimensionFields(shape: RoomShapeId): DimensionField[] {
  if (shape === "square") return SQUARE_FIELDS;
  if (shape === "rectangle") return RECTANGLE_FIELDS;
  return LSHAPE_FIELDS;
}

/**
 * 현재 polygon에서 프리셋별 치수 값(cm)을 역산한다. buildPolygon()의
 * 역함수 — 두 함수는 항상 같은 점 순서 규약(STEP 11 lib/roomBuilderStore.ts
 * 주석 참고)을 공유해야 한다.
 */
export function readDimensions(shape: RoomShapeId, polygon: Point[]): Record<string, number> {
  if (shape === "square") {
    return { side: polygon[1].x - polygon[0].x };
  }
  if (shape === "rectangle") {
    return { width: polygon[1].x - polygon[0].x, depth: polygon[2].z - polygon[1].z };
  }
  // lshape: (0,0) (mainW-notchW,0) (mainW-notchW,notchD) (mainW,notchD) (mainW,mainD) (0,mainD)
  return {
    mainWidth: polygon[4].x - polygon[0].x,
    mainDepth: polygon[4].z - polygon[0].z,
    notchWidth: polygon[4].x - polygon[1].x,
    notchDepth: polygon[2].z - polygon[1].z,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * dims(치수 값, cm)로부터 프리셋 topology에 맞는 polygon을 다시 만든다.
 * 범위 밖 값은 여기서 clamp하기 때문에, 호출부(입력창)는 타이핑 도중의
 * 값을 clamp 없이 그대로 넘겨도 안전하다.
 */
export function buildPolygon(shape: RoomShapeId, dims: Record<string, number>): Point[] {
  if (shape === "square") {
    const side = clamp(dims.side ?? MIN_DIMENSION_CM, MIN_DIMENSION_CM, MAX_DIMENSION_CM);
    return [
      { x: 0, z: 0 },
      { x: side, z: 0 },
      { x: side, z: side },
      { x: 0, z: side },
    ];
  }
  if (shape === "rectangle") {
    const width = clamp(dims.width ?? MIN_DIMENSION_CM, MIN_DIMENSION_CM, MAX_DIMENSION_CM);
    const depth = clamp(dims.depth ?? MIN_DIMENSION_CM, MIN_DIMENSION_CM, MAX_DIMENSION_CM);
    return [
      { x: 0, z: 0 },
      { x: width, z: 0 },
      { x: width, z: depth },
      { x: 0, z: depth },
    ];
  }
  const mainWidth = clamp(dims.mainWidth ?? MIN_DIMENSION_CM, MIN_DIMENSION_CM, MAX_DIMENSION_CM);
  const mainDepth = clamp(dims.mainDepth ?? MIN_DIMENSION_CM, MIN_DIMENSION_CM, MAX_DIMENSION_CM);
  // 잘린 폭/깊이는 각 변의 절반을 못 넘게 — 노치가 방 전체를 삼켜 폴리곤이
  // 무너지는 걸 막는다(예: notchWidth가 mainWidth에 근접하면 위쪽 변이 사라짐).
  const notchWidth = clamp(dims.notchWidth ?? 50, 50, mainWidth / 2);
  const notchDepth = clamp(dims.notchDepth ?? 50, 50, mainDepth / 2);
  return [
    { x: 0, z: 0 },
    { x: mainWidth - notchWidth, z: 0 },
    { x: mainWidth - notchWidth, z: notchDepth },
    { x: mainWidth, z: notchDepth },
    { x: mainWidth, z: mainDepth },
    { x: 0, z: mainDepth },
  ];
}
