/** STEP 13 — 문/창문 표준 사이즈, 벽 색상·바닥 스타일 프리셋. */

export interface DoorPreset {
  id: string;
  label: string;
  widthCm: number;
  heightCm: number;
}

export interface WindowPreset {
  id: string;
  label: string;
  widthCm: number;
  heightCm: number;
  /** 창턱 높이(바닥 기준) — 벽에서 창문이 시작되는 높이. */
  sillHeightCm: number;
}

export const DOOR_PRESETS: DoorPreset[] = [
  { id: "door-80", label: "여닫이문 80cm", widthCm: 80, heightCm: 200 },
  { id: "door-90", label: "여닫이문 90cm", widthCm: 90, heightCm: 200 },
  { id: "door-slide-120", label: "슬라이딩 도어 120cm", widthCm: 120, heightCm: 210 },
];

export const WINDOW_PRESETS: WindowPreset[] = [
  { id: "window-60", label: "소형 창 60×100", widthCm: 60, heightCm: 100, sillHeightCm: 100 },
  { id: "window-120", label: "일반 창 120×100", widthCm: 120, heightCm: 100, sillHeightCm: 90 },
  { id: "window-180", label: "대형 창 180×120", widthCm: 180, heightCm: 120, sillHeightCm: 70 },
];

export interface WallColorPreset {
  id: string;
  label: string;
  hex: string;
}

/** 특정 하우스 타입에 안 묶인 중립 팔레트(STEP 15 요구사항) — 실제
 * app/globals.css 올리브/세이지 톤과 어울리는 페인트 색 6가지. 첫 번째
 * (웜 화이트)가 /studio 기본값이다. */
export const WALL_COLOR_PRESETS: WallColorPreset[] = [
  { id: "warm-white", label: "웜 화이트", hex: "#F3F1EA" },
  { id: "greige", label: "그레이지", hex: "#D9D2C4" },
  { id: "sage", label: "세이지", hex: "#C9D3A8" },
  { id: "deep-olive", label: "딥 올리브", hex: "#6B6A4E" },
  { id: "terracotta", label: "테라코타", hex: "#C57A57" },
  { id: "charcoal", label: "차콜", hex: "#3A382F" },
];

export interface FloorStylePreset {
  id: string;
  label: string;
  base: string;
  accent: string;
  pattern: "wood" | "tile" | "carpet";
}

/** 실제 텍스처 이미지 대신 base/accent 두 색으로 카드 썸네일·3D 바닥을
 * 근사한다(질감 사진 에셋을 새로 안 늘리려고 — CSS/three.js 색상만으로
 * 구현). 첫 번째(원목)가 /studio 기본값. */
export const FLOOR_STYLE_PRESETS: FloorStylePreset[] = [
  { id: "oak", label: "원목 마루", base: "#C9A876", accent: "#B08F5E", pattern: "wood" },
  { id: "walnut", label: "다크 원목", base: "#7A5A3C", accent: "#644A31", pattern: "wood" },
  { id: "tile-light", label: "라이트 타일", base: "#E7E3D9", accent: "#CFCABC", pattern: "tile" },
  { id: "carpet", label: "카펫", base: "#B7A99A", accent: "#A0917F", pattern: "carpet" },
];

export const DEFAULT_WALL_COLOR_HEX = WALL_COLOR_PRESETS[0].hex;
export const DEFAULT_FLOOR_STYLE_ID = FLOOR_STYLE_PRESETS[0].id;
