import { create } from "zustand";
import { buildPolygon, DEFAULT_WALL_HEIGHT_CM, MAX_WALL_HEIGHT_CM, MIN_WALL_HEIGHT_CM, readDimensions, type RoomUnit } from "./roomDimensions";
import { clampOpeningOffset, getWallSegments, overlapsOtherOpening } from "./roomGeometry";
import { DEFAULT_FLOOR_STYLE_ID, DEFAULT_WALL_COLOR_HEX, DOOR_PRESETS, WINDOW_PRESETS } from "./roomStyle";

/** 평면 좌표(cm). x=가로, z=깊이 — y는 3D 높이축이라 평면 좌표엔 안 쓴다. */
export type Point = { x: number; z: number };

export type RoomShapeId = "square" | "rectangle" | "lshape";

export interface RoomShapePreset {
  id: RoomShapeId;
  label: string;
  /** 카드 서브텍스트 */
  helper: string;
  /** 시계방향, 첫 점은 원점(0,0). cm 단위. */
  defaultPolygon: Point[];
}

/**
 * STEP 11(정밀 룸빌더 1단계 — 방 모양·크기) — 프리셋 3종.
 *
 * 좌표는 처음부터 cm 단위로 저장한다 — STEP 12(치수 조정: ft/cm 토글, 내부는
 * cm 기준 통일)가 이 값을 그대로 스케일 조정할 수 있게, 기본값도 그때 쓸
 * 150~1500cm 범위 안으로 잡았다.
 *
 * L자형은 바운딩박스 500×450cm에서 우상단 200×200cm 모서리를 잘라낸
 * 6점 폴리곤이다 — 거실+주방이 분리된 구조를 흉내낸다. 점 순서를
 * (0,0)→(300,0)→(300,200)→(500,200)→(500,450)→(0,450)로 잡아둔 건, STEP 12에서
 * 변마다 이름(mainWidth/mainDepth/notchWidth/notchDepth)을 매길 때 각 변이
 * 어느 인접 점 쌍인지 바로 알아볼 수 있게 하기 위해서다.
 */
export const ROOM_SHAPE_PRESETS: RoomShapePreset[] = [
  {
    id: "square",
    label: "정사각형",
    helper: "군더더기 없는 원룸형",
    defaultPolygon: [
      { x: 0, z: 0 },
      { x: 400, z: 0 },
      { x: 400, z: 400 },
      { x: 0, z: 400 },
    ],
  },
  {
    id: "rectangle",
    label: "직사각형",
    helper: "가장 무난한 기본형",
    defaultPolygon: [
      { x: 0, z: 0 },
      { x: 500, z: 0 },
      { x: 500, z: 350 },
      { x: 0, z: 350 },
    ],
  },
  {
    id: "lshape",
    label: "L자형",
    helper: "거실+주방 분리형",
    defaultPolygon: [
      { x: 0, z: 0 },
      { x: 300, z: 0 },
      { x: 300, z: 200 },
      { x: 500, z: 200 },
      { x: 500, z: 450 },
      { x: 0, z: 450 },
    ],
  },
];

function presetById(id: RoomShapeId): RoomShapePreset {
  const preset = ROOM_SHAPE_PRESETS.find((p) => p.id === id);
  if (!preset) throw new Error(`room shape preset not found: ${id}`);
  return preset;
}

export type OpeningKind = "door" | "window";

/**
 * 벽에 배치된 문/창문 하나. 원 스펙은 doors[]/windows[]로 배열을 나누라고
 * 했지만, 실제로는 "어느 벽(wallIndex)의 어디(offsetCm)에 폭(widthCm)짜리
 * 무엇(kind)이 있는가"가 완전히 같은 모양이라 kind로 구분되는 단일 배열
 * (openings)로 합쳤다 — door/window 각각 별도의 추가·이동·삭제 로직을
 * 중복해서 만들지 않기 위해서다.
 */
export interface PlacedOpening {
  id: string;
  kind: OpeningKind;
  /** 배치할 때 고른 프리셋 id(lib/roomStyle.ts DOOR_PRESETS/WINDOW_PRESETS) —
   * width/height는 이미 이 프리셋 값을 복사해둔 거라 굳이 안 써도 되지만,
   * STEP 14 예산 계산이 "이게 정확히 어느 프리셋이었는지"로 단가를 찾을 때
   * widthCm 역매칭 없이 바로 조회하려고 남겨둔다. */
  presetId: string;
  wallIndex: number;
  /** 벽 시작점(getWallSegments 기준)부터 opening 중심까지 거리(cm). */
  offsetCm: number;
  widthCm: number;
  heightCm: number;
  /** 창문만 — 바닥에서 창턱까지 높이(cm). 문은 항상 바닥부터 시작(0). */
  sillHeightCm?: number;
}

interface RoomBuilderState {
  /** 선택된 프리셋 id. `/studio`는 특정 하우스 타입에 안 묶이는 독립
   * 경로라, 가장 무난한 "rectangle"을 기본값으로 시작한다. */
  roomShape: RoomShapeId;
  /** 현재 방 폴리곤(cm) — 항상 이 단위로만 저장한다(STEP 12). ft는 표시·
   * 입력 시에만 변환하고, 이 값 자체를 ft로 바꿔 들고 있지 않는다. */
  roomPolygon: Point[];
  /** 치수 입력창에 보여줄 단위. roomPolygon(cm)엔 영향 없음 — 화면 표시·
   * 입력 파싱에만 쓰인다(lib/roomDimensions.ts). */
  unit: RoomUnit;
  /** 천장 높이(cm) — 어떤 프리셋을 골라도 공통으로 갖는 값이라 폴리곤과
   * 별도 필드로 둔다. STEP 13의 문/창문 높이 제약에 쓰일 예정. */
  wallHeightCm: number;
  /** 프리셋 카드 선택 — 폴리곤을 그 프리셋의 기본값으로 즉시 교체한다. */
  selectShape: (id: RoomShapeId) => void;
  /** 치수 입력 필드 하나(예: "width")를 cm 값으로 갱신 — 현재 폴리곤에서
   * 나머지 치수를 그대로 읽어와 이 필드만 바꾼 뒤 폴리곤을 다시 만든다.
   * 범위를 벗어난 값은 buildPolygon이 알아서 clamp한다. */
  setDimension: (fieldId: string, cm: number) => void;
  setWallHeight: (cm: number) => void;
  setUnit: (unit: RoomUnit) => void;

  /** 벽에 배치된 문/창문 전부. */
  openings: PlacedOpening[];
  /** 팔레트에서 고른, 다음 벽 클릭 때 배치될 프리셋 — /editor의
   * selectedDefId와 같은 "선택 → 클릭으로 배치" 관례를 따른다. 같은
   * 프리셋을 다시 누르면 선택 해제. */
  pendingOpening: { kind: OpeningKind; presetId: string } | null;
  /** 마지막 배치 시도가 실패(벽이 너무 짧음/다른 opening과 겹침)했는지 —
   * 힌트 문구 전환에 쓴다. */
  openingWarn: boolean;
  selectOpeningPreset: (kind: OpeningKind, presetId: string) => void;
  /** 벽(wallIndex) 위 offsetCm 근처에 pendingOpening을 배치 시도. */
  placeOpeningOnWall: (wallIndex: number, offsetCm: number) => void;
  /** 같은 벽 안에서 opening을 offsetCm으로 옮긴다 — 다른 opening과
   * 겹치게 되면 조용히 무시(마지막 유효 위치 유지). */
  moveOpening: (id: string, offsetCm: number) => void;
  removeOpening: (id: string) => void;

  /** 벽 색상(hex) — 프리셋 스와치도 자유 컬러피커도 결국 이 값 하나를
   * 바꾼다. 특정 하우스 타입에 안 묶인 중립 기본값(웜 화이트)에서 시작. */
  wallColorHex: string;
  setWallColor: (hex: string) => void;
  /** 바닥 스타일 프리셋 id. */
  floorStyleId: string;
  setFloorStyle: (id: string) => void;
}

export const useRoomBuilderStore = create<RoomBuilderState>((set, get) => ({
  roomShape: "rectangle",
  roomPolygon: presetById("rectangle").defaultPolygon,
  unit: "cm",
  wallHeightCm: DEFAULT_WALL_HEIGHT_CM,
  selectShape: (id) => set({ roomShape: id, roomPolygon: presetById(id).defaultPolygon }),
  setDimension: (fieldId, cm) => {
    const { roomShape, roomPolygon } = get();
    const dims = { ...readDimensions(roomShape, roomPolygon), [fieldId]: cm };
    set({ roomPolygon: buildPolygon(roomShape, dims) });
  },
  setWallHeight: (cm) => set({ wallHeightCm: Math.min(MAX_WALL_HEIGHT_CM, Math.max(MIN_WALL_HEIGHT_CM, cm)) }),
  setUnit: (unit) => set({ unit }),

  openings: [],
  pendingOpening: null,
  openingWarn: false,
  selectOpeningPreset: (kind, presetId) =>
    set((state) => ({
      pendingOpening:
        state.pendingOpening?.kind === kind && state.pendingOpening.presetId === presetId
          ? null
          : { kind, presetId },
      openingWarn: false,
    })),
  placeOpeningOnWall: (wallIndex, offsetCm) => {
    const { pendingOpening, roomPolygon, openings } = get();
    if (!pendingOpening) return;
    const preset =
      pendingOpening.kind === "door"
        ? DOOR_PRESETS.find((p) => p.id === pendingOpening.presetId)
        : WINDOW_PRESETS.find((p) => p.id === pendingOpening.presetId);
    const wall = getWallSegments(roomPolygon)[wallIndex];
    if (!preset || !wall || wall.length < preset.widthCm) {
      set({ openingWarn: true });
      return;
    }
    const clamped = clampOpeningOffset(offsetCm, preset.widthCm, wall.length);
    if (overlapsOtherOpening(openings, wallIndex, clamped, preset.widthCm)) {
      set({ openingWarn: true });
      return;
    }
    const opening: PlacedOpening = {
      id: crypto.randomUUID(),
      kind: pendingOpening.kind,
      presetId: pendingOpening.presetId,
      wallIndex,
      offsetCm: clamped,
      widthCm: preset.widthCm,
      heightCm: preset.heightCm,
      ...(pendingOpening.kind === "window" ? { sillHeightCm: (preset as (typeof WINDOW_PRESETS)[number]).sillHeightCm } : {}),
    };
    set({ openings: [...openings, opening], openingWarn: false });
  },
  moveOpening: (id, offsetCm) =>
    set((state) => {
      const target = state.openings.find((o) => o.id === id);
      const wall = target ? getWallSegments(state.roomPolygon)[target.wallIndex] : undefined;
      if (!target || !wall) return state;
      const clamped = clampOpeningOffset(offsetCm, target.widthCm, wall.length);
      if (overlapsOtherOpening(state.openings, target.wallIndex, clamped, target.widthCm, id)) return state;
      return { openings: state.openings.map((o) => (o.id === id ? { ...o, offsetCm: clamped } : o)) };
    }),
  removeOpening: (id) => set((state) => ({ openings: state.openings.filter((o) => o.id !== id) })),

  wallColorHex: DEFAULT_WALL_COLOR_HEX,
  setWallColor: (hex) => set({ wallColorHex: hex }),
  floorStyleId: DEFAULT_FLOOR_STYLE_ID,
  setFloorStyle: (id) => set({ floorStyleId: id }),
}));
